/**
 * Integration Test: Product Variant Workflow
 * 
 * Tests the complete lifecycle of product variants:
 * 1. Create variant with attributes
 * 2. Update variant details
 * 3. Manage inventory
 * 4. Add to cart
 * 5. Create order
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let testData = {
  sellerId: null,
  productId: null,
  variantId: null,
  customerId: null,
  cartItemId: null,
  orderId: null
};

async function setup() {
  console.log('🔧 Setting up test data...\n');
  
  // Get a seller
  const { data: seller } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'seller')
    .limit(1)
    .single();
  
  testData.sellerId = seller?.id;
  
  // Get a product
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('seller_id', testData.sellerId)
    .limit(1)
    .single();
  
  testData.productId = product?.id;
  
  // Get a customer
  const { data: customer } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'customer')
    .limit(1)
    .single();
  
  testData.customerId = customer?.id;
  
  console.log('✅ Test data ready\n');
}

async function testCreateVariant() {
  console.log('📝 Test 1: Create Product Variant');
  
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: testData.productId,
        sku: `TEST-VAR-${Date.now()}`,
        attributes: {
          size: 'Large',
          color: 'Blue'
        },
        price_adjustment: 5.00,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    
    testData.variantId = data.id;
    console.log('✅ PASS: Variant created successfully');
    console.log(`   Variant ID: ${data.id}`);
    console.log(`   SKU: ${data.sku}`);
    console.log(`   Attributes: ${JSON.stringify(data.attributes)}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Variant creation failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testUpdateVariant() {
  console.log('📝 Test 2: Update Variant Details');
  
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({
        price_adjustment: 7.50,
        attributes: {
          size: 'Large',
          color: 'Blue',
          material: 'Cotton'
        }
      })
      .eq('id', testData.variantId)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ PASS: Variant updated successfully');
    console.log(`   New price adjustment: $${data.price_adjustment}`);
    console.log(`   Updated attributes: ${JSON.stringify(data.attributes)}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Variant update failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testManageInventory() {
  console.log('📝 Test 3: Manage Variant Inventory');
  
  try {
    // Create inventory record
    const { data, error } = await supabase
      .from('variant_inventory')
      .insert({
        variant_id: testData.variantId,
        quantity: 100,
        reserved_quantity: 0,
        low_stock_threshold: 10
      })
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ PASS: Inventory created successfully');
    console.log(`   Quantity: ${data.quantity}`);
    console.log(`   Low stock threshold: ${data.low_stock_threshold}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Inventory management failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testAddToCart() {
  console.log('📝 Test 4: Add Variant to Cart');
  
  try {
    const { data, error } = await supabase
      .from('cart')
      .insert({
        user_id: testData.customerId,
        product_id: testData.productId,
        variant_id: testData.variantId,
        quantity: 2
      })
      .select()
      .single();
    
    if (error) throw error;
    
    testData.cartItemId = data.id;
    console.log('✅ PASS: Variant added to cart');
    console.log(`   Cart item ID: ${data.id}`);
    console.log(`   Quantity: ${data.quantity}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Add to cart failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function testCreateOrder() {
  console.log('📝 Test 5: Create Order with Variant');
  
  try {
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: testData.customerId,
        total_amount: 50.00,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    testData.orderId = order.id;
    
    // Create order item with variant
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: testData.productId,
        variant_id: testData.variantId,
        quantity: 2,
        price: 25.00
      })
      .select()
      .single();
    
    if (itemError) throw itemError;
    
    console.log('✅ PASS: Order created with variant');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Order item ID: ${orderItem.id}`);
    console.log(`   Variant ID: ${orderItem.variant_id}\n`);
    return true;
  } catch (err) {
    console.log('❌ FAIL: Order creation failed');
    console.log(`   Error: ${err.message}\n`);
    return false;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...\n');
  
  try {
    // Delete in reverse order of creation
    if (testData.orderId) {
      await supabase.from('order_items').delete().eq('order_id', testData.orderId);
      await supabase.from('orders').delete().eq('id', testData.orderId);
    }
    if (testData.cartItemId) {
      await supabase.from('cart').delete().eq('id', testData.cartItemId);
    }
    if (testData.variantId) {
      await supabase.from('variant_inventory').delete().eq('variant_id', testData.variantId);
      await supabase.from('product_variants').delete().eq('id', testData.variantId);
    }
    
    console.log('✅ Cleanup complete\n');
  } catch (err) {
    console.log('⚠️  Cleanup warning:', err.message, '\n');
  }
}

async function runTests() {
  console.log('🚀 Starting Variant Workflow Integration Tests\n');
  console.log('='.repeat(60) + '\n');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  await setup();
  
  if (await testCreateVariant()) results.passed++; else results.failed++;
  if (await testUpdateVariant()) results.passed++; else results.failed++;
  if (await testManageInventory()) results.passed++; else results.failed++;
  if (await testAddToCart()) results.passed++; else results.failed++;
  if (await testCreateOrder()) results.passed++; else results.failed++;
  
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
