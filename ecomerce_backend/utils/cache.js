/**
 * Cache Utility
 * 
 * Provides caching functionality for frequently accessed data
 * to improve performance and reduce database load.
 */

const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const caches = {
  // Short-lived cache for frequently changing data (1 minute)
  short: new NodeCache({ stdTTL: 60, checkperiod: 120 }),
  
  // Medium-lived cache for moderately stable data (10 minutes)
  medium: new NodeCache({ stdTTL: 600, checkperiod: 120 }),
  
  // Long-lived cache for stable data (1 hour)
  long: new NodeCache({ stdTTL: 3600, checkperiod: 120 })
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @param {string} ttl - TTL category: 'short', 'medium', 'long'
 * @returns {any} Cached value or undefined
 */
function get(key, ttl = 'medium') {
  return caches[ttl].get(key);
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {string} ttl - TTL category: 'short', 'medium', 'long'
 * @returns {boolean} Success status
 */
function set(key, value, ttl = 'medium') {
  return caches[ttl].set(key, value);
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @param {string} ttl - TTL category: 'short', 'medium', 'long'
 * @returns {number} Number of deleted entries
 */
function del(key, ttl = 'medium') {
  return caches[ttl].del(key);
}

/**
 * Delete multiple keys from cache
 * @param {string[]} keys - Array of cache keys
 * @param {string} ttl - TTL category: 'short', 'medium', 'long'
 * @returns {number} Number of deleted entries
 */
function delMultiple(keys, ttl = 'medium') {
  return caches[ttl].del(keys);
}

/**
 * Clear all cache entries
 * @param {string} ttl - TTL category: 'short', 'medium', 'long', or 'all'
 */
function flush(ttl = 'all') {
  if (ttl === 'all') {
    Object.values(caches).forEach(cache => cache.flushAll());
  } else {
    caches[ttl].flushAll();
  }
}

/**
 * Get cache statistics
 * @param {string} ttl - TTL category: 'short', 'medium', 'long'
 * @returns {object} Cache statistics
 */
function getStats(ttl = 'medium') {
  return caches[ttl].getStats();
}

module.exports = {
  get,
  set,
  del,
  delMultiple,
  flush,
  getStats
};
