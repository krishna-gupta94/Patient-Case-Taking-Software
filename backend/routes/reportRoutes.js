const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/', authMiddleware, requireRole('Doctor'), reportController.getReports);

module.exports = router;
