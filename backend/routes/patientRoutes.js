const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/', authMiddleware, requireRole('Doctor'), patientController.getPatients);
router.post('/', authMiddleware, requireRole('Doctor'), patientController.createPatient);
router.delete('/:id', authMiddleware, requireRole('Doctor'), patientController.deletePatient);

module.exports = router;