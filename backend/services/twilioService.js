const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send WhatsApp message via Twilio
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} Twilio response
 */
const sendWhatsAppMessage = async (to, message) => {
  try {
    // Check if 'to' already contains 'whatsapp:' prefix
    const recipient = to.includes('whatsapp:') ? to : `whatsapp:${to}`;
    
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: recipient
    });
    
    console.log(`Message sent to ${recipient}: ${response.sid}`);
    return response;
  } catch (error) {
    console.error('Twilio Error:', error);
    throw error;
  }
};

/**
 * Generate TwiML response for WhatsApp
 * @param {string} message - Response message
 * @returns {string} TwiML formatted response
 */
const generateTwiMLResponse = (message) => {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
};

module.exports = { sendWhatsAppMessage, generateTwiMLResponse };
