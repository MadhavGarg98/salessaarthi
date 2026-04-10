const aiService = require('./aiService');

/**
 * Generate AI response using enhanced AI Service
 * @param {string} message - User message
 * @param {Array} products - List of products
 * @returns {Promise<string>} AI response
 */
const generateAIResponse = async (message, products = []) => {
  return await aiService.generateResponse(message, products, {});
};

module.exports = { generateAIResponse };
