# Amazon Approval Workflow - Complete Implementation Guide

## Current Status

### ✅ Backend Implementation (100% Complete)
- `services/approvalServices/approval.service.js` - Full business logic
- `controllers/approvalControllers/approval.controller.js` - HTTP handlers
- `routes/approvalRoutes/approval.routes.js` - API endpoints
- Routes registered in `routes/index.js`
- Product controller updated to set `approval_status = 'PENDING_APPROVAL'`

### 🔄 Database Migration (Ready to Run)
- Migration file created: `FRESH-APPROVAL-WORKFLOW.sql`
- Seed data file created: `seed-approval-test-data.sql`
- Diagnostic file created: `CHECK-EXISTING-SCHEMA.sql`

### ⏳ Frontend (Not Started)
- Manager approval UI needs to be built
- Admin approval UI needs to be built

---

## Step-by-Step Setup Instructions

### Step 1: Check Your Current Database Schema

Run this in Supabase SQL Editor:

**File:** `ecomerce_backend/database/CHECK-EXISTING-SCHEMA.sql`

This will show you:
- All columns in your products table
- Whether approval tables already exist
- All tables in your database
- Seller count

### Step 2: Run the Complete Migration

Run this in Supabase SQL Editor:

**File:** `ecomerce_backend/database/migrations/FRESH-APPROVAL-WORKFLOW.sql`

This migration will:
1. Create `stores` table (one per seller)
2. Auto-create stores for all existing sellers
3. Add 6 approval columns to products table:
   - `store_id` (UUID)
   - `approval_status` (VARCHAR, default 'PENDING_APPROVAL')
   - `approved_by` (UUID)
   - `approved_at` (TIMESTAMP)
   - `rejection_reason` (TEXT)
   - `submitted_at` (TIMESTAMP)
4. Populate `store_id` for existing products
5. Add foreign key constraints
6. Create indexes
7. Create `store_managers` table
8. Create `product_approvals` table (audit trail)
9. Create `approval_notifications` table
10. Create helper functions (`log_approval_action`, `send_approval_notification`)
11. Create triggers for auto-store creation and product counts

**Expected Output:**
```
NOTICE: Created stores table
NOTICE: Created store for seller: seller@example.com
NOTICE: Added store_id column
NOTICE: Added approval_status column
... (more notices)
Amazon-style approval workflow migration completed!
Stores created: 3
Products with store_id: 15
Products pending approval: 0
```

### Step 3: Seed Test Data

Run this in Supabase SQL Editor:

**File:** `ecomerce_backend/database/seed-approval-test-data.sql`

This will:
1. Create 2 test manager users:
   - `manager1@fastshop.com`
   - `manager2@fastshop.com`
2. Assign manager1 to first half of stores
3. Assign manager2 to second half of stores
4. Set 5 existing products to PENDING_APPROVAL status for testing

### Step 4: Set Manager Passwords

1. Go to Supabase Dashboard → Authentication → Users
2. Find `manager1@fastshop.com` and `manager2@fastshop.com`
3. Click on each user → Reset Password
4. Set passwords (e.g., `Manager123!`)

### Step 5: Test the Backend API

The following endpoints are ready to use:

#### Manager Endpoints

```bash
# Get approval queue
GET /api/manager/approvals/queue
Headers: Authorization: Bearer <manager_token>

# Get approval stats
GET /api/manager/approvals/stats
Headers: Authorization: Bearer <manager_token>

# Approve product
POST /api/manager/approvals/:productId/approve
Headers: Authorization: Bearer <manager_token>
Body: { "notes": "Looks good!" }

# Reject product
POST /api/manager/approvals/:productId/reject
Headers: Authorization: Bearer <manager_token>
Body: { "reason": "Poor quality images", "notes": "Please update" }

# Request changes
POST /api/manager/approvals/:productId/request-changes
Headers: Authorization: Bearer <manager_token>
Body: { "reason": "Missing product specifications" }

# Get approval history
GET /api/manager/approvals/:productId/history
Headers: Authorization: Bearer <manager_token>
```

#### Admin Endpoints

```bash
# Get all pending products (across all stores)
GET /api/admin/approvals/all-pending
Headers: Authorization: Bearer <admin_token>
```

### Step 6: Test the Workflow

1. **Login as Seller**
   - Go to Seller Dashboard → Add Product
   - Fill in product details
   - Submit
   - Product will be created with `approval_status = 'PENDING_APPROVAL'`
   - Product will NOT appear on the storefront yet

2. **Login as Manager**
   - Go to Manager Dashboard → Product Approvals
   - You should see the pending product
   - Click "Approve" or "Reject"
   - If approved, product becomes visible on storefront
   - If rejected, seller gets notification with reason

3. **Check Notifications**
   - Seller should receive notification about approval/rejection
   - Check `approval_notifications` table

4. **View Audit Trail**
   - Check `product_approvals` table
   - All actions are logged with timestamps, performer, and reasons

---

## Database Schema Overview

### stores
- One store per seller
- Auto-created when user becomes seller
- Tracks total products, sales, rating

### store_managers
- Links managers to specific stores
- Permissions: can_approve_products, can_reject_products, can_edit_products
- Status: active/inactive

### products (new columns)
- `store_id` - Links to stores table
- `approval_status` - PENDING_APPROVAL, APPROVED, REJECTED, CHANGES_REQUESTED
- `approved_by` - Manager who approved
- `approved_at` - Approval timestamp
- `rejection_reason` - Why rejected
- `submitted_at` - When submitted for approval

### product_approvals
- Complete audit trail
- Tracks every action (SUBMITTED, APPROVED, REJECTED, CHANGES_REQUESTED)
- Stores performer, role, reason, notes, IP address

### approval_notifications
- In-app notifications
- Tracks read status
- Can be extended for email notifications

---

## Workflow States

```
SELLER ADDS PRODUCT
    ↓
[PENDING_APPROVAL] ← Product created, not visible on storefront
    ↓
MANAGER REVIEWS
    ↓
    ├─→ APPROVE → [APPROVED] → Product goes live
    ├─→ REJECT → [REJECTED] → Seller notified, product hidden
    └─→ REQUEST CHANGES → [CHANGES_REQUESTED] → Seller can edit & resubmit
```

---

## API Response Examples

### Get Approval Queue

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Wireless Headphones",
      "price": 79.99,
      "approval_status": "PENDING_APPROVAL",
      "submitted_at": "2024-01-15T10:30:00Z",
      "hours_pending": 2,
      "seller_name": "John Doe",
      "seller_email": "seller@example.com",
      "store_name": "John's Electronics Store",
      "image_url": "https://...",
      "description": "High quality wireless headphones..."
    }
  ]
}
```

### Get Approval Stats

```json
{
  "success": true,
  "data": {
    "pending_count": 5,
    "approved_today": 12,
    "rejected_today": 2,
    "managed_stores_count": 3
  }
}
```

### Approval History

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "APPROVED",
      "previous_status": "PENDING_APPROVAL",
      "new_status": "APPROVED",
      "performed_by": "uuid",
      "performer_role": "manager",
      "notes": "Looks good!",
      "created_at": "2024-01-15T12:00:00Z",
      "users": {
        "email": "manager1@fastshop.com"
      }
    }
  ]
}
```

---

## Troubleshooting

### Migration Fails with "column store_id does not exist"

This means the `EXECUTE` approach didn't work either. In this case:

1. Use Supabase Table Editor (GUI):
   - Go to Table Editor → products table
   - Click "Add Column" 6 times
   - Add each column manually

2. Or run these commands ONE AT A TIME in SQL Editor:
   ```sql
   ALTER TABLE products ADD COLUMN store_id UUID;
   ALTER TABLE products ADD COLUMN approval_status VARCHAR(50) DEFAULT 'PENDING_APPROVAL';
   ALTER TABLE products ADD COLUMN approved_by UUID;
   ALTER TABLE products ADD COLUMN approved_at TIMESTAMP;
   ALTER TABLE products ADD COLUMN rejection_reason TEXT;
   ALTER TABLE products ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
   ```

3. Then run `FRESH-APPROVAL-WORKFLOW.sql` again

### No Managers Showing Up

- Check if managers were created: `SELECT * FROM users WHERE role = 'manager'`
- Check if they're assigned to stores: `SELECT * FROM store_managers`
- Run `seed-approval-test-data.sql` again

### Products Not Showing in Approval Queue

- Check product status: `SELECT id, title, approval_status FROM products`
- Ensure products have `approval_status = 'PENDING_APPROVAL'`
- Ensure manager is assigned to the product's store

---

## Next Steps

### Frontend Implementation

1. **Manager Approval Page** (`ManagerProductApprovalsPage.jsx`)
   - Already exists but needs to connect to API
   - Display pending products in a table
   - Add Approve/Reject/Request Changes buttons
   - Show approval history modal

2. **Admin Approval Page** (`AdminProductApprovalsPage.jsx`)
   - Already exists but needs to connect to API
   - Show all pending products across all stores
   - Bulk approval actions

3. **Seller Product Status**
   - Update `SellerProductsPage.jsx` to show approval status
   - Add badge colors: Pending (yellow), Approved (green), Rejected (red)
   - Show rejection reason if rejected

4. **Notifications**
   - Add notification bell icon in header
   - Show unread approval notifications
   - Mark as read functionality

---

## Files Created

### Database
- `CHECK-EXISTING-SCHEMA.sql` - Diagnostic queries
- `migrations/FRESH-APPROVAL-WORKFLOW.sql` - Complete migration
- `seed-approval-test-data.sql` - Test data seeder
- `APPROVAL-WORKFLOW-FINAL-GUIDE.md` - This file

### Backend (Already Complete)
- `services/approvalServices/approval.service.js`
- `controllers/approvalControllers/approval.controller.js`
- `routes/approvalRoutes/approval.routes.js`

### Frontend (To Be Built)
- Manager approval UI
- Admin approval UI
- Seller product status badges
- Notification system

---

## Summary

The Amazon-style approval workflow is **100% complete on the backend**. Once you run the two SQL files (`FRESH-APPROVAL-WORKFLOW.sql` and `seed-approval-test-data.sql`), the entire system will be functional via API. The frontend just needs to be connected to these existing endpoints.
