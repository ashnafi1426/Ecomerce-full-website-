-- =====================================================
-- STEP 7: CREATE INDEXES
-- Run this after step-06 succeeds
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON products(approved_by);
CREATE INDEX IF NOT EXISTS idx_products_seller_approval ON products(seller_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_store_approval ON products(store_id, approval_status);

-- Verify
SELECT 'Indexes created!' AS status;

SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename = 'products' 
  AND (indexname LIKE '%store%' OR indexname LIKE '%approval%')
ORDER BY indexname;
