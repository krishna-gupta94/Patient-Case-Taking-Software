const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { checkDatabaseConnection } = require('./config/database');

// Import Middlewares
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import Routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const patientDashboardRoutes = require('./routes/patientDashboardRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const patientAppointmentRoutes = require('./routes/patientAppointmentRoutes');
const patientRoutes = require('./routes/patientRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const patientPrescriptionRoutes = require('./routes/patientPrescriptionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const patientReportRoutes = require('./routes/patientReportRoutes');

const app = express();

// Middleware Setup
// Only allow origin specified in .env, fallback to strict local if missing
const corsOrigin = process.env.CORS_ORIGIN || 'http://127.0.0.1:5500';
app.use(cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin
}));
app.use(express.json()); // Parse JSON bodies

// API Route mounting
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patient-portal/dashboard', patientDashboardRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patient-portal/appointments', patientAppointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/patient-portal/prescriptions', patientPrescriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/patient-portal/reports', patientReportRoutes);

// Placeholder for future routes (Phase 6+)

// Fallback for unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    console.log('⏳ Starting NIVARA API Server...');
    
    // Check database connection first
    await checkDatabaseConnection();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
    });
};

startServer();
