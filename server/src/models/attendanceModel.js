import { all, get, run } from '../db/database.js';
import { monthDateRange } from '../db/sqlUtils.js';

const SELECT = `
  SELECT a.*, p.project_name
  FROM attendance a
  LEFT JOIN projects p ON p.id = a.project_id
`;

export async function findAllAttendance({
  search = '',
  dateFrom = '',
  dateTo = '',
  worker = '',
  projectId = '',
  month = '',
} = {}) {
  let sql = `${SELECT} WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (a.worker_name LIKE ? OR p.project_name LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term);
  }
  if (dateFrom) {
    sql += ` AND a.attendance_date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND a.attendance_date <= ?`;
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
  if (month) {
    const { start, end } = monthDateRange(month);
    sql += ` AND a.attendance_date >= ? AND a.attendance_date < ?`;
    params.push(start, end);
  }

  sql += ` ORDER BY a.attendance_date DESC, a.id DESC`;
  return all(sql, params);
}

export async function findAttendanceById(id) {
  return get(`${SELECT} WHERE a.id = ?`, [id]);
}

export async function createAttendance(data) {
  const { attendance_date, worker_name, status, project_id } = data;
  const result = await run(
    `INSERT INTO attendance (attendance_date, worker_name, status, project_id) VALUES (?, ?, ?, ?)`,
    [attendance_date, worker_name, status, project_id || null]
  );
  return findAttendanceById(result.lastID);
}

export async function updateAttendance(id, data) {
  const { attendance_date, worker_name, status, project_id } = data;
  await run(
    `UPDATE attendance SET attendance_date = ?, worker_name = ?, status = ?, project_id = ? WHERE id = ?`,
    [attendance_date, worker_name, status, project_id || null, id]
  );
  return findAttendanceById(id);
}

export async function deleteAttendance(id) {
  const result = await run(`DELETE FROM attendance WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function getWorkerHistory(workerName, { dateFrom = '', dateTo = '' } = {}) {
  return findAllAttendance({ worker: workerName, dateFrom, dateTo });
}

export async function getMonthlySummary(month) {
  const { start, end } = monthDateRange(month);
  const rows = await all(
    `
    SELECT
      worker_name,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
      COUNT(*) as total_records
    FROM attendance
    WHERE attendance_date >= ? AND attendance_date < ?
    GROUP BY worker_name
    ORDER BY worker_name
    `,
    [start, end]
  );
  return rows;
}
