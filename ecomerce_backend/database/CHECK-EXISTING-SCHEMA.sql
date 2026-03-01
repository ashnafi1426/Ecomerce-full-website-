-- =====================================================
-- DIAGNOSTIC: Check Existing Database Schema
-- Run this in Supabase SQL Editor to see what you have
-- =====================================================

-- 1. Check if products table exists and its columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 2. Check if stores table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'stores'
) AS stores_table_exists;

-- 3. Check if store_managers table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'store_managers'
) AS store_managers_table_exists;

-- 4. Check if product_approvals table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'product_approvals'
) AS product_approvals_table_exists;

-- 5. Check if approval_notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'approval_notifications'
) AS approval_notifications_table_exists;

-- 6. List all tables in your database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 7. Check users table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 8. Check if any sellers exist
SELECT COUNT(*) as seller_count
FROM users 
WHERE role = 'seller';

-- 9. Check products table structure specifically for approval columns
SELECT 
  column_name
FROM information_schema.columns 
WHERE table_name = 'products'
  AND column_name IN ('store_id', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason', 'submitted_at');
