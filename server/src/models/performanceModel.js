import { all } from '../db/database.js';

export async function getWorkerPerformance({ dateFrom = '', dateTo = '', projectId = '' } = {}) {
  let sql = `
    SELECT
      w.worker_name,
      COUNT(DISTINCT w.job_id) as total_jobs,
      COALESCE(SUM(w.volume_share), 0) as total_volume_share,
      COALESCE(SUM(w.individual_salary), 0) as total_earnings
    FROM work_job_workers w
    JOIN work_jobs j ON j.id = w.job_id
    WHERE 1=1
  `;
  const params = [];

  if (dateFrom) {
    sql += ` AND j.entry_date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND j.entry_date <= ?`;
    params.push(dateTo);
  }
  if (projectId) {
    sql += ` AND j.project_id = ?`;
    params.push(projectId);
  }

  sql += ` GROUP BY w.worker_name ORDER BY total_earnings DESC, total_jobs DESC`;

  const rows = await all(sql, params);
  return rows.map((row, index) => ({
    rank: index + 1,
    worker_name: row.worker_name,
    total_jobs: row.total_jobs,
    total_volume_share: row.total_volume_share,
    total_earnings: row.total_earnings,
  }));
}
