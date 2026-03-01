-- ============================================================================
-- FASTSHOP MIGRATION: Phase 1.2 - Multi-Vendor Product Schema
-- Description: Adds seller ownership and manager approval workflow to products
-- Version: 1.0
-- Date: February 7, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Seller and Approval Fields to Products Table
-- ============================================================================

-- Seller Ownership
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Approval Workflow
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Product Metrics (denormalized)
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Additional Product Fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2); -- in kg
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions JSONB; -- {length, width, height}
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- STEP 2: Update Existing Products
-- ============================================================================

-- For existing products without seller_id, assign to admin or mark as platform-owned
-- Option 1: Assign to first admin user
UPDATE products 
SET seller_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    approval_status = 'approved',
    approved_at = NOW(),
    approved_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE seller_id IS NULL;

-- ============================================================================
-- STEP 3: Make seller_id NOT NULL (after data migration)
-- ============================================================================

-- Now that all products have seller_id, make it required
ALTER TABLE products ALTER COLUMN seller_id SET NOT NULL;

-- ============================================================================
-- STEP 4: Create Indexes
-- ============================================================================

-- Seller products index
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);

-- Approval status index
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);

-- Approved by index
CREATE INDEX IF NOT EXISTS idx_products_approved_by ON products(approved_by);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_products_seller_approval ON products(seller_id, approval_status);

-- Partial index for pending approvals (Manager queue)
CREATE INDEX IF NOT EXISTS idx_products_pending_approval 
  ON products(id, submitted_for_approval_at) 
  WHERE approval_status = 'pending';

-- Partial index for approved active products (Customer view)
CREATE INDEX IF NOT EXISTS idx_products_approved_active 
  ON products(id, title, price, created_at) 
  WHERE approval_status = 'approved' AND status = 'active';

-- Featured products index
CREATE INDEX IF NOT EXISTS idx_products_featured 
  ON products(id, featured_until) 
  WHERE is_featured = TRUE AND featured_until > NOW();

-- SKU unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique 
  ON products(sku) 
  WHERE sku IS NOT NULL;

-- ============================================================================
-- STEP 5: Add Comments
-- ============================================================================

COMMENT ON COLUMN products.seller_id IS 'Owner of the product (seller or admin)';
COMMENT ON COLUMN products.approval_status IS 'Manager approval status for seller products';
COMMENT ON COLUMN products.approved_by IS 'Manager who approved/rejected the product';
COMMENT ON COLUMN products.rejection_reason IS 'Reason for product rejection';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - unique product identifier';

-- ============================================================================
-- STEP 6: Create Views
-- ============================================================================

-- View for approved products (Customer view)
CREATE OR REPLACE VIEW approved_products AS
SELECT
  p.id,
  p.title,
  p.description,
  p.price,
  p.image_url,
  p.status,
  p.seller_id,
  u.business_name as seller_name,
  u.average_rating as seller_rating,
  c.name as category_name,
  p.average_rating as product_rating,
  p.total_reviews,
  p.total_sales,
  i.quantity as stock_quantity,
  (i.quantity - i.reserved_quantity) as available_quantity,
  CASE
    WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
    WHEN i.quantity <= i.low_stock_threshold THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
  END as stock_status,
  p.created_at,
  p.is_featured,
  p.shipping_cost
FROM products p
JOIN users u ON p.seller_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id
WHERE p.approval_status = 'approved' 
  AND p.status = 'active';

COMMENT ON VIEW approved_products IS 'Customer-facing view of approved active products';

-- View for pending approvals (Manager queue)
CREATE OR REPLACE VIEW pending_product_approvals AS
SELECT
  p.id,
  p.title,
  p.description,
  p.price,
  p.image_url,
  p.seller_id,
  u.business_name as seller_name,
  u.email as seller_email,
  u.seller_tier,
  u.average_rating as seller_rating,
  c.name as category_name,
  p.submitted_for_approval_at,
  p.created_at,
  p.sku,
  p.brand
FROM products p
JOIN users u ON p.seller_id = u.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.approval_status = 'pending'
ORDER BY p.submitted_for_approval_at ASC;

COMMENT ON VIEW pending_product_approvals IS 'Manager queue of products awaiting approval';

-- View for seller products
CREATE OR REPLACE VIEW seller_products AS
SELECT
  p.id,
  p.title,
  p.description,
  p.price,
  p.image_url,
  p.status,
  p.approval_status,
  p.seller_id,
  p.approved_at,
  p.rejection_reason,
  c.name as category_name,
  p.total_sales,
  p.total_revenue,
  p.average_rating,
  p.total_reviews,
  i.quantity as stock_quantity,
  (i.quantity - i.reserved_quantity) as available_quantity,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id;

COMMENT ON VIEW seller_products IS 'Seller view of their own products with all statuses';

-- ============================================================================
-- STEP 7: Create Trigger for Approval Status Changes
-- ============================================================================

-- Function to handle product approval status changes
CREATE OR REPLACE FUNCTION handle_product_approval_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If product is being approved
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    NEW.approved_at = NOW();
    -- approved_by should be set by the application
  END IF;
  
  -- If product is being rejected
  IF NEW.approval_status = 'rejected' AND OLD.approval_status != 'rejected' THEN
    -- rejection_reason should be set by the application
    IF NEW.rejection_reason IS NULL OR NEW.rejection_reason = '' THEN
      RAISE EXCEPTION 'Rejection reason is required when rejecting a product';
    END IF;
  END IF;
  
  -- If product is being resubmitted (pending after rejection/approval)
  IF NEW.approval_status = 'pending' AND OLD.approval_status IN ('approved', 'rejected') THEN
    NEW.submitted_for_approval_at = NOW();
    NEW.approved_at = NULL;
    NEW.approved_by = NULL;
    NEW.rejection_reason = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS product_approval_change_trigger ON products;
CREATE TRIGGER product_approval_change_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION handle_product_approval_change();

-- ============================================================================
-- STEP 8: Create Function to Get Seller Products
-- ============================================================================

CREATE OR REPLACE FUNCTION get_seller_products(
  seller_uuid UUID,
  filter_status VARCHAR DEFAULT NULL,
  filter_approval VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  price DECIMAL,
  status VARCHAR,
  approval_status VARCHAR,
  stock_quantity INTEGER,
  total_sales INTEGER,
  total_revenue DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.price,
    p.status,
    p.approval_status,
    i.quantity as stock_quantity,
    p.total_sales,
    p.total_revenue,
    p.created_at
  FROM products p
  LEFT JOIN inventory i ON p.id = i.product_id
  WHERE p.seller_id = seller_uuid
    AND (filter_status IS NULL OR p.status = filter_status)
    AND (filter_approval IS NULL OR p.approval_status = filter_approval)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_seller_products IS 'Get products for a specific seller with optional filters';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the migration
SELECT 'Phase 1.2 Migration Completed Successfully!' as status;

-- Show updated schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN (
    'seller_id', 'approval_status', 'approved_by', 
    'approved_at', 'rejection_reason', 'sku'
  )
ORDER BY column_name;

-- Show counts by approval status
SELECT 
  approval_status,
  COUNT(*) as product_count
FROM products
GROUP BY approval_status;
