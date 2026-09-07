const { pool } = require('../config/database');

const getAppointments = async (req, res, next) => {
    try {
        const { date, status, patient_id: patientId } = req.query;
        const conditions = ['a.doctor_id = ?'];
        const values = [req.user.userId];

        if (date) {
            conditions.push('a.date = ?');
            values.push(date);
        }

        if (status) {
            conditions.push('a.status = ?');
            values.push(status);
        }

        if (patientId) {
            conditions.push('a.patient_id = ?');
            values.push(patientId);
        }

        const [appointments] = await pool.execute(
            `SELECT a.id,
                    a.patient_id AS patientId,
                    p.patient_code AS patientCode,
                    p.name AS patientName,
                    a.date,
                    a.time,
                    a.type,
                    a.status
             FROM appointments a
             INNER JOIN patients p ON p.id = a.patient_id
             WHERE ${conditions.join(' AND ')}
             ORDER BY a.date ASC, a.time ASC, a.id ASC`,
            values
        );

        return res.status(200).json({
            success: true,
            data: appointments
        });
    } catch (error) {
        return next(error);
    }
};

const createAppointment = async (req, res, next) => {
    try {
        const { patient, date, time, type } = req.body;

        if (!patient || !date || !time || !type) {
            return res.status(400).json({
                success: false,
                message: 'Patient, date, time, and appointment type are required'
            });
        }

        const allowedTypes = ['General Consultation', 'Follow-up', 'Emergency'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appointment type'
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
            `INSERT INTO appointments (patient_id, doctor_id, date, time, type)
             VALUES (?, ?, ?, ?, ?)`,
            [patients[0].id, req.user.userId, date, time, type]
        );

        if (result.affectedRows !== 1 || !result.insertId) {
            const error = new Error('Appointment insert did not create a record');
            error.statusCode = 500;
            throw error;
        }

        return res.status(201).json({
            success: true,
            message: 'Appointment booked successfully.',
            data: {
                id: result.insertId
            }
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getAppointments,
    createAppointment
};