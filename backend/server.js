const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import cleanup utilities
const { scheduleCleanup } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Import routes (bypass cache)
const webhookRoutes = require('./routes/webhook');
const productRoutes = require('./routes/products');
const analyticsRoutes = require('./routes/analytics');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');

// Use routes
app.use('/webhook', webhookRoutes);
app.use('/api/products', productRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI WhatsApp Sales Assistant is running!' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI WhatsApp Sales Assistant API - Production Ready',
    version: '2.0.0',
    endpoints: {
      webhook: '/webhook',
      products: '/api/products',
      orders: '/api/orders',
      payment: '/api/payment',
      analytics: '/api/analytics',
      health: '/health'
    },
    features: [
      'WhatsApp Chat Integration',
      'UPI Payment Processing',
      'Order Management',
      'State-based Conversations',
      'Real-time Analytics'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start cleanup scheduler
  scheduleCleanup();
});
