const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.get('/', authMiddleware, requireRole('Patient'), dashboardController.getPatientDashboard);

module.exports = router;