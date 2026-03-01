-- ============================================================================
-- FASTSHOP MIGRATION: Phase 1.3 - Commission and Financial Tables
-- Description: Creates tables for commission tracking, seller payouts, and financial management
-- Version: 1.0
-- Date: February 7, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Commission Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Configuration Type
  rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('global', 'category', 'seller_tier', 'promotional')),
  
  -- Rate Details
  commission_percentage DECIMAL(5, 2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 50),
  
  -- Applicability
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  seller_tier VARCHAR(50) CHECK (seller_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Promotional Period
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (rate_type = 'global' AND category_id IS NULL AND seller_tier IS NULL) OR
    (rate_type = 'category' AND category_id IS NOT NULL) OR
    (rate_type = 'seller_tier' AND seller_tier IS NOT NULL) OR
    (rate_type = 'promotional')
  )
);

COMMENT ON TABLE commission_rates IS 'Commission rate configurations for different scenarios';

-- ============================================================================
-- STEP 2: Create Seller Balances Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Seller Reference (1:1)
  seller_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Balance Tracking
  available_balance DECIMAL(12, 2) DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(12, 2) DEFAULT 0 CHECK (pending_balance >= 0),
  escrow_balance DECIMAL(12, 2) DEFAULT 0 CHECK (escrow_balance >= 0),
  lifetime_earnings DECIMAL(12, 2) DEFAULT 0 CHECK (lifetime_earnings >= 0),
  
  -- Commission Tracking
  total_commission_paid DECIMAL(12, 2) DEFAULT 0 CHECK (total_commission_paid >= 0),
  
  -- Payout Tracking
  last_payout_at TIMESTAMP WITH TIME ZONE,
  last_payout_amount DECIMAL(12, 2),
  next_payout_date DATE,
  
  -- Holds and Restrictions
  payout_hold BOOLEAN DEFAULT FALSE,
  payout_hold_reason TEXT,
  payout_hold_until TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE seller_balances IS 'Real-time balance tracking for each seller';
COMMENT ON COLUMN seller_balances.available_balance IS 'Funds ready for payout';
COMMENT ON COLUMN seller_balances.pending_balance IS 'Funds from recent orders (not yet released)';
COMMENT ON COLUMN seller_balances.escrow_balance IS 'Funds held in escrow until order delivery';

-- ============================================================================
-- STEP 3: Create Seller Payouts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Seller Reference
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Payout Details
  payout_amount DECIMAL(12, 2) NOT NULL CHECK (payout_amount > 0),
  payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe_connect', 'check')),
  payout_status VARCHAR(50) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  
  -- Payment Gateway Details
  transaction_id VARCHAR(255), -- External payment gateway transaction ID
  gateway_response JSONB, -- Full response from payment gateway
  
  -- Destination Details
  destination_account VARCHAR(255), -- Last 4 digits or masked account
  
  -- Failure Handling
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE seller_payouts IS 'History of all seller payout transactions';

-- ============================================================================
-- STEP 4: Create Payment Transactions Table (Comprehensive)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transaction Type
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'customer_payment', 'seller_payout', 'refund', 'commission', 
    'adjustment', 'chargeback', 'fee'
  )),
  
  -- References
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payout_id UUID REFERENCES seller_payouts(id) ON DELETE SET NULL,
  
  -- Amount Details
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Commission Details (for customer payments)
  commission_amount DECIMAL(12, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2),
  net_amount DECIMAL(12, 2), -- Amount after commission
  
  -- Payment Method
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  
  -- Status
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  
  -- IP and Security
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

COMMENT ON TABLE payment_transactions IS 'Comprehensive log of all financial transactions';

-- ============================================================================
-- STEP 5: Update Orders Table for Multi-Vendor
-- ============================================================================

-- Add commission and seller fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_payout_amount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_payout_status VARCHAR(50) DEFAULT 'pending' 
  CHECK (seller_payout_status IN ('pending', 'escrowed', 'released', 'paid'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_released_at TIMESTAMP WITH TIME ZONE;

-- Add order items as JSONB (for multi-vendor support)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_items JSONB;

COMMENT ON COLUMN orders.seller_id IS 'Primary seller for single-vendor orders';
COMMENT ON COLUMN orders.commission_amount IS 'Platform commission for this order';
COMMENT ON COLUMN orders.seller_payout_amount IS 'Amount to be paid to seller';
COMMENT ON COLUMN orders.order_items IS 'Detailed order items with seller info for multi-vendor';

-- ============================================================================
-- STEP 6: Create Sub-Orders Table (for Multi-Vendor Orders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sub_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Parent Order Reference
  parent_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Seller Reference
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Sub-Order Details
  items JSONB NOT NULL, -- Products from this seller
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  
  -- Commission
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2),
  seller_payout_amount DECIMAL(10, 2),
  
  -- Fulfillment
  fulfillment_status VARCHAR(50) DEFAULT 'pending' CHECK (fulfillment_status IN (
    'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'
  )),
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Payout Status
  payout_status VARCHAR(50) DEFAULT 'pending' CHECK (payout_status IN (
    'pending', 'escrowed', 'released', 'paid'
  )),
  payout_released_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE sub_orders IS 'Individual seller orders within a multi-vendor order';

-- ============================================================================
-- STEP 7: Create Indexes
-- ============================================================================

-- Commission Rates Indexes
CREATE INDEX IF NOT EXISTS idx_commission_rates_type ON commission_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_commission_rates_category ON commission_rates(category_id);
CREATE INDEX IF NOT EXISTS idx_commission_rates_tier ON commission_rates(seller_tier);
CREATE INDEX IF NOT EXISTS idx_commission_rates_active ON commission_rates(is_active) WHERE is_active = TRUE;

-- Seller Balances Indexes
CREATE INDEX IF NOT EXISTS idx_seller_balances_seller ON seller_balances(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_balances_payout_hold ON seller_balances(payout_hold) WHERE payout_hold = TRUE;
CREATE INDEX IF NOT EXISTS idx_seller_balances_next_payout ON seller_balances(next_payout_date) WHERE next_payout_date IS NOT NULL;

-- Seller Payouts Indexes
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(payout_status);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_initiated_at ON seller_payouts(initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_transaction_id ON seller_payouts(transaction_id);

-- Composite index for pending payouts
CREATE INDEX IF NOT EXISTS idx_seller_payouts_pending ON seller_payouts(seller_id, initiated_at) 
  WHERE payout_status IN ('pending', 'processing');

-- Payment Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_seller ON payment_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payout ON payment_transactions(payout_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON payment_transactions(gateway_transaction_id);

-- Sub-Orders Indexes
CREATE INDEX IF NOT EXISTS idx_sub_orders_parent ON sub_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller ON sub_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_fulfillment_status ON sub_orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_payout_status ON sub_orders(payout_status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_created_at ON sub_orders(created_at DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller_status ON sub_orders(seller_id, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller_payout ON sub_orders(seller_id, payout_status);

-- ============================================================================
-- STEP 8: Create Triggers
-- ============================================================================

-- Update timestamp trigger for new tables
CREATE TRIGGER update_commission_rates_updated_at
  BEFORE UPDATE ON commission_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_balances_updated_at
  BEFORE UPDATE ON seller_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_orders_updated_at
  BEFORE UPDATE ON sub_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 9: Create Helper Functions
-- ============================================================================

-- Function to get applicable commission rate
CREATE OR REPLACE FUNCTION get_commission_rate(
  p_seller_id UUID,
  p_category_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_rate DECIMAL(5, 2);
  v_seller_tier VARCHAR(50);
  v_custom_rate DECIMAL(5, 2);
BEGIN
  -- Check for custom seller rate
  SELECT commission_rate, seller_tier INTO v_custom_rate, v_seller_tier
  FROM users
  WHERE id = p_seller_id AND role = 'seller';
  
  IF v_custom_rate IS NOT NULL THEN
    RETURN v_custom_rate;
  END IF;
  
  -- Check for category-specific rate
  IF p_category_id IS NOT NULL THEN
    SELECT commission_percentage INTO v_rate
    FROM commission_rates
    WHERE rate_type = 'category' 
      AND category_id = p_category_id
      AND is_active = TRUE
      AND (valid_until IS NULL OR valid_until > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_rate IS NOT NULL THEN
      RETURN v_rate;
    END IF;
  END IF;
  
  -- Check for seller tier rate
  IF v_seller_tier IS NOT NULL THEN
    SELECT commission_percentage INTO v_rate
    FROM commission_rates
    WHERE rate_type = 'seller_tier' 
      AND seller_tier = v_seller_tier
      AND is_active = TRUE
      AND (valid_until IS NULL OR valid_until > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_rate IS NOT NULL THEN
      RETURN v_rate;
    END IF;
  END IF;
  
  -- Fall back to global rate
  SELECT commission_percentage INTO v_rate
  FROM commission_rates
  WHERE rate_type = 'global' 
    AND is_active = TRUE
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_rate, 10.00); -- Default 10% if no rate configured
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_commission_rate IS 'Calculate applicable commission rate for a seller/category';

-- Function to calculate seller payout
CREATE OR REPLACE FUNCTION calculate_seller_payout(
  p_order_amount DECIMAL,
  p_commission_rate DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN p_order_amount * (1 - (p_commission_rate / 100));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 10: Insert Default Commission Rates
-- ============================================================================

-- Insert global default commission rate (10%)
INSERT INTO commission_rates (rate_type, commission_percentage, description, is_active)
VALUES ('global', 10.00, 'Default platform commission rate', TRUE)
ON CONFLICT DO NOTHING;

-- Insert tier-based rates
INSERT INTO commission_rates (rate_type, seller_tier, commission_percentage, description, is_active)
VALUES 
  ('seller_tier', 'bronze', 12.00, 'Bronze tier sellers', TRUE),
  ('seller_tier', 'silver', 10.00, 'Silver tier sellers', TRUE),
  ('seller_tier', 'gold', 8.00, 'Gold tier sellers', TRUE),
  ('seller_tier', 'platinum', 5.00, 'Platinum tier sellers', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 11: Create Seller Balance for Existing Sellers
-- ============================================================================

INSERT INTO seller_balances (seller_id)
SELECT id FROM users WHERE role = 'seller'
ON CONFLICT (seller_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Phase 1.3 Migration Completed Successfully!' as status;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('commission_rates', 'seller_balances', 'seller_payouts', 'payment_transactions', 'sub_orders')
ORDER BY table_name;

-- Show commission rates
SELECT rate_type, seller_tier, commission_percentage, is_active
FROM commission_rates
ORDER BY rate_type, seller_tier;
