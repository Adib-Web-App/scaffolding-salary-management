import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { projectsApi, workEntriesApi, formatRM, formatNumber } from '../services/api';
import { exportWorkEntriesToExcel } from '../utils/exportWorkEntriesExcel';

const emptyForm = () => ({
  entry_date: new Date().toISOString().slice(0, 10),
  project_id: '',
  location: '',
  work_type: 'Erection',
  length: '',
  width: '',
  height: '',
  workers: [''],
  volume: 0,
  rate: 0,
  total_salary: 0,
  individual_salary: 0,
});

export default function WorkEntriesPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('work-entries:write');
  const canExport = hasPermission('work-entries:export');
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', worker: '', projectId: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        workEntriesApi.list(filters),
        projectsApi.list(),
      ]);
      setJobs(entriesRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recalc = async (nextForm) => {
    const workers = nextForm.workers.filter((w) => w.trim());
    if (!nextForm.project_id || !nextForm.length || !nextForm.width || !nextForm.height || workers.length === 0) {
      return nextForm;
    }
    try {
      const res = await workEntriesApi.preview({
        project_id: nextForm.project_id,
        work_type: nextForm.work_type,
        length: nextForm.length,
        width: nextForm.width,
        height: nextForm.height,
        workers,
      });
      return {
        ...nextForm,
        volume: res.data.volume,
        rate: res.data.rate,
        total_salary: res.data.total_salary,
        individual_salary: res.data.individual_salary,
      };
    } catch {
      return nextForm;
    }
  };

  const updateForm = async (updates) => {
    const next = { ...form, ...updates };
    const calculated = await recalc(next);
    setForm(calculated);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (job) => {
    setEditing(job);
    setForm({
      entry_date: job.entry_date,
      project_id: String(job.project_id),
      location: job.location || '',
      work_type: job.work_type,
      length: String(job.length),
      width: String(job.width),
      height: String(job.height),
      workers: job.workers?.map((w) => w.worker_name) || [''],
      volume: job.volume,
      rate: job.rate,
      total_salary: job.total_salary,
      individual_salary: job.workers?.[0]?.individual_salary || 0,
    });
    setModalOpen(true);
  };

  const addWorkerField = () => {
    setForm((f) => ({ ...f, workers: [...f.workers, ''] }));
  };

  const removeWorkerField = (index) => {
    const workers = form.workers.filter((_, i) => i !== index);
    if (workers.length === 0) workers.push('');
    updateForm({ workers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const workers = form.workers.map((w) => w.trim()).filter(Boolean);
    if (workers.length === 0) {
      toast.error('Add at least one worker');
      return;
    }
    setSaving(true);
    try {
      const body = {
        entry_date: form.entry_date,
        project_id: Number(form.project_id),
        location: form.location.trim(),
        work_type: form.work_type,
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        workers,
      };
      if (editing) {
        await workEntriesApi.update(editing.id, body);
        toast.success('Work job updated');
      } else {
        await workEntriesApi.create(body);
        toast.success('Work job saved');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (jobs.length === 0) {
      toast.error('No data to export. Adjust filters or add work jobs.');
      return;
    }
    setExporting(true);
    try {
      const { filename, count } = await exportWorkEntriesToExcel(jobs);
      toast.success(`Exported ${count} record(s) to ${filename}`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (job) => {
    if (!confirm(`Delete job #${job.id}?`)) return;
    try {
      await workEntriesApi.remove(job.id);
      toast.success('Job deleted');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'entry_date', label: 'Date' },
    { key: 'project_name', label: 'Project' },
    { key: 'location', label: 'Location', render: (r) => r.location || '—' },
    { key: 'work_type', label: 'Type' },
    {
      key: 'dimensions',
      label: 'L × W × H',
      render: (r) => `${r.length} × ${r.width} × ${r.height}`,
    },
    { key: 'volume', label: 'Volume', render: (r) => formatNumber(r.volume) },
    { key: 'total_salary', label: 'Total Salary', render: (r) => formatRM(r.total_salary) },
    {
      key: 'workers',
      label: 'Workers (split)',
      render: (r) =>
        r.workers?.map((w) => `${w.worker_name}: ${formatRM(w.individual_salary)}`).join(', ') || '—',
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-800"
                  onClick={() => openEdit(r)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(r)}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Filter Jobs</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              placeholder="Worker name"
              value={filters.worker}
              onChange={(e) => setFilters((f) => ({ ...f, worker: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Project</label>
            <select
              className="input-field"
              value={filters.projectId}
              onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
            >
              <option value="">All</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn-primary mt-4" onClick={loadData}>
          Apply Filters
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          One shared job per entry. Volume calculated once; salary split equally among assigned workers.
          Exports use the currently filtered list ({jobs.length} job{jobs.length !== 1 ? 's' : ''}).
        </p>
        <div className="flex flex-wrap gap-2">
          {canExport && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportExcel}
              disabled={exporting || loading || jobs.length === 0}
            >
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          )}
          {canWrite && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              + Add Work Job
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <DataTable columns={columns} data={jobs} searchPlaceholder="Search jobs..." pageSize={10} />
        )}
      </div>

      {canWrite && (
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Work Job' : 'New Work Job'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Date *</label>
              <input
                type="date"
                className="input-field"
                required
                value={form.entry_date}
                onChange={(e) => updateForm({ entry_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Project *</label>
              <select
                className="input-field"
                required
                value={form.project_id}
                onChange={(e) => updateForm({ project_id: e.target.value })}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Location</label>
              <input
                className="input-field"
                placeholder="e.g. Block A, Level 3"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-field">Work Type *</label>
              <select
                className="input-field"
                value={form.work_type}
                onChange={(e) => updateForm({ work_type: e.target.value })}
              >
                <option value="Erection">Erection</option>
                <option value="Dismantle">Dismantle</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label-field">Length *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                required
                value={form.length}
                onChange={(e) => updateForm({ length: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Width *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                required
                value={form.width}
                onChange={(e) => updateForm({ width: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Height *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                required
                value={form.height}
                onChange={(e) => updateForm({ height: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label-field mb-0">Workers on this job *</label>
              <button type="button" className="text-sm text-primary-600" onClick={addWorkerField}>
                + Add worker
              </button>
            </div>
            <div className="space-y-2">
              {form.workers.map((w, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input-field"
                    placeholder="Worker name"
                    value={w}
                    onChange={(e) => {
                      const workers = [...form.workers];
                      workers[i] = e.target.value;
                      updateForm({ workers });
                    }}
                  />
                  {form.workers.length > 1 && (
                    <button type="button" className="btn-secondary shrink-0" onClick={() => removeWorkerField(i)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <p>
              <strong>Volume:</strong> {formatNumber(form.volume)} m³
            </p>
            <p>
              <strong>Rate:</strong> {formatRM(form.rate)} / m³
            </p>
            <p>
              <strong>Total Salary:</strong> {formatRM(form.total_salary)}
            </p>
            <p>
              <strong>Per Worker:</strong> {formatRM(form.individual_salary)} (
              {form.workers.filter((w) => w.trim()).length} workers)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Job' : 'Save Job'}
            </button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
