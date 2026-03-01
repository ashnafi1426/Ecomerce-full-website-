-- ============================================
-- INVENTORY MANAGEMENT FUNCTIONS
-- Required for order processing
-- ============================================

-- Function to decrement inventory when order is placed
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
  -- Update inventory quantity
  UPDATE inventory
  SET 
    quantity = quantity - p_quantity,
    updated_at = NOW()
  WHERE product_id = p_product_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found in inventory', p_product_id;
  END IF;
  
  -- Check if inventory went negative
  IF (SELECT quantity FROM inventory WHERE product_id = p_product_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient inventory for product %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment inventory (for returns/cancellations)
CREATE OR REPLACE FUNCTION increment_inventory(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
  -- Update inventory quantity
  UPDATE inventory
  SET 
    quantity = quantity + p_quantity,
    updated_at = NOW()
  WHERE product_id = p_product_id;
  
  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found in inventory', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get available inventory (considering reserved quantity)
CREATE OR REPLACE FUNCTION get_available_inventory(p_product_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT (quantity - COALESCE(reserved_quantity, 0))
  INTO v_available
  FROM inventory
  WHERE product_id = p_product_id;
  
  RETURN COALESCE(v_available, 0);
END;
$$ LANGUAGE plpgsql;

-- Verify functions created
DO $$
BEGIN
  RAISE NOTICE '✅ Inventory functions created successfully:';
  RAISE NOTICE '   - decrement_inventory(product_id, quantity)';
  RAISE NOTICE '   - increment_inventory(product_id, quantity)';
  RAISE NOTICE '   - get_available_inventory(product_id)';
END $$;
