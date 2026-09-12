import { all, get, run, getDialect } from '../db/database.js';

function nowSql() {
  return getDialect() === 'postgres' ? 'NOW()' : `datetime('now')`;
}

const SELECT = `
  SELECT h.*, p.project_name
  FROM housekeeping h
  LEFT JOIN projects p ON p.id = h.project_id
`;

export async function findAllHousekeeping({
  search = '',
  dateFrom = '',
  dateTo = '',
  worker = '',
  projectId = '',
} = {}) {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (h.worker_name LIKE ? OR h.remarks LIKE ? OR p.project_name LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (dateFrom) {
    sql += ` AND h.housekeeping_date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND h.housekeeping_date <= ?`;
    params.push(dateTo);
  }
  if (worker) {
    sql += ` AND h.worker_name = ?`;
    params.push(worker);
  }
  if (projectId) {
    sql += ` AND h.project_id = ?`;
    params.push(projectId);
  }

  sql += ` ORDER BY h.housekeeping_date DESC, h.id DESC`;
  return all(sql, params);
}

export async function findHousekeepingById(id) {
  return get(`${SELECT} WHERE h.id = ?`, [id]);
}

export async function createHousekeeping({
  worker_name,
  housekeeping_date,
  amount,
  remarks,
  project_id,
}) {
  const result = await run(
    `INSERT INTO housekeeping (worker_name, housekeeping_date, amount, remarks, project_id, updated_at)
     VALUES (?, ?, ?, ?, ?, ${nowSql()})`,
    [worker_name, housekeeping_date, amount, remarks || null, project_id || null]
  );
  return findHousekeepingById(result.lastID);
}

export async function updateHousekeeping(
  id,
  { worker_name, housekeeping_date, amount, remarks, project_id }
) {
  await run(
    `UPDATE housekeeping
     SET worker_name = ?, housekeeping_date = ?, amount = ?, remarks = ?, project_id = ?, updated_at = ${nowSql()}
     WHERE id = ?`,
    [worker_name, housekeeping_date, amount, remarks || null, project_id ?? null, id]
  );
  return findHousekeepingById(id);
}

export async function deleteHousekeeping(id) {
  const result = await run(`DELETE FROM housekeeping WHERE id = ?`, [id]);
  return result.changes > 0;
}
