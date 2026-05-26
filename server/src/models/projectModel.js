import { all, get, run } from '../db/database.js';
import { parseCount } from '../db/sqlUtils.js';

export async function findAllProjects(search = '') {
  if (search) {
    const term = `%${search}%`;
    return all(
      `SELECT * FROM projects WHERE project_name LIKE ? ORDER BY project_name ASC`,
      [term]
    );
  }
  return all(`SELECT * FROM projects ORDER BY project_name ASC`);
}

export async function findProjectById(id) {
  return get(`SELECT * FROM projects WHERE id = ?`, [id]);
}

export async function createProject({ project_name, erection_rate, dismantle_rate }) {
  const result = await run(
    `INSERT INTO projects (project_name, erection_rate, dismantle_rate) VALUES (?, ?, ?)`,
    [project_name, erection_rate, dismantle_rate]
  );
  return findProjectById(result.lastID);
}

export async function updateProject(id, { project_name, erection_rate, dismantle_rate }) {
  await run(
    `UPDATE projects SET project_name = ?, erection_rate = ?, dismantle_rate = ? WHERE id = ?`,
    [project_name, erection_rate, dismantle_rate, id]
  );
  return findProjectById(id);
}

export async function deleteProject(id) {
  const entries = await get(`SELECT COUNT(*) as count FROM work_jobs WHERE project_id = ?`, [id]);
  if (parseCount(entries) > 0) {
    const err = new Error('Cannot delete project with existing work jobs');
    err.status = 400;
    throw err;
  }
  const result = await run(`DELETE FROM projects WHERE id = ?`, [id]);
  return result.changes > 0;
}
