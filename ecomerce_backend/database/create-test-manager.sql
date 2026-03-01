-- ============================================================================
-- CREATE TEST MANAGER USER
-- ============================================================================
-- This script creates a test manager user for testing the manager dashboard
-- Password: password123
-- ============================================================================

-- Insert test manager user
-- Password hash for 'password123' using bcrypt with salt rounds 10
INSERT INTO users (
  email,
  password_hash,
  role,
  display_name,
  phone,
  is_active,
  email_verified,
  created_at,
  updated_at
) VALUES (
  'manager@fastshop.com',
  '$2b$10$rKvVPZqGhXqKJIxLZqKZOeYxGxXxXxXxXxXxXxXxXxXxXxXxXxX',  -- This is a placeholder, use actual bcrypt hash
  'manager',
  'Test Manager',
  '+1234567890',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'manager',
  display_name = 'Test Manager',
  is_active = true,
  email_verified = true,
  updated_at = NOW();

-- Verify the manager was created
SELECT 
  id,
  email,
  role,
  display_name,
  is_active,
  email_verified,
  created_at
FROM users
WHERE email = 'manager@fastshop.com';

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Replace the password_hash with actual bcrypt hash of 'password123'
-- 2. You can generate the hash using Node.js:
--    const bcrypt = require('bcrypt');
--    const hash = await bcrypt.hash('password123', 10);
--    console.log(hash);
-- 
-- 3. Or use an online bcrypt generator (use salt rounds = 10)
--
-- 4. After running this script, you can login with:
--    Email: manager@fastshop.com
--    Password: password123
--
-- 5. The manager will be redirected to /manager dashboard automatically
-- ============================================================================
