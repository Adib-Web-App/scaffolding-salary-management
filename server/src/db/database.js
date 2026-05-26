/**
 * Database facade: PostgreSQL when DATABASE_URL is set, otherwise SQLite (local dev).
 */

function usePostgres() {
  const url = process.env.DATABASE_URL || '';
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

let adapter;

async function getAdapter() {
  if (!adapter) {
    adapter = usePostgres()
      ? await import('./postgres.js')
      : await import('./sqlite.js');
  }
  return adapter;
}

export async function run(sql, params = []) {
  return (await getAdapter()).run(sql, params);
}

export async function get(sql, params = []) {
  return (await getAdapter()).get(sql, params);
}

export async function all(sql, params = []) {
  return (await getAdapter()).all(sql, params);
}

export async function initDatabase() {
  const mod = await getAdapter();
  await mod.initDatabase();
  return mod.dialect;
}

export async function closeDatabase() {
  if (adapter?.closeDatabase) {
    await adapter.closeDatabase();
  }
}

export function getDialect() {
  return usePostgres() ? 'postgres' : 'sqlite';
}

