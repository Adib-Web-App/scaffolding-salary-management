import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import { performanceApi, projectsApi, formatRM, formatNumber } from '../services/api';

export default function PerformancePage() {
  const [rankings, setRankings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', projectId: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [perfRes, projRes] = await Promise.all([
        performanceApi.get(filters),
        projectsApi.list(),
      ]);
      setRankings(perfRes.data);
      setProjects(projRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (r) => (
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
            r.rank === 1
              ? 'bg-amber-100 text-amber-800'
              : r.rank === 2
                ? 'bg-slate-200 text-slate-700'
                : r.rank === 3
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-slate-100 text-slate-600'
          }`}
        >
          {r.rank}
        </span>
      ),
    },
    { key: 'worker_name', label: 'Worker' },
    { key: 'total_jobs', label: 'Jobs Participated' },
    { key: 'total_volume_share', label: 'Volume Share', render: (r) => formatNumber(r.total_volume_share) },
    { key: 'total_earnings', label: 'Total Earnings', render: (r) => formatRM(r.total_earnings) },
  ];

  const topThree = rankings.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Filters</h2>
        <div className="grid gap-4 sm:grid-cols-3">
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
            <label className="label-field">Project</label>
            <select
              className="input-field"
              value={filters.projectId}
              onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn-primary mt-4" onClick={load}>
          Apply
        </button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" size="lg" />
      ) : (
        <>
          {topThree.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {topThree.map((w) => (
                <div key={w.worker_name} className="card border-t-4 border-t-primary-500">
                  <p className="text-xs font-semibold uppercase text-slate-500">#{w.rank} Top Performer</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{w.worker_name}</p>
                  <p className="mt-2 text-sm text-slate-600">{w.total_jobs} jobs</p>
                  <p className="text-sm font-semibold text-primary-700">{formatRM(w.total_earnings)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Worker Rankings</h2>
            <DataTable
              columns={columns}
              data={rankings}
              searchPlaceholder="Search workers..."
              pageSize={10}
              emptyMessage="No performance data for selected filters"
            />
          </div>
        </>
      )}
    </div>
  );
}
