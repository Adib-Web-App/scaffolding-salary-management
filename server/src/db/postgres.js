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
