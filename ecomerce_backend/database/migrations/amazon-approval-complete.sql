-- =====================================================
-- AMAZON-STYLE APPROVAL WORKFLOW - COMPLETE MIGRATION
-- Run this single file to set up the entire approval system
-- =====================================================

-- =====================================================
-- STEP 1: CREATE STORES TABLE
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
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'closed')),
  verification_status VARCHAR(50) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(seller_id)
);

CREATE INDEX IF NOT EXISTS idx_stores_seller_id ON stores(seller_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(store_slug);

-- =====================================================
-- STEP 2: AUTO-CREATE STORES FOR EXISTING SELLERS
-- =====================================================
INSERT INTO stores (seller_id, store_name, store_slug, status, verification_status, verified_at)
SELECT 
  u.id,
  COALESCE(u.email, 'Store') || '''s Store',
  LOWER(REPLACE(COALESCE(u.email, 'store'), ' ', '-')) || '-' || substring(u.id::text, 1, 8),
  'active',
  'verified',
  CURRENT_TIMESTAMP
FROM users u
WHERE u.role = 'seller'
  AND NOT EXISTS (SELECT 1 FROM stores s WHERE s.seller_id = u.id)
ON CONFLICT (seller_id) DO NOTHING;

-- =====================================================
-- STEP 3: ADD COLUMNS TO PRODUCTS TABLE
-- =====================================================
DO $$
BEGIN
  -- Add store_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE products ADD COLUMN store_id UUID;
    RAISE NOTICE 'Added store_id column';
  END IF;
  
  -- Add approval_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL';
    RAISE NOTICE 'Added approval_status column';
  END IF;
  
  -- Add approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE products ADD COLUMN approved_by UUID;
    RAISE NOTICE 'Added approved_by column';
  END IF;
  
  -- Add approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
    RAISE NOTICE 'Added approved_at column';
  END IF;
  
  -- Add rejection_reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE products ADD COLUMN rejection_reason TEXT;
    RAISE NOTICE 'Added rejection_reason column';
  END IF;
  
  -- Add submitted_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added submitted_at column';
  END IF;
END $$;

-- =====================================================
-- STEP 4: POPULATE store_id FOR EXISTING PRODUCTS
-- =====================================================
UPDATE products p
SET store_id = s.id
FROM stores s
WHERE p.seller_id = s.seller_id
  AND p.store_id IS NULL;

-- =====================================================
-- STEP 5: ADD CONSTRAINTS TO PRODUCTS TABLE
-- =====================================================
DO $$
BEGIN
  -- Add check constraint for approval_status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_approval_status_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_approval_status_check 
    CHECK (approval_status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'));
    RAISE NOTICE 'Added approval_status check constraint';
  END IF;
  
  -- Add foreign key for store_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_store_id_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added store_id foreign key';
  END IF;
  
  -- Add foreign key for approved_by
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_approved_by_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id);
    RAISE NOTICE 'Added approved_by foreign key';
  END IF;
END $$;

-- =====================================================
-- STEP 6: CREATE INDEXES ON PRODUCTS
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON products(approved_by);
CREATE INDEX IF NOT EXISTS idx_products_seller_approval ON products(seller_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_store_approval ON products(store_id, approval_status);

-- =====================================================
-- STEP 7: CREATE STORE_MANAGERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS store_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  can_approve_products BOOLEAN DEFAULT true,
  can_reject_products BOOLEAN DEFAULT true,
  can_edit_products BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(manager_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_managers_manager_id ON store_managers(manager_id);
CREATE INDEX IF NOT EXISTS idx_store_managers_store_id ON store_managers(store_id);
CREATE INDEX IF NOT EXISTS idx_store_managers_status ON store_managers(status);

-- =====================================================
-- STEP 8: CREATE PRODUCT_APPROVALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'RESUBMITTED')),
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id),
  performer_role VARCHAR(50) NOT NULL CHECK (performer_role IN ('seller', 'manager', 'admin')),
  reason TEXT,
  notes TEXT,
  changes_made JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_approvals_product_id ON product_approvals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_approvals_store_id ON product_approvals(store_id);
CREATE INDEX IF NOT EXISTS idx_product_approvals_performed_by ON product_approvals(performed_by);
CREATE INDEX IF NOT EXISTS idx_product_approvals_action ON product_approvals(action);
CREATE INDEX IF NOT EXISTS idx_product_approvals_created_at ON product_approvals(created_at DESC);

-- =====================================================
-- STEP 9: CREATE APPROVAL_NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES product_approvals(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(50) NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'PRODUCT_SUBMITTED', 
    'PRODUCT_APPROVED', 
    'PRODUCT_REJECTED', 
    'CHANGES_REQUESTED',
    'PRODUCT_RESUBMITTED'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  sent_via VARCHAR(50)[] DEFAULT ARRAY['in_app'],
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_notifications_recipient ON approval_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_product ON approval_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_type ON approval_notifications(notification_type);

-- =====================================================
-- STEP 10: CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Function: Auto-create store when user becomes seller
CREATE OR REPLACE FUNCTION create_store_for_new_seller()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'seller' AND (OLD IS NULL OR OLD.role != 'seller') THEN
    INSERT INTO stores (
      seller_id,
      store_name,
      store_slug,
      status,
      verification_status,
      verified_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, 'Store') || '''s Store',
      LOWER(REPLACE(COALESCE(NEW.email, 'store'), ' ', '-')) || '-' || substring(NEW.id::text, 1, 8),
      'active',
      'verified',
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (seller_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_store_for_seller ON users;
CREATE TRIGGER trigger_create_store_for_seller
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_store_for_new_seller();

-- Function: Auto-set store_id when product is created
CREATE OR REPLACE FUNCTION set_product_store_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.store_id IS NULL AND NEW.seller_id IS NOT NULL THEN
    SELECT id INTO NEW.store_id
    FROM stores
    WHERE seller_id = NEW.seller_id
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_product_store_id ON products;
CREATE TRIGGER trigger_set_product_store_id
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_store_id();

-- Function: Update store product count
CREATE OR REPLACE FUNCTION update_store_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.store_id IS NOT NULL THEN
      UPDATE stores 
      SET total_products = total_products + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.store_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.store_id IS NOT NULL THEN
      UPDATE stores 
      SET total_products = GREATEST(total_products - 1, 0),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = OLD.store_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_store_product_count ON products;
CREATE TRIGGER trigger_update_store_product_count
  AFTER INSERT OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_store_product_count();

-- =====================================================
-- STEP 11: CREATE HELPER FUNCTIONS
-- =====================================================

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
-- STEP 12: UPDATE EXISTING PRODUCTS COUNT IN STORES
-- =====================================================
UPDATE stores s
SET total_products = (
  SELECT COUNT(*)
  FROM products p
  WHERE p.store_id = s.id
);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
SELECT 'Amazon-style approval workflow migration completed successfully!' AS status;
SELECT 'Stores created: ' || COUNT(*) AS stores_count FROM stores;
SELECT 'Products with store_id: ' || COUNT(*) AS products_count FROM products WHERE store_id IS NOT NULL;
