const express = require('express');
const { 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');

const router = express.Router();

// GET /products - Get all products
router.get('/', getAllProducts);

// POST /products - Add a new product
router.post('/', addProduct);

// PUT /products/:id - Update a product
router.put('/:id', updateProduct);

// DELETE /products/:id - Delete a product
router.delete('/:id', deleteProduct);

module.exports = router;
