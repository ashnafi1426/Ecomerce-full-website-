-- Simple Payment Columns Fix
-- Add only the essential missing columns for Stripe integration

-- Add available_date to seller_earnings if it doesn't exist
ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS available_date DATE;

-- Add order_id to seller_earnings if it doesn't exist  
ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS order_id UUID;

-- Add gross_amount to seller_earnings if it doesn't exist
ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS gross_amount INTEGER DEFAULT 0;

-- Add net_amount to seller_earnings if it doesn't exist
ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS net_amount INTEGER DEFAULT 0;

-- Add commission_rate to seller_earnings if it doesn't exist
ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00;

-- Add payout_id to seller_earnings if it doesn't exist
ALTER TABLE seller_earnings ADD COLUMN IF NOT EXISTS payout_id UUID;

-- Add Stripe columns to payments table if they don't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'usd';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'card';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add commission columns to sub_orders if they don't exist
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS commission_amount INTEGER DEFAULT 0;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS seller_payout INTEGER DEFAULT 0;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Create payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'stripe_connect',
    status VARCHAR(50) DEFAULT 'pending_approval',
    stripe_transfer_id VARCHAR(255),
    account_details JSONB DEFAULT '{}',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    fees INTEGER DEFAULT 0,
    net_amount INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create commission_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS commission_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    default_rate DECIMAL(5,2) DEFAULT 15.00,
    category_rates JSONB DEFAULT '{}',
    seller_custom_rates JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID
);

-- Insert default commission settings if not exists
INSERT INTO commission_settings (default_rate, category_rates, seller_custom_rates)
SELECT 15.00, 
       '{"electronics": 12.00, "fashion": 18.00, "books": 10.00}'::jsonb,
       '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM commission_settings);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_available_date ON seller_earnings(available_date);
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- Update existing seller_earnings records to have proper available_date
UPDATE seller_earnings 
SET available_date = CURRENT_DATE + INTERVAL '7 days'
WHERE available_date IS NULL AND status = 'pending';

UPDATE seller_earnings 
SET available_date = CURRENT_DATE
WHERE available_date IS NULL AND status = 'available';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Payment system columns added successfully!';
END $$;