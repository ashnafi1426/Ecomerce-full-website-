-- =====================================================
-- STEP 1: ADD APPROVAL COLUMNS TO PRODUCTS TABLE ONLY
-- Run this file FIRST in Supabase SQL Editor
-- =====================================================

-- Add columns one by one (no IF NOT EXISTS to avoid syntax issues)
DO $$
BEGIN
  -- Add store_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE products ADD COLUMN store_id UUID;
    RAISE NOTICE 'Added store_id column';
  ELSE
    RAISE NOTICE 'store_id column already exists';
  END IF;

  -- Add approval_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL';
    RAISE NOTICE 'Added approval_status column';
  ELSE
    RAISE NOTICE 'approval_status column already exists';
  END IF;

  -- Add approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE products ADD COLUMN approved_by UUID;
    RAISE NOTICE 'Added approved_by column';
  ELSE
    RAISE NOTICE 'approved_by column already exists';
  END IF;

  -- Add approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
    RAISE NOTICE 'Added approved_at column';
  ELSE
    RAISE NOTICE 'approved_at column already exists';
  END IF;

  -- Add rejection_reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE products ADD COLUMN rejection_reason TEXT;
    RAISE NOTICE 'Added rejection_reason column';
  ELSE
    RAISE NOTICE 'rejection_reason column already exists';
  END IF;

  -- Add submitted_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added submitted_at column';
  ELSE
    RAISE NOTICE 'submitted_at column already exists';
  END IF;
END $$;

-- Verify all columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('store_id', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason', 'submitted_at')
ORDER BY column_name;

-- Success message
SELECT 'All approval columns added successfully! Now run 02-complete-approval-workflow.sql' AS status;
