/**
 * AUDIT LOG CONTROLLER
 * 
 * Handles HTTP requests for audit log operations (Admin only).
 */

const auditLogService = require('../../services/auditLogServices/auditLog.service');

/**
 * Get recent audit logs
 * GET /api/audit-logs/recent
 */
const getRecentLogs = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const logs = await auditLogService.getRecent(
      limit ? parseInt(limit) : 50
    );
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs by table name
 * GET /api/audit-logs/table/:tableName
 */
const getLogsByTable = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const logs = await auditLogService.findByTable(req.params.tableName, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs by user ID
 * GET /api/audit-logs/user/:userId
 */
const getLogsByUser = async (req, res, next) => {
  try {
    const { limit, offset } = req.query;
    const logs = await auditLogService.findByUserId(req.params.userId, {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs by operation type
 * GET /api/audit-logs/operation/:operation
 */
const getLogsByOperation = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const logs = await auditLogService.findByOperation(req.params.operation, {
      limit: limit ? parseInt(limit) : undefined
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get logs by date range
 * GET /api/audit-logs/date-range?startDate=2024-01-01&endDate=2024-12-31
 */
const getLogsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate, limit } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Start date and end date are required'
      });
    }

    const logs = await auditLogService.findByDateRange(startDate, endDate, {
      limit: limit ? parseInt(limit) : undefined
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Search audit logs
 * POST /api/audit-logs/search
 */
const searchLogs = async (req, res, next) => {
  try {
    const { tableName, operation, userId, startDate, endDate, limit } = req.body;

    const logs = await auditLogService.search({
      tableName,
      operation,
      userId,
      startDate,
      endDate,
      limit
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit statistics
 * GET /api/audit-logs/stats
 */
const getStatistics = async (req, res, next) => {
  try {
    const stats = await auditLogService.getStatistics();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Create audit log entry (Internal use)
 * POST /api/audit-logs
 */
const createLog = async (req, res, next) => {
  try {
    const { tableName, operation, userId, oldData, newData, ipAddress } = req.body;

    if (!tableName || !operation) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Table name and operation are required'
      });
    }

    const log = await auditLogService.log({
      tableName,
      operation,
      userId,
      oldData,
      newData,
      ipAddress
    });

    res.status(201).json({
      message: 'Audit log created successfully',
      log
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cleanup old logs
 * DELETE /api/audit-logs/cleanup?daysToKeep=90
 */
const cleanupLogs = async (req, res, next) => {
  try {
    const { daysToKeep } = req.query;
    const deletedCount = await auditLogService.cleanup(
      daysToKeep ? parseInt(daysToKeep) : 90
    );

    res.json({
      message: 'Audit logs cleaned up successfully',
      deletedCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecentLogs,
  getLogsByTable,
  getLogsByUser,
  getLogsByOperation,
  getLogsByDateRange,
  searchLogs,
  getStatistics,
  createLog,
  cleanupLogs
};

