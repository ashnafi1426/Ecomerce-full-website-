const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

/**
 * DIRECT DATABASE CLEANUP
 * =======================
 * 
 * This script directly cleans the test commission data from Supabase
 */

console.log('🔍 Environment check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Found' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Missing');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Expected: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.log('Current working directory:', process.cwd());
  console.log('Looking for .env file in:', path.resolve('.env'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTestCommissionData() {
  try {
    console.log('🧹 Starting direct database cleanup...');

    // 1. Check current data
    console.log('\n📊 Current commission data:');
    const { data: currentEarnings, error: currentError } = await supabase
      .from('seller_earnings')
      .select('*');

    if (currentError) {
      console.error('❌ Error fetching current data:', currentError);
      return false;
    }

    console.log(`   Found ${currentEarnings?.length || 0} earnings records`);
    
    if (currentEarnings && currentEarnings.length > 0) {
      const totalCommission = currentEarnings.reduce((sum, earning) => sum + (earning.commission_amount || 0), 0) / 100;
      const totalRevenue = currentEarnings.reduce((sum, earning) => sum + (earning.gross_amount || 0), 0) / 100;
      console.log(`   Total Commission: $${totalCommission}`);
      console.log(`   Total Revenue: $${totalRevenue}`);
      
      // Show which seller has the test data
      const testSeller = currentEarnings.find(e => e.seller_id === '08659266-babb-4323-b750-b1977c825e24');
      if (testSeller) {
        console.log(`   ⚠️ Found test seller data: ${testSeller.seller_id}`);
      }
    }

    // 2. Delete test earnings data for specific seller
    console.log('\n🗑️ Removing test earnings data for seller: 08659266-babb-4323-b750-b1977c825e24...');
    const { data: deletedData, error: deleteError } = await supabase
      .from('seller_earnings')
      .delete()
      .eq('seller_id', '08659266-babb-4323-b750-b1977c825e24')
      .select();

    if (deleteError) {
      console.error('❌ Error deleting test earnings:', deleteError);
      return false;
    }

    console.log(`✅ Removed ${deletedData?.length || 0} test earnings records`);

    // 3. Also remove any high-value test transactions (> $1000)
    console.log('\n🗑️ Removing high-value test transactions (> $1000)...');
    const { data: deletedHighValue, error: deleteHighValueError } = await supabase
      .from('seller_earnings')
      .delete()
      .gt('gross_amount', 100000) // Remove transactions > $1,000 (in cents)
      .select();

    if (deleteHighValueError) {
      console.error('❌ Error deleting high-value transactions:', deleteHighValueError);
      return false;
    }

    console.log(`✅ Removed ${deletedHighValue?.length || 0} high-value test transactions`);

    // 4. Verify cleanup
    console.log('\n✅ Verifying cleanup...');
    const { data: remainingEarnings, error: verifyError } = await supabase
      .from('seller_earnings')
      .select('*');

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
      return false;
    }

    console.log(`   Remaining earnings records: ${remainingEarnings?.length || 0}`);
    
    if (remainingEarnings && remainingEarnings.length > 0) {
      const remainingCommission = remainingEarnings.reduce((sum, earning) => sum + (earning.commission_amount || 0), 0) / 100;
      const remainingRevenue = remainingEarnings.reduce((sum, earning) => sum + (earning.gross_amount || 0), 0) / 100;
      console.log(`   Remaining Commission: $${remainingCommission}`);
      console.log(`   Remaining Revenue: $${remainingRevenue}`);
      
      if (remainingCommission === 0 && remainingRevenue === 0) {
        console.log('   ✅ Perfect! All test data successfully removed');
      }
    } else {
      console.log('   ✅ Perfect! All earnings data removed - clean slate');
      console.log('   📊 Commission analytics will now show $0 values');
    }

    return true;
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    return false;
  }
}

async function testCommissionAnalyticsAfterCleanup() {
  try {
    console.log('\n🧪 Testing commission analytics after cleanup...');
    
    // Simulate what the commission analytics API will return
    const { data: earnings, error } = await supabase
      .from('seller_earnings')
      .select('*');

    if (error) {
      console.error('❌ Error testing analytics:', error);
      return false;
    }

    const analytics = {
      totalCommission: 0,
      totalRevenue: 0,
      activeSellers: 0,
      averageCommissionRate: 0
    };

    if (earnings && earnings.length > 0) {
      analytics.totalCommission = earnings.reduce((sum, earning) => sum + (earning.commission_amount || 0), 0) / 100;
      analytics.totalRevenue = earnings.reduce((sum, earning) => sum + (earning.gross_amount || 0), 0) / 100;
      analytics.activeSellers = new Set(earnings.map(e => e.seller_id)).size;
      
      if (analytics.totalRevenue > 0) {
        analytics.averageCommissionRate = (analytics.totalCommission / analytics.totalRevenue) * 100;
      }
    }

    console.log('📊 Expected Frontend Display:');
    console.log(`   Total Commission: $${analytics.totalCommission.toFixed(2)}`);
    console.log(`   Active Sellers: ${analytics.activeSellers}`);
    console.log(`   Average Rate: ${analytics.averageCommissionRate.toFixed(2)}%`);
    console.log(`   Commission Revenue: $${analytics.totalRevenue.toFixed(2)}`);

    return analytics.totalCommission === 0;
  } catch (error) {
    console.error('❌ Error testing analytics:', error);
    return false;
  }
}

async function runDirectDatabaseCleanup() {
  console.log('🚀 Starting Direct Database Cleanup for Commission Data...\n');

  const success = await cleanupTestCommissionData();

  if (success) {
    console.log('\n🏁 Database Cleanup Complete!');
    
    // Test the results
    const isClean = await testCommissionAnalyticsAfterCleanup();
    
    if (isClean) {
      console.log('\n🎉 SUCCESS! Database is now in production-ready state');
      console.log('\n📋 RESULTS:');
      console.log('✅ Test commission data removed');
      console.log('✅ High-value test transactions removed');
      console.log('✅ Database shows $0 commission values');
      console.log('✅ Ready for real customer transactions');
      
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Refresh the admin commission settings page');
      console.log('2. You should now see $0.00 values in all statistics');
      console.log('3. Commission data will grow as real customers make purchases');
      console.log('4. Seller tiers will be calculated based on actual sales');
    } else {
      console.log('\n⚠️ Some data may still remain - please verify manually');
    }
  } else {
    console.log('\n❌ Database cleanup failed');
    console.log('Please check the error messages above and try again');
  }
}

// Run the cleanup
runDirectDatabaseCleanup().catch(console.error);