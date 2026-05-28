import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toPgPlaceholders, parseCount } from './sqlUtils.js';
import { seedDefaultUsers } from './seedUsers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required for PostgreSQL');
    }
    const needsSsl =
      process.env.PG_SSL === 'true' ||
      /render\.com|neon\.tech|supabase\.co|railway\.app/i.test(connectionString);
    pool = new pg.Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

function prepare(sql, params) {
  return { text: toPgPlaceholders(sql), values: params };
}

export async function run(sql, params = []) {
  const client = getPool();
  const trimmed = sql.trim();
  const isInsert = /^INSERT\s+/i.test(trimmed);
  let text = toPgPlaceholders(sql);
  if (isInsert && !/RETURNING/i.test(text)) {
    text = `${text.replace(/;\s*$/, '')} RETURNING id`;
  }
  const result = await client.query({ text, values: params });
  return {
    lastID: result.rows[0]?.id ?? null,
    changes: result.rowCount ?? 0,
  };
}

export async function get(sql, params = []) {
  const { text, values } = prepare(sql, params);
  const result = await getPool().query(text, values);
  return result.rows[0] ?? null;
}

export async function all(sql, params = []) {
  const { text, values } = prepare(sql, params);
  const result = await getPool().query(text, values);
  return result.rows;
}

async function migrateWorkJobsColumns() {
  await getPool().query(`ALTER TABLE work_jobs ADD COLUMN IF NOT EXISTS location TEXT`);
  await getPool().query(`ALTER TABLE work_jobs ADD COLUMN IF NOT EXISTS remarks TEXT`);
}

async function migrateWorkJobDimensionsTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS work_job_dimensions (
      id SERIAL PRIMARY KEY,
      work_entry_id INTEGER NOT NULL REFERENCES work_jobs(id) ON DELETE CASCADE,
      length DOUBLE PRECISION NOT NULL,
      width DOUBLE PRECISION NOT NULL,
      height DOUBLE PRECISION NOT NULL,
      volume DOUBLE PRECISION NOT NULL,
      remarks TEXT
    )
  `);
  await getPool().query(
    `CREATE INDEX IF NOT EXISTS idx_work_job_dimensions_entry ON work_job_dimensions(work_entry_id)`
  );
}

async function migrateExistingJobsToDimensionLines() {
  await getPool().query(`
    INSERT INTO work_job_dimensions (work_entry_id, length, width, height, volume, remarks)
    SELECT j.id, j.length, j.width, j.height, j.volume, NULL
    FROM work_jobs j
    LEFT JOIN work_job_dimensions d ON d.work_entry_id = j.id
    WHERE d.id IS NULL
  `);
}

export async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.postgres.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    await getPool().query(statement);
  }

  await migrateWorkJobsColumns();
  await migrateWorkJobDimensionsTable();
  await migrateExistingJobsToDimensionLines();

  await seedDefaultUsers(parseCount);
  console.log('PostgreSQL database initialized');
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export const dialect = 'postgres';
