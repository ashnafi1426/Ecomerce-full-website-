/**
 * Create Pending Product via Database
 * Inserts a product directly with pending status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createPendingProduct() {
  console.log('🧪 Creating Pending Product via Database\n');
  console.log('='.repeat(70));

  try {
    // Step 1: Get a seller user
    console.log('\n📝 Step 1: Finding Seller User');
    console.log('-'.repeat(70));
    
    const { data: sellers, error: sellerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'seller')
      .limit(1);
    
    if (sellerError) throw sellerError;
    
    if (!sellers || sellers.length === 0) {
      console.log('❌ No seller found. Creating one...');
      
      // Create a test seller
      const { data: newSeller, error: createError } = await supabase
        .from('users')
        .insert([{
          email: 'testseller@fastshop.com',
          password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // dummy hash
          role: 'seller',
          status: 'active',
          first_name: 'Test',
          last_name: 'Seller'
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      
      console.log('✅ Created test seller:', newSeller.email);
      sellers[0] = newSeller;
    }
    
    const seller = sellers[0];
    console.log('✅ Using seller:', seller.email);
    console.log('   Seller ID:', seller.id);

    // Step 2: Get seller's store
    console.log('\n📝 Step 2: Finding Seller Store');
    console.log('-'.repeat(70));
    
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('seller_id', seller.id)
      .limit(1);
    
    let storeId = stores?.[0]?.id;
    
    if (!storeId) {
      console.log('⚠️  No store found, creating one...');
      
      const { data: newStore, error: createStoreError } = await supabase
        .from('stores')
        .insert([{
          seller_id: seller.id,
          store_name: 'Test Store',
          store_description: 'Test store for product approvals',
          status: 'active'
        }])
        .select()
        .single();
      
      if (createStoreError) throw createStoreError;
      
      storeId = newStore.id;
      console.log('✅ Created store:', storeId);
    } else {
      console.log('✅ Using store:', storeId);
    }

    // Step 3: Create pending product
    console.log('\n📝 Step 3: Creating Pending Product');
    console.log('-'.repeat(70));
    
    const productData = {
      title: `Test Product ${Date.now()}`,
      description: 'This is a test product for approval testing - created via script',
      price: 149.99,
      image_url: 'https://via.placeholder.com/400x400/FF9900/ffffff?text=Pending+Product',
      seller_id: seller.id,
      store_id: storeId,
      status: 'active',
      approval_status: 'pending',
      created_by: seller.id,
      submitted_for_approval_at: new Date().toISOString()
    };
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .single();
    
    if (productError) throw productError;
    
    console.log('✅ Product created successfully');
    console.log('   Product ID:', product.id);
    console.log('   Title:', product.title);
    console.log('   Price: $' + product.price);
    console.log('   Status:', product.approval_status);

    // Step 4: Verify in pending list
    console.log('\n📝 Step 4: Verifying Product in Pending List');
    console.log('-'.repeat(70));
    
    const { data: pendingProducts, error: pendingError } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!seller_id(id, email)
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });
    
    if (pendingError) throw pendingError;
    
    console.log('✅ Total pending products:', pendingProducts.length);
    
    if (pendingProducts.length > 0) {
      console.log('\n   📦 Pending Products:');
      pendingProducts.slice(0, 5).forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.title}`);
        console.log(`      - Price: $${p.price}`);
        console.log(`      - Seller: ${p.seller?.email || 'Unknown'}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS - Product Created!');
    console.log('='.repeat(70));
    console.log('\n🎉 Now refresh the Admin Product Approvals page in your browser!');
    console.log('   URL: http://localhost:5173/admin/products/approvals');
    console.log('\n📝 You should see the new pending product in the list.');

  } catch (error) {
    console.error('\n❌ FAILED');
    console.error('='.repeat(70));
    console.error('Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

createPendingProduct();
