import { all, get, run } from '../db/database.js';

const JOB_SELECT = `
  SELECT j.*, p.project_name
  FROM work_jobs j
  JOIN projects p ON p.id = j.project_id
`;

export async function findWorkersByJobId(jobId) {
  return all(
    `SELECT * FROM work_job_workers WHERE job_id = ? ORDER BY worker_name`,
    [jobId]
  );
}

export async function findDimensionsByJobId(jobId) {
  return all(
    `SELECT * FROM work_job_dimensions WHERE work_entry_id = ? ORDER BY id`,
    [jobId]
  );
}

async function attachWorkers(job) {
  const workers = await findWorkersByJobId(job.id);
  const dimensions = await findDimensionsByJobId(job.id);
  return { ...job, workers, dimensions };
}

export async function findAllWorkJobs({
  search = '',
  dateFrom = '',
  dateTo = '',
  worker = '',
  projectId = '',
} = {}) {
  let sql = `${JOB_SELECT} WHERE 1=1`;
  const params = [];

  if (search) {
    sql += ` AND (p.project_name LIKE ? OR j.location LIKE ? OR j.id IN (
      SELECT job_id FROM work_job_workers WHERE worker_name LIKE ?
    ))`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (dateFrom) {
    sql += ` AND j.entry_date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND j.entry_date <= ?`;
    params.push(dateTo);
  }
  if (worker) {
    sql += ` AND j.id IN (SELECT job_id FROM work_job_workers WHERE worker_name = ?)`;
    params.push(worker);
  }
  if (projectId) {
    sql += ` AND j.project_id = ?`;
    params.push(projectId);
  }

  sql += ` ORDER BY j.entry_date DESC, j.id DESC`;
  const jobs = await all(sql, params);
  return Promise.all(jobs.map(attachWorkers));
}

export async function findWorkJobById(id) {
  const job = await get(`${JOB_SELECT} WHERE j.id = ?`, [id]);
  if (!job) return null;
  return attachWorkers(job);
}

export async function createWorkJob(jobData, workers, dimensions = []) {
  const {
    entry_date,
    project_id,
    location,
    work_type,
    length,
    width,
    height,
    volume,
    rate,
    total_salary,
    remarks,
  } = jobData;

  const result = await run(
    `INSERT INTO work_jobs (entry_date, project_id, location, work_type, length, width, height, volume, rate, total_salary, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry_date, project_id, location || null, work_type, length, width, height, volume, rate, total_salary, remarks || null]
  );

  for (const w of workers) {
    await run(
      `INSERT INTO work_job_workers (job_id, worker_name, individual_salary, volume_share)
       VALUES (?, ?, ?, ?)`,
      [result.lastID, w.worker_name, w.individual_salary, w.volume_share]
    );
  }
  for (const d of dimensions) {
    await run(
      `INSERT INTO work_job_dimensions (work_entry_id, length, width, height, volume, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [result.lastID, d.length, d.width, d.height, d.volume, null]
    );
  }

  return findWorkJobById(result.lastID);
}

export async function updateWorkJob(id, jobData, workers, dimensions = []) {
  const {
    entry_date,
    project_id,
    location,
    work_type,
    length,
    width,
    height,
    volume,
    rate,
    total_salary,
    remarks,
  } = jobData;

  await run(
    `UPDATE work_jobs SET entry_date = ?, project_id = ?, location = ?, work_type = ?, length = ?, width = ?, height = ?,
     volume = ?, rate = ?, total_salary = ?, remarks = ? WHERE id = ?`,
    [entry_date, project_id, location || null, work_type, length, width, height, volume, rate, total_salary, remarks || null, id]
  );

  await run(`DELETE FROM work_job_workers WHERE job_id = ?`, [id]);
  for (const w of workers) {
    await run(
      `INSERT INTO work_job_workers (job_id, worker_name, individual_salary, volume_share)
       VALUES (?, ?, ?, ?)`,
      [id, w.worker_name, w.individual_salary, w.volume_share]
    );
  }
  await run(`DELETE FROM work_job_dimensions WHERE work_entry_id = ?`, [id]);
  for (const d of dimensions) {
    await run(
      `INSERT INTO work_job_dimensions (work_entry_id, length, width, height, volume, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, d.length, d.width, d.height, d.volume, null]
    );
  }

  return findWorkJobById(id);
}

export async function deleteWorkJob(id) {
  await run(`DELETE FROM work_job_dimensions WHERE work_entry_id = ?`, [id]);
  await run(`DELETE FROM work_job_workers WHERE job_id = ?`, [id]);
  const result = await run(`DELETE FROM work_jobs WHERE id = ?`, [id]);
  return result.changes > 0;
}

export async function getDistinctWorkers() {
  const rows = await all(`SELECT DISTINCT worker_name FROM work_job_workers ORDER BY worker_name`);
  return rows.map((r) => r.worker_name);
}
