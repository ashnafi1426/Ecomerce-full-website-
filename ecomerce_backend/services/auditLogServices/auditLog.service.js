/**
 * AUDIT LOG SERVICE
 * 
 * Business logic layer for audit logging.
 * Tracks all sensitive operations for security and compliance.
 */

const supabase = require('../../config/supabase');

/**
 * Create audit log entry
 * @param {Object} logData - Log data
 * @returns {Promise<Object>} Created log object
 */
const log = async (logData) => {
  const { data, error} = await supabase
    .from('audit_log')
    .insert([{
      table_name: logData.tableName,
      action: logData.operation || logData.action, // Support both old and new naming
      action_type: logData.actionType || logData.operation?.toLowerCase(),
      entity_type: logData.entityType || logData.tableName,
      entity_id: logData.entityId || null,
      performed_by: logData.userId || logData.performedBy || null,
      user_role: logData.userRole || null,
      user_email: logData.userEmail || null,
      old_data: logData.oldData || null,
      new_data: logData.newData || null,
      changes: logData.changes || null,
      session_id: logData.sessionId || null,
      request_id: logData.requestId || null,
      severity: logData.severity || 'info'
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
};

/**
 * Find logs by table name
 * @param {String} tableName - Table name
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of log objects
 */
const findByTable = async (tableName, options = {}) => {
  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .order('performed_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Find logs by user ID
 * @param {String} userId - User UUID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of log objects
 */
const findByUserId = async (userId, options = {}) => {
  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('performed_by', userId)
    .order('performed_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Find logs by operation/action type
 * @param {String} operation - Operation type (INSERT, UPDATE, DELETE) or action
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of log objects
 */
const findByOperation = async (operation, options = {}) => {
  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('action', operation)
    .order('performed_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get recent audit logs
 * @param {Number} limit - Number of logs to retrieve
 * @returns {Promise<Array>} Array of recent log objects
 */
const getRecent = async (limit = 50) => {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('performed_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Find logs by date range
 * @param {String} startDate - Start date (ISO string)
 * @param {String} endDate - End date (ISO string)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of log objects
 */
const findByDateRange = async (startDate, endDate, options = {}) => {
  let query = supabase
    .from('audit_log')
    .select('*')
    .gte('performed_at', startDate)
    .lte('performed_at', endDate)
    .order('performed_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Get audit statistics
 * @returns {Promise<Object>} Audit statistics
 */
const getStatistics = async () => {
  const { data: logs, error } = await supabase
    .from('audit_log')
    .select('action, table_name');
  
  if (error) throw error;
  
  const stats = {
    total_logs: logs.length,
    by_action: {},
    by_table: {}
  };

  logs.forEach(log => {
    // Count by action
    if (!stats.by_action[log.action]) {
      stats.by_action[log.action] = 0;
    }
    stats.by_action[log.action]++;

    // Count by table
    if (!stats.by_table[log.table_name]) {
      stats.by_table[log.table_name] = 0;
    }
    stats.by_table[log.table_name]++;
  });
  
  return stats;
};

/**
 * Search logs
 * @param {Object} filters - Search filters
 * @returns {Promise<Array>} Array of matching log objects
 */
const search = async (filters) => {
  let query = supabase
    .from('audit_log')
    .select('*')
    .order('performed_at', { ascending: false });

  if (filters.tableName) {
    query = query.eq('table_name', filters.tableName);
  }

  if (filters.operation || filters.action) {
    query = query.eq('action', filters.operation || filters.action);
  }

  if (filters.userId || filters.performedBy) {
    query = query.eq('performed_by', filters.userId || filters.performedBy);
  }

  if (filters.startDate) {
    query = query.gte('performed_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('performed_at', filters.endDate);
  }

  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

/**
 * Delete old logs (cleanup)
 * @param {Number} daysToKeep - Number of days to keep logs
 * @returns {Promise<Number>} Number of deleted logs
 */
const cleanup = async (daysToKeep = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const { data, error } = await supabase
    .from('audit_log')
    .delete()
    .lt('performed_at', cutoffDate.toISOString())
    .select();
  
  if (error) throw error;
  
  return data ? data.length : 0;
};

module.exports = {
  log,
  findByTable,
  findByUserId,
  findByOperation,
  getRecent,
  findByDateRange,
  getStatistics,
  search,
  cleanup
};
