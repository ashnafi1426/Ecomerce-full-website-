-- ============================================================================
-- MANAGER PORTAL DATABASE FIXES
-- ============================================================================
-- This migration adds missing columns required for manager portal functionality
-- Fixes 4 failing tests to achieve 100% functionality
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX 1: Products Table - Approval Workflow Columns
-- ============================================================================
-- Required for: GET /api/manager/products/pending

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_approval_status 
ON products(approval_status);

-- Add check constraint
ALTER TABLE products 
ADD CONSTRAINT chk_products_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested'));

COMMENT ON COLUMN products.approval_status IS 'Product approval status for manager review';
COMMENT ON COLUMN products.approved_at IS 'Timestamp when product was approved';
COMMENT ON COLUMN products.approved_by IS 'Manager who approved the product';

-- ============================================================================
-- FIX 2: Disputes Table - Escalation Columns
-- ============================================================================
-- Required for: GET /api/manager/escalations

ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;

-- Add index for escalated disputes
CREATE INDEX IF NOT EXISTS idx_disputes_is_escalated 
ON disputes(is_escalated) WHERE is_escalated = TRUE;

COMMENT ON COLUMN disputes.escalated_at IS 'Timestamp when dispute was escalated to admin';
COMMENT ON COLUMN disputes.escalated_to IS 'Admin user who received the escalation';
COMMENT ON COLUMN disputes.is_escalated IS 'Whether dispute has been escalated';

-- ============================================================================
-- FIX 3: Reviews Table - Flagging/Moderation Columns
-- ============================================================================
-- Required for: GET /api/manager/reviews/flagged

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES users(id);

-- Add index for flagged reviews
CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged 
ON reviews(is_flagged) WHERE is_flagged = TRUE;

-- Add index for moderation status
CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status 
ON reviews(moderation_status);

-- Add check constraint
ALTER TABLE reviews 
ADD CONSTRAINT chk_reviews_moderation_status 
CHECK (moderation_status IN ('approved', 'pending', 'rejected', 'flagged'));

COMMENT ON COLUMN reviews.is_flagged IS 'Whether review has been flagged for moderation';
COMMENT ON COLUMN reviews.flagged_at IS 'Timestamp when review was flagged';
COMMENT ON COLUMN reviews.moderation_status IS 'Review moderation status';

-- ============================================================================
-- FIX 4: Returns Table - Ensure Proper Foreign Keys
-- ============================================================================
-- Required for: GET /api/manager/returns/pending

-- Check if user_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returns' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE returns ADD COLUMN user_id UUID REFERENCES users(id);
        COMMENT ON COLUMN returns.user_id IS 'Customer who initiated the return';
    END IF;
END $$;

-- Ensure seller_id exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'returns' AND column_name = 'seller_id'
    ) THEN
        ALTER TABLE returns ADD COLUMN seller_id UUID REFERENCES users(id);
        COMMENT ON COLUMN returns.seller_id IS 'Seller who needs to process the return';
    END IF;
END $$;

-- Add indexes for returns queries
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_seller_id ON returns(seller_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

-- ============================================================================
-- BONUS: Create Product Approvals History Table
-- ============================================================================
-- Track all approval actions for audit trail

CREATE TABLE IF NOT EXISTS product_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'rejected', 'revision_requested')),
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_approvals_product_id 
ON product_approvals(product_id);

CREATE INDEX IF NOT EXISTS idx_product_approvals_reviewer_id 
ON product_approvals(reviewer_id);

COMMENT ON TABLE product_approvals IS 'Audit trail for product approval actions';

-- ============================================================================
-- BONUS: Create Manager Actions Log Table
-- ============================================================================
-- Track all manager actions for accountability

CREATE TABLE IF NOT EXISTS manager_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manager_actions_manager_id 
ON manager_actions(manager_id);

CREATE INDEX IF NOT EXISTS idx_manager_actions_created_at 
ON manager_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manager_actions_entity 
ON manager_actions(entity_type, entity_id);

COMMENT ON TABLE manager_actions IS 'Audit trail for all manager actions';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify products table columns
SELECT 
    'products' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('approval_status', 'approved_at', 'approved_by')
ORDER BY column_name;

-- Verify disputes table columns
SELECT 
    'disputes' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'disputes'
AND column_name IN ('escalated_at', 'escalated_to', 'is_escalated')
ORDER BY column_name;

-- Verify reviews table columns
SELECT 
    'reviews' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('is_flagged', 'flagged_at', 'moderation_status')
ORDER BY column_name;

-- Verify returns table columns
SELECT 
    'returns' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'returns'
AND column_name IN ('user_id', 'seller_id', 'status')
ORDER BY column_name;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Manager Portal database fixes applied successfully!';
    RAISE NOTICE '📊 Added columns to: products, disputes, reviews, returns';
    RAISE NOTICE '📝 Created audit tables: product_approvals, manager_actions';
    RAISE NOTICE '🎯 Manager Portal should now be 100%% functional';
    RAISE NOTICE '🧪 Run: node test-manager-portal-complete.js';
END $$;
