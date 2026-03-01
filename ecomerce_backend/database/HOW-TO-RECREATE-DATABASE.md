# 🔄 How to Recreate Your Database

**Current Status**: Database is empty (0 tables)  
**Goal**: Recreate all 24 tables from scratch  
**Time Required**: ~2 minutes

---

## ✅ Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `yqigycicloyhasoqlcpn`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query** button

---

### Step 2: Copy the Complete SQL

1. Open the file: `ecomerce_backend/database/ALL-PHASES-COMPLETE-DATABASE.sql`
2. Select ALL content (Ctrl+A or Cmd+A)
3. Copy it (Ctrl+C or Cmd+C)

---

### Step 3: Run the SQL

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** button (or press Ctrl+Enter)
3. Wait for execution to complete (~10 seconds)
4. You should see: "Success. No rows returned"

---

### Step 4: Verify Tables Created

Run this query in the SQL Editor:

```sql
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

**Expected Result**: `total_tables: 24`

---

### Step 5: List All Tables

Run this query to see all tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected Tables** (24 total):
- addresses
- audit_log
- cart
- categories
- commission_rates
- disputes
- inventory
- manager_actions
- notifications
- orders
- payment_transactions
- payments
- payout_requests
- product_approvals
- products
- returns
- reviews
- seller_balances
- seller_documents
- seller_earnings
- seller_payouts
- seller_performance
- sub_orders
- users

---

### Step 6: Restart Backend Server

After database is recreated:

```bash
cd ecomerce_backend
npm start
```

The server should start successfully on port 5000.

---

### Step 7: Run Tests

Verify everything works:

```bash
node test-phase5-comprehensive.js
```

**Expected Result**: All 15 tests should pass ✅

---

## 🎯 What Gets Created

### Tables (24)
All tables from Phases 0-5 including:
- Base tables (users, products, orders, etc.)
- Phase 1 multi-vendor tables
- Phase 5 advanced features

### Indexes (60+)
Performance indexes on all key columns

### Triggers (10+)
Auto-update triggers for timestamps and performance metrics

### Functions (5+)
- `update_updated_at_column()` - Auto-update timestamps
- `update_seller_performance()` - Auto-calculate metrics
- `create_notification()` - Create notifications

### RLS Policies (12+)
Row-level security on sensitive tables

### Seed Data
- ✅ Admin user: `admin@ecommerce.com` / `Admin123!@#`
- ✅ 6 default categories
- ✅ Default commission rates
- ✅ Seller performance records
- ✅ Seller balance records

---

## ⚠️ Important Notes

### Safe to Re-run
The SQL file uses:
- `CREATE TABLE IF NOT EXISTS` - Won't fail if table exists
- `ON CONFLICT DO NOTHING` - Won't duplicate seed data
- Safe to run multiple times

### Schema Cache
The SQL automatically refreshes PostgREST cache with:
```sql
NOTIFY pgrst, 'reload schema';
```

### No Data Loss
Since database was empty, there's no data to lose. This is a fresh start.

---

## 🐛 Troubleshooting

### Problem: "relation already exists"
**Solution**: This is fine! It means some tables already exist. The script will skip them.

### Problem: "permission denied"
**Solution**: Make sure you're using the Supabase SQL Editor, not psql. The editor has full permissions.

### Problem: Tests still failing after recreation
**Solution**: 
1. Verify 24 tables exist (see Step 4)
2. Restart backend server
3. Check `.env` file has correct Supabase credentials
4. Run tests again

### Problem: "Cannot connect to database"
**Solution**: Check your `.env` file:
```env
SUPABASE_URL=https://yqigycicloyhasoqlcpn.supabase.co
SUPABASE_KEY=your_service_role_key
```

---

## 📊 Expected Test Results

After recreation, running `node test-phase5-comprehensive.js` should show:

```
📊 Test Summary:
   Total Tests: 15
   ✅ Passed: 15
   ❌ Failed: 0
   Success Rate: 100.0%

🎉 ALL PHASE 5 TESTS PASSED! 🎉
```

---

## 🚀 Quick Commands

```bash
# Verify table count (in Supabase SQL Editor)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

# List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

# Check admin user exists
SELECT email, role FROM users WHERE role = 'admin';

# Check categories exist
SELECT COUNT(*) FROM categories;

# Restart backend
cd ecomerce_backend
npm start

# Run tests
node test-phase5-comprehensive.js
```

---

**Created**: February 8, 2026  
**Status**: Ready to use  
**File**: `ALL-PHASES-COMPLETE-DATABASE.sql`
