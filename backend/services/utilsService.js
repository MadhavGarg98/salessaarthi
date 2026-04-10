/**
 * Utility Service for WhatsApp AI Sales Assistant
 * Common helper functions and utilities
 */

/**
 * Add human-like typing delay
 * @param {number} length - Message length
 * @returns {number} Delay in milliseconds
 */
function calculateTypingDelay(length) {
  // Humans type roughly 200 characters per minute
  const baseDelay = Math.min(length * 20, 3000); // Max 3 seconds
  const randomVariation = Math.random() * 500; // Add 0-500ms variation
  
  return Math.floor(baseDelay + randomVariation);
}

/**
 * Format currency for Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Generate random order ID
 * @returns {string} Order ID
 */
function generateOrderId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `SS${timestamp}${random}`;
}

/**
 * Clean and normalize phone number
 * @param {string} phone - Phone number
 * @returns {string} Cleaned phone number
 */
function cleanPhoneNumber(phone) {
  return phone.replace(/[^0-9]/g, '').slice(-10);
}

/**
 * Validate Indian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Valid phone number
 */
function validateIndianPhone(phone) {
  const cleaned = cleanPhoneNumber(phone);
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Add urgency indicator based on stock
 * @param {number} stock - Stock quantity
 * @returns {string} Urgency emoji
 */
function getUrgencyIndicator(stock) {
  if (stock <= 2) return 'ð¥';
  if (stock <= 5) return 'â¡';
  return '';
}

/**
 * Format delivery date
 * @param {Date} date - Delivery date
 * @returns {string} Formatted date
 */
function formatDeliveryDate(date) {
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

/**
 * Generate random delivery date (3-5 days from now)
 * @returns {Date} Delivery date
 */
function generateDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 3) + 3);
  return date;
}

/**
 * Escape special characters for WhatsApp
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeWhatsAppText(text) {
  return text.replace(/[*_`]/g, '\\$&');
}

/**
 * Truncate text for display
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate random delay for human-like behavior
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 * @returns {number} Random delay
 */
function randomDelay(min = 500, max = 2000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if message is a command
 * @param {string} message - Message to check
 * @returns {boolean} Is command
 */
function isCommand(message) {
  const commands = ['menu', 'cancel', 'help', 'track', 'paid'];
  return commands.some(cmd => message.toLowerCase().trim() === cmd);
}

/**
 * Extract product keywords from message
 * @param {string} message - User message
 * @returns {Array} Array of keywords
 */
function extractKeywords(message) {
  const keywords = message.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Calculate similarity between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Format message with emojis naturally
 * @param {string} message - Original message
 * @returns {string} Message with emojis
 */
function addNaturalEmojis(message) {
  const emojiMap = {
    'welcome': 'ð',
    'thanks': 'ð',
    'sorry': 'ð',
    'great': 'ð',
    'awesome': 'ð',
    'order': 'ð¦',
    'payment': 'ð³',
    'delivery': 'ð',
    'help': 'ð',
    'support': 'ð¤',
    'success': 'â',
    'error': 'â',
    'warning': 'â ï¸'
  };
  
  let formattedMessage = message;
  
  for (const [word, emoji] of Object.entries(emojiMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    formattedMessage = formattedMessage.replace(regex, `${word} ${emoji}`);
  }
  
  return formattedMessage;
}

module.exports = {
  calculateTypingDelay,
  formatCurrency,
  generateOrderId,
  cleanPhoneNumber,
  validateIndianPhone,
  getUrgencyIndicator,
  formatDeliveryDate,
  generateDeliveryDate,
  escapeWhatsAppText,
  truncateText,
  randomDelay,
  isCommand,
  extractKeywords,
  calculateSimilarity,
  addNaturalEmojis,
  levenshteinDistance
};
