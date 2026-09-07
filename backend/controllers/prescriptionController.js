const { pool } = require('../config/database');

const getPatientPrescriptions = async (req, res, next) => {
    try {
        const [prescriptions] = await pool.execute(
            `SELECT p.id,
                    p.diagnosis,
                    p.instructions,
                    p.created_at AS prescriptionDate,
                    pm.name AS medicineName,
                    pm.dosage,
                    pm.duration
             FROM patients patient
             INNER JOIN prescriptions p ON p.patient_id = patient.id
             LEFT JOIN prescription_medicines pm ON pm.prescription_id = p.id
             WHERE patient.user_id = ?
             ORDER BY p.created_at DESC, p.id DESC, pm.id ASC`,
            [req.user.userId]
        );

        const prescriptionsById = new Map();
        for (const prescription of prescriptions) {
            if (!prescriptionsById.has(prescription.id)) {
                prescriptionsById.set(prescription.id, {
                    id: prescription.id,
                    diagnosis: prescription.diagnosis,
                    instructions: prescription.instructions,
                    prescriptionDate: prescription.prescriptionDate,
                    medicines: []
                });
            }

            if (prescription.medicineName) {
                prescriptionsById.get(prescription.id).medicines.push({
                    name: prescription.medicineName,
                    dosage: prescription.dosage,
                    duration: prescription.duration
                });
            }
        }

        return res.status(200).json({
            success: true,
            data: Array.from(prescriptionsById.values())
        });
    } catch (error) {
        return next(error);
    }
};

const createPrescription = async (req, res, next) => {
    let connection;

    try {
        const {
            patient,
            patient_id: submittedPatientId,
            diagnosis,
            instructions,
            consultation_id: consultationId,
            medicines
        } = req.body;

        if (!patient && !submittedPatientId) {
            return res.status(400).json({
                success: false,
                message: 'Patient is required'
            });
        }

        if (!diagnosis || !diagnosis.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Diagnosis is required'
            });
        }

        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one medicine is required'
            });
        }

        for (const medicine of medicines) {
            if (!medicine || !medicine.name || !medicine.name.trim() ||
                !medicine.dosage || !medicine.dosage.trim() ||
                !medicine.duration || !medicine.duration.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Medicine name, dosage, and duration are required'
                });
            }
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const patientQuery = patient
            ? 'SELECT id FROM patients WHERE name = ? LIMIT 1'
            : 'SELECT id FROM patients WHERE id = ? LIMIT 1';
        const patientValue = patient || submittedPatientId;
        const [patients] = await connection.execute(patientQuery, [patientValue]);

        if (patients.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        const patientId = patients[0].id;

        if (consultationId !== undefined && consultationId !== null && consultationId !== '') {
            const [consultations] = await connection.execute(
                `SELECT id
                 FROM consultations
                 WHERE id = ? AND patient_id = ? AND doctor_id = ?
                 LIMIT 1`,
                [consultationId, patientId, req.user.userId]
            );

            if (consultations.length === 0) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Consultation is invalid for this patient and doctor'
                });
            }
        }

        const [prescriptionResult] = await connection.execute(
            `INSERT INTO prescriptions
             (patient_id, doctor_id, consultation_id, diagnosis, instructions)
             VALUES (?, ?, ?, ?, ?)`,
            [
                patientId,
                req.user.userId,
                consultationId || null,
                diagnosis.trim(),
                instructions && instructions.trim() ? instructions.trim() : null
            ]
        );

        if (prescriptionResult.affectedRows !== 1 || !prescriptionResult.insertId) {
            throw new Error('Prescription insert did not create a record');
        }

        const prescriptionId = prescriptionResult.insertId;
        for (const medicine of medicines) {
            const [medicineResult] = await connection.execute(
                `INSERT INTO prescription_medicines
                 (prescription_id, name, dosage, duration)
                 VALUES (?, ?, ?, ?)`,
                [
                    prescriptionId,
                    medicine.name.trim(),
                    medicine.dosage.trim(),
                    medicine.duration.trim()
                ]
            );

            if (medicineResult.affectedRows !== 1) {
                throw new Error('Medicine insert did not create a record');
            }
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Prescription saved successfully.',
            data: {
                id: prescriptionId
            }
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                error.rollbackError = rollbackError;
            }
        }
        return next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

module.exports = {
    getPatientPrescriptions,
    createPrescription
};