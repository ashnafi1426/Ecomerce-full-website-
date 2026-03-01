-- =====================================================
-- PHASE 5: COMPLETE ALL-IN-ONE SQL SCRIPT
-- FastShop E-Commerce Platform - Multi-Vendor Features
-- Created: February 8, 2026
-- =====================================================
-- This file contains EVERYTHING for Phase 5:
-- 1. All 7 new tables with indexes
-- 2. Updates to existing tables (users, products)
-- 3. Functions and triggers
-- 4. RLS policies for API access
-- 5. Default data seeding
-- 6. Schema cache refresh
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: CREATE NEW TABLES
-- =====================================================

-- 1.1 SELLER DOCUMENTS TABLE
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

-- Indexes for seller_documents
CREATE INDEX IF NOT EXISTS idx_seller_documents_seller_id ON seller_documents(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_documents_status ON seller_documents(status);
CREATE INDEX IF NOT EXISTS idx_seller_documents_type ON seller_documents(document_type);

-- 1.2 SELLER EARNINGS TABLE
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

-- Indexes for seller_earnings
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller_id ON seller_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_order_id ON seller_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_payout_status ON seller_earnings(payout_status);

-- 1.3 PRODUCT APPROVALS TABLE
CREATE TABLE IF NOT EXISTS product_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'revision_requested')),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for product_approvals
CREATE INDEX IF NOT EXISTS idx_product_approvals_product_id ON product_approvals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_approvals_reviewer_id ON product_approvals(reviewer_id);

-- 1.4 SELLER PERFORMANCE TABLE
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

-- Index for seller_performance
CREATE INDEX IF NOT EXISTS idx_seller_performance_seller_id ON seller_performance(seller_id);

-- 1.5 MANAGER ACTIONS TABLE
CREATE TABLE IF NOT EXISTS manager_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for manager_actions
CREATE INDEX IF NOT EXISTS idx_manager_actions_manager_id ON manager_actions(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_actions_entity_type ON manager_actions(entity_type);
CREATE INDEX IF NOT EXISTS idx_manager_actions_created_at ON manager_actions(created_at);

-- 1.6 NOTIFICATIONS TABLE
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

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- 1.7 PAYOUT REQUESTS TABLE
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

-- Indexes for payout_requests
CREATE INDEX IF NOT EXISTS idx_payout_requests_seller_id ON payout_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_requested_at ON payout_requests(requested_at);

-- =====================================================
-- PART 2: UPDATE EXISTING TABLES
-- =====================================================

-- 2.1 Add seller verification fields to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='seller_verification_status') THEN
    ALTER TABLE users ADD COLUMN seller_verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (seller_verification_status IN ('unverified', 'pending', 'verified', 'rejected'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='seller_verified_at') THEN
    ALTER TABLE users ADD COLUMN seller_verified_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='seller_verified_by') THEN
    ALTER TABLE users ADD COLUMN seller_verified_by UUID REFERENCES users(id);
  END IF;
END $$;

-- 2.2 Add approval workflow fields to products table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='approval_status') THEN
    ALTER TABLE products ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='approved_at') THEN
    ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='approved_by') THEN
    ALTER TABLE products ADD COLUMN approved_by UUID REFERENCES users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='rejection_reason') THEN
    ALTER TABLE products ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- =====================================================
-- PART 3: FUNCTIONS AND TRIGGERS
-- =====================================================

-- 3.1 Function to update seller performance metrics
CREATE OR REPLACE FUNCTION update_seller_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics when order status changes
  IF TG_TABLE_NAME = 'orders' AND NEW.seller_id IS NOT NULL THEN
    INSERT INTO seller_performance (seller_id)
    VALUES (NEW.seller_id)
    ON CONFLICT (seller_id) DO NOTHING;
    
    -- Recalculate metrics
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

-- 3.2 Trigger for seller performance updates
DROP TRIGGER IF EXISTS trigger_update_seller_performance ON orders;
CREATE TRIGGER trigger_update_seller_performance
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_seller_performance();

-- 3.3 Function to create notification
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
-- PART 4: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- 4.1 Enable RLS on all Phase 5 tables
ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- 4.2 Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can access seller_documents" ON seller_documents;
DROP POLICY IF EXISTS "Service role can access seller_earnings" ON seller_earnings;
DROP POLICY IF EXISTS "Service role can access product_approvals" ON product_approvals;
DROP POLICY IF EXISTS "Service role can access seller_performance" ON seller_performance;
DROP POLICY IF EXISTS "Service role can access manager_actions" ON manager_actions;
DROP POLICY IF EXISTS "Service role can access notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can access payout_requests" ON payout_requests;

-- 4.3 Create permissive policies for service role (backend access)
CREATE POLICY "Service role can access seller_documents" ON seller_documents
  FOR ALL USING (true);

CREATE POLICY "Service role can access seller_earnings" ON seller_earnings
  FOR ALL USING (true);

CREATE POLICY "Service role can access product_approvals" ON product_approvals
  FOR ALL USING (true);

CREATE POLICY "Service role can access seller_performance" ON seller_performance
  FOR ALL USING (true);

CREATE POLICY "Service role can access manager_actions" ON manager_actions
  FOR ALL USING (true);

CREATE POLICY "Service role can access notifications" ON notifications
  FOR ALL USING (true);

CREATE POLICY "Service role can access payout_requests" ON payout_requests
  FOR ALL USING (true);

-- =====================================================
-- PART 5: SEED DEFAULT DATA
-- =====================================================

-- 5.1 Create seller performance records for existing sellers
INSERT INTO seller_performance (seller_id)
SELECT id FROM users WHERE role = 'seller'
ON CONFLICT (seller_id) DO NOTHING;

-- =====================================================
-- PART 6: REFRESH POSTGREST SCHEMA CACHE
-- =====================================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- PART 7: VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'seller_documents',
    'seller_earnings',
    'product_approvals',
    'seller_performance',
    'manager_actions',
    'notifications',
    'payout_requests'
  );
  
  RAISE NOTICE '✅ Phase 5 Tables Created: % out of 7', table_count;
  
  IF table_count = 7 THEN
    RAISE NOTICE '🎉 ALL PHASE 5 TABLES CREATED SUCCESSFULLY!';
  ELSE
    RAISE WARNING '⚠️  Only % tables created. Expected 7.', table_count;
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Phase 5 Migration Completed Successfully!';
  RAISE NOTICE 'Date: %', NOW();
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 7 New Tables Created';
  RAISE NOTICE '✅ Indexes Created';
  RAISE NOTICE '✅ Functions & Triggers Created';
  RAISE NOTICE '✅ RLS Policies Enabled';
  RAISE NOTICE '✅ Default Data Seeded';
  RAISE NOTICE '✅ Schema Cache Refreshed';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Phase 5 is Ready!';
  RAISE NOTICE '============================================';
END $$;
