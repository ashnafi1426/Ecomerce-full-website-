-- =====================================================
-- STEP 5: POPULATE store_id FOR EXISTING PRODUCTS
-- Run this after step-04 succeeds
-- =====================================================

UPDATE products p
SET store_id = s.id
FROM stores s
WHERE p.seller_id = s.seller_id
  AND p.store_id IS NULL;

-- Verify
SELECT 'store_id populated!' AS status;
SELECT 
  COUNT(*) as products_with_store_id 
FROM products 
WHERE store_id IS NOT NULL;

SELECT 
  COUNT(*) as products_without_store_id 
FROM products 
WHERE store_id IS NULL;
