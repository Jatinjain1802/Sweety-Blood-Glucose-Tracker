const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { query, close, initializeDatabase } = require("../src/config/db");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function resetDb() {
  await query("DELETE FROM doctor_patient_requests");
  await query("DELETE FROM readings");
  await query("DELETE FROM users");
}

async function signupPatient(name, email) {
  const res = await request(app).post("/api/auth/signup").send({
    name,
    email,
    password: "secret123",
  });
  return res.body; // { user, token }
}

// 🎓 We use the doctor-signup endpoint with the DOCTOR_SIGNUP_SECRET env var.
//    In tests we set process.env.DOCTOR_SIGNUP_SECRET = 'test-doctor-secret'
//    before calling this function.
async function signupDoctor(name, email) {
  const res = await request(app).post("/api/auth/doctor-signup").send({
    name,
    email,
    password: "secret123",
    doctorSecret: "test-doctor-secret",
  });
  return res.body; // { user, token }
}

async function addReading(token, date, slot, value) {
  return request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({ date, slot, value });
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
test.before(async () => {
  // Set the doctor signup secret for tests
  process.env.DOCTOR_SIGNUP_SECRET = "test-doctor-secret";
  await initializeDatabase();
});

test.beforeEach(async () => {
  await resetDb();
});

test.after(async () => {
  await resetDb();
  await close();
});

// ===========================================================================
// EXISTING TESTS — preserved exactly
// ===========================================================================

test("user can sign up and log in", async () => {
  const signup = await request(app).post("/api/auth/signup").send({
    name: "Jatin",
    email: "jatin@example.com",
    password: "secret123",
  });

  assert.equal(signup.status, 201);
  assert.equal(signup.body.user.email, "jatin@example.com");
  assert.ok(signup.body.token);

  const login = await request(app).post("/api/auth/login").send({
    email: "jatin@example.com",
    password: "secret123",
  });

  assert.equal(login.status, 200);
  assert.equal(login.body.user.name, "Jatin");
  assert.ok(login.body.token);
});

test("reading validation blocks duplicate slots and invalid values", async () => {
  const signup = await request(app).post("/api/auth/signup").send({
    name: "Jatin",
    email: "validation@example.com",
    password: "secret123",
  });

  const token = signup.body.token;

  const first = await addReading(token, "2026-10-15", "Morning fasting", 90);
  assert.equal(first.status, 201);

  const duplicate = await addReading(
    token,
    "2026-10-15",
    "Morning fasting",
    100,
  );
  assert.equal(duplicate.status, 400);

  const invalid = await addReading(token, "2026-10-15", "After breakfast", 700);
  assert.equal(invalid.status, 400);
});

test("daily and monthly reports return summary and reading details", async () => {
  const signup = await request(app).post("/api/auth/signup").send({
    name: "Jatin",
    email: "reports@example.com",
    password: "secret123",
  });

  assert.equal(signup.status, 201);
  const token = signup.body.token;

  const firstReading = await addReading(
    token,
    "2026-10-15",
    "Morning fasting",
    90,
  );
  assert.equal(firstReading.status, 201);

  const secondReading = await addReading(
    token,
    "2026-10-15",
    "After breakfast",
    110,
  );
  assert.equal(secondReading.status, 201);

  const previousMonthReading = await addReading(
    token,
    "2026-09-30",
    "Morning fasting",
    100,
  );
  assert.equal(previousMonthReading.status, 201);

  const daily = await request(app)
    .get("/api/reports/daily")
    .query({ date: "2026-10-15" })
    .set("Authorization", `Bearer ${token}`);

  assert.equal(daily.status, 200);
  assert.equal(daily.body.summary.count, 2);
  assert.equal(daily.body.summary.average, 100);
  assert.equal(daily.body.readings.length, 2);

  const monthly = await request(app)
    .get("/api/reports/monthly")
    .query({ date: "2026-10-15" })
    .set("Authorization", `Bearer ${token}`);

  assert.equal(monthly.status, 200);
  assert.equal(monthly.body.summary.count, 1);
  assert.equal(monthly.body.summary.average, 100);
});

// ===========================================================================
// NEW: Role assignment tests
// ===========================================================================

test("signup always creates a patient role", async () => {
  const res = await signupPatient("Riya Patient", "riya@example.com");
  assert.equal(res.user.role, "patient");
});

test("doctor-signup creates a doctor role with valid secret", async () => {
  const res = await signupDoctor("Dr. Arjun", "arjun@example.com");
  assert.equal(res.user.role, "doctor");
  assert.ok(res.token);
});

test("doctor-signup is rejected with wrong secret", async () => {
  const res = await request(app).post("/api/auth/doctor-signup").send({
    name: "Fake Doctor",
    email: "fake@example.com",
    password: "secret123",
    doctorSecret: "wrong-secret",
  });
  assert.equal(res.status, 403);
});

test("login response includes role", async () => {
  await signupPatient("Riya", "riya2@example.com");
  const login = await request(app).post("/api/auth/login").send({
    email: "riya2@example.com",
    password: "secret123",
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, "patient");
});

// ===========================================================================
// NEW: Patient can request doctor access
// ===========================================================================

test("patient can send a request to a doctor", async () => {
  const doctor = await signupDoctor("Dr. Kumar", "kumar@example.com");
  const patient = await signupPatient("Riya", "riya3@example.com");

  const res = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  assert.equal(res.status, 201);
  assert.equal(res.body.request.status, "pending");
  assert.equal(res.body.request.doctor_id, doctor.user.id);
  assert.equal(res.body.request.patient_id, patient.user.id);
});

test("patient cannot send duplicate pending request to same doctor", async () => {
  const doctor = await signupDoctor("Dr. Kumar", "kumar2@example.com");
  const patient = await signupPatient("Riya", "riya4@example.com");

  await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const duplicate = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  assert.equal(duplicate.status, 400);
});

test("patient can cancel a pending request", async () => {
  const doctor = await signupDoctor("Dr. Cancel", "cancel@example.com");
  const patient = await signupPatient("Riya", "riya5@example.com");

  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const requestId = reqRes.body.request.id;

  const cancel = await request(app)
    .delete(`/api/patient/requests/${requestId}`)
    .set("Authorization", `Bearer ${patient.token}`);

  assert.equal(cancel.status, 200);
});

// ===========================================================================
// NEW: Doctor can accept or reject requests
// ===========================================================================

test("doctor can see pending requests with limited patient summary", async () => {
  const doctor = await signupDoctor("Dr. Viewer", "viewer@example.com");
  const patient = await signupPatient("Riya", "riya6@example.com");

  // Add a reading so summary isn't null
  await addReading(patient.token, "2026-10-15", "Morning fasting", 95);

  await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const res = await request(app)
    .get("/api/doctor/patients/requests")
    .set("Authorization", `Bearer ${doctor.token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.requests.length, 1);

  const req = res.body.requests[0];
  assert.ok(req.patientSummary);
  assert.equal(req.patientSummary.totalReadings, 1);
  assert.ok(req.patientSummary.highestGlucose !== undefined);
  // Individual readings must NOT be exposed
  assert.equal(req.readings, undefined);
});

test("doctor can accept a patient request", async () => {
  const doctor = await signupDoctor("Dr. Accept", "accept@example.com");
  const patient = await signupPatient("Riya", "riya7@example.com");

  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const requestId = reqRes.body.request.id;

  const accept = await request(app)
    .post(`/api/doctor/patients/requests/${requestId}/accept`)
    .set("Authorization", `Bearer ${doctor.token}`);

  assert.equal(accept.status, 200);
  assert.equal(accept.body.request.status, "accepted");
});

test("doctor can reject a patient request", async () => {
  const doctor = await signupDoctor("Dr. Reject", "reject@example.com");
  const patient = await signupPatient("Riya", "riya8@example.com");

  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const requestId = reqRes.body.request.id;

  const reject = await request(app)
    .post(`/api/doctor/patients/requests/${requestId}/reject`)
    .set("Authorization", `Bearer ${doctor.token}`);

  assert.equal(reject.status, 200);
  assert.equal(reject.body.request.status, "rejected");
});

// ===========================================================================
// NEW: Accepted doctor can view full patient data
// ===========================================================================

test("accepted doctor can view patient detailed reports", async () => {
  const doctor = await signupDoctor("Dr. Full", "full@example.com");
  const patient = await signupPatient("Riya", "riya9@example.com");

  await addReading(patient.token, "2026-10-15", "Morning fasting", 90);
  await addReading(patient.token, "2026-10-15", "After breakfast", 130);

  // Send and accept request
  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const requestId = reqRes.body.request.id;
  await request(app)
    .post(`/api/doctor/patients/requests/${requestId}/accept`)
    .set("Authorization", `Bearer ${doctor.token}`);

  // Doctor fetches patient readings
  const readingsRes = await request(app)
    .get(`/api/doctor/patients/${patient.user.id}/readings`)
    .set("Authorization", `Bearer ${doctor.token}`);

  assert.equal(readingsRes.status, 200);
  assert.equal(readingsRes.body.readings.length, 2);

  // Doctor fetches daily report
  const dailyRes = await request(app)
    .get(`/api/doctor/patients/${patient.user.id}/reports/daily`)
    .query({ date: "2026-10-15" })
    .set("Authorization", `Bearer ${doctor.token}`);

  assert.equal(dailyRes.status, 200);
  assert.equal(dailyRes.body.summary.count, 2);
  assert.equal(dailyRes.body.summary.average, 110);
});

// ===========================================================================
// NEW: Rejected/pending doctor CANNOT view detailed patient data
// ===========================================================================

test("rejected doctor cannot view patient records", async () => {
  const doctor = await signupDoctor("Dr. Denied", "denied@example.com");
  const patient = await signupPatient("Riya", "riya10@example.com");

  await addReading(patient.token, "2026-10-15", "Morning fasting", 90);

  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const requestId = reqRes.body.request.id;

  // Reject the request
  await request(app)
    .post(`/api/doctor/patients/requests/${requestId}/reject`)
    .set("Authorization", `Bearer ${doctor.token}`);

  // Rejected doctor tries to access readings
  const res = await request(app)
    .get(`/api/doctor/patients/${patient.user.id}/readings`)
    .set("Authorization", `Bearer ${doctor.token}`);

  assert.equal(res.status, 403);
});

test("doctor with no request cannot view patient records", async () => {
  const doctor = await signupDoctor("Dr. Random", "random@example.com");
  const patient = await signupPatient("Riya", "riya11@example.com");

  await addReading(patient.token, "2026-10-15", "Morning fasting", 90);

  const res = await request(app)
    .get(`/api/doctor/patients/${patient.user.id}/readings`)
    .set("Authorization", `Bearer ${doctor.token}`);

  assert.equal(res.status, 403);
});

// ===========================================================================
// NEW: Revoked access takes effect immediately
// ===========================================================================

test("revoked doctor immediately loses access to patient records", async () => {
  const doctor = await signupDoctor("Dr. Revoke", "revoke@example.com");
  const patient = await signupPatient("Riya", "riya12@example.com");

  await addReading(patient.token, "2026-10-15", "Morning fasting", 90);

  // Send and accept request
  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);

  const requestId = reqRes.body.request.id;
  await request(app)
    .post(`/api/doctor/patients/requests/${requestId}/accept`)
    .set("Authorization", `Bearer ${doctor.token}`);

  // Confirm doctor has access
  const before = await request(app)
    .get(`/api/doctor/patients/${patient.user.id}/readings`)
    .set("Authorization", `Bearer ${doctor.token}`);
  assert.equal(before.status, 200);

  // Patient revokes access
  const revoke = await request(app)
    .delete(`/api/patient/authorized-doctors/${requestId}`)
    .set("Authorization", `Bearer ${patient.token}`);
  assert.equal(revoke.status, 200);

  // Doctor tries again — must get 403
  const after = await request(app)
    .get(`/api/doctor/patients/${patient.user.id}/readings`)
    .set("Authorization", `Bearer ${doctor.token}`);
  assert.equal(after.status, 403);

  // Doctor no longer appears in patient's authorized list
  const authRes = await request(app)
    .get("/api/patient/authorized-doctors")
    .set("Authorization", `Bearer ${patient.token}`);
  assert.equal(authRes.body.doctors.length, 0);
});

// ===========================================================================
// NEW: Doctors cannot modify patient readings
// ===========================================================================

test("doctor cannot add, edit, or delete patient readings", async () => {
  const doctor = await signupDoctor("Dr. Write", "write@example.com");
  const patient = await signupPatient("Riya", "riya13@example.com");

  const readingRes = await addReading(
    patient.token,
    "2026-10-15",
    "Morning fasting",
    90,
  );
  const readingId = readingRes.body.reading.id;

  // Accept relationship so doctor has max possible access
  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);
  await request(app)
    .post(`/api/doctor/patients/requests/${reqRes.body.request.id}/accept`)
    .set("Authorization", `Bearer ${doctor.token}`);

  // Doctor tries to add a reading via the patient readings endpoint
  const addRes = await request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${doctor.token}`)
    .send({ date: "2026-10-15", slot: "After breakfast", value: 110 });
  // Doctors cannot use the patient readings endpoint (it would create readings
  // scoped to the doctor's own user_id — which is a doctor account with no readings)
  // The test verifies no cross-patient reading creation is possible.
  assert.equal(addRes.status, 403);

  // Doctor tries to edit a patient's reading directly
  const editRes = await request(app)
    .put(`/api/readings/${readingId}`)
    .set("Authorization", `Bearer ${doctor.token}`)
    .send({ date: "2026-10-15", slot: "After breakfast", value: 200 });
  assert.equal(editRes.status, 403);

  // Doctor tries to delete a patient's reading directly
  const deleteRes = await request(app)
    .delete(`/api/readings/${readingId}`)
    .set("Authorization", `Bearer ${doctor.token}`);
  assert.equal(deleteRes.status, 403);
});

// ===========================================================================
// NEW: Patients cannot use doctor endpoints
// ===========================================================================

test("patient cannot access doctor-only endpoints", async () => {
  const patient = await signupPatient("Riya", "riya14@example.com");

  const res1 = await request(app)
    .get("/api/doctor/patients/requests")
    .set("Authorization", `Bearer ${patient.token}`);
  assert.equal(res1.status, 403);

  const res2 = await request(app)
    .get("/api/doctor/patients")
    .set("Authorization", `Bearer ${patient.token}`);
  assert.equal(res2.status, 403);
});

// ===========================================================================
// NEW: Patient cannot access another patient's records
// ===========================================================================

test("patient cannot access another patient's records", async () => {
  const patient1 = await signupPatient("Riya A", "riya_a@example.com");
  const patient2 = await signupPatient("Riya B", "riya_b@example.com");

  await addReading(patient1.token, "2026-10-15", "Morning fasting", 90);

  // patient2 tries to access patient1's readings via patient API
  // (patient routes only expose /api/patient/doctors, not direct readings access)
  // But if patient2 tries the doctor endpoint (they are a patient, not a doctor):
  const res = await request(app)
    .get(`/api/doctor/patients/${patient1.user.id}/readings`)
    .set("Authorization", `Bearer ${patient2.token}`);
  assert.equal(res.status, 403); // Not a doctor
});

// ===========================================================================
// NEW: Doctor can only see their own patients' requests
// ===========================================================================

test("doctor can only manage requests addressed to them", async () => {
  const doctor1 = await signupDoctor("Dr. One", "doc1@example.com");
  const doctor2 = await signupDoctor("Dr. Two", "doc2@example.com");
  const patient = await signupPatient("Riya", "riya15@example.com");

  // Patient sends request to doctor2
  const reqRes = await request(app)
    .post(`/api/patient/doctors/${doctor2.user.id}/request`)
    .set("Authorization", `Bearer ${patient.token}`);
  const requestId = reqRes.body.request.id;

  // Doctor1 tries to accept doctor2's request
  const res = await request(app)
    .post(`/api/doctor/patients/requests/${requestId}/accept`)
    .set("Authorization", `Bearer ${doctor1.token}`);
  assert.equal(res.status, 404); // doctor1 can't see doctor2's requests
});
