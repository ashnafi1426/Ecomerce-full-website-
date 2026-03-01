-- ============================================================
-- CREATE MISSING TABLES FOR E-COMMERCE BACKEND
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. ORDER ITEMS TABLE
-- Stores individual items within an order
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

COMMENT ON TABLE order_items IS 'Individual items within an order';

-- 2. CART TABLE
-- Stores shopping cart items for users
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_unique ON cart(user_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart(product_id);

COMMENT ON TABLE cart IS 'Shopping cart for users';

-- 3. COMMISSIONS TABLE
-- Tracks seller commissions from sales
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sub_order_id UUID NOT NULL REFERENCES sub_orders(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_commissions_seller_id ON commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_sub_order_id ON commissions(sub_order_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

COMMENT ON TABLE commissions IS 'Seller commissions from sales';

-- 4. PROMOTIONS TABLE
-- Stores promotional campaigns
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

COMMENT ON TABLE promotions IS 'Promotional campaigns and discounts';

-- 5. REFUNDS TABLE
-- Tracks refund requests and processing
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  return_id UUID REFERENCES returns(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  processed_by UUID REFERENCES users(id),
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_return_id ON refunds(return_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

COMMENT ON TABLE refunds IS 'Refund requests and processing';

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ORDER ITEMS POLICIES
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- CART POLICIES
CREATE POLICY "Users can manage their own cart"
  ON cart FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all carts"
  ON cart FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- COMMISSIONS POLICIES
CREATE POLICY "Sellers can view their own commissions"
  ON commissions FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Admins and managers can view all commissions"
  ON commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- PROMOTIONS POLICIES
CREATE POLICY "Everyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins and managers can manage promotions"
  ON promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- REFUNDS POLICIES
CREATE POLICY "Users can view their own refunds"
  ON refunds FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can manage all refunds"
  ON refunds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check if tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('order_items', 'cart', 'commissions', 'promotions', 'refunds')
ORDER BY table_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All missing tables created successfully!';
  RAISE NOTICE 'Run comprehensive-backend-test.js to verify.';
END $$;
