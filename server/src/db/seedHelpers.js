import { run } from './database.js';

export function calcJob(length, width, height, erectionRate, dismantleRate, workType, workers) {
  const volume = Number(length) * Number(width) * Number(height);
  const rate = workType === 'Erection' ? erectionRate : dismantleRate;
  const totalSalary = volume * rate;
  const count = workers.length;
  const individualSalary = totalSalary / count;
  const volumeShare = volume / count;
  return { volume, rate, totalSalary, individualSalary, volumeShare };
}

export async function insertJob(projectId, job, rates) {
  const { volume, rate, totalSalary, individualSalary, volumeShare } = calcJob(
    job.length,
    job.width,
    job.height,
    rates.erection_rate,
    rates.dismantle_rate,
    job.workType,
    job.workers
  );

  const result = await run(
    `INSERT INTO work_jobs (entry_date, project_id, work_type, length, width, height, volume, rate, total_salary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      job.date,
      projectId,
      job.workType,
      job.length,
      job.width,
      job.height,
      volume,
      rate,
      totalSalary,
    ]
  );

  for (const name of job.workers) {
    await run(
      `INSERT INTO work_job_workers (job_id, worker_name, individual_salary, volume_share)
       VALUES (?, ?, ?, ?)`,
      [result.lastID, name, individualSalary, volumeShare]
    );
  }

  return { volume, totalSalary, individualSalary };
}

export const SAMPLE_JOBS = [
  // January 2026
  { date: '2026-01-06', projectKey: 'Tower Block A', workType: 'Erection', length: 10, width: 5, height: 2.5, workers: ['Rajesh Kumar', 'Suresh Patel', 'Amit Singh'] },
  { date: '2026-01-10', projectKey: 'Warehouse Extension', workType: 'Dismantle', length: 12, width: 4, height: 2, workers: ['Haikal Ibrahim', 'Kumar Rajan'] },
  { date: '2026-01-14', projectKey: 'Bridge Maintenance', workType: 'Erection', length: 8, width: 3, height: 4, workers: ['Rajesh Kumar', 'Lim Wei Ming'] },
  { date: '2026-01-18', projectKey: 'Tower Block A', workType: 'Dismantle', length: 6, width: 5, height: 3, workers: ['Suresh Patel', 'Amit Singh'] },
  { date: '2026-01-22', projectKey: 'Warehouse Extension', workType: 'Erection', length: 14, width: 6, height: 2, workers: ['Ahmad Zulkifli', 'Haikal Ibrahim', 'Ashwin Das'] },
  { date: '2026-01-27', projectKey: 'Bridge Maintenance', workType: 'Dismantle', length: 9, width: 4, height: 2.5, workers: ['Lim Wei Ming', 'Kumar Rajan', 'Rajesh Kumar'] },
  // February 2026
  { date: '2026-02-03', projectKey: 'Tower Block A', workType: 'Erection', length: 11, width: 5, height: 3, workers: ['Rajesh Kumar', 'Suresh Patel'] },
  { date: '2026-02-07', projectKey: 'Warehouse Extension', workType: 'Erection', length: 10, width: 8, height: 2, workers: ['Haikal Ibrahim', 'Ahmad Zulkifli', 'Ashwin Das'] },
  { date: '2026-02-12', projectKey: 'Bridge Maintenance', workType: 'Dismantle', length: 7, width: 5, height: 3, workers: ['Amit Singh', 'Lim Wei Ming'] },
  { date: '2026-02-16', projectKey: 'Tower Block A', workType: 'Dismantle', length: 8, width: 4, height: 2.5, workers: ['Suresh Patel', 'Kumar Rajan', 'Rajesh Kumar'] },
  { date: '2026-02-20', projectKey: 'Warehouse Extension', workType: 'Dismantle', length: 15, width: 5, height: 2, workers: ['Haikal Ibrahim'] },
  { date: '2026-02-25', projectKey: 'Bridge Maintenance', workType: 'Erection', length: 12, width: 4, height: 3.5, workers: ['Rajesh Kumar', 'Amit Singh', 'Lim Wei Ming', 'Ahmad Zulkifli'] },
  // March 2026
  { date: '2026-03-02', projectKey: 'Tower Block A', workType: 'Erection', length: 9, width: 6, height: 3, workers: ['Rajesh Kumar', 'Ashwin Das', 'Suresh Patel'] },
  { date: '2026-03-06', projectKey: 'Warehouse Extension', workType: 'Dismantle', length: 13, width: 5, height: 2.5, workers: ['Haikal Ibrahim', 'Kumar Rajan'] },
  { date: '2026-03-11', projectKey: 'Bridge Maintenance', workType: 'Erection', length: 10, width: 3, height: 4, workers: ['Lim Wei Ming', 'Amit Singh'] },
  { date: '2026-03-15', projectKey: 'Tower Block A', workType: 'Dismantle', length: 7, width: 5, height: 2, workers: ['Suresh Patel', 'Rajesh Kumar', 'Ahmad Zulkifli'] },
  { date: '2026-03-19', projectKey: 'Warehouse Extension', workType: 'Erection', length: 16, width: 4, height: 2, workers: ['Haikal Ibrahim', 'Ashwin Das', 'Kumar Rajan'] },
  { date: '2026-03-24', projectKey: 'Bridge Maintenance', workType: 'Dismantle', length: 8, width: 6, height: 2.5, workers: ['Rajesh Kumar', 'Lim Wei Ming', 'Amit Singh'] },
  { date: '2026-03-28', projectKey: 'Tower Block A', workType: 'Erection', length: 12, width: 5, height: 2.5, workers: ['Suresh Patel', 'Haikal Ibrahim', 'Rajesh Kumar', 'Amit Singh'] },
];

export const SAMPLE_ADVANCES = [
  { worker: 'Rajesh Kumar', date: '2026-01-05', projectKey: 'Tower Block A', amount: 500, remarks: 'January weekly advance' },
  { worker: 'Suresh Patel', date: '2026-01-05', projectKey: 'Tower Block A', amount: 350, remarks: 'Transport allowance' },
  { worker: 'Amit Singh', date: '2026-01-12', projectKey: 'Bridge Maintenance', amount: 200, remarks: 'Site tools' },
  { worker: 'Haikal Ibrahim', date: '2026-02-01', projectKey: 'Warehouse Extension', amount: 400, remarks: 'February advance' },
  { worker: 'Kumar Rajan', date: '2026-02-01', projectKey: 'Warehouse Extension', amount: 250, remarks: 'February advance' },
  { worker: 'Rajesh Kumar', date: '2026-02-10', projectKey: 'Tower Block A', amount: 450, remarks: 'Mid-month advance' },
  { worker: 'Amit Singh', date: '2026-02-18', projectKey: 'Bridge Maintenance', amount: 300, remarks: 'Tools purchase' },
  { worker: 'Lim Wei Ming', date: '2026-03-01', projectKey: 'Bridge Maintenance', amount: 500, remarks: 'March advance' },
  { worker: 'Rajesh Kumar', date: '2026-03-08', projectKey: 'Tower Block A', amount: 400, remarks: 'Weekly advance' },
  { worker: 'Kumar Rajan', date: '2026-03-15', projectKey: 'Warehouse Extension', amount: 250, remarks: 'Materials' },
  { worker: 'Suresh Patel', date: '2026-03-20', projectKey: 'Tower Block A', amount: 300, remarks: 'End of month advance' },
];

export const SAMPLE_ATTENDANCE = [
  { date: '2026-01-06', worker: 'Rajesh Kumar', status: 'present', projectKey: 'Tower Block A' },
  { date: '2026-01-06', worker: 'Suresh Patel', status: 'present', projectKey: 'Tower Block A' },
  { date: '2026-01-10', worker: 'Haikal Ibrahim', status: 'present', projectKey: 'Warehouse Extension' },
  { date: '2026-02-12', worker: 'Amit Singh', status: 'absent', projectKey: 'Bridge Maintenance' },
  { date: '2026-03-02', worker: 'Ashwin Das', status: 'present', projectKey: 'Tower Block A' },
];
