-- ============================================
-- ADD MISSING STATUS COLUMNS
-- Quick fix for sub_orders and seller_earnings tables
-- ============================================

-- Add status column to sub_orders if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sub_orders' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE sub_orders 
    ADD COLUMN status VARCHAR(50) DEFAULT 'pending_fulfillment';
    
    RAISE NOTICE '✅ Added status column to sub_orders table';
  ELSE
    RAISE NOTICE '✅ Status column already exists in sub_orders table';
  END IF;
END $$;

-- Add status column to seller_earnings if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'seller_earnings' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE seller_earnings 
    ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    
    RAISE NOTICE '✅ Added status column to seller_earnings table';
  ELSE
    RAISE NOTICE '✅ Status column already exists in seller_earnings table';
  END IF;
END $$;

-- Create indexes on status columns
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON sub_orders(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);

-- Verify the fix
DO $$
DECLARE
  sub_orders_status_exists BOOLEAN;
  seller_earnings_status_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'sub_orders' 
    AND column_name = 'status'
  ) INTO sub_orders_status_exists;
  
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'seller_earnings' 
    AND column_name = 'status'
  ) INTO seller_earnings_status_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STATUS COLUMNS VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF sub_orders_status_exists THEN
    RAISE NOTICE '✅ sub_orders.status column exists';
  ELSE
    RAISE NOTICE '❌ sub_orders.status column missing';
  END IF;
  
  IF seller_earnings_status_exists THEN
    RAISE NOTICE '✅ seller_earnings.status column exists';
  ELSE
    RAISE NOTICE '❌ seller_earnings.status column missing';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
  IF sub_orders_status_exists AND seller_earnings_status_exists THEN
    RAISE NOTICE '✅ ALL STATUS COLUMNS FIXED!';
  ELSE
    RAISE NOTICE '❌ SOME STATUS COLUMNS STILL MISSING';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
