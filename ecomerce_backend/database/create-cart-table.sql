-- ============================================================================
-- SHOPPING CART TABLE
-- ============================================================================

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Cart Item Details
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, product_id)
);

-- Add comment
COMMENT ON TABLE cart_items IS 'Shopping cart items for each user';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at DESC);

-- Update timestamp trigger
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cart
CREATE POLICY cart_items_own ON cart_items
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID);
