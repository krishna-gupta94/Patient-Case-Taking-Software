const { pool } = require('../config/database');

const getPatientDashboard = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const [patientRows] = await pool.execute(
            `SELECT p.id, p.patient_code AS patientCode, p.name, p.age, p.blood_group AS bloodGroup
             FROM patients p
             WHERE p.user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (patientRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Patient record not found'
            });
        }

        const patientId = patientRows[0].id;
        const [metricsResult, upcomingResult, prescriptionResult, consultationResult, reportResult, doctorResult] = await Promise.all([
            pool.execute(
                `SELECT
                    (SELECT COUNT(*) FROM appointments
                     WHERE patient_id = ? AND date >= CURDATE() AND status <> 'Cancelled') AS upcomingAppointments,
                    (SELECT COUNT(*) FROM consultations WHERE patient_id = ?) AS pastConsultations,
                    (SELECT COUNT(*) FROM prescriptions WHERE patient_id = ?) AS prescriptions,
                    ((SELECT COUNT(*) FROM consultations WHERE patient_id = ?) +
                     (SELECT COUNT(*) FROM appointments WHERE patient_id = ?)) AS healthReports`,
                [patientId, patientId, patientId, patientId, patientId]
            ),
            pool.execute(
                `SELECT a.id, a.date, a.time, a.type, a.status, d.name AS doctorName
                 FROM appointments a
                 INNER JOIN users d ON d.id = a.doctor_id
                 WHERE a.patient_id = ? AND a.date >= CURDATE() AND a.status <> 'Cancelled'
                 ORDER BY a.date ASC, a.time ASC, a.id ASC
                 LIMIT 4`,
                [patientId]
            ),
            pool.execute(
                `SELECT p.id, p.diagnosis, p.instructions, p.created_at AS prescriptionDate,
                        pm.name AS medicineName, pm.dosage, pm.duration
                 FROM prescriptions p
                 LEFT JOIN prescription_medicines pm ON pm.prescription_id = p.id
                 WHERE p.patient_id = ?
                 ORDER BY p.created_at DESC, p.id DESC, pm.id ASC`,
                [patientId]
            ),
            pool.execute(
                `SELECT c.created_at AS consultationDate
                 FROM consultations c
                 WHERE c.patient_id = ?
                 ORDER BY c.created_at DESC, c.id DESC
                 LIMIT 1`,
                [patientId]
            ),
            pool.execute(
                `SELECT reportType, reportDate, reportTitle
                 FROM (
                    SELECT 'Consultation' AS reportType,
                           c.created_at AS reportDate,
                           c.type AS reportTitle
                    FROM consultations c
                    WHERE c.patient_id = ?
                    UNION ALL
                    SELECT 'Appointment' AS reportType,
                           a.date AS reportDate,
                           a.type AS reportTitle
                    FROM appointments a
                    WHERE a.patient_id = ?
                 ) AS patient_reports
                 ORDER BY reportDate DESC
                 LIMIT 1`,
                [patientId, patientId]
            ),
            pool.execute(
                `SELECT u.name AS doctorName
                 FROM (
                    SELECT doctor_id, created_at AS sortDate
                    FROM consultations
                    WHERE patient_id = ?
                    UNION ALL
                    SELECT doctor_id, created_at AS sortDate
                    FROM appointments
                    WHERE patient_id = ?
                 ) AS patient_visits
                 INNER JOIN users u ON u.id = patient_visits.doctor_id
                 ORDER BY sortDate DESC
                 LIMIT 1`,
                [patientId, patientId]
            )
        ]);

        const prescriptionRows = prescriptionResult[0];
        const latestPrescription = prescriptionRows.length > 0 ? {
            diagnosis: prescriptionRows[0].diagnosis,
            instructions: prescriptionRows[0].instructions,
            medicines: prescriptionRows
                .filter((row) => row.id === prescriptionRows[0].id && row.medicineName)
                .map((row) => ({
                    name: row.medicineName,
                    dosage: row.dosage,
                    duration: row.duration
                }))
        } : null;

        const metrics = metricsResult[0][0];
        return res.status(200).json({
            success: true,
            data: {
                patient: patientRows[0],
                metrics: {
                    upcomingAppointments: Number(metrics.upcomingAppointments),
                    pastConsultations: Number(metrics.pastConsultations),
                    prescriptions: Number(metrics.prescriptions),
                    healthReports: Number(metrics.healthReports)
                },
                upcomingAppointments: upcomingResult[0],
                latestPrescription,
                lastConsultationDate: consultationResult[0][0]?.consultationDate || null,
                doctorName: doctorResult[0][0]?.doctorName || null,
                latestReport: reportResult[0][0] || null
            }
        });
    } catch (error) {
        return next(error);
    }
};

const getDoctorDashboard = async (req, res, next) => {
    try {
        const doctorId = req.user.userId;

        const [metrics] = await pool.execute(
            `SELECT
                (SELECT COUNT(*) FROM consultations
                 WHERE doctor_id = ? AND DATE(created_at) = CURDATE()) AS todaysConsultations,
                (SELECT COUNT(*) FROM appointments
                 WHERE doctor_id = ? AND date = CURDATE()) AS todaysAppointments,
                (SELECT COUNT(*) FROM appointments
                 WHERE doctor_id = ? AND date = CURDATE() AND type = 'Emergency') AS emergencyCases`,
            [doctorId, doctorId, doctorId]
        );

        const [patientCount] = await pool.execute(
            `SELECT COUNT(*) AS totalPatients
             FROM (
                 SELECT patient_id FROM appointments WHERE doctor_id = ?
                 UNION
                 SELECT patient_id FROM consultations WHERE doctor_id = ?
             ) AS doctor_patients`,
            [doctorId, doctorId]
        );

        const [recentPatients] = await pool.execute(
            `SELECT p.id, p.patient_code AS patientCode, p.name, p.age, p.gender, p.status
             FROM patients p
             WHERE EXISTS (
                 SELECT 1 FROM appointments a
                 WHERE a.patient_id = p.id AND a.doctor_id = ?
             ) OR EXISTS (
                 SELECT 1 FROM consultations c
                 WHERE c.patient_id = p.id AND c.doctor_id = ?
             )
             ORDER BY p.updated_at DESC
             LIMIT 4`,
            [doctorId, doctorId]
        );

        const [upcomingAppointments] = await pool.execute(
            `SELECT a.id, p.name AS patientName,
                    TIME_FORMAT(a.time, '%h:%i %p') AS time
             FROM appointments a
             INNER JOIN patients p ON p.id = a.patient_id
             WHERE a.doctor_id = ? AND a.date = CURDATE() AND a.status <> 'Cancelled'
             ORDER BY a.time ASC`,
            [doctorId]
        );

        res.status(200).json({
            success: true,
            data: {
                totalPatients: Number(patientCount[0].totalPatients),
                todaysConsultations: Number(metrics[0].todaysConsultations),
                todaysAppointments: Number(metrics[0].todaysAppointments),
                emergencyCases: Number(metrics[0].emergencyCases),
                recentPatients,
                upcomingAppointments
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPatientDashboard,
    getDoctorDashboard
};