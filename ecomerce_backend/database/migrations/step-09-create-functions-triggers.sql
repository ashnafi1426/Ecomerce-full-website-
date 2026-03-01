-- =====================================================
-- STEP 9: CREATE HELPER FUNCTIONS AND TRIGGERS
-- Run this after step-08 succeeds
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

-- Trigger Function: Auto-create store for new sellers
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

-- Trigger Function: Auto-set store_id for new products
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

-- Trigger Function: Update store product count
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

-- Update store product counts for existing data
UPDATE stores s
SET total_products = (
  SELECT COUNT(*)
  FROM products p
  WHERE p.store_id = s.id
);

-- Verify
SELECT 'Functions and triggers created!' AS status;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%approval%' OR routine_name LIKE '%store%'
ORDER BY routine_name;
