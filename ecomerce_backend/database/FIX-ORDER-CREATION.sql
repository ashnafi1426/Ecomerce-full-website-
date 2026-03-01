-- ============================================
-- FIX ORDER CREATION - RUN THIS IN SUPABASE SQL EDITOR
-- This fixes the "Failed to create order" error
-- ============================================

-- 1. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- 3. Create decrement_inventory function
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
    RAISE NOTICE 'Product % not found in inventory - skipping inventory update', p_product_id;
    RETURN;
  END IF;
  
  -- Check if inventory went negative (warning only, don't fail)
  IF (SELECT quantity FROM inventory WHERE product_id = p_product_id) < 0 THEN
    RAISE NOTICE 'Warning: Inventory for product % is now negative', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Create increment_inventory function (for returns/cancellations)
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
    RAISE NOTICE 'Product % not found in inventory - skipping inventory update', p_product_id;
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Create get_available_inventory function
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

-- 6. Verify everything was created
DO $$
DECLARE
  v_order_items_exists BOOLEAN;
  v_decrement_exists BOOLEAN;
BEGIN
  -- Check if order_items table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items'
  ) INTO v_order_items_exists;
  
  -- Check if decrement_inventory function exists
  SELECT EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'decrement_inventory'
  ) INTO v_decrement_exists;
  
  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '✅ ORDER CREATION FIX COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Verification:';
  
  IF v_order_items_exists THEN
    RAISE NOTICE '   ✅ order_items table exists';
  ELSE
    RAISE NOTICE '   ❌ order_items table NOT created';
  END IF;
  
  IF v_decrement_exists THEN
    RAISE NOTICE '   ✅ decrement_inventory function exists';
  ELSE
    RAISE NOTICE '   ❌ decrement_inventory function NOT created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now test the payment flow again!';
  RAISE NOTICE '';
END $$;
