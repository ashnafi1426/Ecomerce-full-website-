-- ============================================
-- ADD MISSING COLUMNS TO EXISTING PAYMENT TABLES
-- For Stripe Integration & Complete Payment System
-- ============================================

-- Add missing columns to seller_earnings table
DO $$
BEGIN
    -- Add available_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seller_earnings' AND column_name = 'available_date') THEN
        ALTER TABLE seller_earnings ADD COLUMN available_date DATE;
        RAISE NOTICE 'Added available_date column to seller_earnings';
    END IF;

    -- Add order_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seller_earnings' AND column_name = 'order_id') THEN
        ALTER TABLE seller_earnings ADD COLUMN order_id UUID;
        RAISE NOTICE 'Added order_id column to seller_earnings';
    END IF;

    -- Add gross_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seller_earnings' AND column_name = 'gross_amount') THEN
        ALTER TABLE seller_earnings ADD COLUMN gross_amount INTEGER DEFAULT 0;
        RAISE NOTICE 'Added gross_amount column to seller_earnings';
    END IF;

    -- Add net_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seller_earnings' AND column_name = 'net_amount') THEN
        ALTER TABLE seller_earnings ADD COLUMN net_amount INTEGER DEFAULT 0;
        RAISE NOTICE 'Added net_amount column to seller_earnings';
    END IF;

    -- Add commission_rate column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seller_earnings' AND column_name = 'commission_rate') THEN
        ALTER TABLE seller_earnings ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 15.00;
        RAISE NOTICE 'Added commission_rate column to seller_earnings';
    END IF;

    -- Add payout_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'seller_earnings' AND column_name = 'payout_id') THEN
        ALTER TABLE seller_earnings ADD COLUMN payout_id UUID;
        RAISE NOTICE 'Added payout_id column to seller_earnings';
    END IF;
END $$;

-- Add missing columns to payments table for Stripe
DO $$
BEGIN
    -- Add stripe_payment_intent_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'stripe_payment_intent_id') THEN
        ALTER TABLE payments ADD COLUMN stripe_payment_intent_id VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Added stripe_payment_intent_id column to payments';
    END IF;

    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'currency') THEN
        ALTER TABLE payments ADD COLUMN currency VARCHAR(3) DEFAULT 'usd';
        RAISE NOTICE 'Added currency column to payments';
    END IF;

    -- Add payment_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
        ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) DEFAULT 'card';
        RAISE NOTICE 'Added payment_method column to payments';
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'metadata') THEN
        ALTER TABLE payments ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column to payments';
    END IF;
END $$;

-- Create payouts table if it doesn't exist
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    method VARCHAR(50) NOT NULL DEFAULT 'stripe_connect', -- stripe_connect, bank_transfer, paypal
    status VARCHAR(50) DEFAULT 'pending_approval', -- pending_approval, approved, processing, completed, failed, cancelled
    stripe_transfer_id VARCHAR(255), -- Stripe transfer ID
    account_details JSONB DEFAULT '{}',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    fees INTEGER DEFAULT 0, -- Processing fees in cents
    net_amount INTEGER, -- Amount after fees in cents
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create commission_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS commission_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    default_rate DECIMAL(5,2) DEFAULT 15.00, -- Default commission rate
    category_rates JSONB DEFAULT '{}', -- Category-specific rates
    seller_custom_rates JSONB DEFAULT '{}', -- Seller-specific rates
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default commission settings if not exists
INSERT INTO commission_settings (default_rate, category_rates, seller_custom_rates)
SELECT 15.00, 
       '{"electronics": 12.00, "fashion": 18.00, "books": 10.00, "home": 15.00, "sports": 16.00}'::jsonb,
       '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM commission_settings);

-- Create payout_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS payout_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_period_days INTEGER DEFAULT 7, -- Days to hold funds
    minimum_payout INTEGER DEFAULT 5000, -- Minimum payout in cents ($50)
    maximum_payout INTEGER DEFAULT 10000000, -- Maximum payout in cents ($100,000)
    auto_approve_threshold INTEGER DEFAULT 100000, -- Auto-approve under $1000
    require_manual_approval BOOLEAN DEFAULT TRUE,
    stripe_connect_enabled BOOLEAN DEFAULT TRUE,
    bank_transfer_enabled BOOLEAN DEFAULT FALSE,
    paypal_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default payout settings if not exists
INSERT INTO payout_settings (holding_period_days, minimum_payout, auto_approve_threshold)
SELECT 7, 5000, 100000
WHERE NOT EXISTS (SELECT 1 FROM payout_settings);

-- Add missing columns to sub_orders table
DO $$
BEGIN
    -- Add commission_rate column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sub_orders' AND column_name = 'commission_rate') THEN
        ALTER TABLE sub_orders ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 15.00;
        RAISE NOTICE 'Added commission_rate column to sub_orders';
    END IF;

    -- Add commission_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sub_orders' AND column_name = 'commission_amount') THEN
        ALTER TABLE sub_orders ADD COLUMN commission_amount INTEGER DEFAULT 0;
        RAISE NOTICE 'Added commission_amount column to sub_orders';
    END IF;

    -- Add seller_payout column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sub_orders' AND column_name = 'seller_payout') THEN
        ALTER TABLE sub_orders ADD COLUMN seller_payout INTEGER DEFAULT 0;
        RAISE NOTICE 'Added seller_payout column to sub_orders';
    END IF;

    -- Add fulfillment_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sub_orders' AND column_name = 'fulfillment_status') THEN
        ALTER TABLE sub_orders ADD COLUMN fulfillment_status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added fulfillment_status column to sub_orders';
    END IF;

    -- Add tracking_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sub_orders' AND column_name = 'tracking_number') THEN
        ALTER TABLE sub_orders ADD COLUMN tracking_number VARCHAR(255);
        RAISE NOTICE 'Added tracking_number column to sub_orders';
    END IF;

    -- Add shipped_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sub_orders' AND column_name = 'shipped_at') THEN
        ALTER TABLE sub_orders ADD COLUMN shipped_at TIMESTAMP;
        RAISE NOTICE 'Added shipped_at column to sub_orders';
    END IF;

    -- Add delivered_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sub_orders' AND column_name = 'delivered_at') THEN
        ALTER TABLE sub_orders ADD COLUMN delivered_at TIMESTAMP;
        RAISE NOTICE 'Added delivered_at column to sub_orders';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_available_date ON seller_earnings(available_date);
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller ON sub_orders(seller_id);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add payout_id foreign key to seller_earnings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'seller_earnings_payout_id_fkey') THEN
        ALTER TABLE seller_earnings ADD CONSTRAINT seller_earnings_payout_id_fkey 
        FOREIGN KEY (payout_id) REFERENCES payouts(id);
        RAISE NOTICE 'Added payout_id foreign key to seller_earnings';
    END IF;
END $$;

-- Create helper functions for Stripe integration
CREATE OR REPLACE FUNCTION get_commission_rate(seller_uuid UUID, category_id VARCHAR DEFAULT NULL)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    commission_rate DECIMAL(5,2);
    settings RECORD;
BEGIN
    -- Get commission settings
    SELECT * INTO settings FROM commission_settings ORDER BY updated_at DESC LIMIT 1;
    
    -- Check seller-specific rate first
    IF settings.seller_custom_rates ? seller_uuid::text THEN
        SELECT (settings.seller_custom_rates->>seller_uuid::text)::DECIMAL(5,2) INTO commission_rate;
        RETURN commission_rate;
    END IF;
    
    -- Check category-specific rate
    IF category_id IS NOT NULL AND settings.category_rates ? category_id THEN
        SELECT (settings.category_rates->>category_id)::DECIMAL(5,2) INTO commission_rate;
        RETURN commission_rate;
    END IF;
    
    -- Return default rate
    RETURN settings.default_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to get seller available balance
CREATE OR REPLACE FUNCTION get_seller_available_balance(seller_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    available_balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(net_amount), 0) INTO available_balance
    FROM seller_earnings
    WHERE seller_id = seller_uuid 
    AND status = 'available'
    AND (available_date IS NULL OR available_date <= CURRENT_DATE);
    
    RETURN available_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate seller earnings after commission
CREATE OR REPLACE FUNCTION calculate_seller_earnings(
    seller_uuid UUID,
    gross_amount_cents INTEGER,
    category_id VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    commission_rate DECIMAL(5,2),
    commission_amount INTEGER,
    net_amount INTEGER
) AS $$
DECLARE
    rate DECIMAL(5,2);
    commission INTEGER;
    net INTEGER;
BEGIN
    -- Get commission rate
    rate := get_commission_rate(seller_uuid, category_id);
    
    -- Calculate commission (in cents)
    commission := ROUND(gross_amount_cents * (rate / 100));
    
    -- Calculate net amount
    net := gross_amount_cents - commission;
    
    RETURN QUERY SELECT rate, commission, net;
END;
$$ LANGUAGE plpgsql;

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
    RAISE NOTICE '✅ Payment system columns added successfully!';
    RAISE NOTICE '📊 Tables updated: payments, seller_earnings, sub_orders';
    RAISE NOTICE '🆕 Tables created: payouts, commission_settings, payout_settings';
    RAISE NOTICE '🔧 Functions created: get_commission_rate(), get_seller_available_balance(), calculate_seller_earnings()';
    RAISE NOTICE '💳 Stripe integration ready';
    RAISE NOTICE '💰 Commission system configured (15% default)';
    RAISE NOTICE '⏰ Holding period: 7 days';
    RAISE NOTICE '💵 Minimum payout: $50.00';
END $$;