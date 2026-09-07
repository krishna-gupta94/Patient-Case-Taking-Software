const { pool } = require('../config/database');

const getPatients = async (req, res, next) => {
    try {
        const { status } = req.query;
        const conditions = [];
        const values = [];

        if (status) {
            conditions.push('status = ?');
            values.push(status);
        }

        const [patients] = await pool.execute(
            `SELECT id, patient_code, name, age, gender, mobile, blood_group AS bloodGroup, status, address
             FROM patients
             ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
             ORDER BY name ASC, id ASC`,
            values
        );

        return res.status(200).json({
            success: true,
            data: patients
        });
    } catch (error) {
        return next(error);
    }
};

const createPatient = async (req, res, next) => {
    try {
        const { name, age, gender, mobile, bloodGroup, status, address } = req.body;

        if (!name || !age || !gender || !mobile || !bloodGroup || !status || !address) {
            return res.status(400).json({
                success: false,
                message: 'All patient fields are required'
            });
        }

        const [nextCode] = await pool.execute(
            `SELECT COALESCE(MAX(CAST(SUBSTRING(patient_code, 2) AS UNSIGNED)), 0) + 1 AS nextCode
             FROM patients
             WHERE patient_code REGEXP '^P[0-9]+$'`
        );
        const patientCode = `P${String(nextCode[0].nextCode).padStart(3, '0')}`;

        const [result] = await pool.execute(
            `INSERT INTO patients
             (patient_code, name, age, gender, mobile, blood_group, status, address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientCode, name.trim(), age, gender, mobile, bloodGroup, status, address.trim()]
        );

        return res.status(201).json({
            success: true,
            data: { id: result.insertId, patient_code: patientCode }
        });
    } catch (error) {
        return next(error);
    }
};

const deletePatient = async (req, res, next) => {
    try {
        const [result] = await pool.execute(
            "UPDATE patients SET status = 'Inactive' WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows !== 1) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getPatients,
    createPatient,
    deletePatient
};