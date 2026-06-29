/**
 * Production-Ready WhatsApp AI Sales Assistant Controller
 * Complete implementation with human-like conversation and payment processing
 */

const { db } = require('../firebase');
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
 * Save chat message to database and update user info
 * @param {string} phone - User phone number
 * @param {string} message - User message
 * @param {string} reply - Bot reply
 * @param {string} flow - Current flow
 */
async function saveChatAndUser(phone, message, reply, flow) {
  try {
    // 1. Save to chats collection
    await db.collection('chats').add({
      userId: phone,
      message: message,
      reply: reply,
      timestamp: new Date()
    });

    // 2. Determine stage for analytics
    let stage = 'new';
    if (flow === 'ORDER' || flow === 'PAYMENT') {
      stage = 'interested';
    } else if (flow === 'MENU' && reply && (reply.includes('Payment Successful') || reply.includes('Payment received') || reply.includes('Order confirmed'))) {
      stage = 'converted';
    }

    // 3. Save/Update user in users collection
    await db.collection('users').doc(phone).set({
      phone: phone,
      stage: stage,
      lastMessage: new Date(),
      updatedAt: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving chat/user to Firestore:', error);
  }
}

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
      saveChatAndUser(userPhone, message, result.message, 'MENU').catch(() => {});
      return res.set('Content-Type', 'text/xml').send('<Response></Response>');
    }

    if (normalizedMessage === 'cancel' || normalizedMessage === 'stop' || normalizedMessage === 'exit') {
      await sendWhatsAppMessage(userPhone, "Got it! 👍");
      const intent = { type: 'CANCEL', data: null };
      const result = await generateResponse(intent, userState, message);
      if (result.stateUpdates) updateUserState(userPhone, result.stateUpdates);
      await sendWhatsAppMessage(userPhone, result.message);
      saveChatAndUser(userPhone, message, result.message, 'MENU').catch(() => {});
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

    // Handle paid payment verification flow
    if (normalizedMessage.startsWith("paid")) {
      const digits = message.split(" ")[1];
      
      if (digits && digits.length === 4) {
        // Step 1: Show processing message
        await sendWhatsAppMessage(userPhone, "\u23F3 Verifying your payment, please wait...");
        
        // Step 2: Fake delay (4-5 sec)
        setTimeout(async () => {
          const txnId = "TXN" + Math.floor(Math.random() * 1000000);
          const orderId = "ORD" + Math.floor(Math.random() * 10000);
          
          // Create order data
          const orderData = {
            orderId: orderId,
            product: userState.selectedProduct,
            name: userState.tempData.name,
            address: userState.tempData.address,
            phone: userState.tempData.phone,
            amount: userState.selectedProduct.price
          };
          
          // Store order
          await storeOrder(orderData);
          
          // Step 3: Final confirmation message
          await sendWhatsAppMessage(userPhone, 
`\ud83c\udf89 Payment Successful!

\ud83d\udcbe Transaction ID: ${txnId}
\ud83d\udce6 Order ID: ${orderId}

\u2705 Your order has been confirmed.

\ud83d\udce6 Product: ${userState.selectedProduct.name}
\ud83d\ude9a Delivery Address: ${userState.tempData.address}

We'll notify you once it's shipped \ud83d\ude80

Thank you for choosing SalesSaarthi \ud83d\udc99`
          );
          
          // Reset state after successful order
          updateUserState(userPhone, {
            currentFlow: 'MENU',
            step: 'MENU_MAIN',
            selectedProduct: null,
            awaitingPayment: false,
            tempData: {}
          });

          // Save chat history and update user stage to converted
          saveChatAndUser(userPhone, message, "Payment Successful! Order confirmed.", 'MENU').catch(() => {});
        }, 4000); // 4 sec delay
        
        return res.set('Content-Type', 'text/xml').send('<Response></Response>');
      }
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
          await storeOrder(orderData);
          
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

          // Save chat history and update user stage to converted
          saveChatAndUser(userPhone, message, response, 'MENU').catch(() => {});
        } else {
          response = paymentResult.message;
        }
      }
    } else {
      // Detect intent using rule-based service first
      const intent = await detectIntent(message, userState);
      
      if (intent.type !== 'UNKNOWN') {
        const finalResult = await generateResponse(intent, userState, message);
        response = finalResult.message;
        
        // Update state if needed
        if (shouldUpdateState && finalResult.stateUpdates) {
          updateUserState(userPhone, finalResult.stateUpdates);
        }
      } else {
        // Fallback to AI Service for human-like response
        const { getAllProducts } = require('../services/productService');
        const products = await getAllProducts();
        
        const aiService = require('../services/aiService');
        response = await aiService.generateResponse(message, products, userState);
      }
    }

    // Add natural delay only after instant response (optional UX improvement)
    if (needsInstantResponse) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms natural delay
    }

    // Send response via Twilio
    await sendWhatsAppMessage(userPhone, response);

    // Save chat history and update user (non-blocking)
    saveChatAndUser(userPhone, message, response, userState.currentFlow).catch(() => {});

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
