# NIVARA - Database Documentation

This folder contains the MySQL schema and seed data for the NIVARA backend, designed based on the Phase 1 & Phase 2 frontend audits.

## Database Information
- **Name**: `ayush_care`
- **Charset**: `utf8mb4`
- **Collation**: `utf8mb4_unicode_ci`

## Table Overview

1. `users`: Stores all authenticated entities (Doctors, Admins, and Patients). Handles authentication via `mobile` and `password_hash`.
2. `patients`: Core patient demographic records. Linked to `users` if the patient has login access. Primary key `id` is used internally for relationships, while `patient_code` is displayed to the user.
3. `appointments`: Tracks scheduled visits between a patient and a doctor.
4. `consultations`: Medical records of clinical visits, storing symptoms and diagnosis.
5. `prescriptions`: The header record for a medical prescription, optionally linked to a specific consultation.
6. `prescription_medicines`: The individual medicines prescribed (dosage, duration) linked to the `prescriptions` header.
7. `doctor_preferences`: Settings table for notifications (e.g., appointment alerts) for a doctor.

## Relationship ER Diagram Concept

```text
users
  │
  ├── doctor_preferences (1:1)
  │
  └── patients (1:1 nullable)
       │
       ├── appointments ─── users (as doctor)
       ├── consultations ── users (as doctor)
       └── prescriptions ── users (as doctor)
                    │
                    └── prescription_medicines (1:M)
```

## Important Design Decisions

- **Patient Identification**: `patient_code` is separated from the internal primary key (`id`). This allows safe foreign key relationships (`patient_id`) without exposing integer gaps to the users, and ensures the human-readable code remains separate from internal identifiers.
- **Deactivation Strategy**: Patients are not hard-deleted (`ON DELETE RESTRICT` for clinical records) to preserve medical history. Instead, the `status` ENUM ('Active', 'Inactive', 'Follow-up') should be updated to 'Inactive'.
- **Reports**: There is no permanent `reports` table. Dashboards and reports dynamically aggregate data (using `COUNT`, `WHERE date = CURRENT_DATE`) from the core tables.
- **Transactions**: Creating a prescription requires an atomic transaction to `prescriptions` and `prescription_medicines`. If the medicines fail to insert, the `prescriptions` header should roll back.

## Usage Commands

To initialize the database on a fresh MySQL instance:

1. Import Schema:
```bash
mysql -u root -p < database/schema.sql
```

2. Import Seed Data (For Development):
```bash
mysql -u root -p < database/seed.sql
```

3. Verification:
```sql
SHOW DATABASES;
USE ayush_care;
SHOW TABLES;
SELECT * FROM users;
```
