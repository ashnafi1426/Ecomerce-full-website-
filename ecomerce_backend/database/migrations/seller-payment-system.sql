-- ============================================
-- SELLER PAYMENT SYSTEM - DATABASE MIGRATION
-- ============================================
-- This migration creates all tables needed for the seller payment system

-- 1. Sub-orders table (seller-specific orders)
CREATE TABLE IF NOT EXISTS sub_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL, -- Amount in cents
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  commission_amount INTEGER NOT NULL,
  seller_payout INTEGER NOT NULL, -- Amount seller receives
  status VARCHAR(50) DEFAULT 'pending_fulfillment',
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  tracking_number VARCHAR(255),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Seller earnings table
CREATE TABLE IF NOT EXISTS seller_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sub_order_id UUID REFERENCES sub_orders(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- Seller payout amount in cents
  commission_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, available, paid
  available_date DATE,
  payout_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Payouts table (seller withdrawals)
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  method VARCHAR(50) DEFAULT 'bank_transfer', -- stripe_connect, bank_transfer, paypal
  status VARCHAR(50) DEFAULT 'pending_approval', -- pending_approval, approved, processing, completed, failed, rejected
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

-- 4. Seller bank accounts table
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

-- 5. Commission settings table
CREATE TABLE IF NOT EXISTS commission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_rate DECIMAL(5,2) DEFAULT 15.00,
  category_rates JSONB DEFAULT '{}',
  seller_custom_rates JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default commission settings if not exists
INSERT INTO commission_settings (default_rate, category_rates, seller_custom_rates)
SELECT 15.00, '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM commission_settings LIMIT 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_orders_parent ON sub_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller ON sub_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON sub_orders(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_seller ON seller_bank_accounts(seller_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_sub_orders_updated_at ON sub_orders;
CREATE TRIGGER update_sub_orders_updated_at BEFORE UPDATE ON sub_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seller_earnings_updated_at ON seller_earnings;
CREATE TRIGGER update_seller_earnings_updated_at BEFORE UPDATE ON seller_earnings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Seller payment system tables created successfully!';
END $$;
