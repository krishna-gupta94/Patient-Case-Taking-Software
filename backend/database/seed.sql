USE ayush_care;

-- Note: The password_hash values here are dummy bcrypt strings for demonstration.
-- In a real application, they would match the hashed version of '12345'.

-- Insert Doctor
INSERT INTO users (name, mobile, email, password_hash, role) VALUES 
('Dr. Sharma', '9876543210', 'doctor@ayushcare.com', '$2b$10$Y1/L.wA5XyTIfvN8GjWbN.hI4FzXn8oM/xP5c8mX3lq12e3jA7Bqi', 'Doctor');

SET @doctor_id = LAST_INSERT_ID();

INSERT INTO doctor_preferences (doctor_id, appointment_alerts, emergency_alerts, report_alerts)
VALUES (@doctor_id, true, true, false);

-- Insert Patient User (For patient login functionality)
INSERT INTO users (name, mobile, email, password_hash, role) VALUES 
('Rahul Kumar', '9123456780', 'rahul@example.com', '$2b$10$Y1/L.wA5XyTIfvN8GjWbN.hI4FzXn8oM/xP5c8mX3lq12e3jA7Bqi', 'Patient');

SET @patient_user_id = LAST_INSERT_ID();

-- Insert Patients (Matching Phase 1 demo data)
INSERT INTO patients (user_id, patient_code, name, age, gender, mobile, blood_group, status, address) VALUES
(@patient_user_id, 'P001', 'Rahul Kumar', 35, 'Male', '9876543211', 'O+', 'Active', 'Bareilly, Uttar Pradesh'),
(NULL, 'P002', 'Priya Sharma', 29, 'Female', '9123456781', 'B+', 'Active', 'Lucknow, Uttar Pradesh'),
(NULL, 'P003', 'Amit Verma', 42, 'Male', '9012345678', 'A+', 'Follow-up', 'Delhi'),
(NULL, 'P004', 'Neha Singh', 31, 'Female', '9988776655', 'O-', 'Active', 'Noida');

-- Appointments
INSERT INTO appointments (patient_id, doctor_id, date, time, type, status) VALUES 
(1, @doctor_id, CURRENT_DATE, '10:30:00', 'General Consultation', 'Confirmed'),
(2, @doctor_id, CURRENT_DATE, '11:15:00', 'Emergency', 'Pending'),
(3, @doctor_id, CURRENT_DATE, '12:00:00', 'Follow-up', 'Confirmed'),
(4, @doctor_id, CURRENT_DATE, '14:30:00', 'General Consultation', 'Pending');

-- Consultations
INSERT INTO consultations (patient_id, doctor_id, symptoms, diagnosis, type) VALUES
(1, @doctor_id, 'Mild fever, cough', 'Viral Infection', 'General Consultation'),
(2, @doctor_id, 'High fever, shortness of breath', 'Severe Respiratory Infection', 'Emergency');

SET @consult_id_1 = LAST_INSERT_ID() - 1;

-- Prescriptions
INSERT INTO prescriptions (patient_id, doctor_id, consultation_id, diagnosis, instructions) VALUES
(1, @doctor_id, @consult_id_1, 'Viral Infection', 'Rest for 3 days, drink plenty of fluids.');

SET @rx_id_1 = LAST_INSERT_ID();

-- Prescription Medicines
INSERT INTO prescription_medicines (prescription_id, name, dosage, duration) VALUES
(@rx_id_1, 'Paracetamol 500mg', '1 tablet after meals', '3 Days'),
(@rx_id_1, 'Cough Syrup', '2 tsp twice a day', '5 Days');
