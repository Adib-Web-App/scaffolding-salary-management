import { all, get } from '../db/database.js';

export async function getWorkerPayroll(workerName, year, month) {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;

  const work = await get(
    `
    SELECT
      COUNT(DISTINCT w.job_id) as total_jobs,
      COALESCE(SUM(w.volume_share), 0) as total_volume_share,
      COALESCE(SUM(w.individual_salary), 0) as total_earnings
    FROM work_job_workers w
    JOIN work_jobs j ON j.id = w.job_id
    WHERE w.worker_name = ? AND j.entry_date >= ? AND j.entry_date <= ?
    `,
    [workerName, monthStart, monthEnd]
  );

  const advance = await get(
    `
    SELECT COALESCE(SUM(amount), 0) as total_advance
    FROM advances
    WHERE worker_name = ? AND advance_date >= ? AND advance_date <= ?
    `,
    [workerName, monthStart, monthEnd]
  );

  const jobs = await all(
    `
    SELECT j.entry_date, j.work_type, j.volume, p.project_name,
           w.individual_salary, w.volume_share
    FROM work_job_workers w
    JOIN work_jobs j ON j.id = w.job_id
    JOIN projects p ON p.id = j.project_id
    WHERE w.worker_name = ? AND j.entry_date >= ? AND j.entry_date <= ?
    ORDER BY j.entry_date
    `,
    [workerName, monthStart, monthEnd]
  );

  const totalEarnings = work?.total_earnings || 0;
  const totalAdvance = advance?.total_advance || 0;

  return {
    worker_name: workerName,
    period: { year: Number(year), month: Number(month) },
    total_jobs: work?.total_jobs || 0,
    total_volume_share: work?.total_volume_share || 0,
    total_earnings: totalEarnings,
    total_advance: totalAdvance,
    net_salary: totalEarnings - totalAdvance,
    job_details: jobs,
  };
}
