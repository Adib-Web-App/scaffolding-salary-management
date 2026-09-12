import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { formatRM } from '../services/api';
import { useDailySalarySummaryColumns } from '../hooks/useDailySalarySummaryColumns';
import { exportDailySalarySummaryToExcel, formatDateColumnLabel } from '../utils/exportDailySalarySummaryExcel';

const SUMMARY_COLUMN_OPTIONS = [
  { key: 'totalSalary', label: 'Total Salary' },
  { key: 'totalAdvance', label: 'Total Advance' },
  { key: 'totalHousekeeping', label: 'Total Housekeeping' },
  { key: 'totalNettSalary', label: 'Total Nett Salary' },
];

function DailyCell({ cell }) {
  if (!cell?.hasActivity) return '—';

  const advances = Array.isArray(cell.advances) ? cell.advances : [];
  const housekeepings = Array.isArray(cell.housekeepings) ? cell.housekeepings : [];
  const hasSalary = Number(cell.salary) !== 0;

  if (!hasSalary && advances.length === 0 && housekeepings.length === 0) return '—';

  return (
    <div className="flex flex-col items-end gap-0.5 leading-tight">
      {hasSalary && (
        <span className="tabular-nums text-slate-700">{formatRM(cell.salary)}</span>
      )}
      {advances.map((amount, index) => (
        <span key={`adv-${amount}-${index}`} className="text-xs tabular-nums text-red-600">
          ({formatRM(amount)})
        </span>
      ))}
      {housekeepings.map((amount, index) => (
        <span key={`hk-${amount}-${index}`} className="text-xs tabular-nums text-blue-600">
          ({formatRM(amount)})
        </span>
      ))}
    </div>
  );
}

function SummaryColumnsMenu({ columns, setColumnVisible, showAll }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="btn-secondary shrink-0"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Summary Columns
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Show columns
          </p>
          {SUMMARY_COLUMN_OPTIONS.map((option) => (
            <label
              key={option.key}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={columns[option.key] !== false}
                onChange={(e) => setColumnVisible(option.key, e.target.checked)}
              />
              <span className="text-sm text-slate-800">{option.label}</span>
            </label>
          ))}
          <button
            type="button"
            className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-primary-600 hover:bg-primary-50"
            onClick={showAll}
          >
            Show All
          </button>
        </div>
      )}
    </div>
  );
}

export default function DailySalarySummary({ dailySalarySummary, loading }) {
  const [exporting, setExporting] = useState(false);
  const { columns, setColumnVisible, showAll } = useDailySalarySummaryColumns();

  const dates = dailySalarySummary?.dates || [];
  const rows = dailySalarySummary?.rows || [];
  const rangeLabel =
    dailySalarySummary?.dateFrom && dailySalarySummary?.dateTo
      ? `${formatDateColumnLabel(dailySalarySummary.dateFrom)} – ${formatDateColumnLabel(dailySalarySummary.dateTo)}`
      : '';

  const visibleSummaryCount = SUMMARY_COLUMN_OPTIONS.filter((option) => columns[option.key]).length;
  const dateMinWidth = `${Math.min(160, 100 + (4 - visibleSummaryCount) * 16)}px`;
  const firstVisibleSummary = SUMMARY_COLUMN_OPTIONS.find((option) => columns[option.key])?.key;

  const handleExport = async () => {
    if (!rows.length) {
      toast.error('No data to export');
      return;
    }
    setExporting(true);
    try {
      const { filename } = await exportDailySalarySummaryToExcel(dailySalarySummary);
      toast.success(`Exported to ${filename}`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const summaryBorder = (key) =>
    key === firstVisibleSummary ? 'border-l-2 border-slate-300' : '';

  return (
    <div className="card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Daily Salary Summary</h2>
          <p className="mt-1 text-sm text-slate-500">
            Daily salary per worker. Advances appear in red; housekeeping charges appear in blue.
            {rangeLabel && <span className="ml-1 font-medium text-slate-600">{rangeLabel}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SummaryColumnsMenu
            columns={columns}
            setColumnVisible={setColumnVisible}
            showAll={showAll}
          />
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={handleExport}
            disabled={exporting || loading || rows.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading daily summary...</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No salary, advance, or housekeeping records for the selected filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-20 min-w-[140px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Name
                </th>
                {dates.map((day) => (
                  <th
                    key={day}
                    className="whitespace-nowrap border-b border-slate-200 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600"
                    style={{ minWidth: dateMinWidth }}
                  >
                    {formatDateColumnLabel(day)}
                  </th>
                ))}
                {columns.totalSalary && (
                  <th
                    className={`min-w-[120px] whitespace-nowrap border-b bg-violet-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-violet-900 ${summaryBorder('totalSalary')}`}
                  >
                    Total Salary
                  </th>
                )}
                {columns.totalAdvance && (
                  <th
                    className={`min-w-[120px] whitespace-nowrap border-b border-slate-200 bg-amber-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-amber-900 ${summaryBorder('totalAdvance')}`}
                  >
                    Total Advance
                  </th>
                )}
                {columns.totalHousekeeping && (
                  <th
                    className={`min-w-[140px] whitespace-nowrap border-b border-slate-200 bg-sky-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-sky-900 ${summaryBorder('totalHousekeeping')}`}
                  >
                    Total Housekeeping
                  </th>
                )}
                {columns.totalNettSalary && (
                  <th
                    className={`min-w-[120px] whitespace-nowrap border-b border-slate-200 bg-emerald-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-emerald-900 ${summaryBorder('totalNettSalary')}`}
                  >
                    Total Nett Salary
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row) => (
                <tr key={row.worker_name} className="hover:bg-slate-50/80">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2.5 font-medium text-slate-900">
                    {row.worker_name}
                  </td>
                  {dates.map((day) => {
                    const cell = row.daily?.[day];
                    return (
                      <td
                        key={day}
                        className="whitespace-nowrap px-3 py-2.5 text-right align-top"
                        style={{ minWidth: dateMinWidth }}
                      >
                        <DailyCell cell={cell} />
                      </td>
                    );
                  })}
                  {columns.totalSalary && (
                    <td
                      className={`whitespace-nowrap bg-violet-50/80 px-3 py-2.5 text-right font-semibold tabular-nums text-violet-900 ${
                        firstVisibleSummary === 'totalSalary' ? 'border-l-2 border-slate-200' : ''
                      }`}
                    >
                      {formatRM(row.total_salary)}
                    </td>
                  )}
                  {columns.totalAdvance && (
                    <td
                      className={`whitespace-nowrap bg-amber-50/80 px-3 py-2.5 text-right font-semibold tabular-nums text-amber-900 ${
                        firstVisibleSummary === 'totalAdvance' ? 'border-l-2 border-slate-200' : ''
                      }`}
                    >
                      {formatRM(row.total_advance)}
                    </td>
                  )}
                  {columns.totalHousekeeping && (
                    <td
                      className={`whitespace-nowrap bg-sky-50/80 px-3 py-2.5 text-right font-semibold tabular-nums text-sky-900 ${
                        firstVisibleSummary === 'totalHousekeeping' ? 'border-l-2 border-slate-200' : ''
                      }`}
                    >
                      {formatRM(row.total_housekeeping)}
                    </td>
                  )}
                  {columns.totalNettSalary && (
                    <td
                      className={`whitespace-nowrap bg-emerald-50/80 px-3 py-2.5 text-right font-semibold tabular-nums ${
                        firstVisibleSummary === 'totalNettSalary' ? 'border-l-2 border-slate-200' : ''
                      } ${row.total_nett < 0 ? 'text-red-600' : 'text-emerald-900'}`}
                    >
                      {formatRM(row.total_nett)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
