const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/doctor', authMiddleware, requireRole('Doctor'), dashboardController.getDoctorDashboard);

module.exports = router;