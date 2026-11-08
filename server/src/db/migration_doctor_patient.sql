-- =============================================================================
-- Migration: Doctor-Patient Connection System
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS patterns)
-- Preserves all existing users and readings data
-- =============================================================================

-- Step 1: Add role column to existing users table
-- Default is 'patient' so all current users remain patients automatically
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'patient'
    CHECK (role IN ('patient', 'doctor'));

-- Step 2: Create the doctor_patient_requests table
CREATE TABLE IF NOT EXISTS doctor_patient_requests (
  id           SERIAL PRIMARY KEY,
  doctor_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  patient_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(10) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate active/pending requests for the same pair
  CONSTRAINT uq_doctor_patient_active
    UNIQUE (doctor_id, patient_id, status)
    DEFERRABLE INITIALLY DEFERRED
);

-- Step 3: Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_dpr_doctor_id  ON doctor_patient_requests (doctor_id);
CREATE INDEX IF NOT EXISTS idx_dpr_patient_id ON doctor_patient_requests (patient_id);
CREATE INDEX IF NOT EXISTS idx_dpr_status     ON doctor_patient_requests (status);

