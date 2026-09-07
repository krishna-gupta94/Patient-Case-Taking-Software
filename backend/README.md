# NIVARA API Backend

This is the Node.js + Express backend foundation for the NIVARA application.

## Requirements

* Node.js (v14+)
* npm
* MySQL

## Installation

1. Install dependencies:
```bash
npm install
```

## Environment setup

1. Copy `.env.example` to a new file named `.env`
2. Configure your MySQL credentials:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Configure `PORT` (Default 5000)
4. Configure `CORS_ORIGIN` to match your local frontend URL (e.g., `http://127.0.0.1:5500`)

## Database setup

Refer to the SQL schema and seed files located in the `database/` directory. Initialize the database before running the application if you want the health check to report a `connected` database status.

## Run

To start the server in development mode (using nodemon):
```bash
npm run dev
```

To start the server in production mode:
```bash
npm start
```

## Health check

You can test that the API is running by hitting the health check endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "NIVARA API is running",
  "data": {
    "database": "connected"
  }
}
```

## Authentication

NIVARA uses JSON Web Tokens (JWT) for stateless authentication.
- **Login Endpoint:** `POST /api/auth/login` (Expects `mobile` and `password`)
- **Profile Endpoint:** `GET /api/auth/me` (Requires `Authorization: Bearer <token>`)

Passwords are cryptographically hashed using `bcryptjs` and are never stored or logged in plaintext. 
Role-based authorization is handled securely on the server side via the `role.js` middleware (e.g., `requireRole('Doctor')`).

**Logout Behavior:**
Since JWTs are stateless, logging out is handled purely on the frontend by clearing the `ayush_token` from `localStorage` and redirecting to the login page.

**Demo Credentials:**
A doctor account is provided in the development database seed. 
The bcrypt hash in `seed.sql` corresponds to the password `12345` for local development purposes. *Do not use this in production.*

## Troubleshooting

- **MySQL not running**: The server will start, but log a connection failure and `/api/health` will report database `disconnected`. Ensure the MySQL service is started.
- **Wrong DB password**: Similar to above. Update `.env`.
- **Port already in use**: Change the `PORT` variable in `.env`.
- **CORS issue**: If the frontend cannot fetch data, make sure `CORS_ORIGIN` matches the exact URL of the frontend (including protocol and port, without a trailing slash).
- **Missing `.env`**: The system will fall back to default values (e.g., root user with no password).
