-- =====================================================
-- FRESH APPROVAL WORKFLOW MIGRATION
-- This assumes ONLY products and users tables exist
-- Run CHECK-EXISTING-SCHEMA.sql first to verify
-- =====================================================

-- =====================================================
-- PART 1: CREATE STORES TABLE
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'stores') THEN
    CREATE TABLE stores (
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
    
    CREATE INDEX idx_stores_seller_id ON stores(seller_id);
    CREATE INDEX idx_stores_status ON stores(status);
    CREATE INDEX idx_stores_slug ON stores(store_slug);
    
    RAISE NOTICE 'Created stores table';
  ELSE
    RAISE NOTICE 'stores table already exists';
  END IF;
END $$;

-- =====================================================
-- PART 2: CREATE STORES FOR EXISTING SELLERS
-- =====================================================
DO $$
DECLARE
  v_seller RECORD;
  v_store_slug VARCHAR(255);
BEGIN
  FOR v_seller IN 
    SELECT id, email 
    FROM users 
    WHERE role = 'seller'
  LOOP
    -- Check if store already exists for this seller
    IF NOT EXISTS (SELECT 1 FROM stores WHERE seller_id = v_seller.id) THEN
      -- Generate unique slug
      v_store_slug := LOWER(REPLACE(COALESCE(v_seller.email, 'store'), ' ', '-')) || '-' || substring(v_seller.id::text, 1, 8);
      
      INSERT INTO stores (
        seller_id,
        store_name,
        store_slug,
        status,
        verification_status,
        verified_at
      ) VALUES (
        v_seller.id,
        COALESCE(v_seller.email, 'Store') || '''s Store',
        v_store_slug,
        'active',
        'verified',
        CURRENT_TIMESTAMP
      );
      
      RAISE NOTICE 'Created store for seller: %', v_seller.email;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- PART 3: ADD APPROVAL COLUMNS TO PRODUCTS TABLE
-- =====================================================
DO $$
BEGIN
  -- Add store_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'store_id'
  ) THEN
    EXECUTE 'ALTER TABLE products ADD COLUMN store_id UUID';
    RAISE NOTICE 'Added store_id column';
  END IF;

  -- Add approval_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approval_status'
  ) THEN
    EXECUTE 'ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT ''PENDING_APPROVAL''';
    RAISE NOTICE 'Added approval_status column';
  END IF;

  -- Add approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approved_by'
  ) THEN
    EXECUTE 'ALTER TABLE products ADD COLUMN approved_by UUID';
    RAISE NOTICE 'Added approved_by column';
  END IF;

  -- Add approved_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'approved_at'
  ) THEN
    EXECUTE 'ALTER TABLE products ADD COLUMN approved_at TIMESTAMP';
    RAISE NOTICE 'Added approved_at column';
  END IF;

  -- Add rejection_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'rejection_reason'
  ) THEN
    EXECUTE 'ALTER TABLE products ADD COLUMN rejection_reason TEXT';
    RAISE NOTICE 'Added rejection_reason column';
  END IF;

  -- Add submitted_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'submitted_at'
  ) THEN
    EXECUTE 'ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
    RAISE NOTICE 'Added submitted_at column';
  END IF;
END $$;

-- =====================================================
-- PART 4: POPULATE store_id FOR EXISTING PRODUCTS
-- =====================================================
DO $$
BEGIN
  UPDATE products p
  SET store_id = s.id
  FROM stores s
  WHERE p.seller_id = s.seller_id
    AND p.store_id IS NULL;
  
  RAISE NOTICE 'Updated store_id for existing products';
END $$;

-- =====================================================
-- PART 5: ADD FOREIGN KEY CONSTRAINTS
-- =====================================================
DO $$
BEGIN
  -- Add FK for store_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_store_id_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_store_id_fkey 
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added FK constraint for store_id';
  END IF;

  -- Add FK for approved_by
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_approved_by_fkey'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES users(id);
    RAISE NOTICE 'Added FK constraint for approved_by';
  END IF;

  -- Add CHECK constraint for approval_status
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_approval_status_check'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_approval_status_check 
    CHECK (approval_status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'));
    RAISE NOTICE 'Added CHECK constraint for approval_status';
  END IF;
END $$;

-- =====================================================
-- PART 6: CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON products(approved_by);
CREATE INDEX IF NOT EXISTS idx_products_seller_approval ON products(seller_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_products_store_approval ON products(store_id, approval_status);

-- =====================================================
-- PART 7: CREATE STORE_MANAGERS TABLE
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'store_managers') THEN
    CREATE TABLE store_managers (
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
    
    CREATE INDEX idx_store_managers_manager_id ON store_managers(manager_id);
    CREATE INDEX idx_store_managers_store_id ON store_managers(store_id);
    CREATE INDEX idx_store_managers_status ON store_managers(status);
    
    RAISE NOTICE 'Created store_managers table';
  END IF;
END $$;

-- =====================================================
-- PART 8: CREATE PRODUCT_APPROVALS TABLE
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'product_approvals') THEN
    CREATE TABLE product_approvals (
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
    
    CREATE INDEX idx_product_approvals_product_id ON product_approvals(product_id);
    CREATE INDEX idx_product_approvals_store_id ON product_approvals(store_id);
    CREATE INDEX idx_product_approvals_performed_by ON product_approvals(performed_by);
    CREATE INDEX idx_product_approvals_action ON product_approvals(action);
    CREATE INDEX idx_product_approvals_created_at ON product_approvals(created_at DESC);
    
    RAISE NOTICE 'Created product_approvals table';
  END IF;
END $$;

-- =====================================================
-- PART 9: CREATE APPROVAL_NOTIFICATIONS TABLE
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'approval_notifications') THEN
    CREATE TABLE approval_notifications (
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
    
    CREATE INDEX idx_approval_notifications_recipient ON approval_notifications(recipient_id, is_read);
    CREATE INDEX idx_approval_notifications_product ON approval_notifications(product_id);
    CREATE INDEX idx_approval_notifications_type ON approval_notifications(notification_type);
    
    RAISE NOTICE 'Created approval_notifications table';
  END IF;
END $$;

-- =====================================================
-- PART 10: CREATE HELPER FUNCTIONS
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
-- PART 11: CREATE TRIGGERS
-- =====================================================

-- Trigger: Auto-create store for new sellers
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

-- Trigger: Auto-set store_id for new products
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

-- Trigger: Update store product count
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
-- PART 12: UPDATE STORE PRODUCT COUNTS
-- =====================================================
DO $$
BEGIN
  UPDATE stores s
  SET total_products = (
    SELECT COUNT(*)
    FROM products p
    WHERE p.store_id = s.id
  );
  RAISE NOTICE 'Updated store product counts';
END $$;

-- =====================================================
-- MIGRATION COMPLETE - SHOW RESULTS
-- =====================================================
SELECT 'Amazon-style approval workflow migration completed!' AS status;

SELECT 'Stores created: ' || COUNT(*) AS info FROM stores;
SELECT 'Products with store_id: ' || COUNT(*) AS info FROM products WHERE store_id IS NOT NULL;
SELECT 'Products pending approval: ' || COUNT(*) AS info FROM products WHERE approval_status = 'PENDING_APPROVAL';

-- Show products table columns
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'products'
  AND column_name IN ('store_id', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason', 'submitted_at')
ORDER BY column_name;
