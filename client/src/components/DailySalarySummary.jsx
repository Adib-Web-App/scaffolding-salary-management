import { useState } from 'react';
import toast from 'react-hot-toast';
import { formatRM } from '../services/api';
import { exportDailySalarySummaryToExcel, formatDateColumnLabel } from '../utils/exportDailySalarySummaryExcel';

function formatDailyCell(cell) {
  if (!cell?.hasActivity) return '—';
  return formatRM(cell.nett);
}

export default function DailySalarySummary({ dailySalarySummary, loading }) {
  const [exporting, setExporting] = useState(false);

  const dates = dailySalarySummary?.dates || [];
  const rows = dailySalarySummary?.rows || [];
  const rangeLabel =
    dailySalarySummary?.dateFrom && dailySalarySummary?.dateTo
      ? `${formatDateColumnLabel(dailySalarySummary.dateFrom)} – ${formatDateColumnLabel(dailySalarySummary.dateTo)}`
      : '';

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

  return (
    <div className="card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Daily Salary Summary</h2>
          <p className="mt-1 text-sm text-slate-500">
            Daily nett per worker (salary − advance) for each date in the filter range.
            {rangeLabel && <span className="ml-1 font-medium text-slate-600">{rangeLabel}</span>}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={handleExport}
          disabled={exporting || loading || rows.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading daily summary...</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No salary or advance records for the selected filters.
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
                    className="min-w-[100px] whitespace-nowrap border-b border-slate-200 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    {formatDateColumnLabel(day)}
                  </th>
                ))}
                <th className="min-w-[120px] whitespace-nowrap border-b border-l-2 border-slate-300 bg-violet-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-violet-900">
                  Total Salary
                </th>
                <th className="min-w-[120px] whitespace-nowrap border-b border-slate-200 bg-amber-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-amber-900">
                  Total Advance
                </th>
                <th className="min-w-[120px] whitespace-nowrap border-b border-slate-200 bg-emerald-50 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-emerald-900">
                  Total Nett Salary
                </th>
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
                    const negative = cell?.hasActivity && cell.nett < 0;
                    return (
                      <td
                        key={day}
                        className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${
                          negative ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {formatDailyCell(cell)}
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap border-l-2 border-slate-200 bg-violet-50/80 px-3 py-2.5 text-right font-semibold tabular-nums text-violet-900">
                    {formatRM(row.total_salary)}
                  </td>
                  <td className="whitespace-nowrap bg-amber-50/80 px-3 py-2.5 text-right font-semibold tabular-nums text-amber-900">
                    {formatRM(row.total_advance)}
                  </td>
                  <td
                    className={`whitespace-nowrap bg-emerald-50/80 px-3 py-2.5 text-right font-semibold tabular-nums ${
                      row.total_nett < 0 ? 'text-red-600' : 'text-emerald-900'
                    }`}
                  >
                    {formatRM(row.total_nett)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
