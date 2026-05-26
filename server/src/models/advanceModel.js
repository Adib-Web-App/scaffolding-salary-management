import { all, get, run } from '../db/database.js';

const SELECT = `
  SELECT a.*, p.project_name
  FROM advances a
  LEFT JOIN projects p ON p.id = a.project_id
`;

export async function findAllAdvances({
  search = '',
  dateFrom = '',
  dateTo = '',
  worker = '',
  projectId = '',
} = {}) {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (a.worker_name LIKE ? OR a.remarks LIKE ? OR p.project_name LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (dateFrom) {
    sql += ` AND a.advance_date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND a.advance_date <= ?`;
    params.push(dateTo);
  }
  if (worker) {
    sql += ` AND a.worker_name = ?`;
    params.push(worker);
  }
  if (projectId) {
    sql += ` AND a.project_id = ?`;
    params.push(projectId);
  }

  sql += ` ORDER BY a.advance_date DESC, a.id DESC`;
  return all(sql, params);
}

export async function findAdvanceById(id) {
  return get(`${SELECT} WHERE a.id = ?`, [id]);
}

export async function createAdvance({ worker_name, advance_date, amount, remarks, project_id }) {
  const result = await run(
    `INSERT INTO advances (worker_name, advance_date, amount, remarks, project_id) VALUES (?, ?, ?, ?, ?)`,
    [worker_name, advance_date, amount, remarks || null, project_id || null]
  );
  return findAdvanceById(result.lastID);
}

export async function updateAdvance(id, { worker_name, advance_date, amount, remarks, project_id }) {
  await run(
    `UPDATE advances SET worker_name = ?, advance_date = ?, amount = ?, remarks = ?, project_id = ? WHERE id = ?`,
    [worker_name, advance_date, amount, remarks || null, project_id ?? null, id]
  );
  return findAdvanceById(id);
}

export async function deleteAdvance(id) {
  const result = await run(`DELETE FROM advances WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function getDistinctAdvanceWorkers() {
  const rows = await all(`SELECT DISTINCT worker_name FROM advances ORDER BY worker_name`);
  return rows.map((r) => r.worker_name);
}
