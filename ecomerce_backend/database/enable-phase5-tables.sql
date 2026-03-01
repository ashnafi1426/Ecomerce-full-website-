-- ============================================
-- ENABLE PHASE 5 TABLES IN SUPABASE API
-- ============================================
--
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yqigycicloyhasoqlcpn/sql/new
--
-- This enables RLS and creates policies so the tables
-- are accessible via the Supabase API
-- ============================================

-- Enable RLS on Phase 5 tables
ALTER TABLE IF EXISTS seller_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seller_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS seller_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS manager_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payout_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access for service role" ON seller_documents;
DROP POLICY IF EXISTS "Enable all access for service role" ON seller_earnings;
DROP POLICY IF EXISTS "Enable all access for service role" ON product_approvals;
DROP POLICY IF EXISTS "Enable all access for service role" ON seller_performance;
DROP POLICY IF EXISTS "Enable all access for service role" ON manager_actions;
DROP POLICY IF EXISTS "Enable all access for service role" ON payout_requests;

-- Create permissive policies (allow backend to access everything)
CREATE POLICY "Enable all access for service role" ON seller_documents
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON seller_earnings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON product_approvals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON seller_performance
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON manager_actions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON payout_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Phase 5 tables enabled successfully! Wait 10 seconds then run tests.' as message;
