-- =====================================================
-- STEP 1: ADD STORE_ID COLUMN TO PRODUCTS
-- Run this FIRST before anything else
-- =====================================================

-- Simply add the store_id column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id UUID;

-- Verify it was added
SELECT 'store_id column added to products table' AS status;

-- Show the column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'store_id';
