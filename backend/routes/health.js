const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Health Check Route
router.get('/health', healthController.getHealthStatus);

// Future endpoints will be mapped here as well when scaling architecture
// Example: router.post('/test-body', healthController.testBody);

module.exports = router;
