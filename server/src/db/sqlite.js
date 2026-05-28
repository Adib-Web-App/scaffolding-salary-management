import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parseCount } from './sqlUtils.js';
import { seedDefaultUsers } from './seedUsers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', '..', 'data');
const LEGACY_DB_PATH = path.join(DB_DIR, 'salary.db');
const isTestEnv = process.env.NODE_ENV === 'test';

function resolveDbPath() {
  if (process.env.DATABASE_PATH) {
    return path.resolve(process.env.DATABASE_PATH);
  }
  const fileName = isTestEnv ? 'test.db' : 'production.db';
  return path.join(DB_DIR, fileName);
}

export const DB_PATH = resolveDbPath();

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!isTestEnv && !fs.existsSync(DB_PATH) && fs.existsSync(LEGACY_DB_PATH)) {
  fs.copyFileSync(LEGACY_DB_PATH, DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function tableExists(name) {
  const row = await get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [name]
  );
  return !!row;
}

async function migrateLegacyWorkEntries() {
  const hasLegacy = await tableExists('work_entries');
  if (!hasLegacy) return;

  const jobCount = await get(`SELECT COUNT(*) as count FROM work_jobs`);
  if (parseCount(jobCount) > 0) return;

  const legacy = await all(`SELECT * FROM work_entries ORDER BY id`);
  for (const row of legacy) {
    const jobResult = await run(
      `INSERT INTO work_jobs (entry_date, project_id, work_type, length, width, height, volume, rate, total_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.entry_date,
        row.project_id,
        row.work_type,
        row.length,
        row.width,
        row.height,
        row.volume,
        row.rate,
        row.salary,
      ]
    );
    await run(
      `INSERT INTO work_job_workers (job_id, worker_name, individual_salary, volume_share)
       VALUES (?, ?, ?, ?)`,
      [jobResult.lastID, row.worker_name, row.salary, row.volume]
    );
  }
}

async function migrateAdvancesProjectColumn() {
  const columns = await all(`PRAGMA table_info(advances)`);
  const hasProject = columns.some((c) => c.name === 'project_id');
  if (!hasProject) {
    await run(`ALTER TABLE advances ADD COLUMN project_id INTEGER REFERENCES projects(id)`);
  }
}

async function migrateWorkJobsLocationColumn() {
  const columns = await all(`PRAGMA table_info(work_jobs)`);
  const hasLocation = columns.some((c) => c.name === 'location');
  if (!hasLocation) {
    await run(`ALTER TABLE work_jobs ADD COLUMN location TEXT`);
  }
}

async function migrateWorkJobsRemarksColumn() {
  const columns = await all(`PRAGMA table_info(work_jobs)`);
  const hasRemarks = columns.some((c) => c.name === 'remarks');
  if (!hasRemarks) {
    await run(`ALTER TABLE work_jobs ADD COLUMN remarks TEXT`);
  }
}

async function migrateWorkJobDimensionsTable() {
  await run(`
    CREATE TABLE IF NOT EXISTS work_job_dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_entry_id INTEGER NOT NULL,
      length REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      volume REAL NOT NULL,
      remarks TEXT,
      FOREIGN KEY (work_entry_id) REFERENCES work_jobs(id) ON DELETE CASCADE
    )
  `);
  await run(
    `CREATE INDEX IF NOT EXISTS idx_work_job_dimensions_entry ON work_job_dimensions(work_entry_id)`
  );
}

async function migrateExistingJobsToDimensionLines() {
  await run(`
    INSERT INTO work_job_dimensions (work_entry_id, length, width, height, volume, remarks)
    SELECT j.id, j.length, j.width, j.height, j.volume, NULL
    FROM work_jobs j
    WHERE NOT EXISTS (
      SELECT 1 FROM work_job_dimensions d WHERE d.work_entry_id = j.id
    )
  `);
}

export async function initDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      erection_rate REAL NOT NULL DEFAULT 0,
      dismantle_rate REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS work_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      project_id INTEGER NOT NULL,
      work_type TEXT NOT NULL CHECK(work_type IN ('Erection', 'Dismantle')),
      length REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      volume REAL NOT NULL,
      rate REAL NOT NULL,
      total_salary REAL NOT NULL,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS work_job_workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_name TEXT NOT NULL,
      individual_salary REAL NOT NULL,
      volume_share REAL NOT NULL,
      FOREIGN KEY (job_id) REFERENCES work_jobs(id) ON DELETE CASCADE
    )
  `);

  await migrateWorkJobDimensionsTable();

  await run(`
    CREATE TABLE IF NOT EXISTS advances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_name TEXT NOT NULL,
      advance_date TEXT NOT NULL,
      amount REAL NOT NULL,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attendance_date TEXT NOT NULL,
      worker_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
      project_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_work_jobs_date ON work_jobs(entry_date)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_work_jobs_project ON work_jobs(project_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_work_job_workers_name ON work_job_workers(worker_name)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_advances_date ON advances(advance_date)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_advances_worker ON advances(worker_name)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_name)`);

  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'SUPERVISOR', 'VIEWER')),
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);

  await migrateAdvancesProjectColumn();
  await migrateWorkJobsLocationColumn();
  await migrateWorkJobsRemarksColumn();
  await migrateLegacyWorkEntries();
  await migrateExistingJobsToDimensionLines();
  // Idempotent: inserts default users only when users table is empty (never deletes/resets).
  await seedDefaultUsers(parseCount);
  console.log(`SQLite database ready (${DB_PATH})`);
}

export async function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

export const dialect = 'sqlite';
