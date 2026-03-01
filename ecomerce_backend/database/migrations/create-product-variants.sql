-- ============================================================================
-- PRODUCT VARIANTS SYSTEM - DATABASE MIGRATION
-- ============================================================================
-- This migration creates the product variants system for FastShop
-- Requirements: FR-5.1 to FR-5.7
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PRODUCT VARIANTS TABLE
-- ============================================================================
-- Stores different variants of products (size, color, material, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Variant Details
  variant_name VARCHAR(255) NOT NULL, -- e.g., "Size: Large, Color: Red"
  sku VARCHAR(100) UNIQUE NOT NULL, -- Unique SKU for this variant
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0), -- Variant-specific price
  compare_at_price DECIMAL(10, 2), -- Original price for display (optional)
  attributes JSONB NOT NULL, -- e.g., {"size": "L", "color": "Red"}
  images JSONB DEFAULT '[]', -- Array of image URLs for this variant
  
  -- Status
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_product_attributes UNIQUE (product_id, attributes)
);

-- Add comments
COMMENT ON TABLE product_variants IS 'Product variants with different attributes (size, color, material, etc.)';
COMMENT ON COLUMN product_variants.variant_name IS 'Human-readable variant name';
COMMENT ON COLUMN product_variants.sku IS 'Unique Stock Keeping Unit for this variant';
COMMENT ON COLUMN product_variants.price IS 'Variant-specific price (not adjustment, but actual price)';
COMMENT ON COLUMN product_variants.compare_at_price IS 'Original price for display purposes (for showing discounts)';
COMMENT ON COLUMN product_variants.attributes IS 'JSONB object storing variant attributes like size, color, material';
COMMENT ON COLUMN product_variants.images IS 'Array of image URLs specific to this variant';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_available ON product_variants(is_available);
CREATE INDEX IF NOT EXISTS idx_product_variants_attributes ON product_variants USING GIN(attributes);

-- ============================================================================
-- 2. VARIANT INVENTORY TABLE
-- ============================================================================
-- Tracks inventory for each product variant
CREATE TABLE IF NOT EXISTS variant_inventory (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  
  -- Inventory Details
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 0),
  last_restocked_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reserved_quantity CHECK (reserved_quantity <= quantity),
  UNIQUE(variant_id)
);

-- Add comments
COMMENT ON TABLE variant_inventory IS 'Inventory tracking for product variants';
COMMENT ON COLUMN variant_inventory.quantity IS 'Total quantity available';
COMMENT ON COLUMN variant_inventory.reserved_quantity IS 'Quantity reserved in carts/pending orders';
COMMENT ON COLUMN variant_inventory.low_stock_threshold IS 'Alert threshold for low stock';
COMMENT ON COLUMN variant_inventory.last_restocked_at IS 'Timestamp of last inventory restock';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_variant_inventory_variant_id ON variant_inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_inventory_quantity ON variant_inventory(quantity);

-- ============================================================================
-- 3. UPDATE CART_ITEMS TABLE
-- ============================================================================
-- Add variant_id column to cart_items table
ALTER TABLE cart_items 
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

-- Create index for variant_id
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);

-- Update unique constraint to include variant_id
-- Drop old constraint first
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Add new constraint that allows same product with different variants
ALTER TABLE cart_items 
  ADD CONSTRAINT cart_items_user_product_variant_unique 
  UNIQUE(user_id, product_id, variant_id);

-- Add comment
COMMENT ON COLUMN cart_items.variant_id IS 'Optional variant selection for this cart item';

-- ============================================================================
-- 4. UPDATE TRIGGERS
-- ============================================================================

-- Update timestamp trigger for product_variants
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for variant_inventory
CREATE TRIGGER update_variant_inventory_updated_at
  BEFORE UPDATE ON variant_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_inventory ENABLE ROW LEVEL SECURITY;

-- Product variants are visible to everyone (read)
CREATE POLICY product_variants_read ON product_variants
  FOR SELECT
  USING (TRUE);

-- Only sellers can manage their product variants
CREATE POLICY product_variants_manage ON product_variants
  FOR ALL
  USING (
    product_id IN (
      SELECT id FROM products 
      WHERE seller_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
    )
  );

-- Variant inventory is visible to everyone (read)
CREATE POLICY variant_inventory_read ON variant_inventory
  FOR SELECT
  USING (TRUE);

-- Only sellers can manage their variant inventory
CREATE POLICY variant_inventory_manage ON variant_inventory
  FOR ALL
  USING (
    variant_id IN (
      SELECT pv.id FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE p.seller_id = NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID
    )
  );

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate variant final price
CREATE OR REPLACE FUNCTION get_variant_price(p_variant_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_variant_price DECIMAL(10, 2);
BEGIN
  SELECT pv.price
  INTO v_variant_price
  FROM product_variants pv
  WHERE pv.id = p_variant_id;
  
  RETURN COALESCE(v_variant_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check variant availability
CREATE OR REPLACE FUNCTION check_variant_availability(p_variant_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT (quantity - reserved_quantity)
  INTO v_available
  FROM variant_inventory
  WHERE variant_id = p_variant_id;
  
  RETURN COALESCE(v_available, 0) >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to get available variant quantity
CREATE OR REPLACE FUNCTION get_variant_available_quantity(p_variant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_available INTEGER;
BEGIN
  SELECT (quantity - reserved_quantity)
  INTO v_available
  FROM variant_inventory
  WHERE variant_id = p_variant_id;
  
  RETURN COALESCE(v_available, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- This section can be uncommented for testing purposes
/*
-- Example: Add variants to an existing product
-- Assuming product with ID exists
DO $$
DECLARE
  v_product_id UUID;
  v_variant_id UUID;
BEGIN
  -- Get a sample product (you'll need to replace this with actual product ID)
  SELECT id INTO v_product_id FROM products LIMIT 1;
  
  IF v_product_id IS NOT NULL THEN
    -- Create size variants
    INSERT INTO product_variants (product_id, variant_name, sku, price, attributes, images)
    VALUES 
      (v_product_id, 'Size: Small', 'SKU-SMALL-001', 19.99, '{"size": "S"}', '[]'),
      (v_product_id, 'Size: Medium', 'SKU-MEDIUM-001', 24.99, '{"size": "M"}', '[]'),
      (v_product_id, 'Size: Large', 'SKU-LARGE-001', 29.99, '{"size": "L"}', '[]'),
      (v_product_id, 'Size: XL', 'SKU-XL-001', 34.99, '{"size": "XL"}', '[]')
    RETURNING id INTO v_variant_id;
    
    -- Create inventory for each variant
    INSERT INTO variant_inventory (variant_id, quantity, low_stock_threshold)
    SELECT id, 100, 10 FROM product_variants WHERE product_id = v_product_id;
  END IF;
END $$;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Product Variants System Migration Complete!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - product_variants';
  RAISE NOTICE '  - variant_inventory';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - cart_items (added variant_id column)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run schema cache refresh if needed';
  RAISE NOTICE '  2. Test variant creation and inventory management';
  RAISE NOTICE '  3. Update cart and order services to handle variants';
END $$;
