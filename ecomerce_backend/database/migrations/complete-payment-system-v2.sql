-- ============================================
-- FASTSHOP COMPLETE PAYMENT SYSTEM DATABASE
-- Phase 2: Multi-Vendor Payment Architecture
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PAYMENTS TABLE (Stripe Payment Records)
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id), -- NULL for guest orders
    order_id UUID REFERENCES orders(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'card',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- 2. SUB_ORDERS TABLE (Seller Order Splits)
-- ============================================
CREATE TABLE IF NOT EXISTS sub_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_order_id UUID REFERENCES orders(id) NOT NULL,
    seller_id UUID REFERENCES users(id) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal INTEGER NOT NULL DEFAULT 0, -- Amount in cents
    commission_rate DECIMAL(5,2) DEFAULT 15.00, -- Percentage (e.g., 15.00%)
    commission_amount INTEGER DEFAULT 0, -- Amount in cents
    seller_payout INTEGER DEFAULT 0, -- Amount seller receives in cents
    status VARCHAR(50) DEFAULT 'pending_fulfillment',
    fulfillment_status VARCHAR(50) DEFAULT 'pending',
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sub_orders_parent ON sub_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller ON sub_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON sub_orders(status);

-- ============================================
-- 3. SELLER_EARNINGS TABLE (Earnings Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS seller_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) NOT NULL,
    sub_order_id UUID REFERENCES sub_orders(id),
    order_id UUID REFERENCES orders(id), -- For reference
    gross_amount INTEGER NOT NULL DEFAULT 0, -- Total order amount in cents
    commission_amount INTEGER NOT NULL DEFAULT 0, -- Commission deducted in cents
    net_amount INTEGER NOT NULL DEFAULT 0, -- Amount seller receives in cents
    commission_rate DECIMAL(5,2) DEFAULT 15.00,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, available, paid
    available_date DATE, -- When funds become available for payout
    payout_id UUID REFERENCES payouts(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_available_date ON seller_earnings(available_date);

-- ============================================
-- 4. PAYOUTS TABLE (Seller Withdrawals)
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer', -- bank_transfer, stripe_connect, paypal
    status VARCHAR(50) DEFAULT 'pending_approval', -- pending_approval, approved, processing, completed, failed, cancelled
    account_details JSONB DEFAULT '{}',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    transaction_id VARCHAR(255), -- External transaction ID
    fees INTEGER DEFAULT 0, -- Processing fees in cents
    net_amount INTEGER, -- Amount after fees in cents
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payouts_seller ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON payouts(requested_at);

-- ============================================
-- 5. SELLER_BANK_ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS seller_bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number_encrypted TEXT NOT NULL, -- Encrypted account number
    account_number_last4 VARCHAR(4) NOT NULL, -- Last 4 digits for display
    routing_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'checking', -- checking, savings, business_checking
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- micro_deposits, instant, manual
    verification_attempts INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_seller ON seller_bank_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_verified ON seller_bank_accounts(verified);

-- ============================================
-- 6. COMMISSION_SETTINGS TABLE
-- ============================================
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
SELECT 15.00, '{}', '{}'
WHERE NOT EXISTS (SELECT 1 FROM commission_settings);

-- ============================================
-- 7. PAYOUT_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payout_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_period_days INTEGER DEFAULT 7, -- Days to hold funds
    minimum_payout INTEGER DEFAULT 5000, -- Minimum payout in cents ($50)
    maximum_payout INTEGER DEFAULT 10000000, -- Maximum payout in cents ($100,000)
    payout_frequency VARCHAR(50) DEFAULT 'weekly', -- daily, weekly, monthly
    auto_approve_threshold INTEGER DEFAULT 100000, -- Auto-approve under $1000
    require_manual_approval BOOLEAN DEFAULT TRUE,
    auto_payout_enabled BOOLEAN DEFAULT FALSE,
    auto_payout_day INTEGER DEFAULT 1, -- Day of week (1=Monday)
    processing_fee_rate DECIMAL(5,2) DEFAULT 0.00, -- Processing fee percentage
    processing_fee_fixed INTEGER DEFAULT 0, -- Fixed processing fee in cents
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default payout settings if not exists
INSERT INTO payout_settings (holding_period_days, minimum_payout, auto_approve_threshold)
SELECT 7, 5000, 100000
WHERE NOT EXISTS (SELECT 1 FROM payout_settings);

-- ============================================
-- 8. REFUNDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) NOT NULL,
    order_id UUID REFERENCES orders(id) NOT NULL,
    sub_order_id UUID REFERENCES sub_orders(id), -- If refunding specific seller items
    stripe_refund_id VARCHAR(255) UNIQUE,
    amount INTEGER NOT NULL, -- Refund amount in cents
    reason VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, succeeded, failed
    processed_by UUID REFERENCES users(id),
    seller_adjustment_id UUID REFERENCES seller_earnings(id), -- Link to seller earning adjustment
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- ============================================
-- 9. PAYMENT_METHODS TABLE (Seller Payment Accounts)
-- ============================================
CREATE TABLE IF NOT EXISTS seller_payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) NOT NULL,
    method_type VARCHAR(50) NOT NULL, -- stripe_connect, bank_account, paypal
    stripe_account_id VARCHAR(255), -- For Stripe Connect
    paypal_email VARCHAR(255), -- For PayPal
    bank_account_id UUID REFERENCES seller_bank_accounts(id), -- For bank transfers
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seller_payment_methods_seller ON seller_payment_methods(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payment_methods_type ON seller_payment_methods(method_type);

-- ============================================
-- 10. WEBHOOK_EVENTS TABLE (Stripe Webhook Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    error_message TEXT,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers for all tables
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sub_orders_updated_at BEFORE UPDATE ON sub_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_earnings_updated_at BEFORE UPDATE ON seller_earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_bank_accounts_updated_at BEFORE UPDATE ON seller_bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate commission based on seller and category
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

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample commission settings for different categories
UPDATE commission_settings SET 
    category_rates = '{
        "electronics": 12.00,
        "fashion": 18.00,
        "books": 10.00,
        "home": 15.00,
        "sports": 16.00
    }'::jsonb,
    seller_custom_rates = '{}'::jsonb
WHERE id = (SELECT id FROM commission_settings LIMIT 1);

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'FastShop Complete Payment System Database Schema Created Successfully!';
    RAISE NOTICE 'Tables created: payments, sub_orders, seller_earnings, payouts, seller_bank_accounts, commission_settings, payout_settings, refunds, seller_payment_methods, webhook_events';
    RAISE NOTICE 'Functions created: get_commission_rate(), get_seller_available_balance()';
    RAISE NOTICE 'Default commission rate: 15%% with category-specific rates';
    RAISE NOTICE 'Default holding period: 7 days';
    RAISE NOTICE 'Minimum payout: $50.00';
END $$;