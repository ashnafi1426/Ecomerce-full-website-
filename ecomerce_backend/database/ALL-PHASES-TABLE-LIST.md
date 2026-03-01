# Complete Database Schema - All Phases (1-5)

**File**: `ALL-PHASES-COMPLETE-DATABASE.sql`  
**Date**: February 8, 2026  
**Total Tables**: 24

---

## 📊 All Tables by Phase

### Base Tables (Phase 0 - Original)
1. **users** - User accounts (customers, admins, sellers, managers)
2. **categories** - Product categories with hierarchy
3. **products** - Product catalog
4. **inventory** - Stock management
5. **orders** - Customer orders
6. **payments** - Payment transactions
7. **returns** - Return requests
8. **addresses** - User shipping addresses
9. **audit_log** - System audit trail

### Phase 1 Tables (Multi-Vendor Foundation)
10. **commission_rates** - Commission configuration
11. **seller_balances** - Seller financial balances
12. **seller_payouts** - Payout history
13. **payment_transactions** - Comprehensive transaction log
14. **sub_orders** - Multi-vendor order splitting
15. **disputes** - Customer-seller disputes
16. **reviews** - Product reviews
17. **cart** - Shopping cart

### Phase 5 Tables (Advanced Features)
18. **seller_documents** - Seller verification documents
19. **seller_earnings** - Detailed earnings tracking
20. **product_approvals** - Product approval workflow
21. **seller_performance** - Performance metrics
22. **manager_actions** - Manager activity log
23. **notifications** - In-app notifications
24. **payout_requests** - Seller payout requests

---

## 📋 Detailed Table Information

### 1. USERS
**Purpose**: Store all user accounts  
**Key Fields**:
- id, email, password_hash, role
- display_name, phone, address fields
- business_name, seller_tier (Phase 1)
- seller_verification_status (Phase 5)

**Roles**: customer, admin, seller, manager

---

### 2. CATEGORIES
**Purpose**: Product categorization with hierarchy  
**Key Fields**:
- id, name, description
- parent_id (self-referencing)

---

### 3. PRODUCTS
**Purpose**: Product catalog  
**Key Fields**:
- id, title, description, price, image_url
- category_id, seller_id
- approval_status, approved_by (Phase 1)
- sku, brand, shipping_cost (Phase 1)
- average_rating, total_reviews (Phase 1)

---

### 4. INVENTORY
**Purpose**: Stock level management  
**Key Fields**:
- id, product_id
- quantity, reserved_quantity
- low_stock_threshold

---

### 5. ORDERS
**Purpose**: Customer orders  
**Key Fields**:
- id, user_id, payment_intent_id
- amount, basket (JSONB), shipping_address (JSONB)
- status, fulfilled_at, fulfilled_by
- seller_id, commission_amount (Phase 1)
- order_items (JSONB for multi-vendor)

---

### 6. PAYMENTS
**Purpose**: Payment transaction records  
**Key Fields**:
- id, order_id, payment_intent_id
- amount, payment_method, status

---

### 7. RETURNS
**Purpose**: Return and refund management  
**Key Fields**:
- id, order_id, user_id
- reason, status, refund_amount
- return_type, seller_id (Phase 1)
- inspection_notes, restocking_fee (Phase 1)

---

### 8. ADDRESSES
**Purpose**: Multiple shipping addresses per user  
**Key Fields**:
- id, user_id
- address_line1, address_line2, city, state
- postal_code, country, is_default

---

### 9. AUDIT_LOG
**Purpose**: System-wide audit trail  
**Key Fields**:
- id, table_name, operation
- user_id, old_data (JSONB), new_data (JSONB)
- entity_type, severity (Phase 1)

---

### 10. COMMISSION_RATES
**Purpose**: Platform commission configuration  
**Key Fields**:
- id, rate_type (global/category/seller_tier/promotional)
- commission_percentage
- category_id, seller_tier
- valid_from, valid_until, is_active

---

### 11. SELLER_BALANCES
**Purpose**: Real-time seller balance tracking  
**Key Fields**:
- id, seller_id (unique)
- available_balance, pending_balance, escrow_balance
- lifetime_earnings, total_commission_paid
- last_payout_at, next_payout_date
- payout_hold, payout_hold_reason

---

### 12. SELLER_PAYOUTS
**Purpose**: Seller payout transaction history  
**Key Fields**:
- id, seller_id
- payout_amount, payout_method, payout_status
- transaction_id, gateway_response (JSONB)
- failure_reason, retry_count

---

### 13. PAYMENT_TRANSACTIONS
**Purpose**: Comprehensive financial transaction log  
**Key Fields**:
- id, transaction_type
- order_id, seller_id, customer_id, payout_id
- amount, commission_amount, net_amount
- payment_gateway, gateway_transaction_id
- status, metadata (JSONB)

---

### 14. SUB_ORDERS
**Purpose**: Split multi-vendor orders by seller  
**Key Fields**:
- id, parent_order_id, seller_id
- items (JSONB), subtotal, total_amount
- commission_amount, seller_payout_amount
- fulfillment_status, tracking_number
- payout_status, payout_released_at

---

### 15. DISPUTES
**Purpose**: Customer-seller dispute management  
**Key Fields**:
- id, order_id, customer_id, seller_id
- dispute_type, description, evidence (JSONB)
- status, resolution
- resolved_by, resolved_at

---

### 16. REVIEWS
**Purpose**: Product reviews and ratings  
**Key Fields**:
- id, product_id, user_id, order_id
- rating (1-5), title, comment
- verified_purchase, helpful_count
- status (pending/approved/rejected)

---

### 17. CART
**Purpose**: Shopping cart items  
**Key Fields**:
- id, user_id, product_id
- quantity
- Unique constraint: (user_id, product_id)

---

### 18. SELLER_DOCUMENTS
**Purpose**: Seller verification documents  
**Key Fields**:
- id, seller_id
- document_type (business_license/tax_id/etc)
- document_url, document_name
- status (pending/verified/rejected)
- verified_by, verified_at

---

### 19. SELLER_EARNINGS
**Purpose**: Detailed seller earnings tracking  
**Key Fields**:
- id, seller_id, order_id, sub_order_id
- gross_amount, commission_amount, net_amount
- payout_status, payout_date

---

### 20. PRODUCT_APPROVALS
**Purpose**: Product approval workflow history  
**Key Fields**:
- id, product_id, reviewer_id
- action (submitted/approved/rejected)
- comments

---

### 21. SELLER_PERFORMANCE
**Purpose**: Seller performance metrics  
**Key Fields**:
- id, seller_id (unique)
- total_sales, total_orders
- completed_orders, cancelled_orders
- average_rating, total_reviews
- fulfillment_rate, return_rate, dispute_rate

---

### 22. MANAGER_ACTIONS
**Purpose**: Manager activity audit log  
**Key Fields**:
- id, manager_id
- action_type, entity_type, entity_id
- details (JSONB)

---

### 23. NOTIFICATIONS
**Purpose**: In-app user notifications  
**Key Fields**:
- id, user_id
- type, title, message
- data (JSONB), is_read, read_at
- priority (low/normal/high/urgent)

---

### 24. PAYOUT_REQUESTS
**Purpose**: Seller payout requests  
**Key Fields**:
- id, seller_id
- amount, status
- payment_method, payment_details (JSONB)
- processed_by, rejection_reason

---

## 🔑 Key Relationships

### User Relationships
- users → products (seller_id)
- users → orders (user_id, seller_id)
- users → reviews (user_id)
- users → seller_balances (seller_id)
- users → seller_performance (seller_id)

### Order Relationships
- orders → sub_orders (parent_order_id)
- orders → payments (order_id)
- orders → returns (order_id)
- orders → disputes (order_id)
- orders → seller_earnings (order_id)

### Product Relationships
- products → inventory (product_id)
- products → reviews (product_id)
- products → cart (product_id)
- products → product_approvals (product_id)

### Financial Relationships
- seller_balances → seller_payouts (seller_id)
- seller_payouts → payment_transactions (payout_id)
- orders → payment_transactions (order_id)

---

## 📈 Statistics

### Total Counts
- **Tables**: 24
- **Indexes**: 60+
- **Triggers**: 10+
- **Functions**: 5+
- **RLS Policies**: 12+

### By Category
- **User Management**: 1 table
- **Product Management**: 3 tables
- **Order Management**: 3 tables
- **Financial Management**: 7 tables
- **Review & Rating**: 1 table
- **Verification & Approval**: 3 tables
- **Notifications & Audit**: 3 tables
- **Performance Tracking**: 3 tables

---

## 🚀 How to Use

### Run Complete Setup
```bash
# Via Supabase Dashboard
1. Open SQL Editor
2. Copy ALL-PHASES-COMPLETE-DATABASE.sql
3. Paste and Run

# Via psql
psql -U your_user -d your_db -f ALL-PHASES-COMPLETE-DATABASE.sql
```

### Verify Installation
```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## ✅ What's Included

- ✅ All 24 tables with complete schema
- ✅ All indexes for performance
- ✅ All foreign key relationships
- ✅ All check constraints
- ✅ All triggers for auto-updates
- ✅ All functions (update_updated_at, create_notification, etc)
- ✅ RLS policies for security
- ✅ Default seed data (admin user, categories, commission rates)
- ✅ Schema cache refresh command

---

## 📞 Quick Reference

**File Location**: `ecomerce_backend/database/ALL-PHASES-COMPLETE-DATABASE.sql`

**Size**: ~800 lines

**Execution Time**: ~10 seconds

**Safe to Re-run**: Yes (uses IF NOT EXISTS and ON CONFLICT)

---

**Created**: February 8, 2026  
**Status**: ✅ Complete and Ready to Use
