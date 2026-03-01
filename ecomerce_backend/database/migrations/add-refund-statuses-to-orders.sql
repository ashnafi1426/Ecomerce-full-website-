D:\Evangadi classmaterial\phase four\Amazonefullstack\ecomerce_backend> node test-refund-payment-integration.js
✅ Environment configuration validated

=== Testing Enhanced Refund and Payment Service Integration ===

Test 1: Verify payment service exports new functions
- processPartialRefund: function
- processCommissionReversal: function
✓ Payment service functions verified

Test 2: Create test order and payment
- Using customer: 35cf712c-73a7-4b3f-8227-9c81934d16fb
✅ Supabase connected successfully
📊 Database ready (24 users)
- Created test order: df38d72f-c63c-4df1-a6bf-9d0b7200f52a
- Created test payment: 98727f74-2887-42e0-9fa3-30f20cf19c41
- Created test sub-order: 35429643-0ee6-4e77-baf6-13d4ecf36590
✓ Test data created

Test 3: Create partial refund request
- Created refund request: 67879b5c-0185-4cf6-93ae-704c9c3a1559
- Refund type: partial
- Refund amount: 5000
✓ Refund request created

Test 4: Process partial refund with payment integration
Processing refund for order df38d72f-c63c-4df1-a6bf-9d0b7200f52a: $5000
Error updating order: {
  code: '23514',
  details: 'Failing row contains (df38d72f-c63c-4df1-a6bf-9d0b7200f52a, 35cf712c-73a7-4b3f-8227-9c81934d16fb, pi_test_1770582759763, 10000, "[{\\"product_id\\":\\"test\\",\\"quantity\\":1,\\"price\\":10000}]", null, partially_refunded, 2026-02-08 20:37:34.136845, 2026-02-08 20:37:34.136845, null, null, null, 0.00, null, null, pending, null, null, null, 0.00, null, f, none, 0.00, null).',
  hint: null,
  message: 'new row for relation "orders" violates check constraint "orders_status_check"'
}
Error processing partial refund: {
  code: '23514',
  details: 'Failing row contains (df38d72f-c63c-4df1-a6bf-9d0b7200f52a, 35cf712c-73a7-4b3f-8227-9c81934d16fb, pi_test_1770582759763, 10000, "[{\\"product_id\\":\\"test\\",\\"quantity\\":1,\\"price\\":10000}]", null, partially_refunded, 2026-02-08 20:37:34.136845, 2026-02-08 20:37:34.136845, null, null, null, 0.00, null, null, pending, null, null, null, 0.00, null, f, none, 0.00, null).',
  hint: null,
  message: 'new row for relation "orders" violates check constraint "orders_status_check"'
}
⚠ Partial refund processing failed (expected if payment integration not complete)
  Error: new row for relation "orders" violates check constraint "orders_status_check"
  This is OK - it means we need to update the processPaymentRefund function

Cleanup: Removing test data
✓ Test data cleaned up

=== Integration Test Complete ===

Summary:
- Payment service has new functions: ✓
- Refund service can create requests: ✓
- Integration needs manual update to processPaymentRefund function

Next step: Update enhancedRefund.service.js processPaymentRefund function
to call paymentService.processPartialRefund instead of just logging.

PS D:\Evangadi classmaterial\phase four\Amazonefullstack\ecomerce_backend> 