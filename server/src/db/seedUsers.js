import bcrypt from 'bcrypt';
import { parseCount } from './sqlUtils.js';
import { ROLES } from '../config/permissions.js';

const SALT_ROUNDS = 10;

const DEFAULT_USERS = [
  { username: 'admin', password: 'admin123', role: ROLES.ADMIN },
  { username: 'supervisor', password: 'supervisor123', role: ROLES.SUPERVISOR },
  { username: 'viewer', password: 'viewer123', role: ROLES.VIEWER },
];

/**
 * @param {function} [countFn] - optional row parser (postgres init passes parseCount)
 */
export async function seedDefaultUsers(countFn = parseCount) {
  const { run, get } = await import('./database.js');
  const row = await get(`SELECT COUNT(*) as count FROM users`);
  if (countFn(row) > 0) return;

  for (const user of DEFAULT_USERS) {
    const password_hash = await bcrypt.hash(user.password, SALT_ROUNDS);
    await run(
      `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      [user.username, password_hash, user.role]
    );
  }
  console.log('Seeded default users (admin, supervisor, viewer)');
}
