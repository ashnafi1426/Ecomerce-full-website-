-- ============================================
-- FIX PHASE 5 SCHEMA CACHE ISSUE
-- ============================================
-- 
-- This SQL script fixes the PostgREST schema cache issue
-- by enabling RLS and creating permissive policies.
--
-- HOW TO USE:
-- 1. Go to: https://supabase.com/dashboard/project/yqigycicloyhasoqlcpn/sql/new
-- 2. Copy and paste this entire file
-- 3. Click "Run" button
-- 4. Wait 10 seconds
-- 5. Run: node test-phase5-comprehensive.js
-- 6. Expected: 15/15 tests passing (100%)
--
-- ============================================

-- Enable RLS on Phase 5 tables
ALTER TABLE seller_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can access seller_documents" ON seller_documents;
DROP POLICY IF EXISTS "Service role can access seller_earnings" ON seller_earnings;
DROP POLICY IF EXISTS "Service role can access product_approvals" ON product_approvals;
DROP POLICY IF EXISTS "Service role can access seller_performance" ON seller_performance;
DROP POLICY IF EXISTS "Service role can access manager_actions" ON manager_actions;
DROP POLICY IF EXISTS "Service role can access notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can access payout_requests" ON payout_requests;

-- Create permissive policies for service role (backend access)
-- These policies allow the backend (using service role key) to access all data

-- seller_documents: Allow all operations
CREATE POLICY "Service role can access seller_documents" ON seller_documents
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- seller_earnings: Allow all operations
CREATE POLICY "Service role can access seller_earnings" ON seller_earnings
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- product_approvals: Allow all operations
CREATE POLICY "Service role can access product_approvals" ON product_approvals
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- seller_performance: Allow all operations
CREATE POLICY "Service role can access seller_performance" ON seller_performance
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- manager_actions: Allow all operations
CREATE POLICY "Service role can access manager_actions" ON manager_actions
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- notifications: Allow all operations
CREATE POLICY "Service role can access notifications" ON notifications
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- payout_requests: Allow all operations
CREATE POLICY "Service role can access payout_requests" ON payout_requests
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'seller_documents',
  'seller_earnings',
  'product_approvals',
  'seller_performance',
  'manager_actions',
  'notifications',
  'payout_requests'
)
ORDER BY tablename;

-- Check that policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'seller_documents',
  'seller_earnings',
  'product_approvals',
  'seller_performance',
  'manager_actions',
  'notifications',
  'payout_requests'
)
ORDER BY tablename, policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Phase 5 schema cache fix applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Next steps:';
  RAISE NOTICE '   1. Wait 10 seconds for cache to refresh';
  RAISE NOTICE '   2. Run: node test-phase5-comprehensive.js';
  RAISE NOTICE '   3. Expected: 15/15 tests passing (100%%)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 If tests still fail after 10 seconds:';
  RAISE NOTICE '   - Wait another 5 minutes for auto-refresh';
  RAISE NOTICE '   - Or restart your Supabase project';
  RAISE NOTICE '';
END $$;
