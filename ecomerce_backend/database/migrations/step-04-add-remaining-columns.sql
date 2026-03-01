-- =====================================================
-- STEP 4: ADD REMAINING APPROVAL COLUMNS
-- Run this after step-03 succeeds
-- =====================================================

ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL';
ALTER TABLE products ADD COLUMN approved_by UUID;
ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
ALTER TABLE products ADD COLUMN rejection_reason TEXT;
ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Verify
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('approval_status', 'approved_by', 'approved_at', 'rejection_reason', 'submitted_at')
ORDER BY column_name;

SELECT 'All approval columns added!' AS status;
