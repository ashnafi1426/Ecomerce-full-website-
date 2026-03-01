-- =====================================================
-- SEED TEST DATA FOR APPROVAL WORKFLOW
-- Run this AFTER FRESH-APPROVAL-WORKFLOW.sql succeeds
-- =====================================================

-- =====================================================
-- PART 1: CREATE TEST MANAGER USERS
-- =====================================================
DO $$
DECLARE
  v_manager1_id UUID;
  v_manager2_id UUID;
  v_manager1_email VARCHAR := 'manager1@fastshop.com';
  v_manager2_email VARCHAR := 'manager2@fastshop.com';
BEGIN
  -- Check if manager1 exists
  SELECT id INTO v_manager1_id
  FROM users
  WHERE email = v_manager1_email;
  
  -- Create manager1 if doesn't exist
  IF v_manager1_id IS NULL THEN
    INSERT INTO users (email, role, created_at)
    VALUES (v_manager1_email, 'manager', CURRENT_TIMESTAMP)
    RETURNING id INTO v_manager1_id;
    RAISE NOTICE 'Created manager1: %', v_manager1_email;
  ELSE
    -- Update existing user to manager role
    UPDATE users SET role = 'manager' WHERE id = v_manager1_id;
    RAISE NOTICE 'Updated existing user to manager: %', v_manager1_email;
  END IF;
  
  -- Check if manager2 exists
  SELECT id INTO v_manager2_id
  FROM users
  WHERE email = v_manager2_email;
  
  -- Create manager2 if doesn't exist
  IF v_manager2_id IS NULL THEN
    INSERT INTO users (email, role, created_at)
    VALUES (v_manager2_email, 'manager', CURRENT_TIMESTAMP)
    RETURNING id INTO v_manager2_id;
    RAISE NOTICE 'Created manager2: %', v_manager2_email;
  ELSE
    -- Update existing user to manager role
    UPDATE users SET role = 'manager' WHERE id = v_manager2_id;
    RAISE NOTICE 'Updated existing user to manager: %', v_manager2_email;
  END IF;
END $$;

-- =====================================================
-- PART 2: ASSIGN MANAGERS TO STORES
-- =====================================================
DO $$
DECLARE
  v_manager1_id UUID;
  v_manager2_id UUID;
  v_store RECORD;
  v_store_count INTEGER := 0;
BEGIN
  -- Get manager IDs
  SELECT id INTO v_manager1_id FROM users WHERE email = 'manager1@fastshop.com';
  SELECT id INTO v_manager2_id FROM users WHERE email = 'manager2@fastshop.com';
  
  -- Assign manager1 to all stores (or first half)
  FOR v_store IN 
    SELECT id, store_name 
    FROM stores 
    ORDER BY created_at
    LIMIT (SELECT CEIL(COUNT(*)::DECIMAL / 2) FROM stores)
  LOOP
    INSERT INTO store_managers (
      manager_id,
      store_id,
      can_approve_products,
      can_reject_products,
      can_edit_products,
      status
    ) VALUES (
      v_manager1_id,
      v_store.id,
      true,
      true,
      false,
      'active'
    )
    ON CONFLICT (manager_id, store_id) DO NOTHING;
    
    v_store_count := v_store_count + 1;
    RAISE NOTICE 'Assigned manager1 to store: %', v_store.store_name;
  END LOOP;
  
  RAISE NOTICE 'Manager1 assigned to % stores', v_store_count;
  
  -- Assign manager2 to remaining stores
  v_store_count := 0;
  FOR v_store IN 
    SELECT id, store_name 
    FROM stores 
    ORDER BY created_at
    OFFSET (SELECT CEIL(COUNT(*)::DECIMAL / 2) FROM stores)
  LOOP
    INSERT INTO store_managers (
      manager_id,
      store_id,
      can_approve_products,
      can_reject_products,
      can_edit_products,
      status
    ) VALUES (
      v_manager2_id,
      v_store.id,
      true,
      true,
      false,
      'active'
    )
    ON CONFLICT (manager_id, store_id) DO NOTHING;
    
    v_store_count := v_store_count + 1;
    RAISE NOTICE 'Assigned manager2 to store: %', v_store.store_name;
  END LOOP;
  
  RAISE NOTICE 'Manager2 assigned to % stores', v_store_count;
END $$;

-- =====================================================
-- PART 3: SET EXISTING PRODUCTS TO PENDING APPROVAL
-- (Optional - only if you want to test with existing products)
-- =====================================================
DO $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update first 5 products to PENDING_APPROVAL for testing
  UPDATE products
  SET approval_status = 'PENDING_APPROVAL',
      submitted_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT id FROM products 
    WHERE approval_status IS NULL OR approval_status = 'APPROVED'
    LIMIT 5
  );
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RAISE NOTICE 'Set % existing products to PENDING_APPROVAL for testing', v_updated_count;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show created managers
SELECT 
  id,
  email,
  role,
  created_at
FROM users
WHERE role = 'manager'
ORDER BY email;

-- Show manager assignments
SELECT 
  sm.id,
  u.email as manager_email,
  s.store_name,
  sm.can_approve_products,
  sm.can_reject_products,
  sm.status
FROM store_managers sm
JOIN users u ON sm.manager_id = u.id
JOIN stores s ON sm.store_id = s.id
ORDER BY u.email, s.store_name;

-- Show pending products count
SELECT 
  COUNT(*) as pending_products_count
FROM products
WHERE approval_status = 'PENDING_APPROVAL';

-- Show products by approval status
SELECT 
  approval_status,
  COUNT(*) as count
FROM products
GROUP BY approval_status
ORDER BY approval_status;

-- =====================================================
-- TEST CREDENTIALS
-- =====================================================
SELECT '
========================================
TEST MANAGER CREDENTIALS
========================================

Manager 1:
  Email: manager1@fastshop.com
  Password: Manager123!@#
  
Manager 2:
  Email: manager2@fastshop.com
  Password: Manager456!@#

NEXT STEPS:
1. Go to Supabase Auth → Users
2. Find these manager emails
3. Click "Send Magic Link" or "Reset Password"
4. Set passwords to: Manager123!@# and Manager456!@#
5. Login to your app with these credentials
6. Navigate to Manager Dashboard → Product Approvals

========================================
' AS instructions;
