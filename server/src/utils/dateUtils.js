/** Format a Date as local YYYY-MM-DD (no UTC conversion). */
export function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD into a local Date at midnight. */
export function parseDateYMD(ymd) {
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Normalize stored/API values to YYYY-MM-DD. */
export function normalizeDateYMD(value) {
  if (value == null || value === '') return '';
  const str = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(str) ? str.slice(0, 10) : str;
}

/** Inclusive date range as YYYY-MM-DD strings. */
export function enumerateDates(dateFrom, dateTo, maxDays = 366) {
  const dates = [];
  const cursor = parseDateYMD(dateFrom);
  const end = parseDateYMD(dateTo);
  let count = 0;

  while (cursor <= end && count < maxDays) {
    dates.push(formatDateYMD(cursor));
    cursor.setDate(cursor.getDate() + 1);
    count += 1;
  }

  return dates;
}

export function todayYMD() {
  return formatDateYMD(new Date());
}

export function firstDayOfMonthYMD(date = new Date()) {
  return formatDateYMD(new Date(date.getFullYear(), date.getMonth(), 1));
}

/** Normalize dateFrom/dateTo from API query strings. */
export function pickDateQueryFilters(query, keys = ['dateFrom', 'dateTo']) {
  const filters = {};
  for (const key of keys) {
    const value = query[key];
    filters[key] = value ? normalizeDateYMD(value) : '';
  }
  return filters;
}

export function resolveDateRange(dateFrom, dateTo) {
  const from = normalizeDateYMD(dateFrom);
  const to = normalizeDateYMD(dateTo);

  if (from && to) return { dateFrom: from, dateTo: to };
  if (from) return { dateFrom: from, dateTo: from };
  if (to) return { dateFrom: to, dateTo: to };

  const now = new Date();
  return {
    dateFrom: firstDayOfMonthYMD(now),
    dateTo: todayYMD(),
  };
}
