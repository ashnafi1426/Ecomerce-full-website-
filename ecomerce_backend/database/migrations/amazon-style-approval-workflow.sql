-- =====================================================
-- AMAZON-STYLE PRODUCT APPROVAL WORKFLOW
-- Multi-Vendor E-Commerce Platform
-- =====================================================

-- =====================================================
-- 1. STORES TABLE
-- Each seller has their own store
-- =====================================================
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_name VARCHAR(255) NOT NULL,
  store_slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  business_email VARCHAR(255),
  business_phone VARCHAR(50),
  business_address TEXT,
  tax_id VARCHAR(100),
  
  -- Store status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  
  -- Metrics
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(seller_id) -- One store per seller
);

CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(store_slug);

-- =====================================================
-- 2. STORE_MANAGERS TABLE
-- Managers assigned to specific stores
-- =====================================================
CREATE TABLE IF NOT EXISTS store_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Assignment details
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Permissions
  can_approve_products BOOLEAN DEFAULT true,
  can_reject_products BOOLEAN DEFAULT true,
  can_edit_products BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(manager_id, store_id) -- Manager can be assigned to store only once
);

CREATE INDEX IF NOT EXISTS idx_store_managers_manager_id ON store_managers(manager_id);
CREATE INDEX IF NOT EXISTS idx_store_managers_store_id ON store_managers(store_id);
CREATE INDEX IF NOT EXISTS idx_store_managers_status ON store_managers(status);

-- =====================================================
-- 3. UPDATE PRODUCTS TABLE
-- Add store_id and approval fields
-- =====================================================
-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add store_id column (without foreign key first)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='store_id') THEN
    ALTER TABLE products ADD COLUMN store_id UUID;
  END IF;
  
  -- Add approval_status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='approval_status') THEN
    ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL' 
      CHECK (approval_status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'));
  END IF;
  
  -- Add approved_by column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='approved_by') THEN
    ALTER TABLE products ADD COLUMN approved_by UUID REFERENCES users(id);
  END IF;
  
  -- Add approved_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='approved_at') THEN
    ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
  END IF;
  
  -- Add rejection_reason column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='rejection_reason') THEN
    ALTER TABLE products ADD COLUMN rejection_reason TEXT;
  END IF;
  
  -- Add submitted_at column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='products' AND column_name='submitted_at') THEN
    ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Now add foreign key constraint for store_id (after stores table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'products_store_id_fkey' 
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for approval workflow
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON products(approved_by);
CREATE INDEX IF NOT EXISTS idx_products_seller_approval ON products(seller_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_store_approval ON products(store_id, approval_status);

-- =====================================================
-- 4. PRODUCT_APPROVALS TABLE
-- Audit trail for all approval actions
-- =====================================================
CREATE TABLE IF NOT EXISTS product_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Action details
  action VARCHAR(50) NOT NULL CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'RESUBMITTED')),
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  
  -- Actor
  performed_by UUID NOT NULL REFERENCES users(id),
  performer_role VARCHAR(50) NOT NULL CHECK (performer_role IN ('seller', 'manager', 'admin')),
  
  -- Details
  reason TEXT,
  notes TEXT,
  changes_made JSONB, -- Track what changed
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_approvals_product_id ON product_approvals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_approvals_store_id ON product_approvals(store_id);
CREATE INDEX IF NOT EXISTS idx_product_approvals_performed_by ON product_approvals(performed_by);
CREATE INDEX IF NOT EXISTS idx_product_approvals_action ON product_approvals(action);
CREATE INDEX IF NOT EXISTS idx_product_approvals_created_at ON product_approvals(created_at DESC);

-- =====================================================
-- 5. APPROVAL_NOTIFICATIONS TABLE
-- Track notifications sent for approval actions
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES product_approvals(id) ON DELETE CASCADE,
  
  -- Recipient
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(50) NOT NULL,
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'PRODUCT_SUBMITTED', 
    'PRODUCT_APPROVED', 
    'PRODUCT_REJECTED', 
    'CHANGES_REQUESTED',
    'PRODUCT_RESUBMITTED'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Delivery
  sent_via VARCHAR(50)[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'sms']
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_notifications_recipient ON approval_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_product ON approval_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_type ON approval_notifications(notification_type);

-- =====================================================
-- 6. MANAGER_APPROVAL_QUEUE VIEW
-- Optimized view for manager approval dashboard
-- =====================================================
CREATE OR REPLACE VIEW manager_approval_queue AS
SELECT 
  p.id AS product_id,
  p.title,
  p.description,
  p.price,
  p.image_url,
  p.sku,
  p.approval_status,
  p.submitted_at,
  p.rejection_reason,
  
  -- Store info
  s.id AS store_id,
  s.store_name,
  s.seller_id,
  
  -- Seller info
  u.email AS seller_email,
  u.display_name AS seller_name,
  
  -- Time metrics
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - p.submitted_at))/3600 AS hours_pending,
  
  -- Approval history count
  (SELECT COUNT(*) FROM product_approvals WHERE product_id = p.id) AS approval_history_count
  
FROM products p
INNER JOIN stores s ON p.store_id = s.id
INNER JOIN users u ON s.seller_id = u.id
WHERE p.approval_status = 'PENDING_APPROVAL'
ORDER BY p.submitted_at ASC;

-- =====================================================
-- 7. STORE STATISTICS VIEW
-- =====================================================
CREATE OR REPLACE VIEW store_statistics AS
SELECT 
  s.id AS store_id,
  s.store_name,
  s.seller_id,
  
  -- Product counts
  COUNT(p.id) AS total_products,
  COUNT(CASE WHEN p.approval_status = 'APPROVED' THEN 1 END) AS approved_products,
  COUNT(CASE WHEN p.approval_status = 'PENDING_APPROVAL' THEN 1 END) AS pending_products,
  COUNT(CASE WHEN p.approval_status = 'REJECTED' THEN 1 END) AS rejected_products,
  
  -- Approval rate
  CASE 
    WHEN COUNT(p.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN p.approval_status = 'APPROVED' THEN 1 END)::DECIMAL / COUNT(p.id)) * 100, 2)
    ELSE 0 
  END AS approval_rate_percentage,
  
  -- Average approval time (in hours)
  AVG(EXTRACT(EPOCH FROM (p.approved_at - p.submitted_at))/3600) AS avg_approval_time_hours
  
FROM stores s
LEFT JOIN products p ON s.id = p.store_id
GROUP BY s.id, s.store_name, s.seller_id;

-- =====================================================
-- 8. FUNCTIONS FOR APPROVAL WORKFLOW
-- =====================================================

-- Function: Auto-create store when seller registers
CREATE OR REPLACE FUNCTION create_store_for_seller()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'seller' AND OLD.role != 'seller' THEN
    INSERT INTO stores (
      seller_id,
      store_name,
      store_slug,
      status,
      verification_status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.business_name, NEW.display_name || '''s Store'),
      LOWER(REPLACE(COALESCE(NEW.business_name, NEW.display_name), ' ', '-')) || '-' || substring(NEW.id::text, 1, 8),
      'pending',
      'pending'
    )
    ON CONFLICT (seller_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create store on seller role assignment
DROP TRIGGER IF EXISTS trigger_create_store_for_seller ON users;
CREATE TRIGGER trigger_create_store_for_seller
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_store_for_seller();

-- Function: Update store product count
CREATE OR REPLACE FUNCTION update_store_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE stores 
    SET total_products = total_products + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.store_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE stores 
    SET total_products = GREATEST(total_products - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.store_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update store product count
DROP TRIGGER IF EXISTS trigger_update_store_product_count ON products;
CREATE TRIGGER trigger_update_store_product_count
  AFTER INSERT OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_store_product_count();

-- Function: Log approval action
CREATE OR REPLACE FUNCTION log_approval_action(
  p_product_id UUID,
  p_store_id UUID,
  p_action VARCHAR,
  p_previous_status VARCHAR,
  p_new_status VARCHAR,
  p_performed_by UUID,
  p_performer_role VARCHAR,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_approval_id UUID;
BEGIN
  INSERT INTO product_approvals (
    product_id,
    store_id,
    action,
    previous_status,
    new_status,
    performed_by,
    performer_role,
    reason,
    notes,
    ip_address
  ) VALUES (
    p_product_id,
    p_store_id,
    p_action,
    p_previous_status,
    p_new_status,
    p_performed_by,
    p_performer_role,
    p_reason,
    p_notes,
    p_ip_address
  )
  RETURNING id INTO v_approval_id;
  
  RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Send approval notification
CREATE OR REPLACE FUNCTION send_approval_notification(
  p_product_id UUID,
  p_approval_id UUID,
  p_recipient_id UUID,
  p_recipient_role VARCHAR,
  p_notification_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO approval_notifications (
    product_id,
    approval_id,
    recipient_id,
    recipient_role,
    notification_type,
    title,
    message
  ) VALUES (
    p_product_id,
    p_approval_id,
    p_recipient_id,
    p_recipient_role,
    p_notification_type,
    p_title,
    p_message
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. SEED DATA - Create test stores and managers
-- =====================================================

-- This will be run separately after user accounts exist

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE stores IS 'Stores owned by sellers - one store per seller';
COMMENT ON TABLE store_managers IS 'Managers assigned to manage specific stores';
COMMENT ON TABLE product_approvals IS 'Audit trail for all product approval actions';
COMMENT ON TABLE approval_notifications IS 'Notifications sent for approval workflow events';
COMMENT ON VIEW manager_approval_queue IS 'Optimized view for manager approval dashboard';
COMMENT ON VIEW store_statistics IS 'Store-level statistics for products and approvals';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
