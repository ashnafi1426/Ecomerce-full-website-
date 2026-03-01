-- =====================================================
-- SAFE DELETE ALL TABLES - WITH CONFIRMATION
-- FastShop E-Commerce Platform
-- Created: February 8, 2026
-- =====================================================
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA PERMANENTLY!
-- ⚠️  THIS SCRIPT REQUIRES MANUAL CONFIRMATION!
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP REMINDER
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '⚠️  DATABASE DELETION WARNING ⚠️';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'This script will DELETE ALL TABLES and DATA!';
  RAISE NOTICE '';
  RAISE NOTICE 'Before proceeding:';
  RAISE NOTICE '1. Have you backed up your database?';
  RAISE NOTICE '2. Are you absolutely sure you want to delete everything?';
  RAISE NOTICE '3. Is this the correct database?';
  RAISE NOTICE '';
  RAISE NOTICE 'To proceed, uncomment the deletion code below.';
  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- STEP 2: SHOW CURRENT DATABASE INFO
-- =====================================================
DO $$
DECLARE
  table_count INTEGER;
  total_rows BIGINT := 0;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '';
  RAISE NOTICE 'Current Database Status:';
  RAISE NOTICE '- Total Tables: %', table_count;
  RAISE NOTICE '- Database: %', current_database();
  RAISE NOTICE '';
END $$;

-- List all tables with row counts
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- STEP 3: DELETION CODE (COMMENTED OUT FOR SAFETY)
-- =====================================================
-- ⚠️  UNCOMMENT THE LINES BELOW TO ACTUALLY DELETE ⚠️
-- =====================================================

/*

-- Drop all views
DROP VIEW IF EXISTS products_with_inventory CASCADE;
DROP VIEW IF EXISTS orders_with_customer CASCADE;
DROP VIEW IF EXISTS customer_statistics CASCADE;
DROP VIEW IF EXISTS approved_products CASCADE;
DROP VIEW IF EXISTS pending_product_approvals CASCADE;
DROP VIEW IF EXISTS seller_products CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_func() CASCADE;
DROP FUNCTION IF EXISTS validate_inventory() CASCADE;
DROP FUNCTION IF EXISTS enforce_single_default_address() CASCADE;
DROP FUNCTION IF EXISTS handle_product_approval_change() CASCADE;
DROP FUNCTION IF EXISTS get_seller_products(UUID, VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_seller_performance() CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_commission_rate(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_seller_payout(DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS get_product_stock(UUID) CASCADE;
DROP FUNCTION IF EXISTS reserve_inventory(UUID, INTEGER) CASCADE;

-- Drop all tables (in correct order)
DROP TABLE IF EXISTS payout_requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS manager_actions CASCADE;
DROP TABLE IF EXISTS seller_performance CASCADE;
DROP TABLE IF EXISTS product_approvals CASCADE;
DROP TABLE IF EXISTS seller_earnings CASCADE;
DROP TABLE IF EXISTS seller_documents CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS sub_orders CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS seller_payouts CASCADE;
DROP TABLE IF EXISTS seller_balances CASCADE;
DROP TABLE IF EXISTS commission_rates CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Verification
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ DATABASE CLEANUP COMPLETE!';
  RAISE NOTICE 'Remaining Tables: %', table_count;
  RAISE NOTICE '============================================';
END $$;

*/

-- =====================================================
-- END OF SAFE DELETION SCRIPT
-- =====================================================
