-- =====================================================
-- MANUAL COLUMN ADDITION - SIMPLEST POSSIBLE VERSION
-- Copy and paste these commands ONE AT A TIME into Supabase SQL Editor
-- =====================================================

-- Command 1: Add store_id column
ALTER TABLE products ADD COLUMN store_id UUID;

-- Command 2: Add approval_status column
ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL';

-- Command 3: Add approved_by column
ALTER TABLE products ADD COLUMN approved_by UUID;

-- Command 4: Add approved_at column
ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;

-- Command 5: Add rejection_reason column
ALTER TABLE products ADD COLUMN rejection_reason TEXT;

-- Command 6: Add submitted_at column
ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =====================================================
-- VERIFICATION QUERY (Run this after all 6 commands above)
-- =====================================================
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('store_id', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason', 'submitted_at')
ORDER BY column_name;

-- You should see all 6 columns listed
-- If you see all 6, proceed to run amazon-approval-final.sql
