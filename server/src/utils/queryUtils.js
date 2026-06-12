/** Parse workers from query (comma-separated or repeated param). Empty = all workers. */
export function parseWorkersQuery(query) {
  const raw = query.workers ?? query.worker ?? '';
  if (!raw) return [];

  const values = Array.isArray(raw) ? raw : String(raw).split(',');
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
}

/** SQL IN clause for a column, e.g. w.worker_name IN (?, ?). */
export function workersInClause(column, workers) {
  if (!workers?.length) return { sql: '', params: [] };
  const placeholders = workers.map(() => '?').join(', ');
  return {
    sql: ` AND ${column} IN (${placeholders})`,
    params: [...workers],
  };
}

/** Filter work_jobs by workers assigned on the job. */
export function jobWorkersInClause(workers) {
  if (!workers?.length) return { sql: '', params: [] };
  const placeholders = workers.map(() => '?').join(', ');
  return {
    sql: ` AND j.id IN (SELECT job_id FROM work_job_workers WHERE worker_name IN (${placeholders}))`,
    params: [...workers],
  };
}
