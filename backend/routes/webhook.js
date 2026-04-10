const express = require('express');

// Clear cache for webhook controller to ensure fresh load
delete require.cache[require.resolve('../controllers/webhookController')];
const { handleWebhook } = require('../controllers/webhookController');

const router = express.Router();

// POST /webhook - Handle incoming WhatsApp messages from Twilio
router.post('/', handleWebhook);

// GET /webhook - For Twilio webhook verification (optional)
router.get('/', (req, res) => {
  res.send('WhatsApp webhook endpoint is active');
});

module.exports = router;
