/**
 * Guards against accidental destructive or demo seed operations on production.
 *
 * Production is detected when ANY of:
 * - NODE_ENV=production
 * - PRODUCTION=true|1
 * - DATABASE_PATH ends with production.db (MonsterASP / typical prod SQLite)
 *
 * Override (emergency only): ALLOW_DANGEROUS_PRODUCTION_SEED=1
 */

export function isProductionEnvironment() {
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.PRODUCTION === 'true' || process.env.PRODUCTION === '1') return true;

  const dbPath = (process.env.DATABASE_PATH || '').replace(/\\/g, '/');
  if (/\/production\.db$/i.test(dbPath) || dbPath.endsWith('production.db')) {
    return true;
  }

  return false;
}

export function isDangerousSeedAllowed() {
  return process.env.ALLOW_DANGEROUS_PRODUCTION_SEED === '1';
}

/**
 * Block demo/full seed scripts from running against production.
 * @param {string} scriptName - e.g. "npm run seed"
 */
export function assertNotProductionSeed(scriptName) {
  if (!isProductionEnvironment() || isDangerousSeedAllowed()) return;

  const err = new Error(
    `${scriptName} is blocked in production to protect live data.\n` +
      'This script can insert demo projects, jobs, advances, or attendance.\n' +
      'Use only on local/dev databases.\n' +
      'If you truly intend this on production, set ALLOW_DANGEROUS_PRODUCTION_SEED=1 (not recommended).'
  );
  err.code = 'PRODUCTION_SEED_BLOCKED';
  throw err;
}

/**
 * Log when running maintenance against production (migrate is safe).
 */
export function logProductionMaintenance(action) {
  if (isProductionEnvironment()) {
    console.log(`[production] ${action} — additive migrations only; existing rows are not deleted.`);
  }
}
