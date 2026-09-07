const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/role');
const patientAppointmentController = require('../controllers/patientAppointmentController');

router.get('/', authMiddleware, requireRole('Patient'), patientAppointmentController.getAppointments);

module.exports = router;