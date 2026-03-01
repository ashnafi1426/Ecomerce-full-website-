-- =====================================================
-- STEP 6: ADD FOREIGN KEY CONSTRAINTS
-- Run this after step-05 succeeds
-- =====================================================

-- Add FK for store_id (only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_store_id_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added products_store_id_fkey constraint';
  ELSE
    RAISE NOTICE 'products_store_id_fkey constraint already exists';
  END IF;
END $$;

-- Add FK for approved_by (only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_approved_by_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id);
    RAISE NOTICE 'Added products_approved_by_fkey constraint';
  ELSE
    RAISE NOTICE 'products_approved_by_fkey constraint already exists';
  END IF;
END $$;

-- Add CHECK constraint for approval_status (only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_approval_status_check'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_approval_status_check 
    CHECK (approval_status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'));
    RAISE NOTICE 'Added products_approval_status_check constraint';
  ELSE
    RAISE NOTICE 'products_approval_status_check constraint already exists';
  END IF;
END $$;

-- Verify
SELECT 'Constraints check complete!' AS status;

SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'products'::regclass
  AND (conname LIKE '%store_id%' OR conname LIKE '%approval%');
