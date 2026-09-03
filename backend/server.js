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

// Placeholder for future routes (Phase 6+)
// app.use('/api/patients', patientRoutes);

// Fallback for unknown routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    console.log('⏳ Starting AYUSH Care API Server...');
    
    // Check database connection first
    await checkDatabaseConnection();

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🔗 Health check available at: http://localhost:${PORT}/api/health`);
    });
};

startServer();
