-- ============================================================================
-- FASTSHOP PHASE 1 MASTER MIGRATION SCRIPT
-- Description: Executes all Phase 1 database migrations in correct order
-- Version: 1.0
-- Date: February 7, 2026
-- ============================================================================

-- ============================================================================
-- IMPORTANT: BACKUP YOUR DATABASE BEFORE RUNNING THIS SCRIPT
-- ============================================================================

-- Create a backup:
-- pg_dump -h your-host -U your-user -d your-database > backup_before_phase1.sql

-- ============================================================================
-- MIGRATION EXECUTION ORDER
-- ============================================================================

\echo '========================================='
\echo 'FASTSHOP PHASE 1 MIGRATION'
\echo 'Starting database transformation...'
\echo '========================================='
\echo ''

-- ============================================================================
-- STEP 1: Add Roles and Seller Fields
-- ============================================================================

\echo 'Step 1/5: Adding new user roles and seller fields...'
\i phase1-01-add-roles-and-seller-fields.sql
\echo 'Step 1/5: Completed ✓'
\echo ''

-- ============================================================================
-- STEP 2: Multi-Vendor Products
-- ============================================================================

\echo 'Step 2/5: Implementing multi-vendor product schema...'
\i phase1-02-multi-vendor-products.sql
\echo 'Step 2/5: Completed ✓'
\echo ''

-- ============================================================================
-- STEP 3: Commission and Financial Tables
-- ============================================================================

\echo 'Step 3/5: Creating commission and financial tables...'
\i phase1-03-commission-and-financial-tables.sql
\echo 'Step 3/5: Completed ✓'
\echo ''

-- ============================================================================
-- STEP 4: Disputes and Enhanced Returns
-- ============================================================================

\echo 'Step 4/5: Setting up disputes and enhanced returns...'
\i phase1-04-disputes-and-enhanced-returns.sql
\echo 'Step 4/5: Completed ✓'
\echo ''

-- ============================================================================
-- STEP 5: Notifications and Audit Enhancement
-- ============================================================================

\echo 'Step 5/5: Implementing notifications and audit enhancement...'
\i phase1-05-notifications-and-audit-enhancement.sql
\echo 'Step 5/5: Completed ✓'
\echo ''

-- ============================================================================
-- VERIFICATION
-- ============================================================================

\echo '========================================='
\echo 'PHASE 1 MIGRATION COMPLETED'
\echo '========================================='
\echo ''

-- Show all tables
\echo 'Database Tables:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo 'Database Views:'
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''
\echo 'User Roles Distribution:'
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

\echo ''
\echo 'Product Approval Status:'
SELECT approval_status, COUNT(*) as count
FROM products
GROUP BY approval_status
ORDER BY approval_status;

\echo ''
\echo 'Commission Rates:'
SELECT rate_type, seller_tier, commission_percentage, is_active
FROM commission_rates
ORDER BY rate_type, seller_tier;

\echo ''
\echo '========================================='
\echo 'NEXT STEPS:'
\echo '1. Review migration results above'
\echo '2. Test database connectivity'
\echo '3. Update backend code for new schema'
\echo '4. Run application tests'
\echo '5. Proceed to Phase 2 when ready'
\echo '========================================='
