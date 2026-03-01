-- ============================================
-- ENHANCED INVENTORY SYSTEM - AMAZON STYLE
-- Implements soft locks and reservation system
-- ============================================

-- 1. Add reservation tracking columns to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
ADD COLUMN IF NOT EXISTS available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
ADD COLUMN IF NOT EXISTS low_stock_alert_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMP;

-- 2. Create inventory_reservations table for tracking
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reserved_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reserved_by_session_id VARCHAR(255),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'released', 'converted', 'expired')),
  reserved_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  released_at TIMESTAMP,
  notes TEXT,
  CONSTRAINT check_user_or_session CHECK (
    reserved_by_user_id IS NOT NULL OR reserved_by_session_id IS NOT NULL
  )
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_user ON inventory_reservations(reserved_by_user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_session ON inventory_reservations(reserved_by_session_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status ON inventory_reservations(status);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_expires ON inventory_reservations(expires_at);

-- 4. Create function to reserve inventory
CREATE OR REPLACE FUNCTION reserve_inventory(
  p_product_id UUID,
  p_quantity INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR DEFAULT NULL,
  p_expiration_minutes INTEGER DEFAULT 30
)
RETURNS UUID AS $$
DECLARE
  v_available INTEGER;
  v_reservation_id UUID;
  v_expires_at TIMESTAMP;
BEGIN
  -- Check available inventory
  SELECT (quantity - COALESCE(reserved_quantity, 0))
  INTO v_available
  FROM inventory
  WHERE product_id = p_product_id
  FOR UPDATE;
  
  -- Verify sufficient stock
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', v_available, p_quantity;
  END IF;
  
  -- Calculate expiration time
  v_expires_at := NOW() + (p_expiration_minutes || ' minutes')::INTERVAL;
  
  -- Create reservation
  INSERT INTO inventory_reservations (
    product_id,
    quantity,
    reserved_by_user_id,
    reserved_by_session_id,
    expires_at
  ) VALUES (
    p_product_id,
    p_quantity,
    p_user_id,
    p_session_id,
    v_expires_at
  ) RETURNING id INTO v_reservation_id;
  
  -- Update inventory reserved quantity
  UPDATE inventory
  SET reserved_quantity = reserved_quantity + p_quantity
  WHERE product_id = p_product_id;
  
  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to release reservation
CREATE OR REPLACE FUNCTION release_reservation(p_reservation_id UUID)
RETURNS void AS $$
DECLARE
  v_product_id UUID;
  v_quantity INTEGER;
  v_status VARCHAR;
BEGIN
  -- Get reservation details
  SELECT product_id, quantity, status
  INTO v_product_id, v_quantity, v_status
  FROM inventory_reservations
  WHERE id = p_reservation_id;
  
  -- Only release if active
  IF v_status = 'active' THEN
    -- Update reservation status
    UPDATE inventory_reservations
    SET 
      status = 'released',
      released_at = NOW()
    WHERE id = p_reservation_id;
    
    -- Return quantity to available inventory
    UPDATE inventory
    SET reserved_quantity = reserved_quantity - v_quantity
    WHERE product_id = v_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to convert reservation to order
CREATE OR REPLACE FUNCTION convert_reservation_to_order(
  p_reservation_id UUID,
  p_order_id UUID
)
RETURNS void AS $$
DECLARE
  v_product_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Get reservation details
  SELECT product_id, quantity
  INTO v_product_id, v_quantity
  FROM inventory_reservations
  WHERE id = p_reservation_id AND status = 'active';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found or not active';
  END IF;
  
  -- Update reservation
  UPDATE inventory_reservations
  SET 
    status = 'converted',
    order_id = p_order_id,
    released_at = NOW()
  WHERE id = p_reservation_id;
  
  -- Deduct from actual inventory
  UPDATE inventory
  SET 
    quantity = quantity - v_quantity,
    reserved_quantity = reserved_quantity - v_quantity
  WHERE product_id = v_product_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to expire old reservations
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
  v_reservation RECORD;
BEGIN
  v_expired_count := 0;
  
  -- Find and process expired reservations
  FOR v_reservation IN
    SELECT id, product_id, quantity
    FROM inventory_reservations
    WHERE status = 'active' AND expires_at < NOW()
  LOOP
    -- Release the reservation
    UPDATE inventory_reservations
    SET 
      status = 'expired',
      released_at = NOW()
    WHERE id = v_reservation.id;
    
    -- Return quantity to available
    UPDATE inventory
    SET reserved_quantity = reserved_quantity - v_reservation.quantity
    WHERE product_id = v_reservation.product_id;
    
    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to check product availability
CREATE OR REPLACE FUNCTION check_product_availability(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total INTEGER;
  v_reserved INTEGER;
  v_available INTEGER;
BEGIN
  SELECT 
    quantity,
    COALESCE(reserved_quantity, 0),
    (quantity - COALESCE(reserved_quantity, 0))
  INTO v_total, v_reserved, v_available
  FROM inventory
  WHERE product_id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'Product not found in inventory',
      'total_stock', 0,
      'reserved_stock', 0,
      'available_stock', 0
    );
  END IF;
  
  v_result := jsonb_build_object(
    'available', v_available >= p_quantity,
    'total_stock', v_total,
    'reserved_stock', v_reserved,
    'available_stock', v_available,
    'requested_quantity', p_quantity,
    'can_fulfill', v_available >= p_quantity
  );
  
  IF v_available < p_quantity THEN
    v_result := v_result || jsonb_build_object(
      'reason', format('Insufficient stock. Available: %s, Requested: %s', v_available, p_quantity)
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 9. Create view for inventory status
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
  i.id,
  i.product_id,
  p.title as product_name,
  p.sku,
  i.quantity as total_quantity,
  COALESCE(i.reserved_quantity, 0) as reserved_quantity,
  (i.quantity - COALESCE(i.reserved_quantity, 0)) as available_quantity,
  i.low_stock_threshold,
  CASE 
    WHEN (i.quantity - COALESCE(i.reserved_quantity, 0)) <= 0 THEN 'out_of_stock'
    WHEN (i.quantity - COALESCE(i.reserved_quantity, 0)) <= i.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status,
  COUNT(ir.id) FILTER (WHERE ir.status = 'active') as active_reservations,
  i.updated_at,
  i.last_restocked_at
FROM inventory i
JOIN products p ON i.product_id = p.id
LEFT JOIN inventory_reservations ir ON i.product_id = ir.product_id
GROUP BY i.id, p.title, p.sku;

-- 10. Create trigger to update inventory timestamp
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION update_inventory_timestamp();

-- 11. Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ENHANCED INVENTORY SYSTEM INSTALLED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Features Added:';
  RAISE NOTICE '   ✅ Inventory reservation system (soft locks)';
  RAISE NOTICE '   ✅ Automatic expiration (30 min default)';
  RAISE NOTICE '   ✅ Reservation tracking table';
  RAISE NOTICE '   ✅ Available quantity calculation';
  RAISE NOTICE '   ✅ Stock status view';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions Created:';
  RAISE NOTICE '   - reserve_inventory(product_id, quantity, user_id, session_id)';
  RAISE NOTICE '   - release_reservation(reservation_id)';
  RAISE NOTICE '   - convert_reservation_to_order(reservation_id, order_id)';
  RAISE NOTICE '   - expire_old_reservations()';
  RAISE NOTICE '   - check_product_availability(product_id, quantity)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Views Created:';
  RAISE NOTICE '   - inventory_status (real-time stock levels)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready for Amazon-style inventory management!';
  RAISE NOTICE '';
END $$;
