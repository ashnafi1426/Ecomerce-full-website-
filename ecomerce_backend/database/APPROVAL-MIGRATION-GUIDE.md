# Amazon Approval Workflow - Migration Guide

## Problem
The migration keeps failing with "column store_id does not exist" because tables with foreign keys are being created before the column exists.

## Solution: Run Migrations in Order

### Step 1: Add store_id Column ONLY
Run this file first:
```
01-add-store-id-column-only.sql
```

This simply adds the `store_id` column to the products table without any constraints or foreign keys.

### Step 2: Run Complete Migration
After Step 1 succeeds, run:
```
amazon-approval-fixed.sql
```

This will:
1. Create the `stores` table
2. Create `store_managers`, `product_approvals`, and `approval_notifications` tables
3. Auto-create stores for existing sellers
4. Populate `store_id` for existing products
5. Add foreign key constraints
6. Create indexes
7. Create helper functions
8. Create triggers

## What Gets Created

### Tables
- `stores` - One store per seller
- `store_managers` - Managers assigned to stores
- `product_approvals` - Audit trail of all approval actions
- `approval_notifications` - Notifications for approval events

### Columns Added to Products
- `store_id` - Links product to store
- `approval_status` - PENDING_APPROVAL, APPROVED, REJECTED, CHANGES_REQUESTED
- `approved_by` - Manager/admin who approved
- `approved_at` - Timestamp of approval
- `rejection_reason` - Reason for rejection
- `submitted_at` - When product was submitted

### Functions
- `log_approval_action()` - Log approval/rejection actions
- `send_approval_notification()` - Send notifications
- `create_store_for_new_seller()` - Auto-create store when user becomes seller
- `set_product_store_id()` - Auto-set store_id on product insert
- `update_store_product_count()` - Keep store product count in sync

### Triggers
- Auto-create store when user role changes to seller
- Auto-set store_id when product is created
- Update store product count when products are added/removed

## Backend Files Created

### Services
- `ecomerce_backend/services/approvalServices/approval.service.js`

### Controllers
- `ecomerce_backend/controllers/approvalControllers/approval.controller.js`

### Routes
- `ecomerce_backend/routes/approvalRoutes/approval.routes.js`
- Registered in `ecomerce_backend/routes/index.js`

## API Endpoints

### Manager Endpoints
- `GET /api/manager/approvals/queue` - Get pending products for managed stores
- `GET /api/manager/approvals/stats` - Get approval statistics
- `POST /api/manager/approvals/:productId/approve` - Approve product
- `POST /api/manager/approvals/:productId/reject` - Reject product (requires reason)
- `POST /api/manager/approvals/:productId/request-changes` - Request changes
- `GET /api/manager/approvals/:productId/history` - Get approval history

### Admin Endpoints
- `GET /api/admin/approvals/all-pending` - Get all pending products across all stores

## Testing

### 1. Seed Test Data
Run this to create test managers and assign them to stores:
```
seed-approval-test-data.sql
```

This creates:
- 2 test manager accounts
- Assigns them to stores
- Sets some products to PENDING_APPROVAL status

### 2. Test Manager Login
Login as a manager:
- Email: `john.manager@fastshop.com`
- Email: `sarah.manager@fastshop.com`

### 3. Test Approval Flow
1. Manager logs in
2. GET `/api/manager/approvals/queue` - See pending products
3. POST `/api/manager/approvals/{productId}/approve` - Approve a product
4. Check product status changed to APPROVED
5. Check seller receives notification

## Workflow

### Seller Adds Product
1. Seller creates product via `POST /api/seller/products`
2. Product automatically gets:
   - `store_id` set (via trigger)
   - `approval_status` = 'PENDING_APPROVAL'
   - `submitted_at` = current timestamp
3. Product is NOT visible to customers yet

### Manager Reviews Product
1. Manager sees product in approval queue
2. Manager can:
   - Approve → status becomes 'APPROVED', product goes live
   - Reject → status becomes 'REJECTED', seller notified with reason
   - Request Changes → status becomes 'CHANGES_REQUESTED', seller can edit and resubmit

### Product Goes Live
1. When approved, product:
   - `approval_status` = 'APPROVED'
   - `approved_by` = manager ID
   - `approved_at` = timestamp
   - `status` = 'active' (visible to customers)
2. Seller receives notification
3. Approval action logged in `product_approvals` table

## Troubleshooting

### "column store_id does not exist"
- Make sure you ran `01-add-store-id-column-only.sql` FIRST
- Check if column exists: `SELECT * FROM information_schema.columns WHERE table_name='products' AND column_name='store_id';`

### "relation stores does not exist"
- The stores table is created in the main migration
- Make sure `amazon-approval-fixed.sql` ran successfully

### Products don't have store_id
- Run: `UPDATE products p SET store_id = s.id FROM stores s WHERE p.seller_id = s.seller_id AND p.store_id IS NULL;`

### Manager can't see any products
- Check if manager is assigned to stores: `SELECT * FROM store_managers WHERE manager_id = 'manager-uuid';`
- Check if products have matching store_id: `SELECT * FROM products WHERE store_id IN (SELECT store_id FROM store_managers WHERE manager_id = 'manager-uuid');`

## Next Steps

1. Run migrations in order (Step 1, then Step 2)
2. Seed test data
3. Test manager login and approval flow
4. Build frontend approval UI
5. Add email notifications for approval events
