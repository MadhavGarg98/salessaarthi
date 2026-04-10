/**
 * Production-Ready WhatsApp AI Sales Assistant Controller
 * Complete implementation with human-like conversation and payment processing
 */

const { sendWhatsAppMessage } = require('../services/twilioService');
const { getUserState, updateUserState } = require('../services/stateService');
const { detectIntent } = require('../services/intentService');
const { generateResponse } = require('../services/conversationService');
const { 
  processPaymentConfirmation, 
  validatePaymentMessage,
  simulateVerificationDelay,
  generateOrderConfirmation,
  storeOrder
} = require('../services/paymentService');

/**
 * Handle incoming WhatsApp webhook
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const handleWebhook = async (req, res) => {
  try {
    const { Body, From } = req.body;
    
    // Validate required parameters
    if (!Body || !From) {
      res.set('Content-Type', 'text/xml');
      return res.send('<Response></Response>');
    }

    const userPhone = From.replace('whatsapp:', '').replace(/^\+/, '');
    const message = Body.trim();
    const normalizedMessage = message.toLowerCase().trim();

    // Minimal logging for performance
    console.log(`MSG: ${userPhone}: "${message}"`);

    // Get current user state
    const userState = getUserState(userPhone);

    let response;
    let shouldUpdateState = true;

    // Early returns for fast commands
    if (normalizedMessage === 'menu' || normalizedMessage === 'start' || normalizedMessage === 'home') {
      await sendWhatsAppMessage(userPhone, "Got it! 👍");
      const intent = { type: 'MENU', data: null };
      const result = await generateResponse(intent, userState, message);
      if (result.stateUpdates) updateUserState(userPhone, result.stateUpdates);
      await sendWhatsAppMessage(userPhone, result.message);
      return res.set('Content-Type', 'text/xml').send('<Response></Response>');
    }

    if (normalizedMessage === 'cancel' || normalizedMessage === 'stop' || normalizedMessage === 'exit') {
      await sendWhatsAppMessage(userPhone, "Got it! 👍");
      const intent = { type: 'CANCEL', data: null };
      const result = await generateResponse(intent, userState, message);
      if (result.stateUpdates) updateUserState(userPhone, result.stateUpdates);
      await sendWhatsAppMessage(userPhone, result.message);
      return res.set('Content-Type', 'text/xml').send('<Response></Response>');
    }

    // Send instant acknowledgement for heavy operations
    const needsInstantResponse = userState.step === 'PAYMENT_VERIFYING' || 
                              normalizedMessage.includes('buy') || 
                              normalizedMessage.includes('order') ||
                              normalizedMessage.length > 20;

    if (needsInstantResponse) {
      // Send instant response without waiting
      sendWhatsAppMessage(userPhone, "Got it! 👍 Processing...").catch(() => {});
    }

    // Handle payment verification delay
    if (userState.step === 'PAYMENT_VERIFYING') {
      await simulateVerificationDelay(3);
      
      // Process payment confirmation
      const validation = validatePaymentMessage(message);
      if (!validation.isValid) {
        response = validation.error;
      } else {
        const paymentResult = await processPaymentConfirmation(validation.code, userState);
        
        if (paymentResult.success) {
          // Create order confirmation
          const orderData = {
            orderId: paymentResult.orderId,
            product: userState.selectedProduct,
            name: userState.tempData.name,
            address: userState.tempData.address,
            phone: userState.tempData.phone,
            amount: userState.selectedProduct.price
          };
          
          // Store order
          storeOrder(orderData);
          
          // Generate confirmation message
          response = generateOrderConfirmation(
            userState.selectedProduct,
            orderData,
            paymentResult.orderId
          );
          
          // Reset state after successful order
          updateUserState(userPhone, {
            currentFlow: 'MENU',
            step: 'MENU_MAIN',
            selectedProduct: null,
            awaitingPayment: false,
            tempData: {}
          });
          shouldUpdateState = false; // Already updated above
        } else {
          response = paymentResult.message;
        }
      }
    } else {
      // Parallel execution for intent detection and response generation
      const [intent, result] = await Promise.all([
        detectIntent(message, userState),
        generateResponse({ type: 'UNKNOWN', data: null }, userState, message)
      ]);
      
      // Generate proper response if intent was detected
      const finalResult = intent.type !== 'UNKNOWN' ? 
        await generateResponse(intent, userState, message) : result;
      
      response = finalResult.message;
      
      // Update state if needed
      if (shouldUpdateState && finalResult.stateUpdates) {
        updateUserState(userPhone, finalResult.stateUpdates);
      }
    }

    // Add natural delay only after instant response (optional UX improvement)
    if (needsInstantResponse) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms natural delay
    }

    // Send response via Twilio
    await sendWhatsAppMessage(userPhone, response);

    // Return empty TwiML response
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');

  } catch (error) {
    // Minimal error logging for performance
    console.error('Webhook error:', error.message);
    
    // Send error message to user (non-blocking)
    const userPhone = req.body.From?.replace('whatsapp:', '').replace(/^\+/, '');
    if (userPhone) {
      sendWhatsAppMessage(
        userPhone, 
        "Sorry, I'm having trouble right now. Please try again in a moment. ð\x9f\x98\x94"
      ).catch(() => {});
    }
    
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }
};

/**
 * Simulate typing delay for human-like experience
 * @param {number} ms - Delay in milliseconds
 */
function simulateTypingDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle webhook verification (GET request for Twilio)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const handleWebhookVerification = (req, res) => {
  res.send('WhatsApp webhook endpoint is active and ready! ð');
};

/**
 * Health check for webhook service
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const webhookHealthCheck = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WhatsApp AI Sales Assistant',
    version: '2.0.0',
    features: [
      'Human-like conversation',
      'UPI payment processing',
      'Order management',
      'State tracking',
      'Product catalog'
    ],
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  handleWebhook,
  handleWebhookVerification,
  webhookHealthCheck
};
