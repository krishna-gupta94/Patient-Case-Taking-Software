const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.post('/', authMiddleware, requireRole('Doctor'), appointmentController.createAppointment);
router.get('/', authMiddleware, requireRole('Doctor'), appointmentController.getAppointments);

module.exports = router;