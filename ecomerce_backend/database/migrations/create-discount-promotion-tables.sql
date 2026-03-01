-- =====================================================
-- DISCOUNT AND PROMOTION SYSTEM TABLES
-- FastShop E-Commerce Platform
-- Implements FR-14.1 to FR-14.11
-- =====================================================

-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. COUPONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  per_user_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_to VARCHAR(20) DEFAULT 'all' CHECK (applicable_to IN ('all', 'category', 'product', 'seller')),
  applicable_ids JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (valid_until > valid_from),
  CONSTRAINT usage_limit_check CHECK (usage_limit IS NULL OR usage_limit > 0),
  CONSTRAINT per_user_limit_check CHECK (per_user_limit > 0)
);

-- =====================================================
-- 2. COUPON_USAGE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount >= 0),
  used_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

-- =====================================================
-- 3. PROMOTIONAL_PRICING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS promotional_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  promotional_price DECIMAL(10, 2) NOT NULL CHECK (promotional_price >= 0),
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_promo_dates CHECK (valid_until > valid_from),
  CONSTRAINT unique_product_promo UNIQUE(product_id, variant_id, valid_from, valid_until)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Coupons indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_coupons_applicable_to ON coupons(applicable_to);

-- Coupon usage indexes
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON coupon_usage(used_at DESC);

-- Promotional pricing indexes
CREATE INDEX IF NOT EXISTS idx_promotional_pricing_product ON promotional_pricing(product_id);
CREATE INDEX IF NOT EXISTS idx_promotional_pricing_variant ON promotional_pricing(variant_id);
CREATE INDEX IF NOT EXISTS idx_promotional_pricing_active ON promotional_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_promotional_pricing_dates ON promotional_pricing(valid_from, valid_until);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_pricing ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for service role
CREATE POLICY "Service role access coupons" ON coupons FOR ALL USING (true);
CREATE POLICY "Service role access coupon_usage" ON coupon_usage FOR ALL USING (true);
CREATE POLICY "Service role access promotional_pricing" ON promotional_pricing FOR ALL USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for coupons
CREATE TRIGGER update_coupons_updated_at 
BEFORE UPDATE ON coupons
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Update timestamp trigger for promotional_pricing
CREATE TRIGGER update_promotional_pricing_updated_at 
BEFORE UPDATE ON promotional_pricing
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Increment coupon usage count trigger
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons 
  SET usage_count = usage_count + 1
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_coupon_usage
AFTER INSERT ON coupon_usage
FOR EACH ROW
EXECUTE FUNCTION increment_coupon_usage();

-- =====================================================
-- ADD COLUMNS TO ORDERS TABLE
-- =====================================================

-- Add coupon-related columns to orders table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
    ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Add index for coupon_code on orders
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to validate coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_coupon_code VARCHAR,
  p_user_id UUID,
  p_cart_total DECIMAL,
  p_cart_items JSONB
)
RETURNS TABLE(
  is_valid BOOLEAN,
  message TEXT,
  discount_amount DECIMAL,
  coupon_id UUID
) AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage_count INTEGER;
  v_calculated_discount DECIMAL;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = p_coupon_code;
  
  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Invalid coupon code'::TEXT, 0::DECIMAL, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if coupon is active
  IF NOT v_coupon.is_active THEN
    RETURN QUERY SELECT FALSE, 'Coupon is not active'::TEXT, 0::DECIMAL, v_coupon.id;
    RETURN;
  END IF;
  
  -- Check validity dates
  IF NOW() < v_coupon.valid_from THEN
    RETURN QUERY SELECT FALSE, 'Coupon is not yet valid'::TEXT, 0::DECIMAL, v_coupon.id;
    RETURN;
  END IF;
  
  IF NOW() > v_coupon.valid_until THEN
    RETURN QUERY SELECT FALSE, 'Coupon has expired'::TEXT, 0::DECIMAL, v_coupon.id;
    RETURN;
  END IF;
  
  -- Check total usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RETURN QUERY SELECT FALSE, 'Coupon usage limit reached'::TEXT, 0::DECIMAL, v_coupon.id;
    RETURN;
  END IF;
  
  -- Check per-user usage limit
  SELECT COUNT(*) INTO v_user_usage_count
  FROM coupon_usage
  WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
  
  IF v_user_usage_count >= v_coupon.per_user_limit THEN
    RETURN QUERY SELECT FALSE, 'You have already used this coupon'::TEXT, 0::DECIMAL, v_coupon.id;
    RETURN;
  END IF;
  
  -- Check minimum order amount
  IF p_cart_total < v_coupon.min_order_amount THEN
    RETURN QUERY SELECT FALSE, 
      format('Minimum order amount of $%s required', v_coupon.min_order_amount)::TEXT, 
      0::DECIMAL, v_coupon.id;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_calculated_discount := (p_cart_total * v_coupon.discount_value / 100);
    IF v_coupon.max_discount_amount IS NOT NULL THEN
      v_calculated_discount := LEAST(v_calculated_discount, v_coupon.max_discount_amount);
    END IF;
  ELSIF v_coupon.discount_type = 'fixed' THEN
    v_calculated_discount := LEAST(v_coupon.discount_value, p_cart_total);
  ELSIF v_coupon.discount_type = 'free_shipping' THEN
    v_calculated_discount := 0; -- Shipping discount handled separately
  END IF;
  
  -- Return success
  RETURN QUERY SELECT TRUE, 'Coupon is valid'::TEXT, v_calculated_discount, v_coupon.id;
END;
$$ LANGUAGE plpgsql;

-- Function to get active promotional price
CREATE OR REPLACE FUNCTION get_promotional_price(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_promo_price DECIMAL;
BEGIN
  SELECT promotional_price INTO v_promo_price
  FROM promotional_pricing
  WHERE product_id = p_product_id
    AND (variant_id = p_variant_id OR (variant_id IS NULL AND p_variant_id IS NULL))
    AND is_active = TRUE
    AND NOW() BETWEEN valid_from AND valid_until
  ORDER BY promotional_price ASC
  LIMIT 1;
  
  RETURN v_promo_price;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA (Sample Coupons)
-- =====================================================

-- Insert sample coupons (only if admin user exists)
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    -- Welcome coupon
    INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, usage_limit, per_user_limit, valid_from, valid_until, is_active, applicable_to, created_by)
    VALUES (
      'WELCOME10',
      'Welcome discount - 10% off your first order',
      'percentage',
      10.00,
      50.00,
      1000,
      1,
      NOW(),
      NOW() + INTERVAL '90 days',
      TRUE,
      'all',
      v_admin_id
    ) ON CONFLICT (code) DO NOTHING;
    
    -- Free shipping coupon
    INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, usage_limit, per_user_limit, valid_from, valid_until, is_active, applicable_to, created_by)
    VALUES (
      'FREESHIP',
      'Free shipping on orders over $100',
      'free_shipping',
      0,
      100.00,
      NULL,
      5,
      NOW(),
      NOW() + INTERVAL '180 days',
      TRUE,
      'all',
      v_admin_id
    ) ON CONFLICT (code) DO NOTHING;
    
    -- Fixed discount coupon
    INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, usage_limit, per_user_limit, valid_from, valid_until, is_active, applicable_to, created_by)
    VALUES (
      'SAVE20',
      '$20 off orders over $200',
      'fixed',
      20.00,
      200.00,
      500,
      3,
      NOW(),
      NOW() + INTERVAL '60 days',
      TRUE,
      'all',
      v_admin_id
    ) ON CONFLICT (code) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Discount and Promotion System tables created successfully!';
  RAISE NOTICE 'Tables created: coupons, coupon_usage, promotional_pricing';
  RAISE NOTICE 'Columns added to orders: coupon_code, discount_amount';
  RAISE NOTICE 'Helper functions created: validate_coupon(), get_promotional_price()';
END $$;
