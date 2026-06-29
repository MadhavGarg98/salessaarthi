const { db } = require('../firebase');
const { FLOWS, STEPS } = require('./stateService');

/**
 * Get payment settings (UPI ID)
 * @returns {Promise<Object>} Payment settings
 */
async function getPaymentSettings() {
  try {
    const settingsDoc = await db.collection('settings').doc('payment').get();
    if (settingsDoc.exists) {
      return settingsDoc.data();
    }
    return { upiId: "madhavgarg3300@okhdfcbank" };
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return { upiId: "madhavgarg3300@okhdfcbank" };
  }
}

/**
 * Save payment settings (UPI ID)
 * @param {string} upiId - UPI ID to save
 * @returns {Promise<boolean>} Success status
 */
async function savePaymentSettings(upiId) {
  try {
    await db.collection('settings').doc('payment').set({
      upiId,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return false;
  }
}

/**
 * Get the current UPI ID
 * @returns {Promise<string>} UPI ID
 */
async function getUPIId() {
  const settings = await getPaymentSettings();
  return settings.upiId;
}

/**
 * Generate UPI payment link
 * @param {string} upiId - UPI ID
 * @param {number} amount - Amount
 * @param {string} productName - Product name
 * @returns {string} UPI link
 */
function generateUPILink(upiId, amount, productName) {
  const orderId = generateOrderId();
  return `upi://pay?pa=${upiId}&pn=SalesSaarthi&am=${amount}&cu=INR&tn=${encodeURIComponent(productName + ' - ' + orderId)}`;
}

/**
 * Generate UPI payment details
 * @param {Object} product - Product object
 * @param {Object} orderData - Order details
 * @returns {Object} Payment details
 */
function generatePaymentDetails(product, orderData) {
  const upiId = "madhavgarg3300@okhdfcbank";
  const amount = product.price;
  const orderId = generateOrderId();
  
  // Generate UPI link
  const upiLink = `upi://pay?pa=${upiId}&pn=SalesSaarthi&am=${amount}&cu=INR&tn=${orderId}`;
  
  // Generate QR code URL
  const qrLink = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
  
  return {
    upiId,
    amount,
    orderId,
    upiLink,
    qrLink,
    merchantName: "SalesSaarthi"
  };
}

/**
 * Process payment confirmation
 * @param {string} paymentCode - Payment confirmation code
 * @param {Object} userState - Current user state
 * @returns {Object} Payment confirmation result
 */
async function processPaymentConfirmation(paymentCode, userState) {
  // Validate payment code format
  if (!paymentCode || paymentCode.length !== 4) {
    return {
      success: false,
      message: "Invalid payment code. Please use the last 4 digits of your phone number.\n\nExample: PAID 3300"
    };
  }
  
  // Verify user is in payment flow
  if (!userState.awaitingPayment || userState.currentFlow !== FLOWS.PAYMENT) {
    return {
      success: false,
      message: "No active payment found. Please start a new order."
    };
  }
  
  // Simulate payment verification with delay
  console.log(`Verifying payment for ${userState.phone} with code ${paymentCode}`);
  
  // In production, you would:
  // 1. Check with payment gateway
  // 2. Verify transaction ID
  // 3. Check amount matches
  // For now, we'll simulate successful verification
  
  return {
    success: true,
    message: "Payment verification successful!",
    orderId: generateOrderId(),
    verificationData: {
      code: paymentCode,
      timestamp: new Date(),
      amount: userState.selectedProduct.price
    }
  };
}

/**
 * Generate order confirmation message
 * @param {Object} product - Product object
 * @param {Object} orderData - Order details
 * @param {string} orderId - Order ID
 * @returns {string} Confirmation message
 */
function generateOrderConfirmation(product, orderData, orderId) {
  const deliveryDate = getEstimatedDeliveryDate();
  
  return `\u2705 Payment received!\n` +
         `\u{1F389} Order confirmed #${orderId}\n\n` +
         `Product: ${product.name} ${product.emoji}\n` +
         `Amount: \u20B9${product.price}\n` +
         `Customer: ${orderData.name}\n` +
         `Address: ${orderData.address}\n` +
         `Phone: ${orderData.phone}\n\n` +
         `\u{1F699} Estimated delivery: ${deliveryDate}\n\n` +
         `Thank you for shopping with SalesSaarthi! \u2728\n\n` +
         `Type MENU for more shopping`;
}

/**
 * Generate unique order ID
 * @returns {string} Order ID
 */
function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `SS${timestamp}${random}`;
}

/**
 * Get estimated delivery date
 * @returns {string} Delivery date
 */
function getEstimatedDeliveryDate() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3); // 3-5 days
  return deliveryDate.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

/**
 * Validate payment message format
 * @param {string} message - User message
 * @returns {Object} Validation result
 */
function validatePaymentMessage(message) {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Check if it's a payment confirmation
  if (!normalizedMessage.startsWith('paid')) {
    return {
      isValid: false,
      error: "Please start your message with 'PAID' followed by the last 4 digits of your phone number."
    };
  }
  
  // Extract 4-digit code
  const match = normalizedMessage.match(/(\d{4})/);
  if (!match) {
    return {
      isValid: false,
      error: "Please include the last 4 digits of your phone number.\n\nExample: PAID 3300"
    };
  }
  
  // Also check if the 4-digit code matches the last 4 digits of the phone number
  // (We'll just return it and let the controller handle verification if needed)
  return {
    isValid: true,
    code: match[1]
  };
}

/**
 * Simulate payment verification delay
 * @param {number} seconds - Delay in seconds
 * @returns {Promise} Promise that resolves after delay
 */
function simulateVerificationDelay(seconds = 3) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}

/**
 * Store order data in Firebase database
 * @param {Object} orderData - Complete order data
 * @returns {Promise<Object>} Stored order
 */
async function storeOrder(orderData) {
  try {
    const { createOrder, markOrderAsPaid } = require('./orderService');
    
    // First create the order
    const orderId = await createOrder(orderData);
    
    // Then mark it as paid since payment was successful
    await markOrderAsPaid(orderId);
    
    const order = {
      id: orderId,
      orderId: orderData.orderId,
      ...orderData,
      status: 'paid',
      paymentStatus: 'completed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Order stored in database:', order);
    return order;
  } catch (error) {
    console.error('Error storing order:', error);
    // Fallback to console log if database fails
    const order = {
      id: orderData.orderId,
      ...orderData,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Order stored (fallback):', order);
    return order;
  }
}

module.exports = {
  getPaymentSettings,
  savePaymentSettings,
  getUPIId,
  generateUPILink,
  generatePaymentDetails,
  processPaymentConfirmation,
  generateOrderConfirmation,
  generateOrderId,
  validatePaymentMessage,
  simulateVerificationDelay,
  storeOrder,
  getEstimatedDeliveryDate
};
