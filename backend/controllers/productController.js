const { db } = require('../firebase');

/**
 * Get all products
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllProducts = async (req, res) => {
  try {
    const productsSnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

/**
 * Add a new product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addProduct = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;

    // Validation
    if (!name || !price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and price are required' 
      });
    }

    const productData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description || '',
      stock: parseInt(stock) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await db.collection('products').add(productData);
    
    res.status(201).json({ 
      success: true, 
      data: { id: docRef.id, ...productData }
    });
  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add product' });
  }
};

/**
 * Update a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, stock } = req.body;

    // Validation
    if (!name || !price) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and price are required' 
      });
    }

    const productData = {
      name: name.trim(),
      price: parseFloat(price),
      description: description || '',
      stock: parseInt(stock) || 0,
      updatedAt: new Date()
    };

    await db.collection('products').doc(id).update(productData);
    
    res.json({ 
      success: true, 
      data: { id, ...productData }
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
};

/**
 * Delete a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection('products').doc(id).delete();
    
    res.json({ 
      success: true, 
      message: 'Product deleted successfully' 
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
};

module.exports = { 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
};
