-- =====================================================
-- COMPLETE DATABASE SCHEMA - ALL PHASES (1-5)
-- FastShop E-Commerce Platform
-- Created: February 8, 2026
-- =====================================================
-- This file contains ALL tables from ALL phases
-- Total Tables: 27+
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- BASE TABLES (Phase 0 - Original)
-- =====================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'seller', 'manager')),
  display_name VARCHAR(255),
  phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'US',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  login_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  -- Phase 1 additions
  business_name VARCHAR(255),
  business_license VARCHAR(255),
  tax_id VARCHAR(100),
  seller_tier VARCHAR(50) CHECK (seller_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  commission_rate DECIMAL(5, 2),
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  seller_verification_status VARCHAR(20) DEFAULT 'unverified',
  seller_verified_at TIMESTAMP,
  seller_verified_by UUID REFERENCES users(id)
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);


-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Phase 1 additions
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  submitted_for_approval_at TIMESTAMP DEFAULT NOW(),
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  sku VARCHAR(100),
  brand VARCHAR(100),
  weight DECIMAL(10, 2),
  dimensions JSONB,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP
);

-- 4. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 10,
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (quantity >= reserved_quantity)
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  basket JSONB NOT NULL,
  shipping_address JSONB,
  status VARCHAR(50) DEFAULT 'pending_payment',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  fulfilled_at TIMESTAMP,
  fulfilled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Phase 1 additions
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2),
  seller_payout_amount DECIMAL(10, 2),
  seller_payout_status VARCHAR(50) DEFAULT 'pending',
  payout_released_at TIMESTAMP,
  order_items JSONB
);


-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(50) NOT NULL CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. RETURNS TABLE
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  refund_amount INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Phase 1 additions
  return_type VARCHAR(50) CHECK (return_type IN ('refund', 'replacement', 'store_credit')),
  seller_id UUID REFERENCES users(id),
  seller_approved BOOLEAN DEFAULT FALSE,
  seller_approved_at TIMESTAMP,
  return_shipping_label_url TEXT,
  received_at TIMESTAMP,
  inspection_notes TEXT,
  restocking_fee DECIMAL(10, 2) DEFAULT 0
);

-- 8. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'US',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. AUDIT_LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(10) NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Phase 1 additions
  entity_id UUID,
  entity_type VARCHAR(100),
  action_type VARCHAR(100),
  description TEXT,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB
);


-- =====================================================
-- PHASE 1 TABLES - Multi-Vendor Features
-- =====================================================

-- 10. COMMISSION_RATES TABLE
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('global', 'category', 'seller_tier', 'promotional')),
  commission_percentage DECIMAL(5, 2) NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 50),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  seller_tier VARCHAR(50) CHECK (seller_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. SELLER_BALANCES TABLE
CREATE TABLE IF NOT EXISTS seller_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  available_balance DECIMAL(12, 2) DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance DECIMAL(12, 2) DEFAULT 0 CHECK (pending_balance >= 0),
  escrow_balance DECIMAL(12, 2) DEFAULT 0 CHECK (escrow_balance >= 0),
  lifetime_earnings DECIMAL(12, 2) DEFAULT 0 CHECK (lifetime_earnings >= 0),
  total_commission_paid DECIMAL(12, 2) DEFAULT 0 CHECK (total_commission_paid >= 0),
  last_payout_at TIMESTAMP,
  last_payout_amount DECIMAL(12, 2),
  next_payout_date DATE,
  payout_hold BOOLEAN DEFAULT FALSE,
  payout_hold_reason TEXT,
  payout_hold_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 12. SELLER_PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS seller_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payout_amount DECIMAL(12, 2) NOT NULL CHECK (payout_amount > 0),
  payout_method VARCHAR(50) NOT NULL CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe_connect', 'check')),
  payout_status VARCHAR(50) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  destination_account VARCHAR(255),
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  initiated_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  paid_at TIMESTAMP,
  initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL
);


-- 13. PAYMENT_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'customer_payment', 'seller_payout', 'refund', 'commission', 
    'adjustment', 'chargeback', 'fee'
  )),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payout_id UUID REFERENCES seller_payouts(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  commission_amount DECIMAL(12, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2),
  net_amount DECIMAL(12, 2),
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 14. SUB_ORDERS TABLE
CREATE TABLE IF NOT EXISTS sub_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  commission_amount DECIMAL(10, 2) DEFAULT 0,
  commission_rate DECIMAL(5, 2),
  seller_payout_amount DECIMAL(10, 2),
  fulfillment_status VARCHAR(50) DEFAULT 'pending',
  tracking_number VARCHAR(255),
  carrier VARCHAR(100),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  payout_status VARCHAR(50) DEFAULT 'pending',
  payout_released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('product_quality', 'not_received', 'wrong_item', 'damaged', 'other')),
  description TEXT NOT NULL,
  evidence JSONB,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed', 'escalated')),
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- 16. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 17. CART TABLE
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- =====================================================
-- PHASE 5 TABLES - Advanced Multi-Vendor Features
-- =====================================================

-- 18. SELLER_DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS seller_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('business_license', 'tax_id', 'bank_statement', 'identity_proof', 'address_proof')),
  document_url TEXT NOT NULL,
  document_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 19. SELLER_EARNINGS TABLE
CREATE TABLE IF NOT EXISTS seller_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sub_order_id UUID REFERENCES sub_orders(id),
  gross_amount DECIMAL(10,2) NOT NULL CHECK (gross_amount >= 0),
  commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
  net_amount DECIMAL(10,2) NOT NULL CHECK (net_amount >= 0),
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date TIMESTAMP,
  payout_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- 20. PRODUCT_APPROVALS TABLE
CREATE TABLE IF NOT EXISTS product_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'revision_requested')),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 21. SELLER_PERFORMANCE TABLE
CREATE TABLE IF NOT EXISTS seller_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_sales DECIMAL(12,2) DEFAULT 0 CHECK (total_sales >= 0),
  total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
  completed_orders INTEGER DEFAULT 0 CHECK (completed_orders >= 0),
  cancelled_orders INTEGER DEFAULT 0 CHECK (cancelled_orders >= 0),
  average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
  response_time_hours DECIMAL(6,2) DEFAULT 0 CHECK (response_time_hours >= 0),
  fulfillment_rate DECIMAL(5,2) DEFAULT 0 CHECK (fulfillment_rate >= 0 AND fulfillment_rate <= 100),
  return_rate DECIMAL(5,2) DEFAULT 0 CHECK (return_rate >= 0 AND return_rate <= 100),
  dispute_rate DECIMAL(5,2) DEFAULT 0 CHECK (dispute_rate >= 0 AND dispute_rate <= 100),
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 22. MANAGER_ACTIONS TABLE
CREATE TABLE IF NOT EXISTS manager_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 23. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 24. PAYOUT_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),
  payment_method VARCHAR(50) NOT NULL,
  payment_details JSONB,
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  processed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  transaction_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- =====================================================
-- INDEXES - ALL TABLES
-- =====================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_seller_tier ON users(seller_tier);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Returns indexes
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_seller ON returns(seller_id);

-- Addresses indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Commission rates indexes
CREATE INDEX IF NOT EXISTS idx_commission_rates_type ON commission_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_commission_rates_active ON commission_rates(is_active);

-- Seller balances indexes
CREATE INDEX IF NOT EXISTS idx_seller_balances_seller ON seller_balances(seller_id);

-- Seller payouts indexes
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(payout_status);

-- Payment transactions indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_seller ON payment_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(transaction_type);

-- Sub orders indexes
CREATE INDEX IF NOT EXISTS idx_sub_orders_parent ON sub_orders(parent_order_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_seller ON sub_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_sub_orders_status ON sub_orders(fulfillment_status);


-- Disputes indexes
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_seller ON disputes(seller_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- Cart indexes
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON cart(product_id);

-- Seller documents indexes
CREATE INDEX IF NOT EXISTS idx_seller_documents_seller ON seller_documents(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_documents_status ON seller_documents(status);

-- Seller earnings indexes
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_order ON seller_earnings(order_id);

-- Product approvals indexes
CREATE INDEX IF NOT EXISTS idx_product_approvals_product ON product_approvals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_approvals_reviewer ON product_approvals(reviewer_id);

-- Seller performance indexes
CREATE INDEX IF NOT EXISTS idx_seller_performance_seller ON seller_performance(seller_id);

-- Manager actions indexes
CREATE INDEX IF NOT EXISTS idx_manager_actions_manager ON manager_actions(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_actions_entity ON manager_actions(entity_type);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Payout requests indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_seller ON payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for service role
CREATE POLICY "Service role access" ON seller_documents FOR ALL USING (true);
CREATE POLICY "Service role access" ON seller_earnings FOR ALL USING (true);
CREATE POLICY "Service role access" ON product_approvals FOR ALL USING (true);
CREATE POLICY "Service role access" ON seller_performance FOR ALL USING (true);
CREATE POLICY "Service role access" ON manager_actions FOR ALL USING (true);
CREATE POLICY "Service role access" ON notifications FOR ALL USING (true);
CREATE POLICY "Service role access" ON payout_requests FOR ALL USING (true);


-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_balances_updated_at BEFORE UPDATE ON seller_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_orders_updated_at BEFORE UPDATE ON sub_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seller performance update function
CREATE OR REPLACE FUNCTION update_seller_performance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'orders' AND NEW.seller_id IS NOT NULL THEN
    INSERT INTO seller_performance (seller_id)
    VALUES (NEW.seller_id)
    ON CONFLICT (seller_id) DO NOTHING;
    
    UPDATE seller_performance
    SET 
      total_orders = (SELECT COUNT(*) FROM orders WHERE seller_id = NEW.seller_id),
      completed_orders = (SELECT COUNT(*) FROM orders WHERE seller_id = NEW.seller_id AND status = 'delivered'),
      cancelled_orders = (SELECT COUNT(*) FROM orders WHERE seller_id = NEW.seller_id AND status = 'cancelled'),
      last_calculated_at = NOW(),
      updated_at = NOW()
    WHERE seller_id = NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seller_performance
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_seller_performance();

-- Notification creation function
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_data JSONB DEFAULT NULL,
  p_priority VARCHAR DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data, priority)
  VALUES (p_user_id, p_type, p_title, p_message, p_data, p_priority)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default admin user
INSERT INTO users (email, password_hash, role, display_name, status)
VALUES (
  'admin@ecommerce.com',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
  'admin',
  'System Administrator',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Clothing', 'Apparel and fashion'),
  ('Books', 'Books and publications'),
  ('Home & Garden', 'Home improvement and garden supplies'),
  ('Sports & Outdoors', 'Sports equipment and outdoor gear'),
  ('Toys & Games', 'Toys and games for all ages')
ON CONFLICT (name) DO NOTHING;

-- Insert default commission rates
INSERT INTO commission_rates (rate_type, commission_percentage, description, is_active)
VALUES ('global', 10.00, 'Default platform commission rate', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO commission_rates (rate_type, seller_tier, commission_percentage, description, is_active)
VALUES 
  ('seller_tier', 'bronze', 12.00, 'Bronze tier sellers', TRUE),
  ('seller_tier', 'silver', 10.00, 'Silver tier sellers', TRUE),
  ('seller_tier', 'gold', 8.00, 'Gold tier sellers', TRUE),
  ('seller_tier', 'platinum', 5.00, 'Platinum tier sellers', TRUE)
ON CONFLICT DO NOTHING;

-- Create seller performance records for existing sellers
INSERT INTO seller_performance (seller_id)
SELECT id FROM users WHERE role = 'seller'
ON CONFLICT (seller_id) DO NOTHING;

-- Create seller balances for existing sellers
INSERT INTO seller_balances (seller_id)
SELECT id FROM users WHERE role = 'seller'
ON CONFLICT (seller_id) DO NOTHING;

-- =====================================================
-- REFRESH POSTGREST CACHE
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Tables Created: %', table_count;
  RAISE NOTICE 'Date: %', NOW();
  RAISE NOTICE '============================================';
END $$;

-- List all tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;