const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { query, close, initializeDatabase } = require("../src/config/db");

async function resetDb() {
  await query("DELETE FROM readings");
  await query("DELETE FROM users");
}

test.before(async () => {
  await initializeDatabase();
});

test.beforeEach(async () => {
  await resetDb();
});

test.after(async () => {
  await resetDb();
  await close();
});

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
    email: "jatin@example.com",
    password: "secret123",
  });

  const token = signup.body.token;

  const firstReading = await request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-10-15",
      slot: "After lunch",
      value: 90,
    });

  assert.equal(firstReading.status, 201);

  const duplicate = await request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-10-15",
      slot: "After lunch",
      value: 120,
    });

  assert.equal(duplicate.status, 400);
  assert.match(duplicate.body.error, /already have an After lunch/i);

  const rangeError = await request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-10-15",
      slot: "After dinner",
      value: 700,
    });

  assert.equal(rangeError.status, 400);
  assert.match(rangeError.body.error, /between 40 and 600/i);
});

test("daily and monthly reports return summary and reading details", async () => {
  const signup = await request(app).post("/api/auth/signup").send({
    name: "Jatin",
    email: "jatin@example.com",
    password: "secret123",
  });

  const token = signup.body.token;

  await request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-10-15",
      slot: "Morning",
      value: 90,
    });

  await request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-10-15",
      slot: "After breakfast",
      value: 110,
    });

  await request(app)
    .post("/api/readings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-09-30",
      slot: "Morning",
      value: 100,
    });

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
  assert.equal(monthly.body.summary.count, 3);
});
