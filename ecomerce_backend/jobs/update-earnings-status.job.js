/**
 * SCHEDULED JOB: Update Seller Earnings Status
 * 
 * Runs daily to update earnings from 'pending' to 'available'
 * after the holding period (7 days) has passed.
 */

const supabase = require('../config/supabase');

const updateEarningsStatus = async () => {
  try {
    console.log('[Earnings Job] Starting earnings status update...');
    
    const now = new Date().toISOString();
    
    // Find all pending earnings where available_date has passed
    const { data: pendingEarnings, error: fetchError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('status', 'pending')
      .lte('available_date', now);

    if (fetchError) {
      console.error('[Earnings Job] Error fetching pending earnings:', fetchError);
      return;
    }

    if (!pendingEarnings || pendingEarnings.length === 0) {
      console.log('[Earnings Job] No earnings to update');
      return;
    }

    console.log(`[Earnings Job] Found ${pendingEarnings.length} earnings to update`);

    let updated = 0;
    let failed = 0;

    // Update each earning to 'available' status
    for (const earning of pendingEarnings) {
      const { error: updateError } = await supabase
        .from('seller_earnings')
        .update({ status: 'available' })
        .eq('id', earning.id);

      if (updateError) {
        console.error(`[Earnings Job] Error updating earning ${earning.id}:`, updateError);
        failed++;
      } else {
        console.log(`[Earnings Job] Updated earning ${earning.id} to available`);
        updated++;
      }
    }

    console.log('[Earnings Job] Earnings status update completed');
    console.log(`[Earnings Job] Updated: ${updated}, Failed: ${failed}`);
  } catch (error) {
    console.error('[Earnings Job] Error in updateEarningsStatus:', error);
  }
};

// Run immediately if called directly
if (require.main === module) {
  updateEarningsStatus()
    .then(() => {
      console.log('[Earnings Job] Job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Earnings Job] Job failed:', error);
      process.exit(1);
    });
}

module.exports = { updateEarningsStatus };
