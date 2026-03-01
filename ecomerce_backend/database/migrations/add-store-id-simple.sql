-- Simple migration to add store_id to products
-- Run this FIRST before the full approval workflow

-- Step 1: Add store_id column (nullable first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE products ADD COLUMN store_id UUID;
        RAISE NOTICE 'Added store_id column to products';
    ELSE
        RAISE NOTICE 'store_id column already exists';
    END IF;
END $$;

-- Step 2: Add other approval columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL';
        RAISE NOTICE 'Added approval_status column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE products ADD COLUMN approved_by UUID;
        RAISE NOTICE 'Added approved_by column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
        RAISE NOTICE 'Added approved_at column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE products ADD COLUMN rejection_reason TEXT;
        RAISE NOTICE 'Added rejection_reason column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added submitted_at column';
    END IF;
END $$;

SELECT 'Columns added successfully! Now run the full amazon-approval-step-by-step.sql' AS status;
