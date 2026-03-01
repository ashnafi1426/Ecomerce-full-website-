# Amazon Approval Workflow - Complete Setup Guide

## ✅ What's Already Done

### Backend (100% Complete)
- ✅ `services/approvalServices/approval.service.js` - Full business logic
- ✅ `controllers/approvalControllers/approval.controller.js` - HTTP handlers  
- ✅ `routes/approvalRoutes/approval.routes.js` - API endpoints
- ✅ Routes registered in `routes/index.js`
- ✅ Product controller updated to set `approval_status = 'PENDING_APPROVAL'`

### Database Migration (In Progress)
- ✅ Step 1-7: Stores table, columns, constraints, indexes created
- ✅ Step 8: Remaining tables created (store_managers, product_approvals, approval_notifications)
- ⏳ Step 9: Functions and triggers (READY TO RUN)
- ⏳ Seed test data (READY TO RUN)

---

## 🚀 Final Setup Steps

### Step 1: Run Step-09 (Functions & Triggers)

**File:** `ecomerce_backend/database/migrations/step-09-create-functions-triggers.sql`

Run this in Supabase SQL Editor. This will create:
- `log_approval_action()` function
- `send_approval_notification()` function
- Auto-create store trigger for new sellers
- Auto-set store_id trigger for new products
- Update store product count trigger

**Expected Output:**
```
Functions and triggers created!
```

---

### Step 2: Seed Test Manager Data

**File:** `ecomerce_backend/database/seed-approval-test-data.sql`

Run this in Supabase SQL Editor. This will:
1. Create 2 test manager users:
   - `manager1@fastshop.com`
   - `manager2@fastshop.com`
2. Assign managers to stores
3. Set 5 products to PENDING_APPROVAL status for testing

**Expected Output:**
```
Manager users created: 2
Store manager assignments: X
Products set to pending: 5
```

---

### Step 3: Set Manager Passwords in Supabase Auth

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find `manager1@fastshop.com`
3. Click on the user → **Reset Password**
4. Set password: `Manager123!` (or your choice)
5. Repeat for `manager2@fastshop.com`

---

### Step 4: Test the Backend API

#### 4.1 Login as Manager

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "manager1@fastshop.com",
  "password": "Manager123!"
}
```

Copy the `token` from response.

#### 4.2 Get Approval Queue

```bash
GET http://localhost:5000/api/manager/approvals/queue
Authorization: Bearer YOUR_MANAGER_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Product Name",
      "price": 99.99,
      "approval_status": "PENDING_APPROVAL",
      "submitted_at": "2024-01-15T10:30:00Z",
      "hours_pending": 2,
      "seller_name": "John Doe",
      "seller_email": "seller@example.com",
      "store_name": "John's Store"
    }
  ]
}
```

#### 4.3 Approve a Product

```bash
POST http://localhost:5000/api/manager/approvals/{productId}/approve
Authorization: Bearer YOUR_MANAGER_TOKEN
Content-Type: application/json

{
  "notes": "Product looks good, approved!"
}
```

#### 4.4 Reject a Product

```bash
POST http://localhost:5000/api/manager/approvals/{productId}/reject
Authorization: Bearer YOUR_MANAGER_TOKEN
Content-Type: application/json

{
  "reason": "Poor quality images",
  "notes": "Please update product images and resubmit"
}
```

#### 4.5 Request Changes

```bash
POST http://localhost:5000/api/manager/approvals/{productId}/request-changes
Authorization: Bearer YOUR_MANAGER_TOKEN
Content-Type: application/json

{
  "reason": "Missing product specifications"
}
```

#### 4.6 Get Approval History

```bash
GET http://localhost:5000/api/manager/approvals/{productId}/history
Authorization: Bearer YOUR_MANAGER_TOKEN
```

#### 4.7 Get Manager Stats

```bash
GET http://localhost:5000/api/manager/approvals/stats
Authorization: Bearer YOUR_MANAGER_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "pending_count": 5,
    "approved_today": 0,
    "rejected_today": 0,
    "managed_stores_count": 3
  }
}
```

---

### Step 5: Test Admin Endpoints

#### 5.1 Login as Admin

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@fastshop.com",
  "password": "your_admin_password"
}
```

#### 5.2 Get All Pending Products (Across All Stores)

```bash
GET http://localhost:5000/api/admin/approvals/all-pending
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 📊 Database Verification Queries

### Check All Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'stores', 
    'store_managers', 
    'product_approvals', 
    'approval_notifications'
  )
ORDER BY table_name;
```

### Check Products Have Approval Columns

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN (
    'store_id',
    'approval_status',
    'approved_by',
    'approved_at',
    'rejection_reason',
    'submitted_at'
  )
ORDER BY column_name;
```

### Check Pending Products

```sql
SELECT 
  p.id,
  p.title,
  p.approval_status,
  p.submitted_at,
  s.store_name,
  u.email as seller_email
FROM products p
LEFT JOIN stores s ON p.store_id = s.id
LEFT JOIN users u ON p.seller_id = u.id
WHERE p.approval_status = 'PENDING_APPROVAL'
ORDER BY p.submitted_at DESC;
```

### Check Manager Assignments

```sql
SELECT 
  u.email as manager_email,
  s.store_name,
  sm.can_approve_products,
  sm.can_reject_products,
  sm.status
FROM store_managers sm
JOIN users u ON sm.manager_id = u.id
JOIN stores s ON sm.store_id = s.id
ORDER BY u.email;
```

### Check Approval History

```sql
SELECT 
  pa.action,
  pa.previous_status,
  pa.new_status,
  pa.reason,
  pa.notes,
  pa.created_at,
  u.email as performed_by,
  p.title as product_title
FROM product_approvals pa
JOIN users u ON pa.performed_by = u.id
JOIN products p ON pa.product_id = p.id
ORDER BY pa.created_at DESC
LIMIT 20;
```

---

## 🎯 Complete Workflow Test

### Test Scenario: Seller Adds Product → Manager Approves

1. **Seller adds product** (via API or frontend)
   - Product created with `approval_status = 'PENDING_APPROVAL'`
   - Product NOT visible on storefront yet
   - Trigger logs action in `product_approvals` table

2. **Manager views approval queue**
   - GET `/api/manager/approvals/queue`
   - Sees pending product

3. **Manager approves product**
   - POST `/api/manager/approvals/{productId}/approve`
   - Product status changes to `APPROVED`
   - Product becomes visible on storefront
   - Approval logged in `product_approvals`
   - Notification sent to seller in `approval_notifications`

4. **Verify product is live**
   - Check products table: `approval_status = 'APPROVED'`
   - Product appears in customer search/browse

### Test Scenario: Manager Rejects Product

1. **Manager rejects product**
   - POST `/api/manager/approvals/{productId}/reject`
   - Product status changes to `REJECTED`
   - Product remains hidden from storefront
   - Rejection reason stored
   - Notification sent to seller

2. **Seller views rejection**
   - Seller can see rejection reason
   - Seller can edit and resubmit

---

## 🔧 Troubleshooting

### Issue: No products in approval queue

**Check:**
```sql
SELECT COUNT(*) FROM products WHERE approval_status = 'PENDING_APPROVAL';
```

**Fix:** Set some products to pending:
```sql
UPDATE products 
SET approval_status = 'PENDING_APPROVAL',
    submitted_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT id FROM products LIMIT 5
);
```

### Issue: Manager can't see any products

**Check manager assignments:**
```sql
SELECT * FROM store_managers WHERE manager_id = 'YOUR_MANAGER_UUID';
```

**Fix:** Assign manager to stores:
```sql
INSERT INTO store_managers (manager_id, store_id)
SELECT 
  'YOUR_MANAGER_UUID',
  id
FROM stores
LIMIT 3;
```

### Issue: Functions not working

**Check functions exist:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%approval%';
```

**Fix:** Re-run step-09-create-functions-triggers.sql

---

## 📝 API Endpoints Summary

### Manager Endpoints
- `GET /api/manager/approvals/queue` - Get pending products
- `GET /api/manager/approvals/stats` - Get approval statistics
- `POST /api/manager/approvals/:productId/approve` - Approve product
- `POST /api/manager/approvals/:productId/reject` - Reject product
- `POST /api/manager/approvals/:productId/request-changes` - Request changes
- `GET /api/manager/approvals/:productId/history` - Get approval history

### Admin Endpoints
- `GET /api/admin/approvals/all-pending` - Get all pending products (all stores)

### Seller Endpoints (Existing)
- `POST /api/products` - Create product (auto-sets PENDING_APPROVAL)
- `GET /api/seller/products` - View own products with approval status

---

## 🎨 Frontend Integration (Next Phase)

### Manager Pages to Update

**File:** `ecommerce_client/src/pages/manager/ManagerProductApprovalsPage.jsx`

Already exists but needs API integration:
- Fetch pending products from `/api/manager/approvals/queue`
- Display in table with approve/reject buttons
- Show approval history modal
- Real-time stats display

### Admin Pages to Update

**File:** `ecommerce_client/src/pages/admin/AdminProductApprovalsPage.jsx`

Already exists but needs API integration:
- Fetch all pending products from `/api/admin/approvals/all-pending`
- Bulk approval actions
- Filter by store/seller

### Seller Pages to Update

**File:** `ecommerce_client/src/pages/seller/SellerProductsPage.jsx`

Add approval status badges:
- 🟡 PENDING_APPROVAL (yellow badge)
- 🟢 APPROVED (green badge)
- 🔴 REJECTED (red badge)
- 🟠 CHANGES_REQUESTED (orange badge)

Show rejection reason if rejected.

---

## ✅ Success Criteria

Your approval workflow is complete when:

1. ✅ All database tables created (stores, store_managers, product_approvals, approval_notifications)
2. ✅ All functions and triggers working
3. ✅ Manager can login and see approval queue
4. ✅ Manager can approve/reject products
5. ✅ Approved products appear on storefront
6. ✅ Rejected products remain hidden
7. ✅ Approval history is logged
8. ✅ Notifications are created (in database)

---

## 📦 Files Reference

### Database Migration Files
- `step-01-create-stores-table.sql` ✅
- `step-02-create-stores-for-sellers.sql` ✅
- `step-03-add-store-id-column.sql` ✅
- `step-04-add-remaining-columns.sql` ✅
- `step-05-populate-store-id.sql` ✅
- `step-06-add-constraints.sql` ✅
- `step-07-create-indexes.sql` ✅
- `step-08-create-remaining-tables-FIXED.sql` ✅
- `step-09-create-functions-triggers.sql` ⏳ (NEXT)
- `seed-approval-test-data.sql` ⏳ (AFTER STEP 9)

### Backend Files (Complete)
- `services/approvalServices/approval.service.js` ✅
- `controllers/approvalControllers/approval.controller.js` ✅
- `routes/approvalRoutes/approval.routes.js` ✅
- `routes/index.js` ✅ (approval routes registered)
- `controllers/productControllers/product.controller.js` ✅ (sets PENDING_APPROVAL)

### Frontend Files (To Be Updated)
- `ecommerce_client/src/pages/manager/ManagerProductApprovalsPage.jsx` ⏳
- `ecommerce_client/src/pages/admin/AdminProductApprovalsPage.jsx` ⏳
- `ecommerce_client/src/pages/seller/SellerProductsPage.jsx` ⏳

---

## 🎉 Next Steps

1. Run `step-09-create-functions-triggers.sql`
2. Run `seed-approval-test-data.sql`
3. Set manager passwords in Supabase Auth
4. Test API endpoints with Postman/Thunder Client
5. Update frontend pages to connect to API
6. Test complete workflow end-to-end

The backend is 100% ready. Once you complete steps 1-4, the approval system will be fully functional via API!
