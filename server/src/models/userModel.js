import bcrypt from 'bcrypt';
import { all, get, run } from '../db/database.js';
import { parseCount } from '../db/sqlUtils.js';

const SALT_ROUNDS = 10;

export async function findByUsername(username) {
  return get(`SELECT * FROM users WHERE username = ?`, [username]);
}

export async function findById(id) {
  return get(`SELECT id, username, role, created_at FROM users WHERE id = ?`, [id]);
}

export async function listUsers() {
  return all(`SELECT id, username, role, created_at FROM users ORDER BY username`);
}

export async function createUser({ username, password, role }) {
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await run(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
    [username, password_hash, role]
  );
  return findById(result.lastID);
}

export async function updateUser(id, { username, role, password }) {
  const existing = await findById(id);
  if (!existing) return null;

  if (password) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    await run(
      `UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?`,
      [username ?? existing.username, role ?? existing.role, password_hash, id]
    );
  } else {
    await run(
      `UPDATE users SET username = ?, role = ? WHERE id = ?`,
      [username ?? existing.username, role ?? existing.role, id]
    );
  }
  return findById(id);
}

export async function deleteUser(id) {
  const result = await run(`DELETE FROM users WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

export async function countUsers() {
  const row = await get(`SELECT COUNT(*) as count FROM users`);
  return parseCount(row);
}
