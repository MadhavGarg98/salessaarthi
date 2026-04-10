const express = require('express');
const paymentService = require('../services/paymentService');

const router = express.Router();

// GET /api/payment/settings - Get payment settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await paymentService.getPaymentSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment settings'
    });
  }
});

// PUT /api/payment/settings - Update payment settings
router.put('/settings', async (req, res) => {
  try {
    const { upiId } = req.body;
    
    if (!upiId) {
      return res.status(400).json({
        success: false,
        error: 'UPI ID is required'
      });
    }
    
    // Basic UPI ID validation
    if (!upiId.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid UPI ID format'
      });
    }
    
    const success = await paymentService.savePaymentSettings(upiId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Payment settings updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update payment settings'
      });
    }
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment settings'
    });
  }
});

// POST /api/payment/generate-link - Generate UPI payment link
router.post('/generate-link', async (req, res) => {
  try {
    const { amount, productName } = req.body;
    
    if (!amount || !productName) {
      return res.status(400).json({
        success: false,
        error: 'Amount and product name are required'
      });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    const upiId = await paymentService.getUPIId();
    const upiLink = paymentService.generateUPILink(upiId, parseFloat(amount), productName);
    
    res.json({
      success: true,
      data: {
        upiLink,
        upiId,
        amount: parseFloat(amount),
        productName
      }
    });
  } catch (error) {
    console.error('Error generating payment link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate payment link'
    });
  }
});

module.exports = router;
