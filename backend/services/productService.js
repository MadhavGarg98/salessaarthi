/**
 * Dynamic Product Service for WhatsApp AI Sales Assistant
 * Fetches products from database with proper error handling
 */

const { db } = require('../firebase');

// Memory cache for products
let productCache = null;
let productCacheTime = 0;
const CACHE_DURATION = 60000; // 60 seconds

/**
 * Fetch all products from database
 * @returns {Promise<Array>} Array of products
 */
async function getAllProducts() {
  try {
    // Use cache if available and fresh
    const now = Date.now();
    if (productCache && (now - productCacheTime) < CACHE_DURATION) {
      return productCache;
    }
    
    // Fetch fresh data from database
    const productsSnapshot = await db.collection('products').get();
    
    if (productsSnapshot.empty) {
      // Use fallback data and cache it
      const fallbackProducts = getDefaultProducts();
      productCache = fallbackProducts;
      productCacheTime = now;
      return fallbackProducts;
    }
    
    const products = [];
    const seenProducts = new Set(); // Track unique products
    
    productsSnapshot.forEach(doc => {
      const productData = doc.data();
      const productKey = `${productData.name}_${productData.price}`; // Unique key
      
      // Skip duplicates
      if (seenProducts.has(productKey)) {
        return;
      }
      
      seenProducts.add(productKey);
      
      products.push({
        id: productData.id || doc.id,
        name: productData.name || 'Unknown Product',
        price: productData.price || 0,
        stock: productData.stock || 0,
        description: productData.description || 'No description available',
        category: productData.category || 'General',
        emoji: productData.emoji || '📦',
        keywords: productData.keywords || []
      });
    });
    
    // Update cache
    productCache = products;
    productCacheTime = now;
    
    return products;
    
  } catch (error) {
    // Return cache fallback on error
    if (productCache) {
      return productCache;
    }
    return getDefaultProducts();
  }
}

/**
 * Get default products as fallback
 * @returns {Array} Default product array
 */
function getDefaultProducts() {
  return [
    {
      id: 1,
      name: 'Bluetooth Speaker',
      keywords: ['speaker', 'bluetooth', 'audio', 'sound', 'music', '1'],
      price: 1999,
      emoji: '\u{1F50A}',
      stock: 2,
      description: 'Premium wireless speaker with amazing sound quality',
      category: 'Electronics'
    },
    {
      id: 2,
      name: 'iPhone 17',
      keywords: ['iphone', 'apple', 'phone', 'mobile', '2'],
      price: 100000,
      emoji: '\u{1F4F1}',
      stock: 5,
      description: 'Latest iPhone with cutting-edge features',
      category: 'Electronics'
    },
    {
      id: 3,
      name: 'Laptop Pro',
      keywords: ['laptop', 'computer', 'pc', 'macbook', '3'],
      price: 75000,
      emoji: '\u{1F4BB}',
      stock: 3,
      description: 'High-performance laptop for professionals',
      category: 'Electronics'
    },
    {
      id: 4,
      name: 'Smart Watch',
      keywords: ['watch', 'smartwatch', 'wearable', 'fitness', '4'],
      price: 15000,
      emoji: '\u{231A}',
      stock: 8,
      description: 'Advanced fitness and health tracking',
      category: 'Electronics'
    },
    {
      id: 5,
      name: 'Wireless Earbuds',
      keywords: ['earbuds', 'earphones', 'headphones', 'airpods', '5'],
      price: 5000,
      emoji: '\u{1F3A7}',
      stock: 12,
      description: 'Premium wireless earbuds with noise cancellation',
      category: 'Electronics'
    },
    {
      id: 6,
      name: 'USB-C Hub',
      keywords: ['usb', 'hub', 'adapter', 'connector', '6'],
      price: 1299,
      emoji: '\u{1F527}',
      stock: 2,
      description: 'Multi-port USB-C hub with fast charging',
      category: 'Accessories'
    }
  ];
}

/**
 * Get product by ID
 * @param {number} id - Product ID
 * @returns {Promise<Object|null>} Product object or null
 */
async function getProductById(id) {
  try {
    const products = await getAllProducts();
    return products.find(product => product.id === parseInt(id)) || null;
  } catch (error) {
    // Try cache fallback
    if (productCache) {
      return productCache.find(product => product.id === parseInt(id)) || null;
    }
    return null;
  }
}

/**
 * Search products by keyword
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} Array of matching products
 */
async function searchProducts(keyword) {
  try {
    const products = await getAllProducts();
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    return products.filter(product => {
      // Fast exact match first
      if (product.name.toLowerCase() === normalizedKeyword) {
        return true;
      }
      
      // Check in name
      if (product.name.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      
      // Check in keywords (fast)
      for (const k of product.keywords) {
        if (k === normalizedKeyword || k.includes(normalizedKeyword) || normalizedKeyword.includes(k)) {
          return true;
        }
      }
      
      // Check in description
      if (product.description.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      
      // Check in category
      if (product.category.toLowerCase().includes(normalizedKeyword)) {
        return true;
      }
      
      return false;
    });
  } catch (error) {
    // Try cache fallback
    if (productCache) {
      const normalizedKeyword = keyword.toLowerCase().trim();
      return productCache.filter(product => {
        return product.name.toLowerCase().includes(normalizedKeyword) ||
               product.keywords.some(k => k.includes(normalizedKeyword)) ||
               product.description.toLowerCase().includes(normalizedKeyword) ||
               product.category.toLowerCase().includes(normalizedKeyword);
      });
    }
    return [];
  }
}

/**
 * Update product stock
 * @param {number} productId - Product ID
 * @param {number} newStock - New stock quantity
 * @returns {Promise<boolean>} Success status
 */
async function updateProductStock(productId, newStock) {
  try {
    const productRef = db.collection('products').doc(productId.toString());
    await productRef.update({ 
      stock: newStock,
      updatedAt: new Date()
    });
    
    console.log(`Updated stock for product ${productId} to ${newStock}`);
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    return false;
  }
}

/**
 * Get products with low stock
 * @param {number} threshold - Stock threshold
 * @returns {Promise<Array>} Array of low stock products
 */
async function getLowStockProducts(threshold = 3) {
  try {
    const products = await getAllProducts();
    return products.filter(product => product.stock <= threshold);
  } catch (error) {
    // Try cache fallback
    if (productCache) {
      return productCache.filter(product => product.stock <= threshold);
    }
    return [];
  }
}

/**
 * Clear product cache (if using caching)
 */
function clearCache() {
  productCache = null;
  productCacheTime = 0;
}

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  updateProductStock,
  getLowStockProducts,
  getDefaultProducts,
  clearCache
};
