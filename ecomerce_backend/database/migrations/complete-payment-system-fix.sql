-- ============================================
-- COMPLETE PAYMENT SYSTEM FIX
-- Run this in Supabase SQL Editor to fix all payment-related tables
-- ============================================

-- Step 1: Ensure orders table has status column
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
    RAISE NOTICE '✅ Status column already exists in orders table';
  END IF;
END $$;

-- Step 2: Create sub_orders table
CREATE TABLE IF NOT EXISTS sub_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  commission_amount INTEGER NOT NULL,
  seller_payout INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_fulfillment',
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  tracking_number VARCHAR(255),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create seller_earnings table
CREATE TABLE IF NOT EXISTS seller_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_order_id UUID REFERENCES sub_orders(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  commission_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  available_date DATE,
  payout_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  method VARCHAR(50) DEFAULT 'bank_transfer',
  status VARCHAR(50) DEFAULT 'pending_approval',
  account_details JSONB,
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  completed_at TIMESTAMP,
  transaction_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create seller_bank_accounts table
CREATE TABLE IF NOT EXISTS seller_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(255),
  account_holder_name VARCHAR(255),
  account_number_last4 VARCHAR(4),
  routing_number VARCHAR(50),
  account_type VARCHAR(50) DEFAULT 'checking',
  verified BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Create commission_settings table
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_rate DECIMAL(5,2) DEFAULT 15.00,
  category_rates JSONB DEFAULT '{}',
  seller_custom_rates JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Step 7: Insert default commission settings
INSERT INTO commission_settings (default_rate, category_rates, seller_custom_rates)
SELECT 15.00, '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM commission_settings LIMIT 1);

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_parent ON sub_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller ON sub_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON sub_orders(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_seller ON seller_bank_accounts(seller_id);

-- Step 9: Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 10: Add triggers
DROP TRIGGER IF EXISTS update_sub_orders_updated_at ON sub_orders;
CREATE TRIGGER update_sub_orders_updated_at 
  BEFORE UPDATE ON sub_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seller_earnings_updated_at ON seller_earnings;
CREATE TRIGGER update_seller_earnings_updated_at 
  BEFORE UPDATE ON seller_earnings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at 
  BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_accounts_updated_at ON seller_bank_accounts;
CREATE TRIGGER update_bank_accounts_updated_at 
  BEFORE UPDATE ON seller_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Verify all tables and columns
DO $$
DECLARE
  orders_status_exists BOOLEAN;
  sub_orders_exists BOOLEAN;
  seller_earnings_exists BOOLEAN;
  payouts_exists BOOLEAN;
  bank_accounts_exists BOOLEAN;
  commission_settings_exists BOOLEAN;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'orders'
  ) INTO orders_status_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'sub_orders'
  ) INTO sub_orders_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'seller_earnings'
  ) INTO seller_earnings_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'payouts'
  ) INTO payouts_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'seller_bank_accounts'
  ) INTO bank_accounts_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'commission_settings'
  ) INTO commission_settings_exists;
  
  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PAYMENT SYSTEM VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF orders_status_exists THEN
    RAISE NOTICE '✅ orders table exists';
  ELSE
    RAISE NOTICE '❌ orders table missing';
  END IF;
  
  IF sub_orders_exists THEN
    RAISE NOTICE '✅ sub_orders table created';
  ELSE
    RAISE NOTICE '❌ sub_orders table missing';
  END IF;
  
  IF seller_earnings_exists THEN
    RAISE NOTICE '✅ seller_earnings table created';
  ELSE
    RAISE NOTICE '❌ seller_earnings table missing';
  END IF;
  
  IF payouts_exists THEN
    RAISE NOTICE '✅ payouts table created';
  ELSE
    RAISE NOTICE '❌ payouts table missing';
  END IF;
  
  IF bank_accounts_exists THEN
    RAISE NOTICE '✅ seller_bank_accounts table created';
  ELSE
    RAISE NOTICE '❌ seller_bank_accounts table missing';
  END IF;
  
  IF commission_settings_exists THEN
    RAISE NOTICE '✅ commission_settings table created';
  ELSE
    RAISE NOTICE '❌ commission_settings table missing';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PAYMENT SYSTEM SETUP COMPLETE!';
  RAISE NOTICE '========================================';
END $$;
