import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, projectsApi } from '../services/api';

const emptyForm = () => ({
  attendance_date: new Date().toISOString().slice(0, 10),
  worker_name: '',
  status: 'present',
  project_id: '',
});

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('attendance:write');
  const [records, setRecords] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', worker: '' });
  const [summaryMonth, setSummaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [historyWorker, setHistoryWorker] = useState('');
  const [history, setHistory] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [attRes, projRes, monthRes] = await Promise.all([
        attendanceApi.list(filters),
        projectsApi.list(),
        attendanceApi.monthlySummary(summaryMonth),
      ]);
      setRecords(attRes.data);
      setProjects(projRes.data);
      setMonthly(monthRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, summaryMonth]);

  useEffect(() => {
    load();
  }, [load]);

  const loadHistory = async () => {
    if (!historyWorker.trim()) {
      toast.error('Enter worker name for history');
      return;
    }
    try {
      const res = await attendanceApi.workerHistory(historyWorker, filters);
      setHistory(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      attendance_date: row.attendance_date,
      worker_name: row.worker_name,
      status: row.status,
      project_id: row.project_id ? String(row.project_id) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        attendance_date: form.attendance_date,
        worker_name: form.worker_name,
        status: form.status,
        project_id: form.project_id ? Number(form.project_id) : null,
      };
      if (editing) {
        await attendanceApi.update(editing.id, body);
        toast.success('Attendance updated');
      } else {
        await attendanceApi.create(body);
        toast.success('Attendance recorded');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await attendanceApi.remove(row.id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'attendance_date', label: 'Date' },
    { key: 'worker_name', label: 'Worker' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            r.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {r.status}
        </span>
      ),
    },
    { key: 'project_name', label: 'Project', render: (r) => r.project_name || '—' },
    ...(canWrite
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <div className="flex gap-2">
                <button type="button" className="text-sm text-primary-600" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className="text-sm text-red-600" onClick={() => handleDelete(r)}>
                  Delete
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const monthlyColumns = [
    { key: 'worker_name', label: 'Worker' },
    { key: 'present_days', label: 'Present Days' },
    { key: 'absent_days', label: 'Absent Days' },
    { key: 'total_records', label: 'Total Records' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Track daily worker attendance by project.</p>
        {canWrite && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Record Attendance
          </button>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Filter Records</h2>
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
            <label className="label-field">Worker</label>
            <input
              className="input-field"
              value={filters.worker}
              onChange={(e) => setFilters((f) => ({ ...f, worker: e.target.value }))}
            />
          </div>
        </div>
        <button type="button" className="btn-primary mt-4" onClick={load}>
          Apply
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Monthly Summary</h2>
            <input
              type="month"
              className="input-field mt-2 max-w-xs"
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(e.target.value)}
            />
          </div>
        </div>
        <DataTable columns={monthlyColumns} data={monthly} searchPlaceholder="Search..." pageSize={8} />
      </div>

      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Worker History</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            className="input-field max-w-xs"
            placeholder="Worker name"
            value={historyWorker}
            onChange={(e) => setHistoryWorker(e.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={loadHistory}>
            Load History
          </button>
        </div>
        {history.length > 0 && (
          <DataTable columns={columns.filter((c) => c.key !== 'actions')} data={history} pageSize={8} />
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">All Attendance Records</h2>
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <DataTable columns={columns} data={records} searchPlaceholder="Search..." pageSize={10} />
        )}
      </div>

      {canWrite && (
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Attendance' : 'Record Attendance'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Date *</label>
            <input
              type="date"
              className="input-field"
              required
              value={form.attendance_date}
              onChange={(e) => setForm((f) => ({ ...f, attendance_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Worker *</label>
            <input
              className="input-field"
              required
              value={form.worker_name}
              onChange={(e) => setForm((f) => ({ ...f, worker_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Status *</label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div>
            <label className="label-field">Project</label>
            <select
              className="input-field"
              value={form.project_id}
              onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
