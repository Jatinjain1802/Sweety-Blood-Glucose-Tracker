<!-- # Sweety – Blood Glucose Tracker

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.0-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14%2B-336791.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-Node%20Native%20Runner-brightgreen.svg)](https://nodejs.org/api/test.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Assignment Submission:** Junior Full Stack Developer – JavaScript & AI
> **Repository Scope:** Production-ready RESTful backend API with PostgreSQL persistence, JWT security, automated test suite, database migrations, and seed scripts.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Folder Structure](#project-folder-structure)
- [Prerequisites](#prerequisites)
- [Installation Instructions](#installation-instructions)
- [Environment Variable Configuration](#environment-variable-configuration)
- [PostgreSQL Database Setup](#postgresql-database-setup)
- [Database Migration Instructions](#database-migration-instructions)
- [Seed & Demo Account Instructions](#seed--demo-account-instructions)
- [How to Run the Backend](#how-to-run-the-backend)
- [How to Run Automated Tests](#how-to-run-automated-tests)
- [API Documentation](#api-documentation)
  - [System Endpoints](#system-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Readings Endpoints](#readings-endpoints)
  - [Reports Endpoints](#reports-endpoints)
- [Validation and Business Rules](#validation-and-business-rules)
- [Authentication and Data Security](#authentication-and-data-security)
- [Demo Credentials](#demo-credentials)
- [Assumptions and Limitations](#assumptions-and-limitations)
- [Implementation Verification Checklist](#implementation-verification-checklist)

---

## Project Overview

**Sweety – Blood Glucose Tracker** is a healthcare tracking web service designed to help individuals monitor and manage diabetes with structured daily tracking. Managing diabetes requires routine glucose measurement at distinct physiological intervals (fasting and post-meal).

Sweety enforces strict clinical and data validation rules:
- Restricts entries to **four designated daily slots** (`Morning fasting`, `After breakfast`, `After lunch`, `After dinner`).
- Enforces a hard ceiling of **one reading per slot per day** and **maximum 4 readings per calendar day**.
- Validates glucose values within medically safe monitoring thresholds (**40 mg/dL to 600 mg/dL**).
- Rejects future calendar dates to preserve medical data integrity.
- Provides immediate statistical aggregation across **daily**, **month-to-date (MTD)**, and **previous calendar month** periods (calculating high, low, average rounded to 1 decimal place, and total count).
- Fully isolates sensitive health records using cryptographic password hashing (`bcryptjs`) and secure stateless JSON Web Tokens (`jsonwebtoken`).

---

## Key Features

1. **User Authentication & Session Management**:
   - Secure sign-up and login workflows with case-insensitive, normalized email lookup.
   - Salted password hashing using `bcryptjs` (10 rounds).
   - Stateless JWT issuing with 7-day validity.

2. **Complete CRUD for Glucose Readings**:
   - **Create**: Add glucose readings with automatic date, slot, and range checks.
   - **Read**: Fetch paginated reading history sorted in reverse chronological order (`date DESC, created_at DESC`).
   - **Update**: Modify glucose values, slots, or dates with duplicate-detection safeguards.
   - **Delete**: Remove erroneous records safely.

3. **Strict Validation Engine**:
   - Only integers between `40` and `600` mg/dL are accepted.
   - Future dates are strictly prohibited (`date > today` in local time).
   - Exactly one reading allowed per time slot on any given date.
   - Maximum 4 readings allowed per day per user.

4. **Multi-Period Analytics & Reporting**:
   - **Daily Report**: Aggregates all readings recorded on a selected date.
   - **Month-to-Date (MTD) Report**: Aggregates readings from the 1st day of the selected month through the target date.
   - **Previous Month Report**: Computes metrics across the complete previous calendar month, with full support for leap years and month boundary rollovers (e.g., January transitions to December of the previous year).
   - **Key Aggregates**: Highest reading, Lowest reading, Average reading (formatted to 1 decimal place), and Total count.

5. **Multi-Tenant User Isolation**:
   - PostgreSQL foreign keys with `ON DELETE CASCADE`.
   - Every database query strictly filters by the authenticated user's ID (`req.user.id`).
   - Prevents Horizontal Privilege Escalation (users cannot view, edit, or delete readings belonging to others).

6. **Automated Testing Suite**:
   - Zero external testing bloat: runs on Node.js native test runner (`node --test`) and `node:assert/strict`.
   - Integration tests covering authentication, route protection, validation logic, and reporting calculations using `supertest`.

7. **Database Migration & Seeding**:
   - Repeatable SQL schema migration script.
   - Idempotent seed script creating a preconfigured demo account populated with 8 realistic readings across 2 days.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>= 18.0.0` | Server-side JavaScript runtime engine |
| **Framework** | Express.js | `^5.0.0` | Web framework handling routing, middleware, and HTTP parsing |
| **Database** | PostgreSQL | `>= 14` | Relational SQL database for ACID compliance and data integrity |
| **DB Client** | `pg` (node-postgres) | `^8.12.0` | Connection pool manager and SQL client |
| **Security** | `bcryptjs` | `^2.4.3` | One-way salted hashing of user passwords |
| **Security** | `jsonwebtoken` | `^9.0.2` | Signed JWT generation and verification |
| **CORS** | `cors` | `^2.8.5` | Cross-Origin Resource Sharing middleware |
| **Config** | `dotenv` | `^16.4.5` | Twelve-Factor environment variable loader |
| **Testing** | Node Native Test Runner | Built-in | Fast, dependency-free test execution (`node --test`) |
| **Testing** | `supertest` | `^7.0.0` | Programmatic HTTP assertions for Express endpoints |
| **Dev Tools** | `nodemon` | `^3.1.14` | Automatic server restart on file modifications |
| **Frontend** | React | *Pending* | *(Reserved directory `client/`; pending UI integration)* |

---

## Project Folder Structure

```text
Sweety-Blood-Glucose-Tracker/
├── .env.example                     # Root example environment template
├── .gitignore                       # Git exclusions (node_modules, .env, logs)
├── README.md                        # Project documentation (this file)
├── client/                          # [Reserved] React frontend client application
└── server/                          # Backend Node.js / Express application
    ├── src/
    │   ├── config/
    │   │   └── db.js                # PostgreSQL Pool setup, type parsers, & lifecycle hooks
    │   ├── db/
    │   │   ├── migrate.js           # Migration runner executing schema.sql
    │   │   ├── schema.sql           # DDL: users & readings tables, constraints, & indexes
    │   │   └── seed.js              # Database seeder with demo user and 8 sample readings
    │   ├── middleware/
    │   │   └── auth.js              # JWT Bearer token authentication & user context injector
    │   ├── routes/
    │   │   ├── auth.js              # Signup and login endpoints
    │   │   ├── readings.js          # Glucose reading CRUD routes and validation
    │   │   └── reports.js           # Daily, Month-to-Date, and Monthly analytical reports
    │   ├── utils/
    │   │   ├── dateUtils.js         # Date parsing, range calculation, slot order, & summaries
    │   │   └── dateUtils.test.js    # Unit tests for date logic and statistical calculations
    │   ├── app.js                   # Express application setup, middleware, & route mounting
    │   └── index.js                 # HTTP listener bootstrap & database connectivity check
    ├── tests/
    │   └── api.test.js              # End-to-end integration tests for Auth, Readings, & Reports
    ├── .env.example                 # Server-specific environment template
    ├── package.json                 # Project dependencies, metadata, and npm scripts
    └── package-lock.json            # Deterministic dependency lockfile
```

---

## Prerequisites

Before setting up the project, ensure you have the following installed on your operating system:

1. **Node.js**: `v18.x` or higher (LTS recommended). Check with:
   ```bash
   node -v
   ```
2. **npm**: `v9.x` or higher. Check with:
   ```bash
   npm -v
   ```
3. **PostgreSQL**: `v14.x` or higher installed and running locally (or access to a remote PostgreSQL instance). Check with:
   ```bash
   psql --version
   ```

---

## Installation Instructions

1. **Clone the repository** to your local machine:
   ```bash
   git clone https://github.com/your-username/Sweety-Blood-Glucose-Tracker.git
   cd Sweety-Blood-Glucose-Tracker
   ```

2. **Navigate to the server directory**:
   ```bash
   cd server
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

---

## Environment Variable Configuration

The backend application requires three primary environment variables to configure its database connection, security secret, and network port.

1. In the `server/` directory, create a `.env` file by copying the provided example:
   ```bash
   # On Linux / macOS / Git Bash
   cp .env.example .env

   # On Windows PowerShell
   Copy-Item .env.example .env
   ```

2. Open `server/.env` in your text editor and supply your PostgreSQL credentials:

```env
# Server Port (defaults to 5000 if not specified)
PORT=5000

# PostgreSQL Connection String
# Format: postgres://<username>:<password>@<host>:<port>/<database_name>
DATABASE_URL=postgres://postgres:your_password@localhost:5432/sweety_blood_glucose

# Secret key used to sign and verify JSON Web Tokens (use a long, secure random string)
JWT_SECRET=super_secret_sweety_jwt_token_key_change_me_in_production
```

> [!IMPORTANT]
> Never commit `.env` containing real passwords or secrets to Git. The `.gitignore` file is configured to exclude all `.env` files while preserving `.env.example`.

---

## PostgreSQL Database Setup

1. Open your terminal or PostgreSQL prompt (`psql`):
   ```bash
   psql -U postgres
   ```

2. Create a new database named `sweety_blood_glucose`:
   ```sql
   CREATE DATABASE sweety_blood_glucose;
   ```

3. Verify the database was created:
   ```sql
   \l
   ```
   Exit `psql` using `\q`.

---

## Database Migration Instructions

The migration script reads `server/src/db/schema.sql` and creates the `users` and `readings` tables, sets foreign keys, check constraints, unique composite constraints, and query indexes.

Run the migration script from inside the `server/` directory:

```bash
npm run migrate
```

**Expected terminal output:**
```text
Database migrated successfully.
```

### Database Schema Details

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot VARCHAR(30) NOT NULL CHECK (
        slot IN (
            'Morning fasting',
            'After breakfast',
            'After lunch',
            'After dinner'
        )
    ),
    value INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, date, slot)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings (user_id, date);
```

---

## Seed & Demo Account Instructions

To quickly evaluate the API without manually entering records, run the automated seed script:

```bash
npm run seed
```

### What the Seed Script Does:
1. Connects to the configured PostgreSQL database.
2. Deletes any existing demo user account to ensure idempotency (can be safely run multiple times).
3. Creates a fresh demo account with hashed credentials:
   - **Name:** `Demo User`
   - **Email:** `demo@sweety.com`
   - **Password:** `Demo@123`
4. Creates **8 sample readings** spread evenly across **two days** (`yesterday` and `today`):
   - **Yesterday:**
     - `Morning fasting`: `95 mg/dL`
     - `After breakfast`: `135 mg/dL`
     - `After lunch`: `145 mg/dL`
     - `After dinner`: `125 mg/dL`
   - **Today:**
     - `Morning fasting`: `90 mg/dL`
     - `After breakfast`: `130 mg/dL`
     - `After lunch`: `140 mg/dL`
     - `After dinner`: `120 mg/dL`

**Expected terminal output:**
```text
Database seeded successfully!
Demo email: demo@sweety.com
Demo password: Demo@123
Sample readings created: 8
```

---

## How to Run the Backend

Make sure you are in the `server/` directory:

### Development Mode (with automatic restart on code change)
```bash
npm run dev
```

### Production Mode
```bash
npm run start
# or: node src/index.js
```

**Expected terminal output:**
```text
Sweety API running on port 5000
```

You can verify that the server is alive by opening `http://localhost:5000/api/health` in your browser or running:
```bash
curl http://localhost:5000/api/health
# Response: {"status":"ok"}
```

---

## How to Run Automated Tests

Sweety uses Node.js's built-in native test runner (`node --test`) alongside `supertest` for full HTTP route integration testing. No third-party test runners (like Jest or Mocha) are required.

To run the full test suite from the `server/` directory:

```bash
npm test
```

### Test Coverage Highlights
- **`dateUtils.test.js`**:
  - Daily date range calculation
  - Month-to-date (MTD) calculation (1st of month to selected date)
  - Previous calendar month calculation with January rollover (Dec 1 - Dec 31 of prior year)
  - Leap year February calculations (e.g., Feb 29 on 2024)
  - Rejection of invalid calendar dates (e.g., `2026-02-30`)
  - Statistical summary calculations (highest, lowest, average rounded to 1 decimal place, count)
- **`api.test.js`**:
  - User registration (`POST /api/auth/signup`) and authentication (`POST /api/auth/login`)
  - Duplicate slot blocking on the same calendar day (`400 Bad Request`)
  - Out-of-bounds glucose value validation (`400 Bad Request`)
  - Daily and Monthly report calculations and response structure

**Expected output:**
```text
✔ daily range uses the selected date
✔ month-to-date range starts on the first day of the month
✔ monthly range uses the previous calendar month
✔ january and leap year boundaries are handled correctly
✔ buildSummary calculates minimum maximum average and count
✔ invalid calendar dates are rejected
✔ average is rounded to one decimal place
✔ user can sign up and log in
✔ reading validation blocks duplicate slots and invalid values
✔ daily and monthly reports return summary and reading details

ℹ tests 10
ℹ pass 10
ℹ fail 0
```

---

## API Documentation

All API routes are prefixed with `/api`. Protected routes require a valid JWT passed in the HTTP `Authorization` request header:

```http
Authorization: Bearer <your_jwt_token_here>
```

### System Endpoints

#### `GET /api/health`
Check API server availability.

- **Authentication:** None
- **Response (200 OK):**
  ```json
  {
    "status": "ok"
  }
  ```

---

### Authentication Endpoints

#### `POST /api/auth/signup`
Register a new user account and immediately receive a JWT access token.

- **Authentication:** None
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password@123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "user": {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"error": "Please enter a valid name."}` (if name is missing or shorter than 2 chars)
  - `400 Bad Request`: `{"error": "Please enter a valid email address."}` (invalid email format)
  - `400 Bad Request`: `{"error": "Password must be at least 6 characters long."}`
  - `400 Bad Request`: `{"error": "An account with this email already exists."}`

---

#### `POST /api/auth/login`
Authenticate with email and password to receive a JWT.

- **Authentication:** None
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "email": "demo@sweety.com",
    "password": "Demo@123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": 1,
      "name": "Demo User",
      "email": "demo@sweety.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{"error": "Email and password are required."}`
  - `401 Unauthorized`: `{"error": "Invalid email or password."}`

---

### Readings Endpoints

All readings endpoints require the `Authorization: Bearer <token>` header.

#### `GET /api/readings`
Retrieve paginated glucose readings for the authenticated user, sorted with the newest records first.

- **Authentication:** Bearer Token
- **Query Parameters:**
  - `page` (optional, default: `1`, minimum: `1`)
  - `limit` (optional, default: `20`, maximum: `50`, minimum: `1`)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/readings?page=1&limit=10" \
       -H "Authorization: Bearer <TOKEN>"
  ```
- **Response (200 OK):**
  ```json
  {
    "readings": [
      {
        "id": 8,
        "user_id": 1,
        "date": "2026-11-07",
        "slot": "After dinner",
        "value": 120,
        "created_at": "2026-11-07T10:45:00.000Z"
      },
      {
        "id": 7,
        "user_id": 1,
        "date": "2026-11-07",
        "slot": "After lunch",
        "value": 140,
        "created_at": "2026-11-07T08:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 8,
      "pages": 1
    }
  }
  ```

---

#### `POST /api/readings`
Add a new blood glucose reading.

- **Authentication:** Bearer Token
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "date": "2026-11-07",
    "slot": "Morning fasting",
    "value": 95
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "reading": {
      "id": 9,
      "user_id": 1,
      "date": "2026-11-07",
      "slot": "Morning fasting",
      "value": 95,
      "created_at": "2026-11-07T11:00:00.000Z"
    }
  }
  ```
- **Error Responses (`400 Bad Request`):**
  ```json
  { "error": "Value must be between 40 and 600 mg/dl.", "code": "VALIDATION_ERROR" }
  ```
  ```json
  { "error": "Date cannot be in the future.", "code": "VALIDATION_ERROR" }
  ```
  ```json
  { "error": "You already have an Morning fasting reading for this date.", "code": "VALIDATION_ERROR" }
  ```
  ```json
  { "error": "You can add only 4 readings per day.", "code": "VALIDATION_ERROR" }
  ```

---

#### `PUT /api/readings/:id`
Update an existing reading belonging to the authenticated user.

- **Authentication:** Bearer Token
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "date": "2026-11-07",
    "slot": "Morning fasting",
    "value": 98
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "reading": {
      "id": 9,
      "user_id": 1,
      "date": "2026-11-07",
      "slot": "Morning fasting",
      "value": 98,
      "created_at": "2026-11-07T11:00:00.000Z"
    }
  }
  ```
- **Error Responses:**
  - `404 Not Found`: `{"error": "Reading not found."}` (if the record does not exist or belongs to another user)
  - `400 Bad Request`: `{"error": "You already have an Morning fasting reading for this date.", "code": "VALIDATION_ERROR"}`

---

#### `DELETE /api/readings/:id`
Delete a specific reading.

- **Authentication:** Bearer Token
- **Response (200 OK):**
  ```json
  {
    "message": "Reading deleted successfully."
  }
  ```
- **Error Responses:**
  - `404 Not Found`: `{"error": "Reading not found."}`

---

### Reports Endpoints

Reports provide statistical metrics (`highest`, `lowest`, `average`, `count`) and the list of readings for a specific timeframe.

All report endpoints accept an optional query parameter:
- `date`: Date string formatted as `YYYY-MM-DD` (e.g., `?date=2026-11-07`). If omitted, it defaults to the current local date.

#### `GET /api/reports/daily`
Computes statistics for the specified single calendar day.

- **Authentication:** Bearer Token
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/reports/daily?date=2026-11-07" \
       -H "Authorization: Bearer <TOKEN>"
  ```
- **Response (200 OK):**
  ```json
  {
    "period": "daily",
    "selectedDate": "2026-11-07",
    "displayLabel": "7 Nov 2026",
    "range": {
      "start": "2026-11-07",
      "end": "2026-11-07"
    },
    "summary": {
      "highest": 140,
      "lowest": 90,
      "average": 120,
      "count": 4,
      "readings": [
        {
          "id": 5,
          "user_id": 1,
          "date": "2026-11-07",
          "slot": "Morning fasting",
          "value": 90,
          "created_at": "2026-11-07T03:30:00.000Z"
        },
        {
          "id": 6,
          "user_id": 1,
          "date": "2026-11-07",
          "slot": "After breakfast",
          "value": 130,
          "created_at": "2026-11-07T05:00:00.000Z"
        },
        {
          "id": 7,
          "user_id": 1,
          "date": "2026-11-07",
          "slot": "After lunch",
          "value": 140,
          "created_at": "2026-11-07T08:15:00.000Z"
        },
        {
          "id": 8,
          "user_id": 1,
          "date": "2026-11-07",
          "slot": "After dinner",
          "value": 120,
          "created_at": "2026-11-07T10:45:00.000Z"
        }
      ]
    },
    "readings": [ ... ]
  }
  ```

---

#### `GET /api/reports/month-to-date`
Computes statistics from the first day of the selected date's calendar month (`YYYY-MM-01`) through the selected date.

- **Authentication:** Bearer Token
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/reports/month-to-date?date=2026-11-07" \
       -H "Authorization: Bearer <TOKEN>"
  ```
- **Response (200 OK):**
  ```json
  {
    "period": "month-to-date",
    "selectedDate": "2026-11-07",
    "displayLabel": "1 Nov 2026 – 7 Nov 2026",
    "range": {
      "start": "2026-11-01",
      "end": "2026-11-07"
    },
    "summary": {
      "highest": 145,
      "lowest": 90,
      "average": 122.5,
      "count": 8,
      "readings": [ ... ]
    },
    "readings": [ ... ]
  }
  ```

---

#### `GET /api/reports/monthly`
Computes statistics for the **entire previous calendar month** relative to the specified date. For instance, querying with any date in November 2026 analyzes October 1, 2026 through October 31, 2026.

- **Authentication:** Bearer Token
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/reports/monthly?date=2026-11-07" \
       -H "Authorization: Bearer <TOKEN>"
  ```
- **Response (200 OK):**
  ```json
  {
    "period": "monthly",
    "selectedDate": "2026-11-07",
    "displayLabel": "1 Oct 2026 – 31 Oct 2026",
    "range": {
      "start": "2026-10-01",
      "end": "2026-10-31"
    },
    "summary": {
      "highest": 155,
      "lowest": 88,
      "average": 115.4,
      "count": 24,
      "readings": [ ... ]
    },
    "readings": [ ... ]
  }
  ```

---

## Validation and Business Rules

Sweety implements validation at both the Express route layer and the PostgreSQL database constraint layer:

| Domain | Rule | Enforcement Mechanism | Error Message / Code |
| :--- | :--- | :--- | :--- |
| **Glucose Value** | Must be an integer between `40` and `600` mg/dL | `Number.isInteger()` + DB `CHECK (value BETWEEN 40 AND 600)` | `"Value must be between 40 and 600 mg/dl."` (`VALIDATION_ERROR`) |
| **Time Slots** | Must be one of four exact strings: `Morning fasting`, `After breakfast`, `After lunch`, `After dinner` | Array inclusion check + DB `CHECK (slot IN (...))` | `"Please select a valid time slot."` (`VALIDATION_ERROR`) |
| **Date Boundaries** | Must not be in the future (`date <= today`) | Date comparison with local system midnight | `"Date cannot be in the future."` (`VALIDATION_ERROR`) |
| **Date Format** | Strict calendar format `YYYY-MM-DD` | Regex `^\d{4}-\d{2}-\d{2}$` and calendar date verification | `"Please select a valid date."` (`VALIDATION_ERROR`) |
| **Duplicate Slot** | Only one reading per slot per user per calendar day | Pre-insert SQL check + DB `UNIQUE (user_id, date, slot)` | `"You already have an <slot> reading for this date."` (`VALIDATION_ERROR`) |
| **Daily Capacity** | Maximum 4 readings per user per calendar day | SQL row count check before insert/update | `"You can add only 4 readings per day."` (`VALIDATION_ERROR`) |
| **User Ownership** | Users can only access, modify, or delete their own records | Injected `req.user.id` filter on all queries | `404 Not Found: "Reading not found."` |
| **User Sign Up** | Name $\ge 2$ characters, valid RFC-compliant email, password $\ge 6$ characters | String length checks + Email regex | `400 Bad Request` with descriptive error |

---

## Authentication and Data Security

1. **Password Encryption**:
   - Passwords are never stored in plain text.
   - When a user signs up, the backend utilizes `bcryptjs.hash(password, 10)` to produce a secure, salted hash.
   - Authentication verifies hashes via `bcryptjs.compare(password, user.password_hash)`.

2. **JSON Web Tokens (JWT)**:
   - When authenticated, the server signs a token containing the claims `{ sub: user.id, email: user.email }`.
   - Tokens are signed using the HMAC-SHA256 algorithm with `process.env.JWT_SECRET` and expire automatically in 7 days (`expiresIn: "7d"`).

3. **Authorization Middleware (`authMiddleware`)**:
   - Extracts the token from the `Authorization: Bearer <token>` HTTP header.
   - Cryptographically verifies the signature and expiration.
   - Queries the database to confirm the user account still exists.
   - Attaches the sanitized user profile (`{ id, name, email }`) directly to `req.user` for downstream route handlers.

4. **SQL Injection Prevention**:
   - All database queries exclusively use parameterized queries (`$1`, `$2`, etc.) via `node-postgres`, preventing SQL injection vulnerabilities.

5. **Date Offset Consistency**:
   - PostgreSQL type parser 1082 (`DATE`) is configured as `types.setTypeParser(1082, (val) => val)`. This prevents Node.js from converting `DATE` strings into UTC timestamps, avoiding date shifts across midnight in different timezones.

---

## Demo Credentials

A seed script is provided to populate the database with a preconfigured user and sample readings:

- **Email:** `demo@sweety.com`
- **Password:** `Demo@123`
- **Account Name:** `Demo User`
- **Prepopulated Data:** 8 glucose readings across 2 days (yesterday and today), providing immediate data for all report endpoints.

To run or reset the demo account:
```bash
npm run seed
```

---

## Assumptions and Limitations

1. **Measurement Units**:
   - All blood glucose readings are recorded and calculated in **mg/dL** (milligrams per deciliter), standard in diabetes management.
2. **Timezone Handling**:
   - Dates are tracked using the ISO calendar standard `YYYY-MM-DD`. Operations compare against the server's local date boundary (`getTodayLocal()`).
3. **Account Activation & Recovery**:
   - Email verification and password recovery links are not implemented (beyond the scope of this backend hiring assignment).
4. **Rate Limiting**:
   - API rate limiting (e.g. `express-rate-limit`) is recommended before deploying to a public production environment.
5. **Hard Deletions**:
   - Deleting a reading removes the record from PostgreSQL immediately. User deletion cascades to remove all associated readings (`ON DELETE CASCADE`).

---

## Implementation Verification Checklist

For team members, reviewers, and evaluators, the table below highlights verified backend components and areas flagged for subsequent project milestones:

| Area | Status | Notes |
| :--- | :--- | :--- |
| **Backend API Core** | Verified | Express 5 server, JSON parsing, CORS, centralized 500 error handler |
| **Authentication System** | Verified | Bcrypt hashing (10 rounds), JWT sign/verify, protected routes |
| **PostgreSQL Schema** | Verified | Tables `users` and `readings`, cascade deletion, check constraints, unique index |
| **Readings CRUD** | Verified | GET (paginated), POST, PUT, DELETE with strict ownership checks |
| **Report Generation** | Verified | Daily, MTD, and Monthly range calculations, leap year & January rollover safe |
| **Automated Tests** | Verified | 10 passing unit & integration tests using `node --test` |
| **Seed System** | Verified | Idempotent demo account with 8 sample readings |
| **Client / Frontend** | *Needs Verification / In Progress* | `client/` folder is reserved for the upcoming React frontend interface. Frontend endpoints should bind to `http://localhost:5000/api`. |
| **Production SSL** | *Needs Verification / Deployment* | In `server/src/config/db.js`, `ssl: false` is configured for local development. For cloud hosting (e.g., Supabase, Neon, Render, AWS RDS), set `ssl: { rejectUnauthorized: false }`. |

---

## License

This project is licensed under the [MIT License](LICENSE). -->

# 🌸 Sweety – Blood Glucose Tracker

A full-stack web application that helps users record, manage, and monitor their blood glucose readings. Users can create an account, securely log in, manage their daily readings, and view glucose reports.

## 🚀 Project Overview

Sweety is built using React, Node.js, Express, and PostgreSQL.

The application provides user authentication, glucose reading management, and reporting features through a responsive web interface.

## 🛠️ Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- Axios
- React Router DOM
- CSS

### Backend

- Node.js
- Express.js
- PostgreSQL
- JSON Web Tokens (JWT)
- bcryptjs
- dotenv
- pg

### Testing

- Node.js Test Runner
- Supertest

## ✨ Features

### 1. User Authentication

- User registration with name, email, and password.
- Secure password hashing using bcrypt.
- User login with email and password.
- JWT-based authentication.
- Protected frontend pages.

### 2. Glucose Reading Management

- Add new blood glucose readings.
- View previously recorded readings.
- Edit existing readings.
- Delete readings.
- Each reading includes a date, time slot, and glucose value.

### 3. Reading Validation

- Glucose values must be between 40 and 600 mg/dL.
- Only integer values are accepted.
- Future dates are not allowed.
- Only one reading is allowed per time slot per day.
- A maximum of four readings is allowed per day.
- The following four time slots are supported:
  - Morning fasting
  - After breakfast
  - After lunch
  - After dinner

### 4. Dashboard

- Displays the logged-in user's name.
- Shows today's glucose readings.
- Displays highest, lowest, and average glucose values.
- Displays the total number of readings.

### 5. Reports

The application provides three report types:

- **Daily Report:** Displays readings and summary statistics for a selected date.
- **Month-to-Date Report:** Displays statistics from the first day of the selected month through the selected date.
- **Previous Month Report:** Displays statistics for the entire previous calendar month.

Each report includes:

- Highest glucose reading.
- Lowest glucose reading.
- Average glucose reading, rounded to one decimal place.
- Total number of readings.

## 📁 Project Structure

```text
Sweety-Blood-Glucose-Tracker/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Readings.jsx
│   │   │   └── Reports.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── package-lock.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── db/
│   │   │   ├── migrate.js
│   │   │   ├── schema.sql
│   │   │   └── seed.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── readings.js
│   │   │   └── reports.js
│   │   ├── utils/
│   │   │   ├── dateUtils.js
│   │   │   └── dateUtils.test.js
│   │   ├── app.js
│   │   └── index.js
│   ├── tests/
│   │   └── api.test.js
│   ├── .env
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## ⚙️ Prerequisites

Install the following before running the application:

- Node.js and npm
- PostgreSQL
- Git

## 📥 Installation and Setup

### Step 1: Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Sweety-Blood-Glucose-Tracker
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### Step 2: Set up the PostgreSQL database

Create a PostgreSQL database named:

```sql
CREATE DATABASE sweety;
```

### Step 3: Configure the backend

Open a terminal in the server directory:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety
JWT_SECRET=your_long_random_secret
```

Replace `YOUR_PASSWORD` with your PostgreSQL password and configure a secure JWT secret.

### Step 4: Set up the database

Run the database migration:

```bash
npm run migrate
```

This creates the required database tables and constraints.

### Step 5: Seed demo data

Run:

```bash
npm run seed
```

This creates a demo user and sample glucose readings.

**Demo account:**

- Email: `demo@sweety.com`
- Password: `Demo@123`

### Step 6: Start the backend

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### Step 7: Configure the frontend

Open another terminal from the project root:

```bash
cd client
npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 8: Start the frontend

```bash
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

Open the frontend URL in your browser to use Sweety.

## 🔌 API Endpoints

All API endpoints are prefixed with:

```text
http://localhost:5000/api
```

### Authentication

| Method | Endpoint       | Description             |
| ------ | -------------- | ----------------------- |
| POST   | `/auth/signup` | Register a new user     |
| POST   | `/auth/login`  | Log in an existing user |

### Glucose Readings

These endpoints require a valid JWT token.

| Method | Endpoint        | Description             |
| ------ | --------------- | ----------------------- |
| GET    | `/readings`     | Get the user's readings |
| POST   | `/readings`     | Add a reading           |
| PUT    | `/readings/:id` | Update a reading        |
| DELETE | `/readings/:id` | Delete a reading        |

### Reports

These endpoints require a valid JWT token.

| Method | Endpoint                                 | Description                    |
| ------ | ---------------------------------------- | ------------------------------ |
| GET    | `/reports/daily?date=YYYY-MM-DD`         | Daily report                   |
| GET    | `/reports/month-to-date?date=YYYY-MM-DD` | Month-to-date report           |
| GET    | `/reports/monthly?date=YYYY-MM-DD`       | Previous calendar month report |

### Health Check

| Method | Endpoint  | Description          |
| ------ | --------- | -------------------- |
| GET    | `/health` | Check backend status |

Protected endpoints require the following request header:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Running Tests

Open a terminal inside the server directory:

```bash
npm test
```

The backend tests cover date calculations, report summaries, authentication, reading validation, and reporting functionality.

## 🔐 Security and Data Validation

- Passwords are hashed before being stored in the database.
- JWT authentication protects private API endpoints.
- Users can only access their own glucose readings.
- PostgreSQL constraints enforce valid time slots, glucose values, and unique daily slots.
- Input validation prevents invalid readings and future dates.
- Environment variables are used for database credentials and JWT secrets.

## 📝 Assumptions and Notes

- Glucose values are recorded in mg/dL.
- Each user can record a maximum of four readings per day.
- Each of the four specified time slots can have only one reading per day.
- Month-to-date reports include the selected date.
- Previous-month reports cover the complete previous calendar month.
- Report averages are rounded to one decimal place.
- Each user's readings are private and accessible only through authenticated requests.

## 👨‍💻 Author

Developed as part of the Junior Full Stack Developer – JavaScript & AI hiring assignment.

**Project:** Sweety – Blood Glucose Tracker
