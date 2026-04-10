/**
 * Production-Quality WhatsApp Message Formatter
 * Creates business-grade messages with proper formatting and emojis
 */

class MessageFormatter {
  /**
   * Format welcome message with business feel
   * @returns {string} Formatted welcome message
   */
  static getWelcomeMessage() {
    return `*Welcome to SalesSaarthi!* 

Your personal shopping assistant is here! 

*What would you like to do?*

1. Browse Products
2. Special Offers  
3. Track Order
4. Customer Support

Just reply with a number or type what you need!`;
  }

  /**
   * Format product list with WhatsApp-friendly layout
   * @param {Array} products - Product array
   * @returns {string} Formatted product list
   */
  static formatProductList(products) {
    if (!products || products.length === 0) {
      return `*Sorry!* 

No products available at the moment. 
Please try again later or type *offers* for deals!`;
    }

    let message = `*Our Products:*\n\n`;
    
    products.forEach((product, index) => {
      const emoji = this.getProductEmoji(product.category);
      const stockInfo = product.stock <= 3 ? ` (Only ${product.stock} left!)` : '';
      
      message += `${index + 1}. ${emoji} *${product.name}* - *${this.formatPrice(product.price)}*\n`;
      message += `   ${product.description}${stockInfo}\n\n`;
    });

    message += `*Reply with product number (1-${products.length}) to order!*`;
    return message;
  }

  /**
   * Format product details with business layout
   * @param {Object} product - Product object
   * @returns {string} Formatted product details
   */
  static formatProductDetails(product) {
    const emoji = this.getProductEmoji(product.category);
    const stockInfo = product.stock <= 3 ? ` (Only ${product.stock} left!)` : ` (${product.stock} available)`;
    
    return `${emoji} *${product.name}* - *${this.formatPrice(product.price)}*

${product.description}

*Stock:* ${stockInfo}

*Options:*
1. Buy Now
2. Get Discount
3. Back to Products

Reply with option number!`;
  }

  /**
   * Format order collection message
   * @param {Object} product - Selected product
   * @returns {string} Order collection message
   */
  static getOrderCollectionMessage(product) {
    return `*Great Choice!* 

You selected: *${product.name}* (${this.formatPrice(product.price)})

*Please provide your details:*

1. Full Name
2. Complete Delivery Address  
3. Phone Number

*Example:* 
John Doe, 123 Main Street, Delhi, 9876543210

Type all details in one message or reply *cancel* to go back.`;
  }

  /**
   * Format payment message
   * @param {Object} orderData - Order details
   * @returns {string} Payment message
   */
  static getPaymentMessage(orderData) {
    return `*Complete Payment*

*Order Details:*
Product: ${orderData.product.name}
Amount: ${this.formatPrice(orderData.product.price)}
Name: ${orderData.name}

*Payment Options:*

1. UPI: upi://pay?pa=sales@ybl&pn=SalesSaarthi&am=${orderData.product.price}&cu=INR

2. Scan QR Code (attached)

3. Bank Transfer: Account details sent on request

*After payment, reply:* PAID

*Need help?* Reply: HELP`;
  }

  /**
   * Format order confirmation
   * @param {Object} orderData - Order details
   * @returns {string} Order confirmation message
   */
  static getOrderConfirmation(orderData) {
    return `*Payment Received! Thank you!* 

*Order Confirmed* #${orderData.orderId || 'Processing'}

*Product:* ${orderData.product.name}
*Amount:* ${this.formatPrice(orderData.product.price)}
*Delivery:* ${orderData.address}

*Estimated Delivery:* 3-5 business days

*Track Order:* Reply TRACK
*Customer Support:* Reply HELP

*Shop Again:* Reply MENU`;
  }

  /**
   * Format special offers message
   * @returns {string} Offers message
   */
  static getOffersMessage() {
    return `*Special Offers!* 

1. *First Order Discount* 
   Flat 10% OFF on your first purchase! 

2. *Free Delivery* 
   On orders above ${this.formatPrice(500)}

3. *Buy 2 Get 1 Free* 
   On selected electronics

4. *Refer & Earn* 
   Get ${this.formatPrice(100)} for each friend referral!

*Type offer number (1-4) for details*
*Or reply MENU to browse products*`;
  }

  /**
   * Format help message
   * @returns {string} Help message
   */
  static getHelpMessage() {
    return `*How can I help you?*

1. *Track Order* - Check delivery status
2. *Return/Refund* - Easy returns & refunds  
3. *Product Support* - Technical help
4. *Payment Issues* - Payment assistance
5. *Contact Agent* - Talk to our team
6. *Main Menu* - Back to products

*Type option number or describe your issue*`;
  }

  /**
   * Format error message
   * @returns {string} Error message
   */
  static getErrorMessage() {
    return `*Sorry!* 

I'm having some technical issues right now. 

Please try:
1. Browse Products
2. Special Offers
3. Customer Support

Or type what you need - I'll do my best to help!`;
  }

  /**
   * Get emoji for product category
   * @param {string} category - Product category
   * @returns {string} Category emoji
   */
  static getProductEmoji(category) {
    const emojiMap = {
      'electronics': ' ',
      'mobile': ' ',
      'laptop': ' ',
      'headphones': ' ',
      'speaker': ' ',
      'watch': ' ',
      'accessories': ' ',
      'clothing': ' ',
      'shoes': ' ',
      'books': ' ',
      'home': ' ',
      'beauty': ' ',
      'sports': ' ',
      'toys': ' ',
      'food': ' ',
      'default': ' '
    };
    
    return emojiMap[category?.toLowerCase()] || emojiMap.default;
  }

  /**
   * Format price with Indian Rupee symbol
   * @param {number} price - Price amount
   * @returns {string} Formatted price
   */
  static formatPrice(price) {
    return `Rs.${price.toLocaleString('en-IN')}`;
  }

  /**
   * Format fallback message
   * @returns {string} Fallback message
   */
  static getFallbackMessage() {
    return `*I didn't understand that* 

Try these options:
1. Browse Products
2. Special Offers
3. Track Order
4. Customer Support

Or just tell me what you're looking for!`;
  }
}

module.exports = MessageFormatter;
