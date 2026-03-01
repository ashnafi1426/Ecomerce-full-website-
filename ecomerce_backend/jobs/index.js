/**
 * JOBS SCHEDULER - CENTRAL INITIALIZATION
 * ========================================
 * 
 * This file initializes all background jobs and cron schedulers.
 * Import this in app.js to start all automated tasks.
 * 
 * CURRENT JOBS:
 * 1. Earnings Processor - Runs daily at midnight
 *    - Processes pending earnings after 7-day holding period
 *    - Updates status from 'pending' to 'available'
 * 
 * FUTURE JOBS (to be added):
 * 2. Order Status Updater - Check for stuck orders
 * 3. Inventory Sync - Sync with external systems
 * 4. Report Generator - Generate daily/weekly reports
 * 5. Email Queue Processor - Process pending emails
 */

const { scheduleEarningsProcessor } = require('./earnings-processor.job');

/**
 * Initialize all scheduled jobs
 * Call this function once when the server starts
 */
const initializeJobs = () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   INITIALIZING BACKGROUND JOBS         ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  try {
    // Initialize earnings processor
    console.log('[Jobs] 1. Starting Earnings Processor...');
    const earningsJob = scheduleEarningsProcessor();
    console.log('[Jobs] ✅ Earnings Processor initialized\n');
    
    // Add more jobs here as they are created
    // Example:
    // console.log('[Jobs] 2. Starting Order Status Updater...');
    // const orderJob = scheduleOrderStatusUpdater();
    // console.log('[Jobs] ✅ Order Status Updater initialized\n');
    
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ALL JOBS INITIALIZED SUCCESSFULLY    ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    return {
      earningsJob
      // Add more jobs here
    };
    
  } catch (error) {
    console.error('\n╔════════════════════════════════════════╗');
    console.error('║   ERROR INITIALIZING JOBS              ║');
    console.error('╚════════════════════════════════════════╝\n');
    console.error('[Jobs] ❌ Error:', error.message);
    console.error('[Jobs] Stack:', error.stack);
    
    // Don't crash the server if jobs fail to initialize
    // Just log the error and continue
    return null;
  }
};

/**
 * Stop all scheduled jobs
 * Call this when shutting down the server gracefully
 */
const stopAllJobs = (jobs) => {
  console.log('\n[Jobs] Stopping all scheduled jobs...');
  
  if (jobs && jobs.earningsJob) {
    jobs.earningsJob.stop();
    console.log('[Jobs] ✅ Earnings Processor stopped');
  }
  
  // Stop other jobs here
  
  console.log('[Jobs] All jobs stopped\n');
};

module.exports = {
  initializeJobs,
  stopAllJobs
};
