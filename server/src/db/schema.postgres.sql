-- COREBUILD Salary Management — PostgreSQL schema

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  project_name TEXT NOT NULL,
  erection_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  dismantle_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_jobs (
  id SERIAL PRIMARY KEY,
  entry_date TEXT NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  location TEXT,
  work_type TEXT NOT NULL CHECK (work_type IN ('Erection', 'Dismantle')),
  length DOUBLE PRECISION NOT NULL,
  width DOUBLE PRECISION NOT NULL,
  height DOUBLE PRECISION NOT NULL,
  volume DOUBLE PRECISION NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  total_salary DOUBLE PRECISION NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_job_workers (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES work_jobs(id) ON DELETE CASCADE,
  worker_name TEXT NOT NULL,
  individual_salary DOUBLE PRECISION NOT NULL,
  volume_share DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS work_job_dimensions (
  id SERIAL PRIMARY KEY,
  work_entry_id INTEGER NOT NULL REFERENCES work_jobs(id) ON DELETE CASCADE,
  length DOUBLE PRECISION NOT NULL,
  width DOUBLE PRECISION NOT NULL,
  height DOUBLE PRECISION NOT NULL,
  volume DOUBLE PRECISION NOT NULL,
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS advances (
  id SERIAL PRIMARY KEY,
  worker_name TEXT NOT NULL,
  advance_date TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  remarks TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  attendance_date TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SUPERVISOR', 'VIEWER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_jobs_date ON work_jobs(entry_date);
CREATE INDEX IF NOT EXISTS idx_work_jobs_project ON work_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_work_job_workers_name ON work_job_workers(worker_name);
CREATE INDEX IF NOT EXISTS idx_work_job_dimensions_entry ON work_job_dimensions(work_entry_id);
CREATE INDEX IF NOT EXISTS idx_advances_date ON advances(advance_date);
CREATE INDEX IF NOT EXISTS idx_advances_worker ON advances(worker_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_name);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
