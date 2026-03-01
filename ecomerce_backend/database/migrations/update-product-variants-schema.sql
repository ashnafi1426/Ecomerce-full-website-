-- ============================================================================
-- UPDATE PRODUCT VARIANTS SCHEMA TO MATCH DESIGN SPECIFICATIONS
-- ============================================================================
-- This migration updates the existing product_variants tables to match
-- the design specifications in the Critical Features Implementation spec
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. UPDATE PRODUCT_VARIANTS TABLE
-- ============================================================================

-- Add new columns if they don't exist
ALTER TABLE product_variants 
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- Rename is_active to is_available if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE product_variants RENAME COLUMN is_active TO is_available;
  END IF;
END $$;

-- If price column was just added and price_adjustment exists, migrate the data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'price_adjustment'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_variants' AND column_name = 'price'
  ) THEN
    -- Migrate price_adjustment to price by adding it to base product price
    UPDATE product_variants pv
    SET price = p.price + COALESCE(pv.price_adjustment, 0)
    FROM products p
    WHERE pv.product_id = p.id AND pv.price IS NULL;
    
    -- Drop the old price_adjustment column
    ALTER TABLE product_variants DROP COLUMN IF EXISTS price_adjustment;
  END IF;
END $$;

-- Make price NOT NULL and add check constraint
ALTER TABLE product_variants 
  ALTER COLUMN price SET NOT NULL,
  ADD CONSTRAINT IF NOT EXISTS check_price_positive CHECK (price >= 0);

-- Make attributes NOT NULL (it should already be, but ensure it)
ALTER TABLE product_variants 
  ALTER COLUMN attributes SET NOT NULL;

-- Drop old constraint if it exists
ALTER TABLE product_variants 
  DROP CONSTRAINT IF EXISTS valid_price_adjustment;

-- Add unique constraint on (product_id, attributes) if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_product_attributes'
  ) THEN
    ALTER TABLE product_variants 
      ADD CONSTRAINT unique_product_attributes UNIQUE (product_id, attributes);
  END IF;
END $$;

-- Update index name if needed
DROP INDEX IF EXISTS idx_product_variants_is_active;
CREATE INDEX IF NOT EXISTS idx_product_variants_is_available ON product_variants(is_available);

-- ============================================================================
-- 2. UPDATE VARIANT_INVENTORY TABLE
-- ============================================================================

-- Add last_restocked_at column if it doesn't exist
ALTER TABLE variant_inventory 
  ADD COLUMN IF NOT EXISTS last_restocked_at TIMESTAMP WITH TIME ZONE;

-- Ensure all check constraints exist
ALTER TABLE variant_inventory 
  DROP CONSTRAINT IF EXISTS check_quantity_positive,
  DROP CONSTRAINT IF EXISTS check_reserved_positive,
  DROP CONSTRAINT IF EXISTS check_threshold_positive;

ALTER TABLE variant_inventory 
  ADD CONSTRAINT check_quantity_positive CHECK (quantity >= 0),
  ADD CONSTRAINT check_reserved_positive CHECK (reserved_quantity >= 0),
  ADD CONSTRAINT check_threshold_positive CHECK (low_stock_threshold >= 0);

-- ============================================================================
-- 3. UPDATE HELPER FUNCTIONS
-- ============================================================================

-- Update get_variant_price function to use price instead of price_adjustment
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

-- ============================================================================
-- 4. UPDATE COMMENTS
-- ============================================================================

COMMENT ON COLUMN product_variants.price IS 'Variant-specific price (not adjustment, but actual price)';
COMMENT ON COLUMN product_variants.compare_at_price IS 'Original price for display purposes (for showing discounts)';
COMMENT ON COLUMN product_variants.images IS 'Array of image URLs specific to this variant';
COMMENT ON COLUMN product_variants.is_available IS 'Whether this variant is available for purchase';
COMMENT ON COLUMN variant_inventory.last_restocked_at IS 'Timestamp of last inventory restock';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Product Variants Schema Update Complete!';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  - Added price, compare_at_price, images columns';
  RAISE NOTICE '  - Renamed is_active to is_available';
  RAISE NOTICE '  - Migrated price_adjustment to price';
  RAISE NOTICE '  - Added last_restocked_at to variant_inventory';
  RAISE NOTICE '  - Updated constraints and indexes';
  RAISE NOTICE '  - Updated helper functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Run verification: node verify-variant-migration.js';
END $$;
