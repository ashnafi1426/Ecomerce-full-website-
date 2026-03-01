-- =====================================================
-- FASTSHOP PAYMENT SYSTEM - PHASE 1: DATABASE SCHEMA
-- =====================================================
-- Complete multi-vendor payment system database architecture
-- Similar to Amazon's marketplace payment structure

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS seller_earnings CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS seller_bank_accounts CASCADE;
DROP TABLE IF EXISTS commission_settings CASCADE;
DROP TABLE IF EXISTS payout_settings CASCADE;
DROP TABLE IF EXISTS payment_methods_config CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;

-- =====================================================
-- 1. ENHANCED PAYMENTS TABLE
-- =====================================================
-- Core payment records from Stripe
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),  -- Customer who paid
    order_id UUID REFERENCES orders(id), -- Links to main order
    stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount INTEGER NOT NULL,  -- Total amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, refunded, partially_refunded
    payment_method VARCHAR(50), -- card, bank_transfer, etc.
    payment_method_details JSONB, -- Stripe payment method details
    metadata JSONB, -- Additional payment metadata
    stripe_fee INTEGER DEFAULT 0, -- Stripe processing fee in cents
    application_fee INTEGER DEFAULT 0, -- Platform fee in cents
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT payments_amount_positive CHECK (amount > 0),
    CONSTRAINT payments_status_valid CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'))
);

-- =====================================================
-- 2. SUB-ORDERS TABLE (Enhanced for Payment System)
-- =====================================================
-- Individual seller orders from multi-vendor purchases
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 15.00;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS commission_amount INTEGER DEFAULT 0;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS seller_payout INTEGER DEFAULT 0;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS platform_fee INTEGER DEFAULT 0;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS processing_fee INTEGER DEFAULT 0;
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS net_amount INTEGER DEFAULT 0; -- Amount after all deductions

-- Add payment-related columns
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS payout_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE sub_orders ADD COLUMN IF NOT EXISTS earnings_available_date DATE;

-- Add constraints (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    -- Add commission rate constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sub_orders_commission_rate_valid') THEN
        ALTER TABLE sub_orders ADD CONSTRAINT sub_orders_commission_rate_valid 
            CHECK (commission_rate >= 0 AND commission_rate <= 100);
    END IF;
    
    -- Add payment status constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sub_orders_payment_status_valid') THEN
        ALTER TABLE sub_orders ADD CONSTRAINT sub_orders_payment_status_valid 
            CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed'));
    END IF;
    
    -- Add payout status constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sub_orders_payout_status_valid') THEN
        ALTER TABLE sub_orders ADD CONSTRAINT sub_orders_payout_status_valid 
            CHECK (payout_status IN ('pending', 'processing', 'available', 'paid', 'on_hold'));
    END IF;
END $$;

-- =====================================================
-- 3. SELLER EARNINGS TABLE
-- =====================================================
-- Tracks individual earnings from each sub-order
CREATE TABLE seller_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id),
    sub_order_id UUID NOT NULL REFERENCES sub_orders(id),
    parent_order_id UUID NOT NULL REFERENCES orders(id),
    
    -- Financial details
    gross_amount INTEGER NOT NULL, -- Original order amount
    commission_amount INTEGER NOT NULL DEFAULT 0, -- Platform commission
    processing_fee INTEGER NOT NULL DEFAULT 0, -- Payment processing fee
    platform_fee INTEGER NOT NULL DEFAULT 0, -- Additional platform fees
    net_amount INTEGER NOT NULL, -- Final amount seller receives
    
    -- Status and timing
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    available_date DATE, -- When funds become available for payout
    hold_reason VARCHAR(255), -- Reason for holding funds
    
    -- Payout tracking (will be added after payouts table is created)
    payout_id UUID, -- References payouts(id) - constraint added later
    paid_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT seller_earnings_status_valid CHECK (status IN ('pending', 'processing', 'available', 'paid', 'on_hold', 'disputed', 'refunded')),
    CONSTRAINT seller_earnings_net_amount_valid CHECK (net_amount >= 0),
    CONSTRAINT seller_earnings_unique_sub_order UNIQUE (sub_order_id)
);

-- =====================================================
-- 4. PAYOUTS TABLE
-- =====================================================
-- Seller payout requests and processing
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id),
    
    -- Payout details
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    method VARCHAR(50) NOT NULL, -- stripe_connect, bank_transfer, paypal
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id), -- Admin who approved
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    
    -- Payment details
    account_details JSONB, -- Bank account, PayPal email, etc.
    transaction_id VARCHAR(255), -- External transaction ID
    failure_reason TEXT,
    
    -- Fees
    processing_fee INTEGER DEFAULT 0,
    net_amount INTEGER, -- Amount after fees
    
    -- Metadata
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT payouts_amount_positive CHECK (amount > 0),
    CONSTRAINT payouts_status_valid CHECK (status IN (
        'pending_approval', 'approved', 'processing', 'completed', 'failed', 'cancelled'
    )),
    CONSTRAINT payouts_method_valid CHECK (method IN ('stripe_connect', 'bank_transfer', 'paypal', 'check'))
);

-- =====================================================
-- 5. SELLER BANK ACCOUNTS TABLE
-- =====================================================
-- Seller payment account information
CREATE TABLE seller_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id),
    
    -- Account details (encrypted)
    account_type VARCHAR(50) NOT NULL, -- checking, savings, business_checking
    bank_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number_encrypted TEXT NOT NULL, -- Encrypted full account number
    account_number_last4 VARCHAR(4) NOT NULL, -- Last 4 digits for display
    routing_number VARCHAR(50) NOT NULL,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50), -- micro_deposits, instant, manual
    verification_attempts INTEGER DEFAULT 0,
    verification_data JSONB, -- Micro-deposit amounts, etc.
    
    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT seller_bank_accounts_account_type_valid CHECK (account_type IN ('checking', 'savings', 'business_checking')),
    CONSTRAINT seller_bank_accounts_verification_method_valid CHECK (verification_method IN ('micro_deposits', 'instant', 'manual'))
);

-- =====================================================
-- 6. COMMISSION SETTINGS TABLE
-- =====================================================
-- Platform commission configuration
CREATE TABLE commission_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Default rates
    default_rate DECIMAL(5,2) NOT NULL DEFAULT 15.00, -- 15% default
    
    -- Category-specific rates
    category_rates JSONB DEFAULT '{}', -- {"electronics": 12, "fashion": 18}
    
    -- Seller-specific rates
    seller_custom_rates JSONB DEFAULT '{}', -- {"seller-uuid": 10}
    
    -- Additional fees
    transaction_fee INTEGER DEFAULT 30, -- $0.30 per transaction
    listing_fee INTEGER DEFAULT 0, -- Fee per product listing
    subscription_fee INTEGER DEFAULT 0, -- Monthly seller subscription
    
    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE DEFAULT CURRENT_DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT commission_settings_default_rate_valid CHECK (default_rate >= 0 AND default_rate <= 100)
);

-- Insert default commission settings
INSERT INTO commission_settings (default_rate, category_rates, seller_custom_rates) 
VALUES (15.00, '{}', '{}') 
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. PAYOUT SETTINGS TABLE
-- =====================================================
-- Payout system configuration
CREATE TABLE payout_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Holding periods
    holding_period_days INTEGER DEFAULT 7, -- Hold funds for 7 days
    instant_payout_threshold INTEGER DEFAULT 100000, -- $1000 threshold for instant payout
    
    -- Minimums and limits
    minimum_payout_amount INTEGER DEFAULT 2000, -- $20 minimum
    maximum_payout_amount INTEGER DEFAULT 10000000, -- $100,000 maximum
    daily_payout_limit INTEGER DEFAULT 5000000, -- $50,000 daily limit
    
    -- Frequency settings
    auto_payout_enabled BOOLEAN DEFAULT FALSE,
    auto_payout_frequency VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, monthly
    auto_payout_day INTEGER DEFAULT 1, -- Day of week (1=Monday) or month
    
    -- Approval settings
    require_manual_approval BOOLEAN DEFAULT TRUE,
    auto_approve_threshold INTEGER DEFAULT 50000, -- Auto-approve under $500
    
    -- Fees
    bank_transfer_fee INTEGER DEFAULT 0, -- Free bank transfers
    instant_payout_fee INTEGER DEFAULT 100, -- $1 for instant payouts
    international_fee_rate DECIMAL(5,2) DEFAULT 2.50, -- 2.5% for international
    
    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT payout_settings_holding_period_valid CHECK (holding_period_days >= 0),
    CONSTRAINT payout_settings_frequency_valid CHECK (auto_payout_frequency IN ('daily', 'weekly', 'monthly'))
);

-- Insert default payout settings
INSERT INTO payout_settings (holding_period_days, minimum_payout_amount, require_manual_approval) 
VALUES (7, 2000, TRUE) 
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. PAYMENT METHODS CONFIG TABLE
-- =====================================================
-- Available payment methods configuration
CREATE TABLE payment_methods_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Stripe configuration
    stripe_enabled BOOLEAN DEFAULT TRUE,
    stripe_public_key VARCHAR(255),
    stripe_secret_key VARCHAR(255), -- Should be encrypted
    stripe_webhook_secret VARCHAR(255), -- Should be encrypted
    
    -- Bank transfer configuration
    bank_transfer_enabled BOOLEAN DEFAULT TRUE,
    bank_transfer_fee INTEGER DEFAULT 0,
    
    -- PayPal configuration
    paypal_enabled BOOLEAN DEFAULT FALSE,
    paypal_client_id VARCHAR(255),
    paypal_client_secret VARCHAR(255), -- Should be encrypted
    paypal_fee_rate DECIMAL(5,2) DEFAULT 2.90, -- 2.9%
    
    -- Other payment methods
    apple_pay_enabled BOOLEAN DEFAULT FALSE,
    google_pay_enabled BOOLEAN DEFAULT FALSE,
    
    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Insert default payment methods config
INSERT INTO payment_methods_config (stripe_enabled, bank_transfer_enabled) 
VALUES (TRUE, TRUE) 
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. REFUNDS TABLE
-- =====================================================
-- Refund processing records
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    payment_id UUID NOT NULL REFERENCES payments(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    sub_order_id UUID REFERENCES sub_orders(id), -- If partial refund for specific seller
    return_id UUID, -- Links to returns table if applicable
    
    -- Refund details
    amount INTEGER NOT NULL, -- Refund amount in cents
    reason VARCHAR(255),
    refund_type VARCHAR(50) NOT NULL, -- full, partial, return, dispute
    
    -- Processing
    stripe_refund_id VARCHAR(255), -- Stripe refund ID
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMP,
    
    -- Impact on sellers
    seller_adjustments JSONB, -- How refund affects each seller
    
    -- Metadata
    initiated_by UUID REFERENCES users(id), -- Who initiated the refund
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT refunds_amount_positive CHECK (amount > 0),
    CONSTRAINT refunds_status_valid CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT refunds_type_valid CHECK (refund_type IN ('full', 'partial', 'return', 'dispute', 'chargeback'))
);

-- =====================================================
-- 10. RETURNS TABLE
-- =====================================================
-- Product return requests
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    order_id UUID NOT NULL REFERENCES orders(id),
    sub_order_id UUID NOT NULL REFERENCES sub_orders(id),
    seller_id UUID NOT NULL REFERENCES users(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    
    -- Return details
    items JSONB NOT NULL, -- Items being returned
    reason VARCHAR(255) NOT NULL,
    return_type VARCHAR(50) NOT NULL, -- defective, wrong_item, not_as_described, changed_mind
    
    -- Financial impact
    refund_amount INTEGER NOT NULL,
    restocking_fee INTEGER DEFAULT 0,
    return_shipping_cost INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'requested',
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    shipped_at TIMESTAMP,
    received_at TIMESTAMP,
    processed_at TIMESTAMP,
    
    -- Shipping
    return_label_url TEXT,
    tracking_number VARCHAR(255),
    
    -- Resolution
    resolution VARCHAR(50), -- refund, exchange, store_credit
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT returns_status_valid CHECK (status IN (
        'requested', 'approved', 'rejected', 'shipped', 'received', 'processed', 'completed'
    )),
    CONSTRAINT returns_type_valid CHECK (return_type IN (
        'defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping'
    )),
    CONSTRAINT returns_resolution_valid CHECK (resolution IN ('refund', 'exchange', 'store_credit', 'none'))
);

-- =====================================================
-- 11. DISPUTES TABLE
-- =====================================================
-- Payment disputes and chargebacks
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- References
    payment_id UUID NOT NULL REFERENCES payments(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    seller_id UUID REFERENCES users(id), -- If dispute affects specific seller
    
    -- Dispute details
    stripe_dispute_id VARCHAR(255), -- Stripe dispute ID
    dispute_type VARCHAR(50) NOT NULL, -- chargeback, inquiry, warning
    reason VARCHAR(255),
    amount INTEGER NOT NULL, -- Disputed amount
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    due_date TIMESTAMP, -- Response due date
    resolved_at TIMESTAMP,
    
    -- Evidence and responses
    evidence JSONB, -- Evidence submitted
    response_notes TEXT,
    
    -- Resolution
    resolution VARCHAR(50), -- won, lost, accepted
    resolution_amount INTEGER, -- Final amount if different
    
    -- Metadata
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT disputes_type_valid CHECK (dispute_type IN ('chargeback', 'inquiry', 'warning')),
    CONSTRAINT disputes_status_valid CHECK (status IN ('open', 'under_review', 'won', 'lost', 'accepted')),
    CONSTRAINT disputes_resolution_valid CHECK (resolution IN ('won', 'lost', 'accepted', 'none'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Sub-orders indexes
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller_id ON sub_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_parent_order ON sub_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_payment_status ON sub_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_payout_status ON sub_orders(payout_status);

-- Seller earnings indexes
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller_id ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_status ON seller_earnings(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_available_date ON seller_earnings(available_date);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_payout_id ON seller_earnings(payout_id);

-- Payouts indexes
CREATE INDEX IF NOT EXISTS idx_payouts_seller_id ON payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON payouts(requested_at);

-- Bank accounts indexes
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_seller_id ON seller_bank_accounts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_verified ON seller_bank_accounts(verified);
CREATE INDEX IF NOT EXISTS idx_seller_bank_accounts_is_default ON seller_bank_accounts(is_default);

-- Returns indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_seller_id ON returns(seller_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_payment_id ON disputes(payment_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_earnings_updated_at BEFORE UPDATE ON seller_earnings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seller_bank_accounts_updated_at BEFORE UPDATE ON seller_bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON commission_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payout_settings_updated_at BEFORE UPDATE ON payout_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_config_updated_at BEFORE UPDATE ON payment_methods_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ PHASE 1 COMPLETE: Payment System Database Schema Created';
    RAISE NOTICE '📊 Tables Created:';
    RAISE NOTICE '   - Enhanced payments table with Stripe integration';
    RAISE NOTICE '   - Enhanced sub_orders table with commission tracking';
    RAISE NOTICE '   - seller_earnings table for payout management';
    RAISE NOTICE '   - payouts table for withdrawal processing';
    RAISE NOTICE '   - seller_bank_accounts table for payment methods';
    RAISE NOTICE '   - commission_settings table for fee configuration';
    RAISE NOTICE '   - payout_settings table for payout rules';
    RAISE NOTICE '   - payment_methods_config table for payment options';
    RAISE NOTICE '   - refunds table for refund processing';
    RAISE NOTICE '   - returns table for return management';
    RAISE NOTICE '   - disputes table for chargeback handling';
    RAISE NOTICE '🚀 Ready for Phase 2: Payment Processing Implementation';
END $$;