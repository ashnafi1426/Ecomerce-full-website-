/**
 * SUPABASE DATABASE CONFIGURATION
 * 
 * Production-ready Supabase client configuration with connection testing
 * and error handling. This is the ONLY database connection method used.
 */

const { createClient } = require('@supabase/supabase-js');
const { envConfig } = require('./env.config');

// Validate Supabase configuration
if (!envConfig.supabase.url || !envConfig.supabase.serviceRoleKey) {
  console.error('❌ Missing required Supabase configuration:');
  console.error('   SUPABASE_URL:', envConfig.supabase.url ? '✅ Set' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', envConfig.supabase.serviceRoleKey ? '✅ Set' : '❌ Missing');
  
  if (envConfig.nodeEnv === 'production') {
    console.error('💡 Please set these variables in your production environment');
  } else {
    console.error('💡 Please check your .env file');
  }
  process.exit(1);
}

// Create Supabase client with service role key
// Service role key bypasses Row Level Security (RLS) - use carefully!
const supabase = createClient(
  envConfig.supabase.url,
  envConfig.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

/**
 * Test Supabase connection
 */
const testConnection = async () => {
  try {
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      console.error('💡 Make sure you have run the database setup SQL script');
      return false;
    } else {
      console.log('✅ Supabase connected successfully');
      console.log(`📊 Database ready (${count || 0} users)`);
      return true;
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// Test connection on initialization (only in development)
if (envConfig.nodeEnv === 'development') {
  testConnection();
}

/**
 * Get Supabase client instance
 */
const getSupabase = () => {
  return supabase;
};

/**
 * Execute a query with error handling
 */
const query = async (table, operation) => {
  try {
    const result = await operation(supabase.from(table));
    
    if (result.error) {
      console.error(`❌ Query error on table '${table}':`, result.error.message);
      throw result.error;
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Unexpected error querying table '${table}':`, error.message);
    throw error;
  }
};

module.exports = supabase;
module.exports.getSupabase = getSupabase;
module.exports.testConnection = testConnection;
module.exports.query = query;