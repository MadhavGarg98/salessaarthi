const express = require('express');
const { getAnalytics, getUserStats } = require('../controllers/analyticsController');

const router = express.Router();

// GET /analytics - Get analytics data
router.get('/', getAnalytics);

// GET /analytics/users - Get user statistics
router.get('/users', getUserStats);

module.exports = router;
