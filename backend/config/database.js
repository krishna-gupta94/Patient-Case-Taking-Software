const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Function to test connection on startup
const checkDatabaseConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(`   Error Code: ${error.code}`);
        console.error(`   Message: ${error.message}`);
        // Log gracefully instead of crashing immediately so health check can show degraded state,
        // or rethrow if strict startup is required. We'll return false for health check tracking.
        return false;
    }
};

module.exports = {
    pool,
    checkDatabaseConnection
};
