const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.get('/', authMiddleware, requireRole('Patient'), reportController.getPatientReports);

module.exports = router;