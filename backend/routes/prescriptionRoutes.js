const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.post('/', authMiddleware, requireRole('Doctor'), prescriptionController.createPrescription);

module.exports = router;