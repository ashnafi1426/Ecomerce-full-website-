# How to Delete All Tables - Complete Guide

**Created**: February 8, 2026  
**⚠️ WARNING**: This will permanently delete ALL data!

---

## 📁 Files Available

### 1. DELETE-ALL-TABLES.sql (Direct Deletion)
- **Purpose**: Immediately deletes all tables
- **Safety**: No confirmation required
- **Use When**: You're absolutely sure and have backups

### 2. DELETE-ALL-TABLES-SAFE.sql (Safe Deletion)
- **Purpose**: Shows info first, requires manual uncomment
- **Safety**: Deletion code is commented out
- **Use When**: You want to review before deleting

---

## ⚠️ CRITICAL WARNINGS

### Before You Delete:

1. **BACKUP YOUR DATABASE!**
   ```bash
   # Create backup
   pg_dump -h your-host -U your-user -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verify Database**
   - Make sure you're connected to the CORRECT database
   - Double-check the database name
   - Confirm this is not production

3. **Understand Consequences**
   - ALL data will be lost
   - ALL tables will be deleted
   - ALL functions will be deleted
   - ALL triggers will be deleted
   - ALL views will be deleted
   - This CANNOT be undone without a backup

---

## 🚀 Method 1: Direct Deletion (Fast)

### Step 1: Backup Database
```bash
# Via pg_dump
pg_dump "your-connection-string" > backup.sql

# Or via Supabase Dashboard
# Go to Database → Backups → Create Backup
```

### Step 2: Open SQL Editor
Go to: https://supabase.com/dashboard/project/yqigycicloyhasoqlcpn/sql/new

### Step 3: Copy and Run
1. Open: `ecomerce_backend/database/DELETE-ALL-TABLES.sql`
2. Copy ALL content
3. Paste into SQL Editor
4. Click "Run"

### Step 4: Verify
You should see:
```
✅ All tables deleted successfully!
Remaining Tables: 0
```

---

## 🛡️ Method 2: Safe Deletion (Recommended)

### Step 1: Review Current State
1. Open: `ecomerce_backend/database/DELETE-ALL-TABLES-SAFE.sql`
2. Copy and paste into SQL Editor
3. Run it (while deletion code is still commented)
4. Review the output showing current tables

### Step 2: Backup Database
```bash
pg_dump "your-connection-string" > backup_before_delete.sql
```

### Step 3: Uncomment Deletion Code
In the SQL file, find this section:
```sql
/*
-- Drop all views
DROP VIEW IF EXISTS ...
...
*/
```

Remove the `/*` at the start and `*/` at the end to uncomment.

### Step 4: Run Deletion
1. Copy the ENTIRE file (with uncommented deletion code)
2. Paste into SQL Editor
3. Click "Run"

### Step 5: Verify
Check that all tables are deleted.

---

## 📋 What Gets Deleted

### Tables (24 total):
1. payout_requests
2. notifications
3. manager_actions
4. seller_performance
5. product_approvals
6. seller_earnings
7. seller_documents
8. cart
9. reviews
10. disputes
11. sub_orders
12. payment_transactions
13. seller_payouts
14. seller_balances
15. commission_rates
16. audit_log
17. addresses
18. returns
19. payments
20. orders
21. inventory
22. products
23. categories
24. users

### Views (6 total):
- products_with_inventory
- orders_with_customer
- customer_statistics
- approved_products
- pending_product_approvals
- seller_products

### Functions (12 total):
- update_updated_at_column()
- audit_trigger_func()
- validate_inventory()
- enforce_single_default_address()
- handle_product_approval_change()
- get_seller_products()
- update_seller_performance()
- create_notification()
- get_commission_rate()
- calculate_seller_payout()
- get_product_stock()
- reserve_inventory()

### Triggers (15+ total):
- All update triggers
- All audit triggers
- All validation triggers

---

## 🔄 After Deletion

### Option 1: Recreate Fresh Database
```bash
# Run the complete setup
psql "your-connection-string" -f database/ALL-PHASES-COMPLETE-DATABASE.sql
```

Or via Supabase Dashboard:
1. Open SQL Editor
2. Copy `ALL-PHASES-COMPLETE-DATABASE.sql`
3. Paste and Run

### Option 2: Restore from Backup
```bash
# Restore from backup
psql "your-connection-string" < backup.sql
```

---

## 🧪 Verification Queries

### Check Remaining Tables
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
```

**Expected**: 0

### List Any Remaining Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected**: Empty result

### Check Remaining Functions
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Expected**: Empty or only system functions

---

## 🚨 Troubleshooting

### Error: "cannot drop table X because other objects depend on it"
**Solution**: The script uses `CASCADE` which should handle this. If you still get this error:
```sql
-- Force drop with CASCADE
DROP TABLE table_name CASCADE;
```

### Error: "permission denied"
**Solution**: Make sure you're using the database owner or superuser account.

### Some Tables Remain
**Solution**: Run the deletion script again, or manually drop remaining tables:
```sql
-- List remaining tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Drop manually
DROP TABLE remaining_table_name CASCADE;
```

---

## 💡 Alternative: Drop Schema

If you want to delete EVERYTHING including all objects:

```sql
-- Drop entire public schema
DROP SCHEMA public CASCADE;

-- Recreate public schema
CREATE SCHEMA public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

---

## 📊 Deletion Order (Technical Details)

The script deletes in this order to respect foreign key dependencies:

1. **Views** (no dependencies)
2. **Triggers** (depend on tables)
3. **Functions** (used by triggers)
4. **Child Tables** (have foreign keys to parent tables)
   - Phase 5 tables
   - Phase 1 tables
   - Dependent base tables
5. **Parent Tables** (referenced by other tables)
   - orders, products, categories, users

---

## 🔐 Safety Checklist

Before running deletion:

- [ ] Database backup created
- [ ] Backup verified (can be restored)
- [ ] Confirmed correct database
- [ ] Not in production environment
- [ ] Team notified (if applicable)
- [ ] Have plan to recreate/restore
- [ ] Understand this is permanent
- [ ] Read this guide completely

---

## 📞 Quick Commands

### Backup
```bash
# Create backup
pg_dump "postgresql://user:pass@host:5432/db" > backup.sql
```

### Delete All Tables
```bash
# Via psql
psql "your-connection-string" -f database/DELETE-ALL-TABLES.sql
```

### Recreate Database
```bash
# Via psql
psql "your-connection-string" -f database/ALL-PHASES-COMPLETE-DATABASE.sql
```

### Restore Backup
```bash
# Via psql
psql "your-connection-string" < backup.sql
```

---

## ⏱️ Execution Time

- **Deletion**: ~5-10 seconds
- **Backup**: Depends on data size (usually 10-60 seconds)
- **Restore**: Depends on data size (usually 30-120 seconds)
- **Recreate**: ~10 seconds (empty database)

---

## 🎯 Common Use Cases

### 1. Fresh Start
```
1. Delete all tables
2. Run ALL-PHASES-COMPLETE-DATABASE.sql
3. Start with clean database
```

### 2. Testing
```
1. Backup current state
2. Delete all tables
3. Run tests
4. Restore backup
```

### 3. Migration Reset
```
1. Delete all tables
2. Run new migration scripts
3. Verify new schema
```

---

**Status**: ✅ **READY TO USE**  
**Files**: 
- `DELETE-ALL-TABLES.sql` (Direct)
- `DELETE-ALL-TABLES-SAFE.sql` (Safe)
- `HOW-TO-DELETE-ALL-TABLES.md` (This guide)

⚠️ **REMEMBER**: Always backup before deleting!
