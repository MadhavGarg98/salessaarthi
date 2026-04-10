const { db } = require('../firebase');
const { sendWhatsAppMessage } = require('../services/twilioService');
const { generateAIResponse } = require('../services/groqService');

// Import new services
const stateService = require('../services/stateService');
const paymentService = require('../services/paymentService');
const orderService = require('../services/orderService');

/**
 * Handle incoming WhatsApp messages with priority logic
 * Priority: 1. Greeting -> 2. Number -> 3. Keywords -> 4. AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleWebhook = async (req, res) => {
  console.log('=== WEBHOOK HIT ===');
  console.log('Request body:', req.body);
  console.log('Headers:', req.headers);
  
  try {
    const { Body, From } = req.body;
    
    // Validate required parameters
    if (!Body || !From) {
      console.error('❌ Missing required parameters:', { Body, From });
      return res.status(400).send('Missing required parameters');
    }

    const userPhone = From.replace('whatsapp:', '').replace(/^\+/, '');
    const message = Body.trim().toLowerCase();
    const originalMessage = Body.trim();

    console.log(`📱 Message from ${userPhone}: "${originalMessage}"`);

    // Get user state using new service
    const userState = stateService.getUserState(userPhone);
    console.log(`🔄 User ${userPhone} state: ${userState.stage}`);

    // Get products from database ONLY IF NEEDED (no blocking at top)
    let products = [];
    if (userState.stage !== stateService.STAGES.HOME) {
      console.log('📦 Fetching products...');
      products = await getCleanProducts();
      console.log(`✅ Found ${products.length} products`);
      
      if (products.length === 0) {
        console.log('No products available, sending fallback message...');
        await sendWhatsAppMessage(From, "Sorry, no products available right now. Please try again later.");
        return res.sendStatus(200);
      }
    }

    // ==================== FAST STATE-BASED LOGIC ====================
    let response;

    // 1. GREETING HANDLER (Always resets to home)
    if (isGreeting(message)) {
      response = handleGreeting();
      stateService.resetToHome(userPhone);
    }
    // 2. PAYMENT CONFIRMATION HANDLER
    else if (stateService.isInPaymentStage(userPhone)) {
      response = await handlePaymentConfirmation(message, userPhone);
    }
    // 3. STATE-BASED INPUT HANDLING
    else {
      switch (userState.stage) {
        case stateService.STAGES.HOME:
          response = handleHomeInput(message, products, userPhone);
          break;
          
        case stateService.STAGES.PRODUCTS:
          response = handleProductsInput(message, products, userPhone);
          break;
          
        case stateService.STAGES.PRODUCT_DETAIL:
          response = handleProductDetailInput(message, products, userPhone);
          break;
          
        case stateService.STAGES.COLLECTING_DETAILS:
          response = await handleDetailsCollection(message, userPhone);
          break;
          
        default:
          response = handleHomeInput(message, products, userPhone);
          stateService.resetToHome(userPhone);
      }
    }

    // Ensure we always have a response
    if (!response || response.trim().length === 0) {
      response = "I didn't understand that. Try: 1. Products 2. Offers 3. Help";
    }

    // Send WhatsApp message via API (CRITICAL for WhatsApp Sandbox)
    console.log('Sending WhatsApp message via API...');
    await sendWhatsAppMessage(From, response);
    console.log('WhatsApp message sent successfully!');

    // Respond with empty 200 (webhook processed)
    res.sendStatus(200);

    // Save chat history AFTER response (non-blocking)
    saveChatHistory(userPhone, originalMessage, response).catch(err => {
      console.error('Failed to save chat history:', err);
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    
    // NEVER CRASH - Always return 200
    try {
      await sendWhatsAppMessage(req.body.From, "I'm having some technical issues. Please try: 1. Products 2. Offers 3. Help");
    } catch (apiError) {
      console.error('Failed to send error message:', apiError);
    }
    
    res.sendStatus(200); // Return 200 to prevent Twilio retries
  }
};

// ==================== STATE-BASED HANDLER FUNCTIONS ====================

/**
 * Handle input when user is in HOME state
 * @param {string} message - User message
 * @param {Array} products - Available products
 * @param {string} userPhone - User phone number
 * @returns {string} Response message
 */
function handleHomeInput(message, products, userPhone) {
  // Number inputs in HOME state
  if (isNumberInput(message)) {
    const number = parseInt(message);
    switch (number) {
      case 1:
        stateService.setStage(userPhone, stateService.STAGES.PRODUCTS);
        return handleProductList(products);
      case 2:
        return handleDiscountIntent();
      case 3:
        return handleHelpIntent();
      default:
        return "Invalid option. Please choose: 1. Products 2. Offers 3. Help";
    }
  }
  
  // Keyword inputs in HOME state
  if (isProductIntent(message)) {
    stateService.setStage(userPhone, stateService.STAGES.PRODUCTS);
    return handleProductList(products);
  }
  if (isDiscountIntent(message)) {
    return handleDiscountIntent();
  }
  if (isHelpIntent(message)) {
    return handleHelpIntent();
  }
  if (isBuyIntent(message)) {
    stateService.setStage(userPhone, stateService.STAGES.PRODUCTS);
    return handleProductList(products);
  }
  
  // Fallback for HOME state
  return "I didn't understand. Please choose from the options: 1. Products 2. Offers 3. Help";
}

/**
 * Handle input when user is in PRODUCTS state
 * @param {string} message - User message
 * @param {Array} products - Available products
 * @param {string} userPhone - User phone number
 * @returns {string} Response message
 */
function handleProductsInput(message, products, userPhone) {
  // Number inputs in PRODUCTS state
  if (isNumberInput(message)) {
    const number = parseInt(message);
    if (number >= 1 && number <= products.length) {
      const product = products[number - 1];
      stateService.updateUserState(userPhone, { 
        stage: stateService.STAGES.PRODUCT_DETAIL, 
        selectedProduct: product 
      });
      return handleProductDetail(product);
    } else {
      return `Invalid product number. Please choose from 1 to ${products.length}.\n\nReply with a product number or type 'menu' to go back.`;
    }
  }
  
  // Back to home
  if (message.includes('menu') || message.includes('back') || message.includes('home')) {
    stateService.resetToHome(userPhone);
    return handleGreeting();
  }
  
  return "Please reply with a product number (1, 2, 3...) or type 'menu' to go back.";
}

/**
 * Handle input when user is in PRODUCT_DETAIL state
 * @param {string} message - User message
 * @param {Array} products - Available products
 * @param {string} userPhone - User phone number
 * @returns {string} Response message
 */
function handleProductDetailInput(message, products, userPhone) {
  const userState = stateService.getUserState(userPhone);
  const product = userState.selectedProduct;
  
  // Number inputs in PRODUCT_DETAIL state
  if (isNumberInput(message)) {
    const number = parseInt(message);
    switch (number) {
      case 1:
        stateService.setStage(userPhone, stateService.STAGES.COLLECTING_DETAILS);
        return "Great choice! To complete your order:\n\nPlease provide:\n1. Your full name\n2. Complete delivery address\n\nExample: 'John Doe, 123 Main Street, City'";
      case 2:
        return handleDiscountIntent();
      case 3:
        stateService.setStage(userPhone, stateService.STAGES.PRODUCTS);
        return handleProductList(products);
      default:
        return `Invalid option. Please choose:\n1\u20e3\ufe0f Buy Now\n2\u20e3\ufe0f Get Discount\n3\u20e3\ufe0f Back to Products`;
    }
  }
  
  // Back to home
  if (message.includes('menu') || message.includes('back') || message.includes('home')) {
    stateService.resetToHome(userPhone);
    return handleGreeting();
  }
  
  return `Please choose an option:\n1\u20e3\ufe0f Buy Now\n2\u20e3\ufe0f Get Discount\n3\u20e3\ufe0f Back to Products`;
}

/**
 * Handle details collection for order
 * @param {string} message - User message
 * @param {string} userPhone - User phone number
 * @returns {Promise<string>} Response message
 */
async function handleDetailsCollection(message, userPhone) {
  const userState = stateService.getUserState(userPhone);
  
  // Check if user provided order details (name and address)
  if (message.length > 10 && /[a-zA-Z]/.test(message) && /\d/.test(message)) {
    // Extract name (simple logic)
    const nameMatch = message.match(/[a-zA-Z]{2,}/);
    const name = nameMatch ? nameMatch[0] : 'Customer';
    
    // Store user details
    stateService.setUserDetails(userPhone, name, message);
    
    // Create payment message FAST
    const product = userState.selectedProduct;
    let paymentMessage = "Generating payment link...";
    
    // Move to payment stage
    stateService.setStage(userPhone, stateService.STAGES.PAYMENT);
    
    // Process payment async (non-blocking)
    paymentService.createPaymentMessage(product, userPhone)
      .then(paymentData => {
        // Could update state or send follow-up message if needed
        console.log('Payment link generated for', userPhone);
      })
      .catch(err => {
        console.log('Payment error:', err);
      });
    
    return `Complete your payment:

Product: ${getProductEmoji(product.category)} ${product.name}
Amount: ¥${product.price}

Click to Pay:
upi://pay?pa=sales@ybl&pn=SalesSaarthi&am=${product.price}&cu=INR

Reply "PAID" after payment or "CANCEL" to exit`;
  }
  
  // Back to home
  if (message.includes('cancel') || message.includes('back') || message.includes('menu')) {
    stateService.resetToHome(userPhone);
    return handleGreeting();
  }
  
  return `Please provide your complete name and delivery address.\n\nExample: 'John Doe, 123 Main Street, City'\n\nOr type 'cancel' to go back.`;
}

/**
 * Handle payment confirmation
 * @param {string} message - User message
 * @param {string} userPhone - User phone number
 * @returns {Promise<string>} Response message
 */
async function handlePaymentConfirmation(message, userPhone) {
const userState = stateService.getUserState(userPhone);
  
// Check if payment is confirmed
if (paymentService.isPaymentConfirmed(message)) {
// Process order async (non-blocking)
const orderData = {
phone: userPhone,
name: userState.name,
product: userState.selectedProduct,
address: userState.address
};
  
// Create order in background
orderService.createOrder(orderData)
.then(orderId => {
console.log('Order created:', orderId);
// Mark as paid
return orderService.markOrderAsPaid(orderId);
})
.then(() => {
console.log('Order marked as paid for:', userPhone);
})
.catch(err => {
console.error('Order processing error:', err);
});
  
// Complete order and reset state immediately
stateService.completeOrder(userPhone);
  
return `Thank you ${userState.name}! 

Your order has been confirmed:

Product: ${getProductEmoji(userState.selectedProduct.category)} ${userState.selectedProduct.name}
Amount: ¥${userState.selectedProduct.price}
Order ID: Processing...

We'll process your order and deliver it soon! 

For any queries, reply "HELP"`;
}
  
// Check if payment is cancelled
if (paymentService.isPaymentCancelled(message)) {
stateService.resetToHome(userPhone);
return handleGreeting();
}
  
return "Please reply 'PAID' after completing the payment or 'CANCEL' to exit.";
}

/**
 * Handle input when user is in ORDERING state
 * @param {string} message - User message
 * @param {string} userPhone - User phone number
 * @returns {string} Response message
 */
function handleOrderingInput(message, userPhone) {
  const userState = getUserState(userPhone);
  const product = userState.selectedProduct;
  
  // Check if user provided order details
  if (message.length > 10 && /[a-zA-Z]/.test(message) && /\d/.test(message)) {
    // Extract name (simple logic)
    const nameMatch = message.match(/[a-zA-Z]{2,}/);
    const name = nameMatch ? nameMatch[0] : 'Customer';
    
    // Save order
    saveOrder(userPhone, product, name, message);
    
    resetToHome(userPhone);
    return `Thank you ${name}! Your order for ${product.name} has been placed.\n\nOrder details:\nProduct: ${product.name}\nPrice: \u20b9${product.price}\nAddress: ${message}\n\nWe'll contact you soon!`;
  }
  
  // Back to home
  if (message.includes('cancel') || message.includes('back') || message.includes('menu')) {
    resetToHome(userPhone);
    return handleGreeting();
  }
  
  return `Please provide your complete name and delivery address.\n\nExample: 'John Doe, 123 Main Street, City'\n\nOr type 'cancel' to go back.`;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if message is a greeting
 * @param {string} message - User message
 * @returns {boolean} Is greeting
 */
function isGreeting(message) {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  return greetings.some(greeting => message.includes(greeting));
}

/**
 * Check if message is a number input
 * @param {string} message - User message
 * @returns {boolean} Is number input
 */
function isNumberInput(message) {
  return /^\d+$/.test(message);
}

/**
 * Check if message has product intent
 * @param {string} message - User message
 * @returns {boolean} Has product intent
 */
function isProductIntent(message) {
  const productKeywords = ['product', 'products', 'catalog', 'show products', 'items', 'what do you have', 'menu', 'list'];
  return productKeywords.some(keyword => message.includes(keyword));
}

/**
 * Check if message has price intent
 * @param {string} message - User message
 * @returns {boolean} Has price intent
 */
function isPriceIntent(message) {
  const priceKeywords = ['price', 'cost', 'rates', 'how much', 'pricing', 'amount', 'rupees', 'rs', 'money'];
  return priceKeywords.some(keyword => message.includes(keyword));
}

/**
 * Check if message has buy intent
 * @param {string} message - User message
 * @returns {boolean} Has buy intent
 */
function isBuyIntent(message) {
  const buyKeywords = ['buy', 'order', 'purchase', 'want to buy', 'get', 'shop', 'book'];
  return buyKeywords.some(keyword => message.includes(keyword));
}

/**
 * Check if message has discount intent
 * @param {string} message - User message
 * @returns {boolean} Has discount intent
 */
function isDiscountIntent(message) {
  const discountKeywords = ['discount', 'offer', 'sale', 'deal', 'promotion', 'cheap', 'best price'];
  return discountKeywords.some(keyword => message.includes(keyword));
}

/**
 * Check if message has help intent
 * @param {string} message - User message
 * @returns {boolean} Has help intent
 */
function isHelpIntent(message) {
  const helpKeywords = ['help', 'support', 'assistance', 'info', 'information', 'contact'];
  return helpKeywords.some(keyword => message.includes(keyword));
}

// ==================== HANDLER FUNCTIONS ====================

/**
 * Handle greeting - NO AI CALL
 * @returns {string} Greeting response
 */
function handleGreeting() {
  return "Welcome to SalesSaarthi! What would you like to do? 1. View Products 2. Get Discounts 3. Help";
}

/**
 * Handle number input for product selection - NO AI CALL
 * @param {string} message - User message (number)
 * @param {Array} products - Available products
 * @param {string} userPhone - User phone number
 * @returns {Promise<string>} Product details response
 */
async function handleNumberInput(message, products, userPhone) {
  const number = parseInt(message);
  
  // Validate number range
  if (number < 1 || number > products.length) {
    return `Invalid product number. Please choose from 1 to ${products.length}.

Try:
1\u20e3\ufe0f View Products
2\u20e3\ufe0f Get Discounts
3\u20e3\ufe0f Help`;
  }

  const product = products[number - 1];
  const stockInfo = product.stock <= 3 ? `\u26a0\ufe0f Only ${product.stock} left!` : `\u2705 In stock (${product.stock} available)`;
  
  // Store user selection for potential order
  await storeUserSelection(userPhone, product);

  return `${getProductEmoji(product.category)} ${product.name} - \u20b9${product.price}

${product.description}

${stockInfo}

Options:
1\u20e3\ufe0f Buy Now
2\u20e3\ufe0f Get Discount
3\u20e3\ufe0f Back to Products`;
}

/**
 * Handle product list request - NO AI CALL
 * @param {Array} products - Available products
 * @returns {string} Product list response
 */
function handleProductList(products) {
  if (products.length === 0) {
    return "Sorry, no products available right now.";
  }

  let productList = `Here are our available products:\n\n`;
  
  products.forEach((product, index) => {
    const stockWarning = product.stock <= 3 ? ` \u26a0\ufe0f Only ${product.stock} left!` : '';
    productList += `${index + 1}. ${getProductEmoji(product.category)} ${product.name} - \u20b9${product.price}${stockWarning}\n`;
    productList += `   ${product.description}\n\n`;
  });

  productList += `Reply with the product number to order!`;
  
  return productList;
}

/**
 * Handle product detail display - NO AI CALL
 * @param {Object} product - Selected product
 * @returns {string} Product details response
 */
function handleProductDetail(product) {
  const stockInfo = product.stock <= 3 ? `\u26a0\ufe0f Only ${product.stock} left!` : `\u2705 In stock (${product.stock} available)`;
  
  return `${getProductEmoji(product.category)} ${product.name} - \u20b9${product.price}

${product.description}

${stockInfo}

Options:
1\u20e3\ufe0f Buy Now
2\u20e3\ufe0f Get Discount
3\u20e3\ufe0f Back to Products`;
}

/**
 * Save order to database
 * @param {string} userPhone - User phone number
 * @param {Object} product - Selected product
 * @param {string} name - Customer name
 * @param {string} address - Delivery address
 */
async function saveOrder(userPhone, product, name, address) {
  try {
    await db.collection('orders').add({
      phone: userPhone,
      product: product.name,
      productId: product.id,
      price: product.price,
      customerName: name,
      deliveryAddress: address,
      timestamp: new Date(),
      status: 'pending'
    });
    
    console.log(`Order saved: ${userPhone} - ${product.name} - ${name}`);
  } catch (error) {
    console.error('Error saving order:', error);
    // Don't throw - continue processing
  }
}

/**
 * Handle price list request - NO AI CALL
 * @param {Array} products - Available products
 * @returns {string} Price list response
 */
function handlePriceList(products) {
  if (products.length === 0) {
    return "Sorry, no products available right now.";
  }

  let priceList = `\ud83d\udcb0 Our Product Prices:\n\n`;
  
  products.forEach((product, index) => {
    priceList += `${index + 1}. ${product.name} - \u20b9${product.price}\n`;
  });

  priceList += `\nReply with the product number to order!`;
  
  return priceList;
}

/**
 * Handle buy intent - NO AI CALL
 * @returns {string} Buy intent response
 */
function handleBuyIntent() {
  return `Great choice! To place an order:

Please provide:
1. Your full name
2. Complete delivery address
3. Phone number

Example: "John Doe, 123 Main Street, City"

Or reply with a product number from the list!`;
}

/**
 * Handle discount intent - NO AI CALL
 * @returns {string} Discount response
 */
function handleDiscountIntent() {
  return `\ud83c\udf89 Special Offers:

1. \ud83d\udd25 Flat 10% off on first order
2. \ud83d\udce6 Free delivery on orders above \u20b9500
3. \ud83c\udfab Buy 2 Get 1 Free on selected items

Reply with offer number to know more or type 'products' to see items!`;
}

/**
 * Handle help intent - NO AI CALL
 * @returns {string} Help response
 */
function handleHelpIntent() {
  return `How can I help you?

1\u20e3\ufe0f Order Status
2\u20e3\ufe0f Return/Refund
3\u20e3\ufe0f Contact Support
4\u20e3\ufe0f Products
5\u20e3\ufe0f Main Menu`;
}

/**
 * Handle AI fallback with safe error handling
 * @param {string} message - Original user message
 * @param {Array} products - Available products
 * @returns {Promise<string>} AI response or safe fallback
 */
async function handleAIFallback(message, products) {
  try {
    // Only call AI if we have a valid API key
    if (!process.env.GROQ_API_KEY) {
      console.log('No Groq API key found, using fallback');
      return getSafeFallback();
    }

    const aiResponse = await generateAIResponse(message, products);
    
    // Validate AI response - don't return error messages
    if (aiResponse && 
        aiResponse.trim().length > 0 && 
        !aiResponse.includes('trouble connecting') &&
        !aiResponse.includes('sorry') &&
        !aiResponse.includes('error')) {
      return aiResponse;
    }
    
  } catch (error) {
    console.error('AI fallback error:', error.message);
  }

  // Always return safe fallback
  return getSafeFallback();
}

/**
 * Get safe fallback response
 * @returns {string} Safe fallback message
 */
function getSafeFallback() {
  return `I didn't understand that.

Try:
1\u20e3\ufe0f Products
2\u20e3\ufe0f Offers
3\u20e3\ufe0f Help`;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get clean products (remove duplicates)
 * @returns {Promise<Array>} Clean products array
 */
async function getCleanProducts() {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Remove duplicates based on name (case insensitive)
    const uniqueProducts = products.filter((product, index, self) =>
      index === self.findIndex((p) => p.name.toLowerCase() === product.name.toLowerCase())
    );

    // Sort by name for consistency
    return uniqueProducts.sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get emoji for product category
 * @param {string} category - Product category
 * @returns {string} Category emoji
 */
function getProductEmoji(category) {
  const categoryEmojis = {
    'electronics': '\ud83d\udcf1',
    'accessories': '\ud83c\udf92',
    'headphones': '\ud83c\udfa7',
    'watch': '\u231a',
    'speaker': '\ud83d\udd0a',
    'default': '\ud83d\udce6'
  };
  
  const categoryLower = (category || '').toLowerCase();
  return categoryEmojis[categoryLower] || categoryEmojis.default;
}

/**
 * Store user selection for potential order
 * @param {string} userPhone - User phone number
 * @param {Object} product - Selected product
 */
async function storeUserSelection(userPhone, product) {
  try {
    await db.collection('user_selections').doc(userPhone).set({
      product,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error storing user selection:', error);
    // Don't throw - continue processing
  }
}

/**
 * Save chat history
 * @param {string} userPhone - User phone number
 * @param {string} message - User message
 * @param {string} response - Bot response
 */
async function saveChatHistory(userPhone, message, response) {
  try {
    await db.collection('chats').add({
      userId: userPhone,
      message,
      reply: response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
    // Don't throw - continue processing
  }
}

module.exports = { handleWebhook };
