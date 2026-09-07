const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.post('/', authMiddleware, requireRole('Doctor'), consultationController.createConsultation);

module.exports = router;