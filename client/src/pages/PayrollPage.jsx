import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { payrollApi, workEntriesApi, formatRM, formatNumber } from '../services/api';

export default function PayrollPage() {
  const { hasPermission } = useAuth();
  const canExportPayslip = hasPermission('payroll:export');
  const [workers, setWorkers] = useState([]);
  const [worker, setWorker] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(true);

  useEffect(() => {
    workEntriesApi
      .workers()
      .then((res) => setWorkers(res.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingWorkers(false));
  }, []);

  const loadPreview = async () => {
    if (!worker) {
      toast.error('Select a worker');
      return;
    }
    setLoading(true);
    try {
      const res = await payrollApi.preview(worker, year, month);
      setPreview(res.data);
    } catch (err) {
      toast.error(err.message);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = async () => {
    if (!worker) {
      toast.error('Select a worker');
      return;
    }
    try {
      await payrollApi.downloadPayslip(worker, year, month);
      toast.success('Payslip downloaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Generate monthly payslips per worker. All amounts in Malaysian Ringgit (RM).
      </p>

      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Payslip Generator</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-field">Worker *</label>
            {loadingWorkers ? (
              <LoadingSpinner size="sm" />
            ) : (
              <select className="input-field" value={worker} onChange={(e) => setWorker(e.target.value)}>
                <option value="">Select worker</option>
                {workers.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label-field">Year *</label>
            <input
              type="number"
              className="input-field"
              min="2020"
              max="2099"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Month *</label>
            <select className="input-field" value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('en-MY', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={loadPreview} disabled={loading}>
            {loading ? 'Loading...' : 'Preview Payroll'}
          </button>
          {canExportPayslip && (
            <button type="button" className="btn-secondary" onClick={downloadPayslip} disabled={!worker}>
              Download PDF Payslip
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingSpinner className="py-12" />}

      {preview && !loading && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Payslip Preview — {preview.worker_name}
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Period: {preview.period.month}/{preview.period.year}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Total Jobs</p>
              <p className="text-xl font-bold">{preview.total_jobs}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Volume Share</p>
              <p className="text-xl font-bold">{formatNumber(preview.total_volume_share)} m³</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-sm text-slate-600">Total Earnings</p>
              <p className="text-xl font-bold text-emerald-800">{formatRM(preview.total_earnings)}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm text-slate-600">Advance Deduction</p>
              <p className="text-xl font-bold text-amber-800">{formatRM(preview.total_advance)}</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border-2 border-primary-200 bg-primary-50 p-6">
            <p className="text-sm font-medium text-primary-800">Net Salary</p>
            <p className="text-3xl font-bold text-primary-900">{formatRM(preview.net_salary)}</p>
          </div>

          {preview.job_details?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-semibold text-slate-800">Job Details</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Project</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-right">Volume Share</th>
                      <th className="px-4 py-2 text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.job_details.map((j, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{j.entry_date}</td>
                        <td className="px-4 py-2">{j.project_name}</td>
                        <td className="px-4 py-2">{j.work_type}</td>
                        <td className="px-4 py-2 text-right">{formatNumber(j.volume_share)}</td>
                        <td className="px-4 py-2 text-right">{formatRM(j.individual_salary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
