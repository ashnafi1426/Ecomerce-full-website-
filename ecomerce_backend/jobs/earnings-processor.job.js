/**
 * EARNINGS PROCESSOR JOB
 * ======================
 * 
 * Automatically processes seller earnings after 7-day holding period.
 * Runs daily at midnight to update earnings from 'pending' to 'available'.
 * 
 * WHAT IT DOES:
 * 1. Runs every day at midnight (00:00)
 * 2. Finds all earnings where available_date <= today
 * 3. Updates status from 'pending' to 'available'
 * 4. Logs all processed earnings
 * 5. Handles errors gracefully
 * 
 * EARNINGS LIFECYCLE:
 * - Day 0: Customer purchases → Earnings created with status='pending'
 * - Days 1-6: Holding period (protects against refunds/disputes)
 * - Day 7: This job runs → Status changes to 'available'
 * - Seller can now request payout
 */

const cron = require('node-cron');
const supabase = require('../config/supabase');

/**
 * Process Earnings Availability
 * Updates all pending earnings that have passed their holding period
 */
const processEarningsAvailability = async () => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    
    console.log('\n========================================');
    console.log(`[Earnings Processor] Starting at ${timestamp}`);
    console.log(`[Earnings Processor] Current date: ${currentDate}`);
    console.log('========================================\n');
    
    // Find all pending earnings that should be available
    const { data: pendingEarnings, error: fetchError } = await supabase
      .from('seller_earnings')
      .select('id, seller_id, net_amount, available_date, created_at')
      .eq('status', 'pending')
      .lte('available_date', currentDate);
    
    if (fetchError) {
      console.error('[Earnings Processor] ❌ Error fetching pending earnings:', fetchError);
      return {
        success: false,
        error: fetchError.message
      };
    }
    
    const count = pendingEarnings?.length || 0;
    
    if (count === 0) {
      console.log('[Earnings Processor] ℹ️  No earnings to process today');
      console.log('[Earnings Processor] All earnings are either already available or still in holding period\n');
      return {
        success: true,
        count: 0,
        message: 'No earnings to process'
      };
    }
    
    console.log(`[Earnings Processor] 📊 Found ${count} earnings ready to process:`);
    
    // Log details of each earning
    pendingEarnings.forEach((earning, index) => {
      const amount = (earning.net_amount / 100).toFixed(2);
      console.log(`  ${index + 1}. Earning ID: ${earning.id}`);
      console.log(`     Seller: ${earning.seller_id}`);
      console.log(`     Amount: $${amount}`);
      console.log(`     Available Date: ${earning.available_date}`);
      console.log(`     Created: ${earning.created_at}`);
    });
    
    console.log('\n[Earnings Processor] 🔄 Updating earnings status to "available"...\n');
    
    // Update earnings status to 'available'
    const { data: updatedEarnings, error: updateError } = await supabase
      .from('seller_earnings')
      .update({ 
        status: 'available',
        updated_at: timestamp
      })
      .eq('status', 'pending')
      .lte('available_date', currentDate)
      .select();
    
    if (updateError) {
      console.error('[Earnings Processor] ❌ Error updating earnings:', updateError);
      return {
        success: false,
        error: updateError.message
      };
    }
    
    const updatedCount = updatedEarnings?.length || 0;
    
    console.log(`[Earnings Processor] ✅ Successfully processed ${updatedCount} earnings`);
    
    // Calculate total amount made available
    const totalAmount = updatedEarnings.reduce((sum, earning) => sum + earning.net_amount, 0);
    const totalAmountDollars = (totalAmount / 100).toFixed(2);
    
    console.log(`[Earnings Processor] 💰 Total amount made available: $${totalAmountDollars}`);
    console.log('[Earnings Processor] 📧 Sellers will be notified (when email system is implemented)');
    console.log('\n========================================');
    console.log('[Earnings Processor] Job completed successfully');
    console.log('========================================\n');
    
    // TODO: Send email notifications to sellers
    // await notifySellersOfAvailableEarnings(updatedEarnings);
    
    return {
      success: true,
      count: updatedCount,
      total_amount: totalAmountDollars,
      earnings: updatedEarnings
    };
    
  } catch (error) {
    console.error('\n========================================');
    console.error('[Earnings Processor] ❌ FATAL ERROR:', error.message);
    console.error('[Earnings Processor] Stack:', error.stack);
    console.error('========================================\n');
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Schedule the earnings processor job
 * Runs every day at midnight (00:00)
 * 
 * Cron schedule: '0 0 * * *'
 * - Minute: 0
 * - Hour: 0 (midnight)
 * - Day of month: * (every day)
 * - Month: * (every month)
 * - Day of week: * (every day of week)
 */
const scheduleEarningsProcessor = () => {
  console.log('\n========================================');
  console.log('[Earnings Processor] Initializing cron job');
  console.log('[Earnings Processor] Schedule: Daily at midnight (00:00)');
  console.log('[Earnings Processor] Cron expression: 0 0 * * *');
  console.log('========================================\n');
  
  // Schedule the job
  const job = cron.schedule('0 0 * * *', async () => {
    console.log('[Earnings Processor] 🕐 Cron job triggered');
    await processEarningsAvailability();
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'America/New_York' // Default to EST
  });
  
  console.log('[Earnings Processor] ✅ Cron job scheduled successfully');
  console.log(`[Earnings Processor] Timezone: ${process.env.TIMEZONE || 'America/New_York'}`);
  console.log('[Earnings Processor] Next run: Tomorrow at midnight\n');
  
  return job;
};

/**
 * Manual trigger for testing
 * Can be called directly to test the processor without waiting for cron
 */
const triggerManually = async () => {
  console.log('[Earnings Processor] 🔧 Manual trigger activated');
  return await processEarningsAvailability();
};

module.exports = {
  scheduleEarningsProcessor,
  processEarningsAvailability,
  triggerManually
};
