CREATE TABLE IF NOT EXISTS users (
  id INTEGER,
  name VARCHAR(255),
  email VARCHAR(255),
  password_hash TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS readings (
  id INTEGER,
  user_id INTEGER,
  date DATE,
  slot VARCHAR(30),
  value INTEGER,
  created_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, date);
