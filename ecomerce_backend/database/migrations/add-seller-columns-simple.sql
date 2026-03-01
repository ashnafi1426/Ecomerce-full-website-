-- Add seller verification columns to users table
-- Run this if Phase 5 migration DO blocks didn't execute

ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_verification_status VARCHAR(20) DEFAULT 'unverified';
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_verified_by UUID;

-- Add check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_seller_verification_status_check;
ALTER TABLE users ADD CONSTRAINT users_seller_verification_status_check 
  CHECK (seller_verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

-- Add foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_seller_verified_by_fkey;
ALTER TABLE users ADD CONSTRAINT users_seller_verified_by_fkey 
  FOREIGN KEY (seller_verified_by) REFERENCES users(id);

-- Add approval workflow columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add check constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_approval_status_check;
ALTER TABLE products ADD CONSTRAINT products_approval_status_check 
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested'));

-- Add foreign key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_approved_by_fkey;
ALTER TABLE products ADD CONSTRAINT products_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES users(id);
