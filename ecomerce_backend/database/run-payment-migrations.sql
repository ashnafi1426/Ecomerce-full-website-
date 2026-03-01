-- ============================================
-- RUN ALL PAYMENT-RELATED MIGRATIONS
-- Execute this file to fix order creation issues
-- ============================================

\echo '🚀 Starting payment system migrations...'
\echo ''

-- 1. Create order_items table
\echo '📦 Creating order_items table...'
\i migrations/create-order-items-table.sql
\echo ''

-- 2. Create inventory functions
\echo '📦 Creating inventory functions...'
\i migrations/create-inventory-functions.sql
\echo ''

\echo '✅ All payment migrations completed successfully!'
\echo ''
\echo '📋 Summary:'
\echo '   ✅ order_items table created'
\echo '   ✅ Inventory functions created'
\echo '   ✅ Ready for order processing'
\echo ''
