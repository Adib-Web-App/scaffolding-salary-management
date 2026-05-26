/** Convert ? placeholders to PostgreSQL $1, $2, ... */
export function toPgPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

/** First day of month (YYYY-MM) and exclusive end for range filters. */
export function monthDateRange(month) {
  const [year, mon] = month.split('-').map(Number);
  const start = `${month}-01`;
  let endYear = year;
  let endMonth = mon + 1;
  if (endMonth > 12) {
    endMonth = 1;
    endYear += 1;
  }
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
  return { start, end };
}

export function parseCount(row) {
  if (!row) return 0;
  const val = row.count ?? row.COUNT ?? 0;
  return Number(val);
}
