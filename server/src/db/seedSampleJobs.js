import 'dotenv/config';
import { assertNotProductionSeed } from './productionSafety.js';
import { initDatabase, run, get, closeDatabase } from './database.js';
import { parseCount } from './sqlUtils.js';

assertNotProductionSeed('npm run seed:sample');
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

async function ensureProjects() {
  const map = {};
  for (const p of PROJECTS) {
    let row = await get(`SELECT * FROM projects WHERE project_name = ?`, [p.project_name]);
    if (!row) {
      const result = await run(
        `INSERT INTO projects (project_name, erection_rate, dismantle_rate) VALUES (?, ?, ?)`,
        [p.project_name, p.erection_rate, p.dismantle_rate]
      );
      row = await get(`SELECT * FROM projects WHERE id = ?`, [result.lastID]);
    }
    map[p.project_name] = row;
  }
  return map;
}

async function seedSampleJobs() {
  await initDatabase();

  const existing = await get(
    `SELECT COUNT(*) as count FROM work_jobs WHERE entry_date >= '2026-01-01' AND entry_date <= '2026-03-31'`
  );
  if (parseCount(existing) > 0) {
    console.log(`Sample jobs for Jan–Mar 2026 already exist (${parseCount(existing)} jobs). Skipping.`);
    await closeDatabase();
    process.exit(0);
  }

  console.log('Seeding sample jobs for January–March 2026...');

  const projectMap = await ensureProjects();

  let jobCount = 0;
  for (const job of SAMPLE_JOBS) {
    const project = projectMap[job.projectKey];
    if (!project) {
      console.warn(`Project not found: ${job.projectKey}`);
      continue;
    }
    await insertJob(project.id, job, project);
    jobCount++;
  }

  for (const adv of SAMPLE_ADVANCES) {
    const exists = await get(
      `SELECT id FROM advances WHERE worker_name = ? AND advance_date = ? AND amount = ?`,
      [adv.worker, adv.date, adv.amount]
    );
    if (!exists) {
      const project = adv.projectKey ? projectMap[adv.projectKey] : null;
      await run(
        `INSERT INTO advances (worker_name, advance_date, amount, remarks, project_id) VALUES (?, ?, ?, ?, ?)`,
        [adv.worker, adv.date, adv.amount, adv.remarks, project?.id || null]
      );
    }
  }

  for (const att of SAMPLE_ATTENDANCE) {
    const project = projectMap[att.projectKey];
    const exists = await get(
      `SELECT id FROM attendance WHERE worker_name = ? AND attendance_date = ?`,
      [att.worker, att.date]
    );
    if (!exists) {
      await run(
        `INSERT INTO attendance (attendance_date, worker_name, status, project_id) VALUES (?, ?, ?, ?)`,
        [att.date, att.worker, att.status, project?.id || null]
      );
    }
  }

  console.log(`Inserted ${jobCount} sample work jobs (Jan–Mar 2026).`);
  console.log('Sample advances and attendance records added where missing.');
  await closeDatabase();
  process.exit(0);
}

seedSampleJobs().catch(async (err) => {
  console.error('Sample seed failed:', err);
  await closeDatabase().catch(() => {});
  process.exit(1);
});
