-- =====================================================
-- DELETE ALL TABLES - COMPLETE DATABASE CLEANUP
-- FastShop E-Commerce Platform
-- Created: February 8, 2026
-- =====================================================
-- ⚠️  WARNING: THIS WILL DELETE ALL DATA PERMANENTLY!
-- ⚠️  BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT!
-- =====================================================

-- Disable foreign key checks temporarily (if supported)
-- Note: PostgreSQL doesn't have this, so we drop in correct order

-- =====================================================
-- STEP 1: DROP ALL VIEWS FIRST
-- =====================================================

DROP VIEW IF EXISTS products_with_inventory CASCADE;
DROP VIEW IF EXISTS orders_with_customer CASCADE;
DROP VIEW IF EXISTS customer_statistics CASCADE;
DROP VIEW IF EXISTS approved_products CASCADE;
DROP VIEW IF EXISTS pending_product_approvals CASCADE;
DROP VIEW IF EXISTS seller_products CASCADE;

-- =====================================================
-- STEP 2: DROP ALL TRIGGERS
-- =====================================================

-- Drop triggers on users
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS audit_users ON users CASCADE;

-- Drop triggers on products
DROP TRIGGER IF EXISTS update_products_updated_at ON products CASCADE;
DROP TRIGGER IF EXISTS audit_products ON products CASCADE;
DROP TRIGGER IF EXISTS product_approval_change_trigger ON products CASCADE;

-- Drop triggers on orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders CASCADE;
DROP TRIGGER IF EXISTS audit_orders ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_seller_performance ON orders CASCADE;

-- Drop triggers on inventory
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory CASCADE;
DROP TRIGGER IF EXISTS validate_inventory_trigger ON inventory CASCADE;

-- Drop triggers on payments
DROP TRIGGER IF EXISTS audit_payments ON payments CASCADE;

-- Drop triggers on addresses
DROP TRIGGER IF EXISTS enforce_default_address ON addresses CASCADE;

-- Drop triggers on other tables
DROP TRIGGER IF EXISTS update_seller_balances_updated_at ON seller_balances CASCADE;
DROP TRIGGER IF EXISTS update_sub_orders_updated_at ON sub_orders CASCADE;
DROP TRIGGER IF EXISTS update_disputes_updated_at ON disputes CASCADE;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews CASCADE;
DROP TRIGGER IF EXISTS update_cart_updated_at ON cart CASCADE;
DROP TRIGGER IF EXISTS update_commission_rates_updated_at ON commission_rates CASCADE;

-- =====================================================
-- STEP 3: DROP ALL FUNCTIONS
-- =====================================================

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

-- =====================================================
-- STEP 4: DROP ALL TABLES IN CORRECT ORDER
-- =====================================================
-- Drop tables in reverse order of dependencies
-- (child tables first, parent tables last)

-- Drop tables that exist (IF EXISTS prevents errors)
-- Phase 5 tables
DO $$ 
BEGIN
  DROP TABLE IF EXISTS payout_requests CASCADE;
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS manager_actions CASCADE;
  DROP TABLE IF EXISTS seller_performance CASCADE;
  DROP TABLE IF EXISTS product_approvals CASCADE;
  DROP TABLE IF EXISTS seller_earnings CASCADE;
  DROP TABLE IF EXISTS seller_documents CASCADE;
  
  -- Phase 1 tables (continued)
  DROP TABLE IF EXISTS cart CASCADE;
  DROP TABLE IF EXISTS reviews CASCADE;
  DROP TABLE IF EXISTS disputes CASCADE;
  DROP TABLE IF EXISTS sub_orders CASCADE;
  DROP TABLE IF EXISTS payment_transactions CASCADE;
  DROP TABLE IF EXISTS seller_payouts CASCADE;
  DROP TABLE IF EXISTS seller_balances CASCADE;
  DROP TABLE IF EXISTS commission_rates CASCADE;
  
  -- Base tables
  DROP TABLE IF EXISTS audit_log CASCADE;
  DROP TABLE IF EXISTS addresses CASCADE;
  DROP TABLE IF EXISTS returns CASCADE;
  DROP TABLE IF EXISTS payments CASCADE;
  DROP TABLE IF EXISTS orders CASCADE;
  DROP TABLE IF EXISTS inventory CASCADE;
  DROP TABLE IF EXISTS products CASCADE;
  DROP TABLE IF EXISTS categories CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  
  RAISE NOTICE 'All existing tables have been dropped';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error during table deletion: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 5: DROP EXTENSIONS (OPTIONAL)
-- =====================================================
-- Uncomment if you want to remove extensions too
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;
-- DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;

-- =====================================================
-- STEP 6: VERIFICATION
-- =====================================================

-- Check remaining tables
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATABASE CLEANUP COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Remaining Tables: %', table_count;
  RAISE NOTICE 'Date: %', NOW();
  RAISE NOTICE '============================================';
  
  IF table_count = 0 THEN
    RAISE NOTICE '✅ All tables deleted successfully!';
  ELSE
    RAISE NOTICE '⚠️  % tables still remain', table_count;
  END IF;
END $$;

-- List any remaining tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- CLEANUP COMPLETE
-- =====================================================
