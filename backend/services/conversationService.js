/**
 * Human-like Conversation Service for WhatsApp AI Sales Assistant
 * Handles natural, friendly responses with proper flow management
 */

const { FLOWS, STEPS } = require('./stateService');
const { getAllProducts, getProductById } = require('./productService');

// Memory cache for product lists
let productCache = null;
let productCacheTime = 0;
const CACHE_DURATION = 60000; // 60 seconds

/**
 * Generate human-like response based on intent and state
 * @param {Object} intent - Detected intent
 * @param {Object} userState - Current user state
 * @param {string} message - Original message
 * @returns {Object} Response object with message and state updates
 */
async function generateResponse(intent, userState, message) {
  const intentType = intent.type;
  let response = '';
  let stateUpdates = {};
  
  // Handle global commands first (early returns for speed)
  if (intentType === 'MENU') {
    return {
      message: getWelcomeMessage(),
      stateUpdates: {
        currentFlow: FLOWS.MENU,
        step: STEPS.MENU_MAIN,
        selectedProduct: null,
        awaitingPayment: false,
        tempData: {}
      }
    };
  }
  
  if (intentType === 'CANCEL') {
    if (userState.currentFlow === FLOWS.ORDER || userState.currentFlow === FLOWS.PAYMENT) {
      return {
        message: "No worries! I've cancelled your order. Thank you for shopping with SalesSaarthi! \u2728\n\n" + getWelcomeMessage(),
        stateUpdates: {
          currentFlow: FLOWS.MENU,
          step: STEPS.MENU_MAIN,
          selectedProduct: null,
          awaitingPayment: false,
          tempData: {}
        }
      };
    }
    return {
      message: "Alright! What would you like to do instead? \u{1F928}\n\n" + getWelcomeMessage(),
      stateUpdates: {
        currentFlow: FLOWS.MENU,
        step: STEPS.MENU_MAIN
      }
    };
  }
  
  if (intentType === 'HELP') {
    return {
      message: getSupportMessage(),
      stateUpdates: {
        currentFlow: FLOWS.SUPPORT,
        step: STEPS.SUPPORT_MAIN
      }
    };
  }
  
  if (intentType === 'TRACK') {
    return {
      message: getTrackingMessage(),
      stateUpdates: {}
    };
  }
  
  // Handle flow-specific intents
  switch (userState.currentFlow) {
    case FLOWS.MENU:
      return handleMenuFlow(intent, userState);
    case FLOWS.BROWSING:
      return handleBrowsingFlow(intent, userState);
    case FLOWS.ORDER:
      return handleOrderFlow(intent, userState, message);
    case FLOWS.PAYMENT:
      return handlePaymentFlow(intent, userState);
    case FLOWS.SUPPORT:
      return handleSupportFlow(intent, userState, message);
    default:
      return {
        message: getFailsafeMessage(),
        stateUpdates: {
          currentFlow: FLOWS.MENU,
          step: STEPS.MENU_MAIN
        }
      };
  }
}

/**
 * Handle menu flow
 */
async function handleMenuFlow(intent, userState) {
  switch (intent.type) {
    case 'SHOW_MENU':
      return {
        message: getWelcomeMessage(),
        stateUpdates: {}
      };
      
    case 'BROWSE_PRODUCTS':
      return {
        message: await getProductListMessage(),
        stateUpdates: {
          currentFlow: FLOWS.BROWSING,
          step: STEPS.BROWSING_PRODUCTS
        }
      };
      
    case 'SELECT_PRODUCT':
      return {
        message: getProductDetailMessage(intent.data),
        stateUpdates: {
          currentFlow: FLOWS.BROWSING,
          step: STEPS.BROWSING_PRODUCT_DETAIL,
          selectedProduct: intent.data
        }
      };
      
    default:
      return {
        message: getFailsafeMessage(),
        stateUpdates: {}
      };
  }
}

/**
 * Handle browsing flow
 */
async function handleBrowsingFlow(intent, userState) {
  switch (intent.type) {
    case 'SELECT_PRODUCT':
      return {
        message: getProductDetailMessage(intent.data),
        stateUpdates: {
          step: STEPS.BROWSING_PRODUCT_DETAIL,
          selectedProduct: intent.data
        }
      };
      
    case 'PRODUCT_DETAILS':
      if (userState.selectedProduct) {
        return {
          message: getProductDetailMessage(userState.selectedProduct),
          stateUpdates: {}
        };
      }
      return {
        message: "Which product would you like to know more about? \u{1F928}\n\n" + await getProductListMessage(),
        stateUpdates: {}
      };
      
    case 'BUY_PRODUCT':
      if (userState.selectedProduct) {
        return {
          message: "Great choice! Let's get your order started \u{1F680}\n\nFirst, what's your name?",
          stateUpdates: {
            currentFlow: FLOWS.ORDER,
            step: STEPS.ORDER_NAME
          }
        };
      }
      return {
        message: "Which product would you like to buy? \u{1F6D2}\n\n" + await getProductListMessage(),
        stateUpdates: {}
      };
      
    default:
      return {
        message: getFailsafeMessage(),
        stateUpdates: {}
      };
  }
}

/**
 * Handle order flow
 */
function handleOrderFlow(intent, userState, message) {
  switch (userState.step) {
    case STEPS.ORDER_NAME:
      return {
        message: `Nice to meet you, ${message}! \u{1F44B}\n\nNow, please share your delivery address: `,
        stateUpdates: {
          step: STEPS.ORDER_ADDRESS,
          tempData: { ...userState.tempData, name: message }
        }
      };
      
    case STEPS.ORDER_ADDRESS:
      return {
        message: "Got it! One last thing - what's your phone number? \u{1F4F1}",
        stateUpdates: {
          step: STEPS.ORDER_PHONE,
          tempData: { ...userState.tempData, address: message }
        }
      };
      
    case STEPS.ORDER_PHONE:
      const orderConfirmation = getOrderConfirmationMessage(
        userState.selectedProduct,
        userState.tempData.name,
        userState.tempData.address,
        message
      );
      return {
        message: orderConfirmation,
        stateUpdates: {
          step: STEPS.ORDER_CONFIRM,
          tempData: { ...userState.tempData, phone: message }
        }
      };
      
    case STEPS.ORDER_CONFIRM:
      if (message.toLowerCase().includes('yes')) {
        return {
          message: getPaymentMessage(userState.selectedProduct),
          stateUpdates: {
            currentFlow: FLOWS.PAYMENT,
            step: STEPS.PAYMENT_AWAITING,
            awaitingPayment: true
          }
        };
      } else {
        return {
          message: "No problem! Let's start over. What would you like to do? \u{2728}\n\n" + getWelcomeMessage(),
          stateUpdates: {
            currentFlow: FLOWS.MENU,
            step: STEPS.MENU_MAIN,
            selectedProduct: null,
            tempData: {}
          }
        };
      }
      
    default:
      return {
        message: getFailsafeMessage(),
        stateUpdates: {}
      };
  }
}

/**
 * Handle payment flow
 */
async function handlePaymentFlow(intent, userState) {
  if (intent.type === 'PAYMENT_CONFIRMATION') {
    return {
        message: "\u{1F50D} Verifying your payment...",
      stateUpdates: {
        step: STEPS.PAYMENT_VERIFYING
      }
    };
  }
  
  return {
    message: await getPaymentMessage(userState.selectedProduct),
    stateUpdates: {}
  };
}

/**
 * Handle support flow
 */
function handleSupportFlow(intent, userState, message) {
  if (intent.type === 'SUPPORT_MESSAGE') {
    return {
      message: `Thanks for your message! Our support team will get back to you soon. \u{1F5E7}\n\nMessage received: "${message}"\n\nType MENU to go back to main menu.`,
      stateUpdates: {}
    };
  }
  
  return {
    message: getSupportMessage(),
    stateUpdates: {}
  };
}

/**
 * Welcome message
 */
function getWelcomeMessage() {
  return "Hey \u{1F44B} I'm your Sales Assistant! What are you looking for today?\n\n" +
         "You can:\n" +
         "\u{1F6D2} Browse products\n" +
         "\u{1F4E6} Track order\n" +
         "\u{1F4DE} Talk to support\n\n" +
         "Just tell me what you'd like to do!";
}

/**
 * Product list message
 */
async function getProductListMessage() {
  try {
    // Use cache if available and fresh
    const now = Date.now();
    if (productCache && (now - productCacheTime) < CACHE_DURATION) {
      return buildProductMessage(productCache);
    }
    
    // Fetch fresh data
    const products = await getAllProducts();
    
    if (!products || products.length === 0) {
      return "\u{1F614} Currently no products available \u{1F614} Please try again later.";
    }
    
    // Update cache
    productCache = products;
    productCacheTime = now;
    
    return buildProductMessage(products);
  } catch (error) {
    // Try cache fallback on error
    if (productCache) {
      return buildProductMessage(productCache);
    }
    return "\u{1F614} Sorry, having trouble loading products. Please try again \u{1F614}";
  }
}

function buildProductMessage(products) {
  let message = "Here are some great products \u{1F447}\n\n";
  
  products.forEach((product, index) => {
    const stockInfo = product.stock <= 3 ? ` \u{1F525} Only ${product.stock} left!` : '';
    message += `${index + 1}. ${product.name} - \u20B9${product.price} ${product.emoji}${stockInfo}\n`;
  });
  
  message += "\nYou can reply with number or just type the product name \u{1F60A}\n\n" +
            "Type MENU anytime to go back";
  
  return message;
}

/**
 * Product detail message
 */
function getProductDetailMessage(product) {
  return `${product.emoji} ${product.name}\n\n` +
         `Price: \u20B9${product.price}\n` +
         `Stock: ${product.stock} units\n` +
         `${product.stock <= 3 ? '⚡ Limited stock! Order now!' : ''}\n\n` +
         `${product.description}\n\n` +
         "Type 'buy' to order or 'back' to see more products";
}

/**
 * Order confirmation message
 */
function getOrderConfirmationMessage(product, name, address, phone) {
  return "Please confirm your order \u{1F447}\n\n" +
         `Product: ${product.name} ${product.emoji}\n` +
         `Amount: ₹${product.price}\n` +
         `Name: ${name}\n` +
         `Address: ${address}\n` +
         `Phone: ${phone}\n\n` +
         "Reply YES to confirm or CANCEL to exit";
}

/**
 * Payment message
 */
function getPaymentMessage(product) {
  const upiId = "madhavgarg3300@okhdfcbank";
  const upiLink = `upi://pay?pa=${upiId}&pn=SalesSaarthi&am=${product.price}&cu=INR`;
  const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  
  return `Complete your payment \u{1F4B3}\n\n` +
         `Amount: \u20B9${product.price}\n` +
         `UPI ID: ${upiId}\n\n` +
         `Tap to pay:\n${upiLink}\n\n` +
         `Or scan QR below \u{1F4F8}\n${qrLink}\n\n` +
         `After payment, reply:\n` +
         `PAID + last 4 digits of your phone\n` +
         `Example: PAID 3300`;
}

/**
 * Support message
 */
function getSupportMessage() {
  return "\u{1F4DE} Need help? I'm here for you!\n\n" +
         "You can:\n" +
         "\u2022 Ask about products\n" +
         "\u2022 Check order status\n" +
         "\u2022 Report issues\n" +
         "\u2022 Get general help\n\n" +
         "Type your message or MENU to go back";
}

/**
 * Tracking message
 */
function getTrackingMessage() {
  return "\u{1F4E6} Order Tracking\n\n" +
         "Please share your order ID and I'll check the status for you.\n\n" +
         "Example: ORDER12345\n\n" +
         "Type MENU to go back";
}

/**
 * Failsafe message
 */
function getFailsafeMessage() {
  return "Sorry, I didn't get that \u{1F928}\n\n" +
         "You can:\n" +
         "1. Browse products\n" +
         "2. Track order\n" +
         "3. Talk to support\n\n" +
         "Or type MENU for main menu";
}

// Clear cache function for external use
function clearProductCache() {
  productCache = null;
  productCacheTime = 0;
}

module.exports = {
  generateResponse,
  clearProductCache
};
