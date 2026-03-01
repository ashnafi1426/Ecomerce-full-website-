-- ============================================================================
-- FASTSHOP MIGRATION: Phase 1.1 - Add New User Roles and Seller Fields
-- Description: Extends user roles from 2 (admin, customer) to 4 (admin, manager, seller, customer)
--              and adds seller-specific fields
-- Version: 1.0
-- Date: February 7, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: Update Role Enum
-- ============================================================================

-- Drop existing role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new role constraint with 4 roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'manager', 'seller', 'customer'));

-- ============================================================================
-- STEP 2: Add Seller-Specific Fields to Users Table
-- ============================================================================

-- Business Information
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50); -- EIN or Tax ID

-- Seller Verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending' 
  CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_documents JSONB; -- Store document URLs/metadata
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Seller Settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_tier VARCHAR(50) DEFAULT 'bronze' 
  CHECK (seller_tier IN ('bronze', 'silver', 'gold', 'platinum'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2); -- Override default commission
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_schedule VARCHAR(20) DEFAULT 'weekly' 
  CHECK (payout_schedule IN ('daily', 'weekly', 'biweekly', 'monthly'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_method VARCHAR(50) DEFAULT 'bank_transfer' 
  CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe_connect', 'check'));

-- Bank Account Information (encrypted)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number_encrypted TEXT; -- Encrypted
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_routing_number_encrypted TEXT; -- Encrypted
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS paypal_email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_connect_id VARCHAR(255);

-- Seller Metrics (denormalized for performance)
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sales DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Manager-Specific Fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_permissions JSONB; -- Granular permissions

-- ============================================================================
-- STEP 3: Add Comments
-- ============================================================================

COMMENT ON COLUMN users.business_name IS 'Seller business/store name';
COMMENT ON COLUMN users.verification_status IS 'Seller verification status by admin';
COMMENT ON COLUMN users.seller_tier IS 'Seller tier affecting commission rates';
COMMENT ON COLUMN users.payout_schedule IS 'How often seller receives payouts';
COMMENT ON COLUMN users.commission_rate IS 'Custom commission rate (overrides default)';

-- ============================================================================
-- STEP 4: Create Indexes for New Fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status) 
  WHERE role = 'seller';

CREATE INDEX IF NOT EXISTS idx_users_seller_tier ON users(seller_tier) 
  WHERE role = 'seller';

CREATE INDEX IF NOT EXISTS idx_users_business_name ON users(business_name) 
  WHERE role = 'seller';

-- Partial index for pending seller verifications
CREATE INDEX IF NOT EXISTS idx_users_pending_verification ON users(id, created_at) 
  WHERE role = 'seller' AND verification_status = 'pending';

-- ============================================================================
-- STEP 5: Update Existing Data
-- ============================================================================

-- Set default verification status for existing sellers (if any)
UPDATE users 
SET verification_status = 'verified', 
    verified_at = NOW()
WHERE role = 'seller' 
  AND verification_status IS NULL;

-- ============================================================================
-- STEP 6: Create Seller Statistics View
-- ============================================================================

CREATE OR REPLACE VIEW seller_statistics AS
SELECT
  u.id,
  u.email,
  u.business_name,
  u.seller_tier,
  u.verification_status,
  u.created_at as registration_date,
  u.verified_at,
  u.total_sales,
  u.total_orders,
  u.average_rating,
  u.total_reviews,
  u.commission_rate,
  u.payout_schedule,
  u.payout_method
FROM users u
WHERE u.role = 'seller';

COMMENT ON VIEW seller_statistics IS 'Comprehensive seller statistics and settings';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the migration
SELECT 'Phase 1.1 Migration Completed Successfully!' as status;

-- Show updated schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'business_name', 'verification_status', 'seller_tier', 
    'payout_schedule', 'commission_rate'
  )
ORDER BY column_name;
