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
    // Clean the phone number (remove any non-digits, except '+' if present)
    let cleanPhone = to.trim();
    
    // Check if it already has 'whatsapp:' prefix and extract the number part
    if (cleanPhone.startsWith('whatsapp:')) {
      cleanPhone = cleanPhone.replace('whatsapp:', '');
    }
    
    // Remove all non-numeric characters except leading plus
    const hasPlus = cleanPhone.startsWith('+');
    cleanPhone = cleanPhone.replace(/\D/g, '');
    if (hasPlus) {
      cleanPhone = '+' + cleanPhone;
    }
    
    // If it's a 10-digit number, prepend the Indian country code +91
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }
    
    const recipient = `whatsapp:${cleanPhone}`;
    
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
