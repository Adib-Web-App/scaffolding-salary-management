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

function resolveDateRange(dateFrom, dateTo) {
  if (dateFrom && dateTo) return { dateFrom, dateTo };
  if (dateFrom) return { dateFrom, dateTo: dateFrom };
  if (dateTo) return { dateFrom: dateTo, dateTo };
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: now.toISOString().slice(0, 10),
  };
}

function enumerateDates(dateFrom, dateTo) {
  const dates = [];
  const cursor = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T00:00:00`);
  const maxDays = 366;
  let count = 0;
  while (cursor <= end && count < maxDays) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
    count += 1;
  }
  return dates;
}

function advanceDateFilter(dateFrom, dateTo, projectId) {
  let sql = '';
  const params = [];
  if (dateFrom) {
    sql += ` AND a.advance_date >= ?`;
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ` AND a.advance_date <= ?`;
    params.push(dateTo);
  }
  if (projectId) {
    sql += ` AND a.project_id = ?`;
    params.push(projectId);
  }
  return { sql, params };
}

/**
 * Daily salary matrix: workers × dates with salary, advance, nett per day.
 */
export async function getDailySalarySummary({
  dateFrom = '',
  dateTo = '',
  worker = '',
  projectId = '',
} = {}) {
  const range = resolveDateRange(dateFrom, dateTo);
  const allDatesInRange = enumerateDates(range.dateFrom, range.dateTo);
  const { sql: jobSql, params: jobParams } = jobDateFilter('j', range.dateFrom, range.dateTo, projectId);

  let salarySql = `
    SELECT w.worker_name, j.entry_date AS day,
           COALESCE(SUM(w.individual_salary), 0) AS daily_salary
    FROM work_job_workers w
    JOIN work_jobs j ON j.id = w.job_id
    WHERE 1=1 ${jobSql}
  `;
  const salaryParams = [...jobParams];
  if (worker) {
    salarySql += ` AND w.worker_name = ?`;
    salaryParams.push(worker);
  }
  salarySql += ` GROUP BY w.worker_name, j.entry_date`;

  let advanceSql = `
    SELECT a.worker_name, a.advance_date AS day,
           COALESCE(SUM(a.amount), 0) AS daily_advance
    FROM advances a
    WHERE 1=1
  `;
  const { sql: advFilterSql, params: advFilterParams } = advanceDateFilter(
    range.dateFrom,
    range.dateTo,
    projectId
  );
  advanceSql += advFilterSql;
  const advanceParams = [...advFilterParams];
  if (worker) {
    advanceSql += ` AND a.worker_name = ?`;
    advanceParams.push(worker);
  }
  advanceSql += ` GROUP BY a.worker_name, a.advance_date`;

  const [salaryRows, advanceRows] = await Promise.all([
    all(salarySql, salaryParams),
    all(advanceSql, advanceParams),
  ]);

  const workerSet = new Set();
  const activeDateSet = new Set();
  const salaryMap = {};
  const advanceMap = {};

  for (const row of salaryRows) {
    const value = Number(row.daily_salary) || 0;
    if (value !== 0) {
      workerSet.add(row.worker_name);
      activeDateSet.add(row.day);
    }
    const key = `${row.worker_name}|${row.day}`;
    salaryMap[key] = value;
  }
  for (const row of advanceRows) {
    const value = Number(row.daily_advance) || 0;
    if (value !== 0) {
      workerSet.add(row.worker_name);
      activeDateSet.add(row.day);
    }
    const key = `${row.worker_name}|${row.day}`;
    advanceMap[key] = value;
  }

  const dates = allDatesInRange.filter((day) => activeDateSet.has(day));
  const workers = [...workerSet].sort((a, b) => a.localeCompare(b));

  const rows = workers
    .map((workerName) => {
    let totalSalary = 0;
    let totalAdvance = 0;
    let hasAnyActivity = false;
    const daily = {};

    for (const day of dates) {
      const key = `${workerName}|${day}`;
      const dailySalary = salaryMap[key] ?? 0;
      const dailyAdvance = advanceMap[key] ?? 0;
      const dailyNett = dailySalary - dailyAdvance;
      const hasActivity = dailySalary !== 0 || dailyAdvance !== 0;
      hasAnyActivity = hasAnyActivity || hasActivity;

      daily[day] = {
        salary: dailySalary,
        advance: dailyAdvance,
        nett: dailyNett,
        hasActivity,
      };
      totalSalary += dailySalary;
      totalAdvance += dailyAdvance;
    }

    return {
      worker_name: workerName,
      daily,
      total_salary: totalSalary,
      total_advance: totalAdvance,
      total_nett: totalSalary - totalAdvance,
      has_any_activity: hasAnyActivity,
    };
    })
    .filter((row) => row.has_any_activity);

  return {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    dates,
    rows,
  };
}

/**
 * Advance-only matrix: workers × dates with advance amounts per day.
 */
export async function getAdvanceSummary({
  dateFrom = '',
  dateTo = '',
  worker = '',
  projectId = '',
} = {}) {
  const range = resolveDateRange(dateFrom, dateTo);
  const allDatesInRange = enumerateDates(range.dateFrom, range.dateTo);

  let advanceSql = `
    SELECT a.worker_name, a.advance_date AS day,
           COALESCE(SUM(a.amount), 0) AS daily_advance
    FROM advances a
    WHERE 1=1
  `;
  const { sql: advFilterSql, params: advanceParams } = advanceDateFilter(
    range.dateFrom,
    range.dateTo,
    projectId
  );
  advanceSql += advFilterSql;
  if (worker) {
    advanceSql += ` AND a.worker_name = ?`;
    advanceParams.push(worker);
  }
  advanceSql += ` GROUP BY a.worker_name, a.advance_date`;

  const advanceRows = await all(advanceSql, advanceParams);

  const workerSet = new Set();
  const activeDateSet = new Set();
  const advanceMap = {};

  for (const row of advanceRows) {
    const value = Number(row.daily_advance) || 0;
    if (value !== 0) {
      workerSet.add(row.worker_name);
      activeDateSet.add(row.day);
      advanceMap[`${row.worker_name}|${row.day}`] = value;
    }
  }

  const dates = allDatesInRange.filter((day) => activeDateSet.has(day));
  const workers = [...workerSet].sort((a, b) => a.localeCompare(b));

  const rows = workers.map((workerName) => {
    let totalAdvance = 0;
    const daily = {};

    for (const day of dates) {
      const dailyAdvance = advanceMap[`${workerName}|${day}`] ?? 0;
      const hasActivity = dailyAdvance !== 0;
      daily[day] = { advance: dailyAdvance, hasActivity };
      totalAdvance += dailyAdvance;
    }

    return {
      worker_name: workerName,
      daily,
      total_advance: totalAdvance,
    };
  });

  return {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    dates,
    rows,
  };
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
