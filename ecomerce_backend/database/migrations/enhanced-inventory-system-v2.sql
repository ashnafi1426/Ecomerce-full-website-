-- ============================================
-- ENHANCED INVENTORY SYSTEM V2 - AMAZON STYLE
-- Compatible with existing inventory_reservations table
-- ============================================

-- 1. Add missing columns to existing inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS low_stock_alert_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMP;

-- Note: reserved_quantity and available_quantity already exist from pdp-enhancements.sql

-- 2. Add missing columns to existing inventory_reservations table
ALTER TABLE inventory_reservations
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS released_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status constraint to include 'expired'
ALTER TABLE inventory_reservations DROP CONSTRAINT IF EXISTS inventory_reservations_status_check;
ALTER TABLE inventory_reservations 
ADD CONSTRAINT inventory_reservations_status_check 
CHECK (status IN ('active', 'released', 'converted', 'expired'));

-- 3. Drop existing functions if they exist (to allow recreation with new signatures)
DROP FUNCTION IF EXISTS reserve_inventory(UUID, INTEGER, UUID, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS release_reservation(UUID);
DROP FUNCTION IF EXISTS convert_reservation_to_order(UUID, UUID);
DROP FUNCTION IF EXISTS expire_old_reservations();
DROP FUNCTION IF EXISTS check_product_availability(UUID, INTEGER);

-- 4. Create function to reserve inventory (compatible with existing table)
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
  
  -- Create reservation (using existing column names)
  INSERT INTO inventory_reservations (
    product_id,
    quantity,
    user_id,
    session_id,
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

-- 10. Verification
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ENHANCED INVENTORY SYSTEM V2 INSTALLED!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Features Added:';
  RAISE NOTICE '   ✅ Inventory reservation system (soft locks)';
  RAISE NOTICE '   ✅ Automatic expiration (30 min default)';
  RAISE NOTICE '   ✅ Reservation tracking (using existing table)';
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
