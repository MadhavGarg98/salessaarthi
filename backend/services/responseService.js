/**
 * Response Service
 * Handles structured message responses with number-based options
 */

class ResponseService {
  constructor() {
    this.responses = {
      welcome: "Welcome to our store! Choose an option: 1. View Products 2. Get Offers 3. Help 4. Talk to Agent",
      
      products: `Here are our available products:

{productList}

Reply with the product number to order or type "menu" to go back.`,

      productDetails: "Product Details: {name} Price: {price} {description} {stockInfo} Reply with: 1. Buy Now 2. More Products 3. Menu",

      order: `Great choice! To complete your order:

Please provide:
1. Your full name
2. Delivery address
3. Phone number (for confirmation)

Reply with all details or type "menu" to go back.`,

      offers: "Special Offers: 1. Flat 10% off on first order 2. Free delivery on orders above 500 3. Buy 2 Get 1 Free on selected items. Type menu to see products or reply with offer number to know more!",

      help: "How can I help you? 1. Order Status 2. Return/Refund 3. Contact Support 4. Products 5. Menu",

      fallback: "I'm here to help with shopping. Try: 1. Products 2. Offers 3. Help or describe what you're looking for!",

      error: "Sorry, I'm having trouble connecting right now. Try: 1. Products 2. Offers 3. Help",

      goodbye: "Thank you for visiting! Shop again soon! Type hi to start a new conversation.",

      orderConfirmation: "Order Confirmed! Order Details: Product: {productName} Name: {name} Address: {address} We'll contact you soon for delivery confirmation. Type menu to continue shopping."
    };
  }

  /**
   * Get welcome message
   * @returns {string} Welcome message
   */
  getWelcomeMessage() {
    return this.responses.welcome;
  }

  /**
   * Format product list
   * @param {Array} products - Product list
   * @returns {string} Formatted product list
   */
  formatProductList(products) {
    if (products.length === 0) {
      return 'Sorry, no products available right now.';
    }

    let productList = '';
    products.forEach((product, index) => {
      const stockInfo = product.stock <= 3 ? `\u26a0\ufe0f Only ${product.stock} left!` : '';
      productList += `${index + 1}. ${product.name} - \u20b9${product.price} ${stockInfo}\n`;
      productList += `   ${product.description}\n\n`;
    });

    return this.responses.products.replace('{productList}', productList);
  }

  /**
   * Format product details
   * @param {Object} product - Product object
   * @returns {string} Formatted product details
   */
  formatProductDetails(product) {
    const stockInfo = product.stock <= 3 ? `\u26a0\ufe0f Only ${product.stock} left! Hurry up!` : `\u2705 In stock (${product.stock} available)`;
    
    return this.responses.productDetails
      .replace('{name}', product.name)
      .replace('{price}', product.price)
      .replace('{description}', product.description)
      .replace('{stockInfo}', stockInfo);
  }

  /**
   * Get offers message
   * @returns {string} Offers message
   */
  getOffersMessage() {
    return this.responses.offers;
  }

  /**
   * Get help message
   * @returns {string} Help message
   */
  getHelpMessage() {
    return this.responses.help;
  }

  /**
   * Get fallback message
   * @returns {string} Fallback message
   */
  getFallbackMessage() {
    return this.responses.fallback;
  }

  /**
   * Get error message
   * @returns {string} Error message
   */
  getErrorMessage() {
    return this.responses.error;
  }

  /**
   * Get goodbye message
   * @returns {string} Goodbye message
   */
  getGoodbyeMessage() {
    return this.responses.goodbye;
  }

  /**
   * Get order message
   * @returns {string} Order message
   */
  getOrderMessage() {
    return this.responses.order;
  }

  /**
   * Get order confirmation message
   * @param {Object} orderData - Order details
   * @returns {string} Order confirmation message
   */
  getOrderConfirmationMessage(orderData) {
    return this.responses.orderConfirmation
      .replace('{productName}', orderData.productName)
      .replace('{name}', orderData.name)
      .replace('{address}', orderData.address);
  }

  /**
   * Handle number-based responses
   * @param {number} number - Selected number
   * @param {string} context - Current context
   * @param {Array} products - Available products
   * @returns {Object} Response with action
   */
  handleNumberResponse(number, context, products = []) {
    const response = { message: '', action: null, data: null };

    switch (context) {
      case 'welcome':
        switch (number) {
          case 1:
            response.message = this.formatProductList(products);
            response.action = 'show_products';
            break;
          case 2:
            response.message = this.getOffersMessage();
            response.action = 'show_offers';
            break;
          case 3:
            response.message = this.getHelpMessage();
            response.action = 'show_help';
            break;
          case 4:
            response.message = 'Connecting you to our agent... They will reply shortly.';
            response.action = 'contact_agent';
            break;
          default:
            response.message = this.getFallbackMessage();
        }
        break;

      case 'products':
        if (number >= 1 && number <= products.length) {
          const product = products[number - 1];
          response.message = this.formatProductDetails(product);
          response.action = 'show_product_details';
          response.data = product;
        } else {
          response.message = 'Invalid product number. Please try again.';
        }
        break;

      case 'product_details':
        switch (number) {
          case 1:
            response.message = this.getOrderMessage();
            response.action = 'start_order';
            break;
          case 2:
            response.message = this.formatProductList(products);
            response.action = 'show_products';
            break;
          case 3:
            response.message = this.getWelcomeMessage();
            response.action = 'show_menu';
            break;
          default:
            response.message = this.getFallbackMessage();
        }
        break;

      default:
        response.message = this.getFallbackMessage();
    }

    return response;
  }
}

module.exports = new ResponseService();
