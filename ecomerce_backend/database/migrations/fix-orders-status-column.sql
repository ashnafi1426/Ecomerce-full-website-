-- ============================================
-- FIX ORDERS TABLE STATUS COLUMN
-- Ensures the status column exists with proper constraints
-- ============================================

-- Step 1: Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE orders 
    ADD COLUMN status VARCHAR(50) DEFAULT 'pending_payment';
    
    RAISE NOTICE '✅ Added status column to orders table';
  ELSE
    RAISE NOTICE '✅ Status column already exists';
  END IF;
END $$;

-- Step 2: Drop existing constraint if it exists (to recreate with all statuses)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_status_check'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_status_check;
    RAISE NOTICE '✅ Dropped existing status constraint';
  END IF;
END $$;

-- Step 3: Add comprehensive status check constraint
ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'pending_payment',
  'paid',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'partially_refunded',
  'processing',
  'on_hold',
  'completed'
));

-- Step 4: Update any NULL status values
UPDATE orders 
SET status = 'pending_payment' 
WHERE status IS NULL;

-- Step 5: Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Step 6: Verify the fix
DO $$
DECLARE
  status_count INTEGER;
  sample_statuses TEXT;
BEGIN
  SELECT COUNT(*) INTO status_count FROM orders;
  
  SELECT string_agg(DISTINCT status, ', ') INTO sample_statuses 
  FROM orders 
  LIMIT 10;
  
  RAISE NOTICE '✅ Orders table has % orders', status_count;
  RAISE NOTICE '✅ Sample statuses: %', COALESCE(sample_statuses, 'No orders yet');
  RAISE NOTICE '✅ Status column fix complete!';
END $$;
