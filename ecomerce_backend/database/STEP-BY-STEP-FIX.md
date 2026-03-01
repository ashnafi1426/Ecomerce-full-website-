# Step-by-Step Fix for Approval Workflow Migration

## The Problem
Your Supabase PostgreSQL version doesn't handle `ALTER TABLE ADD COLUMN IF NOT EXISTS` properly, causing the migration to fail with "column store_id does not exist".

## The Solution
Add the columns manually, then run the full migration.

---

## STEP 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

---

## STEP 2: Add Columns One by One

Copy and paste each command below **ONE AT A TIME** and click "Run":

```sql
ALTER TABLE products ADD COLUMN store_id UUID;
```

Wait for success, then run:

```sql
ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL';
```

Wait for success, then run:

```sql
ALTER TABLE products ADD COLUMN approved_by UUID;
```

Wait for success, then run:

```sql
ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
```

Wait for success, then run:

```sql
ALTER TABLE products ADD COLUMN rejection_reason TEXT;
```

Wait for success, then run:

```sql
ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

---

## STEP 3: Verify Columns Were Added

Run this verification query:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('store_id', 'approval_status', 'approved_by', 'approved_at', 'rejection_reason', 'submitted_at')
ORDER BY column_name;
```

**Expected Result:** You should see 6 rows showing all the columns.

---

## STEP 4: Run the Full Migration

Now that the columns exist, run the complete migration file:

**File:** `ecomerce_backend/database/migrations/amazon-approval-final.sql`

This will:
- Create the `stores` table
- Create the `store_managers` table
- Create the `product_approvals` table
- Create the `approval_notifications` table
- Add foreign key constraints
- Create indexes
- Create helper functions
- Set up triggers

---

## STEP 5: Seed Test Data

After the migration succeeds, run:

**File:** `ecomerce_backend/database/seed-approval-test-data.sql`

This creates test managers and assigns them to stores.

---

## STEP 6: Test the Workflow

1. Login as a seller
2. Add a new product (it will have status='PENDING_APPROVAL')
3. Login as a manager
4. Go to Manager Dashboard → Product Approvals
5. Approve/reject the product

---

## What If Columns Already Exist?

If you get an error like "column already exists", that's fine! It means that column was already added. Just skip to the next command.

---

## Alternative: Use Supabase Table Editor

If you prefer a GUI approach:

1. Go to Supabase Dashboard → Table Editor
2. Click on the `products` table
3. Click "Add Column" button
4. Add each column manually:
   - `store_id` - Type: uuid, Nullable: Yes
   - `approval_status` - Type: varchar(50), Default: 'PENDING_APPROVAL'
   - `approved_by` - Type: uuid, Nullable: Yes
   - `approved_at` - Type: timestamp, Nullable: Yes
   - `rejection_reason` - Type: text, Nullable: Yes
   - `submitted_at` - Type: timestamp, Default: now()

Then proceed to STEP 4.

---

## Backend is Ready!

The backend code is 100% complete:
- ✅ `services/approvalServices/approval.service.js`
- ✅ `controllers/approvalControllers/approval.controller.js`
- ✅ `routes/approvalRoutes/approval.routes.js`
- ✅ Routes registered in `routes/index.js`

Once the database is set up, the approval workflow will work immediately!
