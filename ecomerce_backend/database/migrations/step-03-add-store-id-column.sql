-- =====================================================
-- STEP 3: ADD store_id COLUMN TO PRODUCTS
-- Run this after step-02 succeeds
-- =====================================================

ALTER TABLE products ADD COLUMN store_id UUID;

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'store_id';

SELECT 'store_id column added!' AS status;
