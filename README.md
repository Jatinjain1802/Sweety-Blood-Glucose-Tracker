# 🌸 Sweety – Blood Glucose Tracker

Sweety is a full-stack web app where a diabetes patient records up to 4 blood
glucose readings a day and views daily and monthly reports. It is built with
React, Node.js + Express, and PostgreSQL, and includes a consent-based
doctor dashboard where a doctor can view a patient's reports only after the
patient approves their access request.

Built as the assignment for the **Junior Full Stack Developer – JavaScript & AI**
position at Kenpath.

> Sweety is a record-keeping app, not a medical device. Its summaries and
> sample data are not medical advice.

---

## ✨ Features

### Patient side

- **Sign up and log in** with name, email and password. Passwords are hashed
  with bcrypt (bcryptjs); JWT authentication on all private routes.
- **Add, view, edit and delete readings.** Each reading has a date, a time
  slot and a value in mg/dL. The 4 slots are: Morning fasting, After
  breakfast, After lunch, After dinner.
- **Dashboard** with today's readings and today's highest / lowest / average
  / count.
- **Reports** for three periods:
  - **Daily** – the selected date, listing each reading with its slot.
  - **Month-to-date** – 1st of the month through the selected date.
  - **Monthly** – the whole previous calendar month.
  - Each report shows the highest, lowest and average reading (rounded to 1
    decimal) and the number of readings, with a friendly empty state.
- **Trend chart** – a Recharts line chart on the Reports page.
- **Paginated history** – `GET /api/readings?page=1&limit=20` with
  Previous/Next controls.
- **Profile page** – view and update name/email.

### Validation rules

Every rule is enforced on the server (and mirrored in the UI with a clear
error message):

| Rule                              | Error message                                            |
| --------------------------------- | -------------------------------------------------------- |
| Value is required                 | "Please enter a glucose value."                          |
| Whole number between 40 and 600   | "Value must be between 40 and 600 mg/dl."                |
| Only one reading per slot per day | "You already have an After lunch reading for this date." |
| Maximum 4 readings per day        | "You can add only 4 readings per day."                   |
| Date cannot be in the future      | "Date cannot be in the future."                          |

PostgreSQL constraints back these up: valid slots, value range, and a
UNIQUE(user_id, date, slot) constraint. A user only ever sees their own
readings – every query is scoped to the authenticated user id.

### Doctor dashboard (consent-based access)

- Patients and doctors have separate roles. Doctor accounts are created
  through a dedicated signup endpoint protected by a server-side secret
  (`DOCTOR_SIGNUP_SECRET`), so patients cannot self-promote.
- A patient browses the doctor directory and sends an **access request** to a
  doctor.
- While the request is **pending**, the doctor sees only a limited aggregate
  summary (total readings, average, highest, lowest, date range) – never the
  individual readings.
- The doctor can **accept or reject**. Only after acceptance can the doctor
  open the patient's full readings, reports (daily / month-to-date / monthly)
  and chart, in read-only mode.
- The patient can **cancel a pending request** or **revoke** an accepted
  doctor's access at any time. The doctor's role is re-read from the database
  on every request, so revocation takes effect immediately.

---

## 📸 Screenshots & recordings

### Patient side

![Landing page and patient dashboard](user_dashboard.png)

![Adding and editing glucose readings](user_reading_management.png)

![Daily, month-to-date and monthly reports](user_reports_management.png)

![Glucose trend charts on the Reports page](user_report_graphs.png)

![Patient profile page](user_profile_page.png)

![Patient sending an access request to a doctor](user_adding_doctor.png)

### Doctor side

![Doctor dashboard with pending and accepted patients](doctor_dashboard.png)

![Doctor viewing a patient's analysis after consent](<patient_analyis_(via doctor).png>)

![Doctor profile page](doctor_profile.png)

### Recordings

- [Landing page walkthrough (MP4)](landing_page.mp4)
- [Doctor dashboard walkthrough (MP4)](doctor_dashboard.mp4)
- [Patient dashboard walkthrough (recording)](https://drive.google.com/file/d/1a64JOs3yipZ2BUkT-MaDfK7h0oNgi8s3/view?usp=sharing)

---

## 🛠️ Tech stack

**Frontend:** React, Vite, React Router, Axios, Recharts, plain CSS.
**Backend:** Node.js, Express, PostgreSQL (pg), JWT (jsonwebtoken), bcryptjs.
**Testing:** Node's built-in test runner + Supertest (server), Vitest +
React Testing Library (client).

---

## 📁 Project structure

```text
Sweety-Blood-Glucose-Tracker/
├── client/
│   └── src/
│       ├── api/axios.js
│       ├── components/   (Navbar, ProtectedRoute, GlucoseChart, MyDoctor)
│       ├── pages/        (Landing, Login, Signup, Dashboard, Readings,
│       │                  Reports, Profile, DoctorSignup, DoctorDashboard,
│       │                  DoctorPatientProfile, MyDoctorPage)
│       └── __tests__/    (Landing, Navbar, Readings – React Testing Library)
├── server/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── db/           (schema.sql, migration_doctor_patient.sql,
│   │   │                  migrate.js, seed.js, sampleData.js)
│   │   ├── middleware/auth.js
│   │   ├── routes/       (auth, readings, reports, doctor, patient)
│   │   ├── utils/        (dateUtils.js + tests)
│   │   ├── app.js
│   │   └── index.js
│   └── tests/api.test.js
├── .env.example
└── README.md
```

---

## ⚙️ Setup

### Prerequisites

Node.js (LTS), npm, PostgreSQL, Git.

### 1. Clone

```bash
git clone https://github.com/Jatinjain1802/Sweety-Blood-Glucose-Tracker.git
cd Sweety-Blood-Glucose-Tracker
```

### 2. Create the database

```sql
CREATE DATABASE sweety;
```

### 3. Configure the backend

```bash
cd server
npm install
```

Create `server/.env`:

```dotenv
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety
JWT_SECRET=replace_with_a_long_random_secret
DOCTOR_SIGNUP_SECRET=replace_with_another_random_secret
```

### 4. Migrate and seed

```bash
npm run migrate   # creates/updates all tables (users, readings, doctor-patient)
npm run seed      # creates the demo patient, 4 demo doctors and sample readings
```

### 5. Run the backend

```bash
npm run dev       # http://localhost:5000
```

### 6. Configure and run the frontend

```bash
cd client
npm install
```

Create `client/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev       # usually http://localhost:5173
```

---

## 📊 Demo accounts

Seeded by `npm run seed`:

| Role    | Email                  | Password     | Notes                                           |
| ------- | ---------------------- | ------------ | ----------------------------------------------- |
| Patient | `demo@sweety.com`      | `Demo@123`   | ~60 days of sample readings                     |
| Doctor  | `doctor@sweety.com`    | `Doctor@123` | already has ACCEPTED access to the demo patient |
| Doctor  | `dr.arjun@sweety.com`  | `Doctor@123` | has a PENDING request from the demo patient     |
| Doctor  | `dr.priya@sweety.com`  | `Doctor@123` | available in the directory                      |
| Doctor  | `dr.rajesh@sweety.com` | `Doctor@123` | available in the directory                      |

All sample readings are synthetic demo data, not real measurements.
The seed is non-destructive: it inserts demo accounts with stable ids and
never deletes existing users or readings, so it is safe to run repeatedly.

---

## 🔌 API overview

Base URL: `http://localhost:5000/api`. All routes except `/auth/*` and
`/health` require `Authorization: Bearer <token>`.

**Auth:** `POST /auth/signup` · `POST /auth/login` · `POST /auth/doctor-signup`
(requires the doctor secret) · `GET /auth/profile` · `PUT /auth/profile`

**Readings:** `GET /readings?page=1&limit=20` · `POST /readings` ·
`PUT /readings/:id` · `DELETE /readings/:id`

**Reports:** `GET /reports/daily?date=YYYY-MM-DD` ·
`GET /reports/month-to-date?date=YYYY-MM-DD` ·
`GET /reports/monthly?date=YYYY-MM-DD`

**Patient:** `GET /patient/doctors` (directory) ·
`POST /patient/doctors/:doctorId/request` · `GET /patient/requests` ·
`DELETE /patient/requests/:id` (cancel pending) ·
`GET /patient/authorized-doctors` ·
`DELETE /patient/authorized-doctors/:requestId` (revoke access)

**Doctor (doctor role required):** `GET /doctor/patients/requests` ·
`POST /doctor/patients/requests/:id/accept` ·
`POST /doctor/patients/requests/:id/reject` · `GET /doctor/patients` ·
`GET /doctor/patients/:patientId` · `GET /doctor/patients/:patientId/readings` ·
`GET /doctor/patients/:patientId/reports/{daily|month-to-date|monthly}`

**Health:** `GET /health`

---

## 🧪 Tests

Tests need the backend `.env` in place and a running PostgreSQL (they run
against the configured database and clean up after themselves).

```bash
cd server && npm test        # 28 backend tests
cd client && npm run test:run   # 9 frontend tests
cd client && npm run build      # production build check
```

Backend tests cover: signup/login, validation rules (duplicate slot, invalid
values), report ranges and summary maths, per-user isolation, and the full
doctor–patient consent flow (request, pending-summary limits, accept/reject,
revocation). Frontend tests cover the readings form, validation feedback and
empty states. Last run: **28 backend + 9 frontend tests passing**.

---

## 🔐 Security notes

- Passwords hashed with bcryptjs; never stored in plain text.
- JWT auth on every private route; the user's role is re-read from the
  database per request so revocation applies immediately.
- Every readings/reports query is scoped to the authenticated user id.
- Doctors only ever see detailed records of patients who accepted them;
  pending/rejected/revoked requests expose nothing beyond an aggregate
  summary (and only while pending).
- Secrets live in local `.env` files (gitignored); `.env.example` contains
  placeholders only.

---

## 📝 Assumptions and notes

- Glucose values are whole numbers in mg/dL, 40–600 inclusive.
- Maximum 4 readings per day, one per slot.
- Month-to-date reports include the selected date; monthly reports cover the
  complete previous calendar month.
- Averages are rounded to one decimal place.
- When something was ambiguous I noted the assumption here rather than
  blocking on it.

## 🚀 What I'd improve with more time

- **Deployment & ops:** Docker Compose for one-command setup, CI running the
  tests, and a hosted demo with managed Postgres.
- **Richer doctor tools and reminders:** date-range comparisons and CSV/PDF
  export for doctors, plus optional reminder notifications (e.g. a BullMQ
  background job) for patients who log fewer than 4 readings a day.
- **Polish:** accessibility pass (keyboard navigation, screen-reader labels),
  Redis caching for report results, and refreshing a session automatically
  instead of showing an error when a token expires.
- **Add AI** assistent in the patients dashboard for the better assistance.

---

## 👨‍💻 Author

Jatin Jain – built as the assignment for the Junior Full Stack Developer –
JavaScript & AI role at Kenpath.
