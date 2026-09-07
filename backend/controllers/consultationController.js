const { pool } = require('../config/database');

const createConsultation = async (req, res, next) => {
    try {
        const { patient, symptoms, diagnosis, type } = req.body;

        if (!patient || !symptoms || !diagnosis || !type) {
            return res.status(400).json({
                success: false,
                message: 'Patient, symptoms, diagnosis, and consultation type are required'
            });
        }

        const allowedTypes = ['General Consultation', 'Follow-up', 'Emergency'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid consultation type'
            });
        }

        const [patients] = await pool.execute(
            `SELECT id
             FROM patients
             WHERE name = ? AND status <> 'Inactive'
             LIMIT 1`,
            [patient]
        );

        if (patients.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found or inactive'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO consultations (patient_id, doctor_id, symptoms, diagnosis, type)
             VALUES (?, ?, ?, ?, ?)`,
            [patients[0].id, req.user.userId, symptoms, diagnosis, type]
        );

        if (result.affectedRows !== 1 || !result.insertId) {
            const error = new Error('Consultation insert did not create a record');
            error.statusCode = 500;
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: 'Consultation saved successfully.',
            data: {
                id: result.insertId
            }
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createConsultation
};