-- ============================================================================
-- MANAGER PORTAL - QUICK FIX (2 FAILING TESTS)
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the 2 remaining failing tests
-- This will bring the success rate from 88.89% to 100%
-- ============================================================================

BEGIN;

-- ============================================================================
-- FIX 1: Products Table - Add approval_status column
-- ============================================================================
-- Required for: GET /api/manager/products/pending
-- Current Error: "Failed to get pending products"

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_approval_status 
ON products(approval_status);

-- Add check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_approval_status'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT chk_products_approval_status 
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested'));
  END IF;
END $$;

COMMENT ON COLUMN products.approval_status IS 'Product approval status for manager review';

-- ============================================================================
-- FIX 2: Returns Table - Add user_id column
-- ============================================================================
-- Required for: GET /api/manager/returns/pending
-- Current Error: "Could not find a relationship between 'returns' and 'user_id'"

ALTER TABLE returns 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_returns_user_id'
  ) THEN
    ALTER TABLE returns 
    ADD CONSTRAINT fk_returns_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);

COMMENT ON COLUMN returns.user_id IS 'Customer who initiated the return';

-- ============================================================================
-- BONUS: Add other useful columns (optional but recommended)
-- ============================================================================

-- Products: Add approval tracking columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Returns: Add seller_id for better tracking
ALTER TABLE returns 
ADD COLUMN IF NOT EXISTS seller_id UUID;

CREATE INDEX IF NOT EXISTS idx_returns_seller_id ON returns(seller_id);

-- Reviews: Add flagging columns (for future use)
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';

CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged 
ON reviews(is_flagged) WHERE is_flagged = TRUE;

-- Disputes: Add escalation columns (for future use)
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS escalated_to UUID,
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_disputes_is_escalated 
ON disputes(is_escalated) WHERE is_escalated = TRUE;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify products table has approval_status
SELECT 
    'products.approval_status' as column_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'approval_status'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- Verify returns table has user_id
SELECT 
    'returns.user_id' as column_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'returns' AND column_name = 'user_id'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Manager Portal Quick Fix Applied!';
    RAISE NOTICE '📊 Fixed: products.approval_status column';
    RAISE NOTICE '📊 Fixed: returns.user_id column';
    RAISE NOTICE '🎯 Expected Result: 18/18 tests passing (100%%)';
    RAISE NOTICE '🧪 Next Step: Run test-manager-portal-complete.js';
END $$;
