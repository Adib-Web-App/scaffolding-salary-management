import 'dotenv/config';
import { initDatabase, run, get, closeDatabase } from './database.js';
import { parseCount } from './sqlUtils.js';
import {
  SAMPLE_JOBS,
  SAMPLE_ADVANCES,
  SAMPLE_ATTENDANCE,
  insertJob,
} from './seedHelpers.js';

const PROJECTS = [
  { project_name: 'Tower Block A', erection_rate: 12.5, dismantle_rate: 8.0 },
  { project_name: 'Warehouse Extension', erection_rate: 10.0, dismantle_rate: 7.5 },
  { project_name: 'Bridge Maintenance', erection_rate: 15.0, dismantle_rate: 11.0 },
];

async function seed() {
  await initDatabase();

  const existing = await get(`SELECT COUNT(*) as count FROM work_jobs`);
  if (parseCount(existing) > 0) {
    console.log('Database already has work jobs. Run "npm run seed:sample" to add Jan–Mar 2026 sample data.');
    await closeDatabase();
    process.exit(0);
  }

  console.log('Seeding database...');

  const projectMap = {};
  for (const p of PROJECTS) {
    const result = await run(
      `INSERT INTO projects (project_name, erection_rate, dismantle_rate) VALUES (?, ?, ?)`,
      [p.project_name, p.erection_rate, p.dismantle_rate]
    );
    projectMap[p.project_name] = await get(`SELECT * FROM projects WHERE id = ?`, [result.lastID]);
  }

  for (const job of SAMPLE_JOBS) {
    const project = projectMap[job.projectKey];
    await insertJob(project.id, job, project);
  }

  for (const adv of SAMPLE_ADVANCES) {
    const project = adv.projectKey ? projectMap[adv.projectKey] : null;
    await run(
      `INSERT INTO advances (worker_name, advance_date, amount, remarks, project_id) VALUES (?, ?, ?, ?, ?)`,
      [adv.worker, adv.date, adv.amount, adv.remarks, project?.id || null]
    );
  }

  for (const att of SAMPLE_ATTENDANCE) {
    const project = projectMap[att.projectKey];
    await run(
      `INSERT INTO attendance (attendance_date, worker_name, status, project_id) VALUES (?, ?, ?, ?)`,
      [att.date, att.worker, att.status, project.id]
    );
  }

  console.log(`Seed completed: ${SAMPLE_JOBS.length} jobs (Jan–Mar 2026), projects, advances, attendance.`);
  await closeDatabase();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
