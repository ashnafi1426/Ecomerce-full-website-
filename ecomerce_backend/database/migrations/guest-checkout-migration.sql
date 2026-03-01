-- ============================================
-- GUEST CHECKOUT SYSTEM - DATABASE MIGRATION
-- Amazon-Style Guest Checkout Implementation
-- ============================================

-- 1. Update Users Table for Guest Support
-- ============================================

-- Add user_type column to distinguish guest vs registered
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'registered' 
CHECK (user_type IN ('guest', 'registered'));

-- Make password optional for guest users
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Add email verification status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add guest session tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS guest_session_id VARCHAR(255);

-- Add conversion tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS converted_from_guest BOOLEAN DEFAULT FALSE;

-- Add index for user_type
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_guest_session ON users(guest_session_id);


-- 2. Create Guest Carts Table
-- ============================================

CREATE TABLE IF NOT EXISTS guest_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  guest_email VARCHAR(255),
  cart_data JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_carts_session ON guest_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_guest_carts_expires ON guest_carts(expires_at);
CREATE INDEX IF NOT EXISTS idx_guest_carts_email ON guest_carts(guest_email);

COMMENT ON TABLE guest_carts IS 'Temporary shopping carts for guest users (24-hour expiration)';
COMMENT ON COLUMN guest_carts.session_id IS 'Unique session identifier stored in browser';
COMMENT ON COLUMN guest_carts.cart_data IS 'JSON array of cart items with product_id and quantity';
COMMENT ON COLUMN guest_carts.expires_at IS 'Cart expiration timestamp (24 hours from creation)';


-- 3. Update Orders Table for Guest Orders
-- ============================================

-- Add guest order support
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_tracking_token VARCHAR(255) UNIQUE;

-- Make user_id nullable for guest orders
ALTER TABLE orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Add indexes for guest order tracking
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(order_tracking_token);

COMMENT ON COLUMN orders.guest_email IS 'Email for guest orders (null for registered users)';
COMMENT ON COLUMN orders.guest_phone IS 'Phone number for guest orders';
COMMENT ON COLUMN orders.order_tracking_token IS 'Unique token for magic link order tracking';


-- 4. Create Guest Addresses Table
-- ============================================

CREATE TABLE IF NOT EXISTS guest_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'US',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_addresses_email ON guest_addresses(guest_email);

COMMENT ON TABLE guest_addresses IS 'Temporary addresses for guest checkout';
COMMENT ON COLUMN guest_addresses.guest_email IS 'Guest user email (not linked to users table)';


-- 5. Add Constraint to Ensure Either user_id OR guest_email
-- ============================================

ALTER TABLE orders 
ADD CONSTRAINT check_user_or_guest 
CHECK (
  (user_id IS NOT NULL AND guest_email IS NULL) OR 
  (user_id IS NULL AND guest_email IS NOT NULL)
);

COMMENT ON CONSTRAINT check_user_or_guest ON orders IS 'Ensures order belongs to either registered user OR guest';


-- 6. Create Function to Auto-Cleanup Expired Guest Carts
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_guest_carts()
RETURNS void AS $$
BEGIN
  DELETE FROM guest_carts 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_guest_carts IS 'Removes expired guest carts (run via cron job)';


-- 7. Migration Complete Summary
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Guest Checkout Migration Complete!';
  RAISE NOTICE '📦 Tables Updated:';
  RAISE NOTICE '   - users (added user_type, guest_session_id, email_verified, converted_from_guest)';
  RAISE NOTICE '   - orders (added guest_email, guest_phone, order_tracking_token)';
  RAISE NOTICE '📦 Tables Created:';
  RAISE NOTICE '   - guest_carts (temporary cart storage)';
  RAISE NOTICE '   - guest_addresses (guest shipping addresses)';
  RAISE NOTICE '🔍 Indexes Created: 8 indexes for performance';
  RAISE NOTICE '✨ Ready for Amazon-style guest checkout!';
END $$;
