import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import { BRAND } from '../config/branding';
import { summaryApi, formatRM, formatNumber } from '../services/api';

function StatCard({ label, value, accent }) {
  const accents = {
    blue: 'border-l-primary-500 bg-primary-50',
    green: 'border-l-emerald-500 bg-emerald-50',
    amber: 'border-l-amber-500 bg-amber-50',
    orange: 'border-l-orange-500 bg-orange-50',
    purple: 'border-l-violet-500 bg-violet-50',
  };
  return (
    <div className={`card border-l-4 ${accents[accent]}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    worker: '',
    projectId: '',
  });

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await summaryApi.get(filters);
      setData(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const workerColumns = [
    { key: 'worker_name', label: 'Worker' },
    { key: 'total_jobs', label: 'Jobs' },
    { key: 'total_volume_share', label: 'Volume Share', render: (r) => formatNumber(r.total_volume_share) },
    { key: 'total_salary', label: 'Salary', render: (r) => formatRM(r.total_salary) },
    { key: 'total_advance', label: 'Advance', render: (r) => formatRM(r.total_advance) },
    { key: 'net_salary', label: 'Net Salary', render: (r) => formatRM(r.net_salary) },
  ];

  const projectColumns = [
    { key: 'project_name', label: 'Project' },
    { key: 'erection_volume', label: 'Erection Vol.', render: (r) => formatNumber(r.erection_volume) },
    { key: 'dismantle_volume', label: 'Dismantle Vol.', render: (r) => formatNumber(r.dismantle_volume) },
    { key: 'total_salary', label: 'Total Salary', render: (r) => formatRM(r.total_salary) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4 shadow-sm">
        <p className="text-lg font-extrabold tracking-tight text-slate-900">{BRAND.company}</p>
        <p className="text-sm font-medium text-slate-600">{BRAND.app}</p>
        <p className="mt-2 text-sm text-slate-500">Welcome — review salary summaries and worker performance below.</p>
      </div>

      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Filters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label-field">From Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">To Date</label>
            <input
              type="date"
              className="input-field"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Worker</label>
            <select
              className="input-field"
              value={filters.worker}
              onChange={(e) => setFilters((f) => ({ ...f, worker: e.target.value }))}
            >
              <option value="">All Workers</option>
              {(data?.workers || []).map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Project</label>
            <select
              className="input-field"
              value={filters.projectId}
              onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            >
              <option value="">All Projects</option>
              {(data?.projects || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="button" className="btn-primary w-full" onClick={loadSummary}>
              Apply
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setFilters({ dateFrom: '', dateTo: '', worker: '', projectId: '' })
              }
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" size="lg" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Erection Volume"
              value={formatNumber(data?.totals?.total_erection_volume)}
              accent="blue"
            />
            <StatCard
              label="Dismantle Volume"
              value={formatNumber(data?.totals?.total_dismantle_volume)}
              accent="orange"
            />
            <StatCard label="Total Salary" value={formatRM(data?.totals?.total_salary)} accent="green" />
            <StatCard label="Total Advance" value={formatRM(data?.totals?.total_advance)} accent="amber" />
            <StatCard label="Net Salary" value={formatRM(data?.totals?.net_salary)} accent="purple" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Breakdown by Worker</h2>
              <DataTable
                columns={workerColumns}
                data={data?.byWorker || []}
                searchPlaceholder="Search workers..."
                pageSize={8}
              />
            </div>
            <div className="card">
              <h2 className="mb-4 text-base font-semibold text-slate-900">Breakdown by Project</h2>
              <DataTable
                columns={projectColumns}
                data={data?.byProject || []}
                searchPlaceholder="Search projects..."
                pageSize={8}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
