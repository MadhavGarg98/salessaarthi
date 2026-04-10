/**
 * Intelligent Intent Detection Service for WhatsApp AI Sales Assistant
 * Handles flexible message interpretation with human-like understanding
 */

const { FLOWS, STEPS } = require('./stateService');
const { getAllProducts, searchProducts } = require('./productService');

// Global commands that work anywhere
const GLOBAL_COMMANDS = {
  MENU: ['menu', 'home', 'start', 'main'],
  CANCEL: ['cancel', 'stop', 'exit', 'quit', 'back'],
  HELP: ['help', 'support', 'assist', 'customer'],
  TRACK: ['track', 'order', 'status', 'delivery'],
  PAID: ['paid', 'payment', 'done', 'completed']
};

// Cache for products to avoid repeated database calls
let productsCache = null;
let productsCacheTime = 0;
const PRODUCTS_CACHE_DURATION = 60000; // 60 seconds

/**
 * Detect user intent from message
 * @param {string} message - User message
 * @param {Object} userState - Current user state
 * @returns {Promise<Object>} Intent object
 */
async function detectIntent(message, userState) {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Check global commands first (fast string matching)
  const globalCommand = detectGlobalCommand(normalizedMessage);
  if (globalCommand) {
    return globalCommand;
  }
  
  // Check payment confirmation (fast check)
  if (userState.awaitingPayment && isPaymentConfirmation(normalizedMessage)) {
    return {
      type: 'PAYMENT_CONFIRMATION',
      data: extractPaymentCode(normalizedMessage)
    };
  }
  
  // Context-aware intent detection
  switch (userState.currentFlow) {
    case FLOWS.MENU:
      return await detectMenuIntent(normalizedMessage);
    case FLOWS.BROWSING:
      return await detectBrowsingIntent(normalizedMessage);
    case FLOWS.ORDER:
      return detectOrderIntent(normalizedMessage, userState);
    case FLOWS.PAYMENT:
      return detectPaymentIntent(normalizedMessage);
    case FLOWS.SUPPORT:
      return detectSupportIntent(normalizedMessage);
    default:
      return await detectMenuIntent(normalizedMessage);
  }
}

/**
 * Detect global commands
 */
function detectGlobalCommand(message) {
  // Fast early returns for common commands
  if (message === 'menu' || message === 'start' || message === 'home') {
    return { type: 'MENU', data: null };
  }
  if (message === 'cancel' || message === 'stop' || message === 'exit') {
    return { type: 'CANCEL', data: null };
  }
  if (message === 'help' || message === 'support') {
    return { type: 'HELP', data: null };
  }
  if (message === 'track' || message === 'order') {
    return { type: 'TRACK', data: null };
  }
  
  // Fallback to keyword matching
  for (const [command, keywords] of Object.entries(GLOBAL_COMMANDS)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return { type: command, data: null };
    }
  }
  return null;
}

/**
 * Detect menu flow intent
 */
async function detectMenuIntent(message) {
  // Fast exact matches first
  if (message === 'browse' || message === 'products' || message === 'shop') {
    return { type: 'BROWSE_PRODUCTS', data: null };
  }
  if (message === 'buy' || message === 'order') {
    return { type: 'BROWSE_PRODUCTS', data: null };
  }
  
  // Fast keyword checks
  if (message.includes('product') || message.includes('show') || 
      message.includes('browse') || message.includes('shop') ||
      message.includes('buy') || message.includes('see') ||
      message.includes('catalog') || message.includes('list')) {
    return { type: 'BROWSE_PRODUCTS', data: null };
  }
  
  // Track order
  if (message.includes('track') || message.includes('order') || 
      message.includes('status')) {
    return { type: 'TRACK_ORDER', data: null };
  }
  
  // Support
  if (message.includes('help') || message.includes('support') || 
      message.includes('talk') || message.includes('human')) {
    return { type: 'SUPPORT', data: null };
  }
  
  // Product selection (cached)
  const product = await detectProductSelection(message);
  if (product) {
    return { type: 'SELECT_PRODUCT', data: product };
  }
  
  // Default to menu
  return { type: 'SHOW_MENU', data: null };
}

/**
 * Detect browsing flow intent
 */
async function detectBrowsingIntent(message) {
  // Fast exact matches
  if (message === 'buy' || message === 'order') {
    return { type: 'BUY_PRODUCT', data: null };
  }
  if (message === 'back' || message === 'menu') {
    return { type: 'MENU', data: null };
  }
  
  // Product selection (cached)
  const product = await detectProductSelection(message);
  if (product) {
    return { type: 'SELECT_PRODUCT', data: product };
  }
  
  // Back to menu
  if (message.includes('back') || message.includes('menu')) {
    return { type: 'MENU', data: null };
  }
  
  // More details
  if (message.includes('detail') || message.includes('info') || 
      message.includes('spec') || message.includes('more')) {
    return { type: 'PRODUCT_DETAILS', data: null };
  }
  
  // Buy current product
  if (message.includes('buy') || message.includes('order') || 
      message.includes('purchase') || message.includes('get')) {
    return { type: 'BUY_PRODUCT', data: null };
  }
  
  return { type: 'UNKNOWN', data: null };
}

/**
 * Detect order flow intent
 */
function detectOrderIntent(message, userState) {
  // This will be handled by the order flow logic
  return { type: 'ORDER_INPUT', data: message };
}

/**
 * Detect payment flow intent
 */
function detectPaymentIntent(message) {
  if (isPaymentConfirmation(message)) {
    return { type: 'PAYMENT_CONFIRMATION', data: extractPaymentCode(message) };
  }
  
  return { type: 'UNKNOWN', data: null };
}

/**
 * Detect support flow intent
 */
function detectSupportIntent(message) {
  if (message.includes('back') || message.includes('menu')) {
    return { type: 'MENU', data: null };
  }
  
  return { type: 'SUPPORT_MESSAGE', data: message };
}

/**
 * Detect product selection from message
 */
async function detectProductSelection(message) {
  try {
    // Use cache if available and fresh
    const now = Date.now();
    let products = productsCache;
    
    if (!products || (now - productsCacheTime) > PRODUCTS_CACHE_DURATION) {
      products = await getAllProducts();
      productsCache = products;
      productsCacheTime = now;
    }
    
    // Fast number match first
    const numberMatch = message.match(/^\d+$/);
    if (numberMatch) {
      const productIndex = parseInt(numberMatch[0]) - 1;
      if (productIndex >= 0 && productIndex < products.length) {
        return products[productIndex];
      }
    }
    
    // Fast keyword matching - break early on first match
    for (const product of products) {
      // Check exact name match first (fastest)
      const productName = product.name.toLowerCase();
      if (productName === message || message === productName) {
        return product;
      }
      
      // Check in keywords (fast)
      for (const keyword of product.keywords) {
        if (message === keyword || keyword === message) {
          return product;
        }
      }
      
      // Check partial matches (slower but necessary)
      if (productName.includes(message) || message.includes(productName)) {
        return product;
      }
      
      // Check in keywords (partial)
      for (const keyword of product.keywords) {
        if (message.includes(keyword) || keyword.includes(message)) {
          return product;
        }
      }
    }
    
    return null;
  } catch (error) {
    // Try cache fallback on error
    if (productsCache) {
      return productsCache.find(p => 
        p.name.toLowerCase().includes(message) || 
        p.keywords.some(k => message.includes(k))
    ) || null;
    }
    return null;
  }
}

/**
 * Check if message is payment confirmation
 */
function isPaymentConfirmation(message) {
  return message.startsWith('paid') || 
         message.includes('payment done') ||
         message.includes('payment completed');
}

/**
 * Extract payment code from message
 */
function extractPaymentCode(message) {
  const match = message.match(/(\d{4})/);
  return match ? match[1] : null;
}

// Clear cache function for external use
function clearProductsCache() {
  productsCache = null;
  productsCacheTime = 0;
}

module.exports = {
  detectIntent,
  detectProductSelection,
  isPaymentConfirmation,
  extractPaymentCode,
  clearProductsCache
};
