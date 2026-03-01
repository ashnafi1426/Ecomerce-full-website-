/**
 * Integration Test: Discount Workflow
 * 
 * Tests the complete discount and coupon system:
 * 1. Create coupon
 * 2. Validate coupon
 * 3. Apply coupon to order
 * 4. Create promotion
 * 5. Calculate promotional pricing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let testData = {
  managerId: null,
  customerId: null,
  productId: null,
  couponId: null,
  promotionId: null,
  orderId: null
};

async function setup() {
  console.log('🔧 Setting up test data...\n');
  
  // Get a manager
  const { data: manager } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'manager')
    .limit(1)
    .single();
  
  testData.managerId = manager?.id;
  
  // Get a customer
  const { data: customer } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'customer')
    .limit(1)
    .single();
  
  testData.customerId = customer?.id;
  
  // Get a product
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .limit(1)
    .single();
  
  testData.productId = product?.id;
  
  console.log('✅ Test data ready\n');
}

async function testCreateCoupon() {
  console.log('📝 Test 1: Create Coupon');
  
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: `TEST${Date.now()}`,
        discount_type: 'percentage',
        discount_value: 15.00,
        min_purchase_amount: 50.00,
        max_uses: 100,
        uses_count: 0,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: testData.managerId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    testData.couponId = data.id;
    console.log('✅ PASS: Coupon created successfully');
    console.log(`   Coupon ID: ${data.id}`);
    console.log(`   Code: ${data.code}`);
    console.log(`   Discount: ${data.discount_value}%`);
    console.log(`   Min purchase: $${data.min_purchase_amount}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Coupon creation failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testValidateCoupon() {
  console.log('📝 Test 2: Validate Coupon');
  
  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', testData.couponId)
      .single();
    
    if (error) throw error;
    
    // Check if coupon is valid
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);
    
    const isValid = 
      coupon.is_active &&
      now >= validFrom &&
      now <= validUntil &&
      coupon.uses_count < coupon.max_uses;
    
    if (!isValid) throw new Error('Coupon validation failed');
    
    console.log('✅ PASS: Coupon validated successfully');
    console.log(`   Code: ${coupon.code}`);
    console.log(`   Status: Active`);
    console.log(`   Uses: ${coupon.uses_count}/${coupon.max_uses}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Coupon validation failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testApplyCoupon() {
  console.log('📝 Test 3: Apply Coupon to Order');
  
  try {
    // Create order with coupon
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: testData.customerId,
        total_amount: 100.00,
        discount_amount: 15.00,
        final_amount: 85.00,
        coupon_id: testData.couponId,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    testData.orderId = order.id;
    
    // Record coupon usage
    const { error: usageError } = await supabase
      .from('coupon_usage')
      .insert({
        coupon_id: testData.couponId,
        user_id: testData.customerId,
        order_id: order.id,
        discount_amount: 15.00
      });
    
    if (usageError) throw usageError;
    
    // Update coupon uses count
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ uses_count: 1 })
      .eq('id', testData.couponId);
    
    if (updateError) throw updateError;
    
    console.log('✅ PASS: Coupon applied to order');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Original amount: $${order.total_amount}`);
    console.log(`   Discount: $${order.discount_amount}`);
    console.log(`   Final amount: $${order.final_amount}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Coupon application failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testCreatePromotion() {
  console.log('📝 Test 4: Create Promotion');
  
  try {
    const { data, error } = await supabase
      .from('promotions')
      .insert({
        product_id: testData.productId,
        discount_percentage: 20.00,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: testData.managerId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    testData.promotionId = data.id;
    console.log('✅ PASS: Promotion created successfully');
    console.log(`   Promotion ID: ${data.id}`);
    console.log(`   Product ID: ${data.product_id}`);
    console.log(`   Discount: ${data.discount_percentage}%\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Promotion creation failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testPromotionalPricing() {
  console.log('📝 Test 5: Calculate Promotional Pricing');
  
  try {
    // Get product with promotion
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('id', testData.productId)
      .single();
    
    if (productError) throw productError;
    
    // Get active promotion
    const { data: promotion, error: promoError } = await supabase
      .from('promotions')
      .select('*')
      .eq('product_id', testData.productId)
      .eq('is_active', true)
      .single();
    
    if (promoError) throw promoError;
    
    // Calculate promotional price
    const originalPrice = parseFloat(product.price);
    const discountPercentage = parseFloat(promotion.discount_percentage);
    const promotionalPrice = originalPrice * (1 - discountPercentage / 100);
    
    console.log('✅ PASS: Promotional pricing calculated');
    console.log(`   Product: ${product.name}`);
    console.log(`   Original price: $${originalPrice.toFixed(2)}`);
    console.log(`   Discount: ${discountPercentage}%`);
    console.log(`   Promotional price: $${promotionalPrice.toFixed(2)}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Promotional pricing calculation failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    if (testData.orderId) {
      await supabase.from('coupon_usage').delete().eq('order_id', testData.orderId);
      await supabase.from('orders').delete().eq('id', testData.orderId);
    }
    if (testData.couponId) {
      await supabase.from('coupons').delete().eq('id', testData.couponId);
    }
    if (testData.promotionId) {
      await supabase.from('promotions').delete().eq('id', testData.promotionId);
    }
    
    console.log('✅ Cleanup complete\n');
  } catch (err) {
    console.log('⚠️  Cleanup warning:', err.message, '\n');
  }
}

async function runTests() {
  console.log('🚀 Starting Discount Workflow Integration Tests\n');
  console.log('='.repeat(60) + '\n');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  await setup();
  
  if (await testCreateCoupon()) results.passed++; else results.failed++;
  if (await testValidateCoupon()) results.passed++; else results.failed++;
  if (await testApplyCoupon()) results.passed++; else results.failed++;
  if (await testCreatePromotion()) results.passed++; else results.failed++;
  if (await testPromotionalPricing()) results.passed++; else results.failed++;
  
  await cleanup();
  
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
