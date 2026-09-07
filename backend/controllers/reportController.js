const { pool } = require('../config/database');

const reportTypes = new Set(['all', 'consultation', 'appointment', 'emergency']);

const getPatientReports = async (req, res, next) => {
    try {
        const [reports] = await pool.execute(
            `SELECT reportType,
                    reportDate,
                    doctorName,
                    reportTitle,
                    details,
                    priority,
                    status
             FROM (
                SELECT 'Consultation' AS reportType,
                       DATE_FORMAT(c.created_at, '%Y-%m-%d') AS reportDate,
                       u.name AS doctorName,
                       c.type AS reportTitle,
                       CONCAT(
                           'Symptoms: ', COALESCE(NULLIF(c.symptoms, ''), 'Not recorded'),
                           ' | Diagnosis: ', COALESCE(NULLIF(c.diagnosis, ''), 'Not recorded')
                       ) AS details,
                       CASE WHEN c.type = 'Emergency' THEN 'Emergency' ELSE 'Normal' END AS priority,
                       'Completed' AS status,
                       c.created_at AS sortDate
                FROM consultations c
                INNER JOIN patients p ON p.id = c.patient_id
                INNER JOIN users u ON u.id = c.doctor_id
                WHERE p.user_id = ?

                UNION ALL

                SELECT 'Appointment' AS reportType,
                       DATE_FORMAT(a.date, '%Y-%m-%d') AS reportDate,
                       u.name AS doctorName,
                       a.type AS reportTitle,
                       CONCAT('Appointment status: ', a.status) AS details,
                       CASE WHEN a.type = 'Emergency' THEN 'Emergency' ELSE 'Normal' END AS priority,
                       a.status AS status,
                       a.date AS sortDate
                FROM appointments a
                INNER JOIN patients p ON p.id = a.patient_id
                INNER JOIN users u ON u.id = a.doctor_id
                WHERE p.user_id = ?
             ) AS patient_reports
             ORDER BY sortDate DESC`,
            [req.user.userId, req.user.userId]
        );

        return res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        return next(error);
    }
};

const buildDateFilter = (column, fromDate, toDate, values) => {
    if (fromDate && toDate) {
        values.push(fromDate, toDate);
        return ` AND DATE(${column}) BETWEEN ? AND ?`;
    }

    return '';
};

const getReports = async (req, res, next) => {
    try {
        const doctorId = req.user.userId;
        const { from, to, type = 'all' } = req.query;

        if (!reportTypes.has(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report type'
            });
        }

        if ((from && !to) || (!from && to) || (from && to && from > to)) {
            return res.status(400).json({
                success: false,
                message: 'A valid from and to date are required'
            });
        }

        const consultationValues = [doctorId];
        const appointmentValues = [doctorId];
        const prescriptionValues = [doctorId];
        const patientAppointmentValues = [doctorId];
        const patientConsultationValues = [doctorId];
        const patientPrescriptionValues = [doctorId];

        const consultationDateFilter = buildDateFilter('c.created_at', from, to, consultationValues);
        const appointmentDateFilter = buildDateFilter('a.date', from, to, appointmentValues);
        const prescriptionDateFilter = buildDateFilter('p.created_at', from, to, prescriptionValues);
        const patientAppointmentDateFilter = buildDateFilter('a.date', from, to, patientAppointmentValues);
        const patientConsultationDateFilter = buildDateFilter('c.created_at', from, to, patientConsultationValues);
        const patientPrescriptionDateFilter = buildDateFilter('p.created_at', from, to, patientPrescriptionValues);

        const [statisticsResult, reportsResult] = await Promise.all([
            pool.execute(
                `SELECT
                    (SELECT COUNT(*)
                     FROM (
                         SELECT a.patient_id
                         FROM appointments a
                         WHERE a.doctor_id = ?${patientAppointmentDateFilter}
                         UNION
                         SELECT c.patient_id
                         FROM consultations c
                         WHERE c.doctor_id = ?${patientConsultationDateFilter}
                         UNION
                         SELECT p.patient_id
                         FROM prescriptions p
                         WHERE p.doctor_id = ?${patientPrescriptionDateFilter}
                     ) AS doctor_patients) AS totalPatients,
                    (SELECT COUNT(*) FROM consultations c WHERE c.doctor_id = ?${consultationDateFilter}) AS totalConsultations,
                    (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = ?${appointmentDateFilter}) AS totalAppointments,
                    (SELECT COUNT(*) FROM appointments a
                     WHERE a.doctor_id = ? AND a.type = 'Emergency'${appointmentDateFilter.replace(/a\.doctor_id = \?/, '')}) AS totalEmergencyAppointments,
                    (SELECT COUNT(*) FROM prescriptions p WHERE p.doctor_id = ?${prescriptionDateFilter}) AS totalPrescriptions,
                    (SELECT COUNT(*) FROM appointments a
                     WHERE a.doctor_id = ? AND a.type = 'Emergency' AND a.status = 'Completed'${appointmentDateFilter.replace(/a\.doctor_id = \?/, '')}) AS completedEmergencyAppointments`,
                [
                    ...patientAppointmentValues,
                    ...patientConsultationValues,
                    ...patientPrescriptionValues,
                    ...consultationValues,
                    ...appointmentValues,
                    doctorId,
                    ...(from && to ? [from, to] : []),
                    ...prescriptionValues,
                    doctorId,
                    ...(from && to ? [from, to] : [])
                ]
            ),
            pool.execute(
                `SELECT reportType, patientName, patientCode, reportDate, doctorName, priority, status
                 FROM (
                    SELECT 'Consultation' AS reportType,
                        p.name AS patientName,
                        p.patient_code AS patientCode,
                            DATE_FORMAT(c.created_at, '%Y-%m-%d') AS reportDate,
                            u.name AS doctorName,
                            CASE WHEN c.type = 'Emergency' THEN 'Emergency' ELSE 'Normal' END AS priority,
                            'Completed' AS status,
                            'consultation' AS sourceType
                     FROM consultations c
                     INNER JOIN patients p ON p.id = c.patient_id
                     INNER JOIN users u ON u.id = c.doctor_id
                     WHERE c.doctor_id = ?${consultationDateFilter}

                     UNION ALL

                    SELECT 'Appointment' AS reportType,
                        p.name AS patientName,
                        p.patient_code AS patientCode,
                            DATE_FORMAT(a.date, '%Y-%m-%d') AS reportDate,
                            u.name AS doctorName,
                            CASE WHEN a.type = 'Emergency' THEN 'Emergency' ELSE 'Normal' END AS priority,
                            a.status AS status,
                            'appointment' AS sourceType
                     FROM appointments a
                     INNER JOIN patients p ON p.id = a.patient_id
                     INNER JOIN users u ON u.id = a.doctor_id
                     WHERE a.doctor_id = ?${appointmentDateFilter}
                 ) AS report_rows
                 WHERE (? = 'all' OR sourceType = ? OR (? = 'emergency' AND priority = 'Emergency'))
                 ORDER BY reportDate DESC`,
                [
                    ...consultationValues,
                    ...appointmentValues,
                    type,
                    type,
                    type
                ]
            )
        ]);

        const statistics = statisticsResult[0][0];
        return res.status(200).json({
            success: true,
            data: {
                statistics: {
                    totalPatients: Number(statistics.totalPatients),
                    totalConsultations: Number(statistics.totalConsultations),
                    totalAppointments: Number(statistics.totalAppointments),
                    totalEmergencyAppointments: Number(statistics.totalEmergencyAppointments),
                    totalPrescriptions: Number(statistics.totalPrescriptions),
                    consultationCompletionRate: Number(statistics.totalConsultations) > 0 ? 100 : 0,
                    emergencyHandledRate: Number(statistics.totalEmergencyAppointments) > 0
                        ? Math.round((Number(statistics.completedEmergencyAppointments) / Number(statistics.totalEmergencyAppointments)) * 100)
                        : 0
                },
                reports: reportsResult[0]
            }
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getPatientReports,
    getReports
};
