-- ============================================
-- CREATE ORDER_ITEMS TABLE
-- Required for Stripe payment order creation
-- ============================================

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Add update trigger
CREATE TRIGGER update_order_items_updated_at 
BEFORE UPDATE ON order_items
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Verify table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
    RAISE NOTICE '✅ order_items table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create order_items table';
  END IF;
END $$;
