-- =====================================================
-- STEP 2: CREATE STORES FOR EXISTING SELLERS
-- Run this after step-01 succeeds
-- =====================================================

INSERT INTO stores (seller_id, store_name, store_slug, status, verification_status, verified_at)
SELECT 
  u.id,
  COALESCE(u.email, 'Store') || '''s Store',
  LOWER(REPLACE(COALESCE(u.email, 'store'), ' ', '-')) || '-' || substring(u.id::text, 1, 8),
  'active',
  'verified',
  CURRENT_TIMESTAMP
FROM users u
WHERE u.role = 'seller'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.seller_id = u.id)
ON CONFLICT (seller_id) DO NOTHING;

-- Verify
SELECT 'Stores created for sellers!' AS status;
SELECT COUNT(*) as total_stores FROM stores;
SELECT store_name, status FROM stores ORDER BY created_at;
