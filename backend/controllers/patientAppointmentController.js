const { pool } = require('../config/database');

const getAppointments = async (req, res, next) => {
    try {
        const [appointments] = await pool.execute(
            `SELECT a.id,
                    a.date,
                    a.time,
                    a.type,
                    a.status,
                    d.name AS doctorName
             FROM appointments a
             INNER JOIN patients p ON p.id = a.patient_id
             INNER JOIN users d ON d.id = a.doctor_id
             WHERE p.user_id = ?
             ORDER BY a.date ASC, a.time ASC, a.id ASC`,
            [req.user.userId]
        );

        return res.status(200).json({
            success: true,
            data: appointments
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getAppointments
};