import { all, get } from '../db/database.js';

function jobDateFilter(alias, dateFrom, dateTo, projectId) {
  let sql = '';
  const params = [];
  if (dateFrom) {
    sql += ` AND ${alias}.entry_date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND ${alias}.entry_date <= ?`;
    params.push(dateTo);
  }
  if (projectId) {
    sql += ` AND ${alias}.project_id = ?`;
    params.push(projectId);
  }
  return { sql, params };
}

export async function getSummary({ dateFrom = '', dateTo = '', worker = '', projectId = '' } = {}) {
  const { sql: dateSql, params: dateParams } = jobDateFilter('j', dateFrom, dateTo, projectId);

  let erectionSql = `
    SELECT COALESCE(SUM(j.volume), 0) as vol
    FROM work_jobs j WHERE j.work_type = 'Erection' ${dateSql}
  `;
  let dismantleSql = `
    SELECT COALESCE(SUM(j.volume), 0) as vol
    FROM work_jobs j WHERE j.work_type = 'Dismantle' ${dateSql}
  `;

  const erectionParams = [...dateParams];
  const dismantleParams = [...dateParams];

  if (worker) {
    erectionSql += ` AND j.id IN (SELECT job_id FROM work_job_workers WHERE worker_name = ?)`;
    dismantleSql += ` AND j.id IN (SELECT job_id FROM work_job_workers WHERE worker_name = ?)`;
    erectionParams.push(worker);
    dismantleParams.push(worker);
  }

  const erectionRow = await get(erectionSql, erectionParams);
  const dismantleRow = await get(dismantleSql, dismantleParams);

  let salarySql = `
    SELECT COALESCE(SUM(w.individual_salary), 0) as total_salary
    FROM work_job_workers w
    JOIN work_jobs j ON j.id = w.job_id
    WHERE 1=1 ${dateSql.replace(/j\./g, 'j.')}
  `;
  const salaryParams = [...dateParams];
  if (worker) {
    salarySql += ` AND w.worker_name = ?`;
    salaryParams.push(worker);
  }

  const salaryRow = await get(salarySql, salaryParams);

  let advanceSql = `SELECT COALESCE(SUM(amount), 0) as total_advance FROM advances WHERE 1=1`;
  const advanceParams = [];
  if (dateFrom) {
    advanceSql += ` AND advance_date >= ?`;
    advanceParams.push(dateFrom);
  }
  if (dateTo) {
    advanceSql += ` AND advance_date <= ?`;
    advanceParams.push(dateTo);
  }
  if (worker) {
    advanceSql += ` AND worker_name = ?`;
    advanceParams.push(worker);
  }

  const advanceRow = await get(advanceSql, advanceParams);
  const totalSalary = salaryRow?.total_salary || 0;
  const totalAdvance = advanceRow?.total_advance || 0;

  return {
    total_erection_volume: erectionRow?.vol || 0,
    total_dismantle_volume: dismantleRow?.vol || 0,
    total_salary: totalSalary,
    total_advance: totalAdvance,
    net_salary: totalSalary - totalAdvance,
  };
}

export async function getSummaryByWorker({ dateFrom = '', dateTo = '', projectId = '' } = {}) {
  const { sql: dateSql, params: dateParams } = jobDateFilter('j', dateFrom, dateTo, projectId);

  let sql = `
    SELECT
      w.worker_name,
      COUNT(DISTINCT w.job_id) as total_jobs,
      COALESCE(SUM(w.volume_share), 0) as total_volume_share,
      COALESCE(SUM(w.individual_salary), 0) as total_salary
    FROM work_job_workers w
    JOIN work_jobs j ON j.id = w.job_id
    WHERE 1=1 ${dateSql}
    GROUP BY w.worker_name
    ORDER BY total_salary DESC
  `;

  const workRows = await all(sql, dateParams);

  let advanceSql = `SELECT worker_name, COALESCE(SUM(amount), 0) as total_advance FROM advances WHERE 1=1`;
  const advanceParams = [];
  if (dateFrom) {
    advanceSql += ` AND advance_date >= ?`;
    advanceParams.push(dateFrom);
  }
  if (dateTo) {
    advanceSql += ` AND advance_date <= ?`;
    advanceParams.push(dateTo);
  }
  advanceSql += ` GROUP BY worker_name`;
  const advanceRows = await all(advanceSql, advanceParams);
  const advanceMap = Object.fromEntries(advanceRows.map((r) => [r.worker_name, r.total_advance]));

  const workerSet = new Set([
    ...workRows.map((r) => r.worker_name),
    ...advanceRows.map((r) => r.worker_name),
  ]);

  return [...workerSet]
    .map((name) => {
      const work = workRows.find((r) => r.worker_name === name);
      const salary = work?.total_salary || 0;
      const advance = advanceMap[name] || 0;
      return {
        worker_name: name,
        total_jobs: work?.total_jobs || 0,
        total_volume_share: work?.total_volume_share || 0,
        total_salary: salary,
        total_advance: advance,
        net_salary: salary - advance,
      };
    })
    .sort((a, b) => b.total_salary - a.total_salary);
}

export async function getSummaryByProject({ dateFrom = '', dateTo = '', worker = '' } = {}) {
  let sql = `
    SELECT
      p.id as project_id,
      p.project_name,
      COALESCE(SUM(CASE WHEN j.work_type = 'Erection' THEN j.volume ELSE 0 END), 0) as erection_volume,
      COALESCE(SUM(CASE WHEN j.work_type = 'Dismantle' THEN j.volume ELSE 0 END), 0) as dismantle_volume,
      COALESCE(SUM(j.total_salary), 0) as total_salary
    FROM work_jobs j
    JOIN projects p ON p.id = j.project_id
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
  if (worker) {
    sql += ` AND j.id IN (SELECT job_id FROM work_job_workers WHERE worker_name = ?)`;
    params.push(worker);
  }

  sql += ` GROUP BY p.id, p.project_name ORDER BY p.project_name`;
  return all(sql, params);
}

export async function getAllWorkers() {
  const workWorkers = await all(`SELECT DISTINCT worker_name FROM work_job_workers`);
  const advanceWorkers = await all(`SELECT DISTINCT worker_name FROM advances`);
  const attendanceWorkers = await all(`SELECT DISTINCT worker_name FROM attendance`);
  const names = new Set([
    ...workWorkers.map((r) => r.worker_name),
    ...advanceWorkers.map((r) => r.worker_name),
    ...attendanceWorkers.map((r) => r.worker_name),
  ]);
  return [...names].sort();
}
