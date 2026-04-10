/**
 * Complete State Management Service for WhatsApp AI Sales Assistant
 * Handles comprehensive user state with proper flow management
 */

// In-memory state management for each user
const userStates = new Map();

// State flows as specified
const FLOWS = {
  MENU: 'MENU',
  BROWSING: 'BROWSING', 
  ORDER: 'ORDER',
  PAYMENT: 'PAYMENT',
  SUPPORT: 'SUPPORT'
};

// Steps within each flow
const STEPS = {
  // Menu flow
  MENU_MAIN: 'MENU_MAIN',
  
  // Browsing flow
  BROWSING_PRODUCTS: 'BROWSING_PRODUCTS',
  BROWSING_PRODUCT_DETAIL: 'BROWSING_PRODUCT_DETAIL',
  
  // Order flow
  ORDER_NAME: 'ORDER_NAME',
  ORDER_ADDRESS: 'ORDER_ADDRESS', 
  ORDER_PHONE: 'ORDER_PHONE',
  ORDER_CONFIRM: 'ORDER_CONFIRM',
  
  // Payment flow
  PAYMENT_AWAITING: 'PAYMENT_AWAITING',
  PAYMENT_VERIFYING: 'PAYMENT_VERIFYING',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  
  // Support flow
  SUPPORT_MAIN: 'SUPPORT_MAIN'
};

/**
 * Get or create user state
 * @param {string} phone - User phone number
 * @returns {Object} User state object
 */
function getUserState(phone) {
  if (!userStates.has(phone)) {
    userStates.set(phone, {
      phone: phone,
      currentFlow: FLOWS.MENU,
      step: STEPS.MENU_MAIN,
      selectedProduct: null,
      cart: [],
      awaitingPayment: false,
      tempData: {},
      createdAt: new Date(),
      lastUpdated: new Date()
    });
  }
  
  const state = userStates.get(phone);
  state.lastUpdated = new Date();
  return state;
}

/**
 * Update user state
 * @param {string} phone - User phone number
 * @param {Object} updates - State updates
 */
function updateUserState(phone, updates) {
  const state = getUserState(phone);
  Object.assign(state, updates);
  state.lastUpdated = new Date();
  // Minimal logging for performance
  console.log(`State: ${phone} -> ${state.currentFlow}:${state.step}`);
}

/**
 * Reset user state to menu
 * @param {string} phone - User phone number
 */
function resetUserState(phone) {
  updateUserState(phone, {
    currentFlow: FLOWS.MENU,
    step: STEPS.MENU_MAIN,
    selectedProduct: null,
    cart: [],
    awaitingPayment: false,
    tempData: {}
  });
}

/**
 * Set user flow
 * @param {string} phone - User phone number
 * @param {string} flow - New flow
 * @param {string} step - New step
 */
function setUserFlow(phone, flow, step) {
  updateUserState(phone, {
    currentFlow: flow,
    step: step
  });
}

/**
 * Store temporary data
 * @param {string} phone - User phone number
 * @param {string} key - Data key
 * @param {*} value - Data value
 */
function setTempData(phone, key, value) {
  const state = getUserState(phone);
  state.tempData[key] = value;
}

/**
 * Get temporary data
 * @param {string} phone - User phone number
 * @param {string} key - Data key
 * @returns {*} Data value
 */
function getTempData(phone, key) {
  const state = getUserState(phone);
  return state.tempData[key];
}

/**
 * Clean up old states (older than 24 hours)
 */
function cleanupOldStates() {
  const now = Date.now();
  const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago
  
  let cleanedCount = 0;
  for (const [phone, state] of userStates.entries()) {
    if (state.lastUpdated.getTime() < cutoff) {
      userStates.delete(phone);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned ${cleanedCount} old states`);
  }
}

/**
 * Get all active states (for debugging)
 */
function getAllStates() {
  const states = [];
  for (const [phone, state] of userStates.entries()) {
    states.push({
      phone,
      flow: state.currentFlow,
      step: state.step,
      selectedProduct: state.selectedProduct?.name || null,
      awaitingPayment: state.awaitingPayment,
      lastUpdated: state.lastUpdated
    });
  }
  return states;
}

// Auto cleanup every hour (non-blocking)
setInterval(() => {
  // Run cleanup in next tick to avoid blocking
  setImmediate(cleanupOldStates);
}, 60 * 60 * 1000);

module.exports = {
  FLOWS,
  STEPS,
  getUserState,
  updateUserState,
  resetUserState,
  setUserFlow,
  setTempData,
  getTempData,
  getAllStates,
  cleanupOldStates
};
