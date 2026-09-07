const { pool } = require('../config/database');

const getHealthStatus = async (req, res, next) => {
    let dbStatus = 'disconnected';

    try {
        // Attempt a very lightweight query to check if DB is truly alive
        const connection = await pool.getConnection();
        dbStatus = 'connected';
        connection.release();
    } catch (error) {
        dbStatus = 'disconnected';
    }

    res.status(200).json({
        success: true,
        message: 'NIVARA API is running',
        data: {
            database: dbStatus
        }
    });
};

module.exports = {
    getHealthStatus
};
