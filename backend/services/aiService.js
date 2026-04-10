/**
 * AI Service
 * Enhanced AI integration with proper error handling and fallbacks
 */

const Groq = require('groq-sdk');

class AIService {
  constructor() {
    this.groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
    this.fallbackResponses = [
      "I'm here to help you shop! Try: 1. Products 2. Offers 3. Help",
      "Let me help you find what you need! 1. View Products 2. Get Offers 3. Support",
      "I can assist you with shopping! 1. Browse Products 2. Special Offers 3. Get Help"
    ];
  }

  /**
   * Generate AI response with robust error handling
   * @param {string} message - User message
   * @param {Array} products - Available products
   * @param {Object} userState - Current user state
   * @returns {Promise<string>} AI response
   */
  async generateResponse(message, products = [], userState = {}) {
    try {
      // Check if Groq client is available
      if (!this.groq) {
        console.warn('Groq client not initialized, using fallback');
        return this.getFallbackResponse();
      }

      const systemPrompt = this.buildSystemPrompt(products, userState);
      
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'llama3-70b-8192',
        temperature: 0.7,
        max_tokens: 150,
        timeout: 5000 // 5 second timeout
      });

      const response = chatCompletion.choices[0]?.message?.content;
      
      if (!response || response.trim().length === 0) {
        return this.getFallbackResponse();
      }

      // Validate response length for WhatsApp
      if (response.length > 160) {
        return response.substring(0, 157) + '...';
      }

      return response;

    } catch (error) {
      console.error('AI Service Error:', error.message);
      
      // Different fallbacks based on error type
      if (error.code === 'insufficient_quota') {
        return "I'm experiencing high demand right now. Please try the menu options:\n1\u20e3\ufe0f Products\n2\u20e3\ufe0f Offers\n3\u20e3\ufe0f Help";
      }
      
      if (error.code === 'timeout') {
        return "Taking too long to respond! Try:\n1\u20e3\ufe0f Products\n2\u20e3\ufe0f Offers\n3\u20e3\ufe0f Help";
      }

      return this.getFallbackResponse();
    }
  }

  /**
   * Build system prompt based on context
   * @param {Array} products - Available products
   * @param {Object} userState - User state
   * @returns {string} System prompt
   */
  buildSystemPrompt(products, userState) {
    const productInfo = products.length > 0 
      ? products.map(p => `${p.name} - \u20b9${p.price} (${p.stock} in stock)`).join(', ')
      : 'No products available';

    let prompt = `You are a smart WhatsApp sales assistant for a small business. Be friendly, helpful, and brief.

Available products: ${productInfo}

Current conversation stage: ${userState.stage || 'home'}

Guidelines:
- Keep responses under 160 characters (WhatsApp limit)
- Be conversational and friendly
- Use emojis occasionally
- If user asks about products, mention specific items
- If asked about pricing, provide exact prices
- Guide users toward purchase decisions
- If user wants to buy, ask for name and address
- Always include a clear call to action
- If you don't understand, suggest using menu options

Examples:
- "Hi! Welcome! \ud83d\ude0a What can I help you find today?"
- "Great choice! That's \u20b9299. Ready to order?"
- "I can help with that! Try our menu options."`;

    return prompt;
  }

  /**
   * Get fallback response
   * @returns {string} Fallback response
   */
  getFallbackResponse() {
    const randomIndex = Math.floor(Math.random() * this.fallbackResponses.length);
    return this.fallbackResponses[randomIndex];
  }

  /**
   * Check if AI service is available
   * @returns {Promise<boolean>} Service availability
   */
  async isAvailable() {
    try {
      if (!this.groq) {
        return false;
      }

      // Test with a simple request
      await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: 'llama3-70b-8192',
        max_tokens: 1,
        timeout: 3000
      });

      return true;
    } catch (error) {
      console.error('AI Service availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate product recommendation
   * @param {Array} products - Available products
   * @param {string} userPreference - User preference
   * @returns {Promise<string>} Recommendation
   */
  async getProductRecommendation(products, userPreference = '') {
    if (products.length === 0) {
      return "Sorry, no products available right now.";
    }

    try {
      const productInfo = products.map(p => `${p.name} - \u20b9${p.price}: ${p.description}`).join('\n');
      
      const prompt = `Based on this preference: "${userPreference}", recommend the best product from:

${productInfo}

Respond with just the product name and a brief reason (under 100 characters).`;

      const response = await this.generateResponse(prompt, products);
      return response;

    } catch (error) {
      console.error('Recommendation error:', error);
      // Fallback to first available product
      return `Try ${products[0].name} - \u20b9${products[0].price}. Great choice!`;
    }
  }

  /**
   * Generate order confirmation message
   * @param {Object} orderDetails - Order details
   * @returns {Promise<string>} Confirmation message
   */
  async generateOrderConfirmation(orderDetails) {
    try {
      const prompt = `Generate a friendly order confirmation for:
Product: ${orderDetails.productName}
Name: ${orderDetails.name}
Address: ${orderDetails.address}

Keep it under 160 characters, include an emoji, and mention delivery confirmation.`;

      const response = await this.generateResponse(prompt, []);
      return response;

    } catch (error) {
      console.error('Order confirmation error:', error);
      return `Order confirmed! \ud83c\udf89 We'll contact you soon for delivery of ${orderDetails.productName}.`;
    }
  }
}

module.exports = new AIService();
