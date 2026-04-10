const express = require('express');
const orderService = require('../services/orderService');
const paymentService = require('../services/paymentService');

const router = express.Router();

// GET /api/orders - Get all orders with optional filters
router.get('/', async (req, res) => {
  try {
    const { limit = 50, status, paymentStatus, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const orders = await orderService.getAllOrders(parseInt(limit), filters);
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// GET /api/orders/stats - Get order statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await orderService.getOrderStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order statistics'
    });
  }
});

// GET /api/orders/recent - Get recent orders (last 24 hours)
router.get('/recent', async (req, res) => {
  try {
    const orders = await orderService.getRecentOrders();
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent orders'
    });
  }
});

// GET /api/orders/search - Search orders
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const orders = await orderService.searchOrders(q);
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error searching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search orders'
    });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
});

// PUT /api/orders/:id - Update order status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    const updates = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }
    
    const success = await orderService.updateOrderStatus(id, updates);
    
    if (success) {
      res.json({
        success: true,
        message: 'Order updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update order'
      });
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await orderService.deleteOrder(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Order deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete order'
      });
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order'
    });
  }
});

// GET /api/orders/phone/:phone - Get orders by phone number
router.get('/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const orders = await orderService.getOrdersByPhone(phone);
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching orders by phone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
});

// POST /api/orders/:id/mark-paid - Mark order as paid
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await orderService.markOrderAsPaid(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Order marked as paid'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to mark order as paid'
      });
    }
  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark order as paid'
    });
  }
});

module.exports = router;
