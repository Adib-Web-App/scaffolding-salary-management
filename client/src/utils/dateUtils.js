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

/** Today's date in local YYYY-MM-DD. */
export function todayYMD() {
  return formatDateYMD(new Date());
}

/** Current month as YYYY-MM in local time. */
export function currentMonthYM() {
  return todayYMD().slice(0, 7);
}

/** Display label e.g. 15-May-26 from YYYY-MM-DD. */
export function formatDateColumnLabel(ymd) {
  const date = parseDateYMD(ymd);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}
