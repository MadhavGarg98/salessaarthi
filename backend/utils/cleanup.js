/**
 * Cleanup Utilities
 * Periodic cleanup tasks for maintaining system health
 */

const stateService = require('../services/stateService');
const productService = require('../services/productService');

/**
 * Run periodic cleanup tasks
 * Should be called periodically (e.g., every hour)
 */
function runPeriodicCleanup() {
  console.log('Running periodic cleanup...');
  
  // Clean up inactive user states
  stateService.cleanupOldStates();
  
  // Clear product cache periodically
  if (productService && productService.clearCache) {
    productService.clearCache();
  }
  
  console.log('Cleanup completed');
}

/**
 * Schedule cleanup to run every hour
 */
function scheduleCleanup() {
  // Run immediately
  runPeriodicCleanup();
  
  // Then run every hour
  setInterval(runPeriodicCleanup, 60 * 60 * 1000);
}

module.exports = {
  runPeriodicCleanup,
  scheduleCleanup
};
