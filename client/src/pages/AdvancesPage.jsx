import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { advancesApi, projectsApi, formatRM } from '../services/api';
import { exportAdvancesToExcel } from '../utils/exportAdvancesExcel';

const emptyForm = {
  worker_name: '',
  advance_date: new Date().toISOString().slice(0, 10),
  amount: '',
  remarks: '',
  project_id: '',
};

export default function AdvancesPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('advances:write');
  const canExport = hasPermission('export:reports');
  const [advances, setAdvances] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', worker: '', projectId: '' });

  const loadAdvances = useCallback(async () => {
    setLoading(true);
    try {
      const [advRes, projRes] = await Promise.all([
        advancesApi.list(filters),
        projectsApi.list(),
      ]);
      setAdvances(advRes.data);
      setProjects(projRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAdvances();
  }, [loadAdvances]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (advance) => {
    setEditing(advance);
    setForm({
      worker_name: advance.worker_name,
      advance_date: advance.advance_date,
      amount: String(advance.amount),
      remarks: advance.remarks || '',
      project_id: advance.project_id ? String(advance.project_id) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        worker_name: form.worker_name,
        advance_date: form.advance_date,
        amount: parseFloat(form.amount) || 0,
        remarks: form.remarks,
        project_id: form.project_id ? Number(form.project_id) : null,
      };
      if (editing) {
        await advancesApi.update(editing.id, body);
        toast.success('Advance updated');
      } else {
        await advancesApi.create(body);
        toast.success('Advance recorded');
      }
      setModalOpen(false);
      loadAdvances();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = async () => {
    if (advances.length === 0) {
      toast.error('No data to export. Adjust filters or add advances.');
      return;
    }
    setExporting(true);
    try {
      const { filename, count } = await exportAdvancesToExcel(advances);
      toast.success(`Exported ${count} record(s) to ${filename}`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (advance) => {
    if (!confirm(`Delete advance for ${advance.worker_name}?`)) return;
    try {
      await advancesApi.remove(advance.id);
      toast.success('Advance deleted');
      loadAdvances();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'advance_date', label: 'Date' },
    { key: 'worker_name', label: 'Worker' },
    { key: 'project_name', label: 'Project', render: (r) => r.project_name || '—' },
    { key: 'amount', label: 'Amount (RM)', render: (r) => formatRM(r.amount) },
    { key: 'remarks', label: 'Remarks', render: (r) => r.remarks || '—' },
    ...(canWrite
      ? [
          {
            key: 'actions',
            label: 'Actions',
            render: (r) => (
              <div className="flex gap-2">
                <button type="button" className="text-sm font-medium text-primary-600 hover:text-primary-800" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className="text-sm font-medium text-red-600 hover:text-red-800" onClick={() => handleDelete(r)}>
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
        <h2 className="mb-4 text-base font-semibold text-slate-900">Filter Advances</h2>
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
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="btn-primary mt-4" onClick={loadAdvances}>
          Apply Filters
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Record advance payments to workers. Deducted from net salary on the dashboard.
          Export uses the currently filtered list ({advances.length} record
          {advances.length !== 1 ? 's' : ''}).
        </p>
        <div className="flex flex-wrap gap-2">
          {canExport && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportExcel}
              disabled={exporting || loading || advances.length === 0}
            >
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </button>
          )}
          {canWrite && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              + Add Advance
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <DataTable columns={columns} data={advances} searchPlaceholder="Search advances..." />
        )}
      </div>

      {canWrite && (
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Advance' : 'New Advance Payment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Worker Name *</label>
            <input
              className="input-field"
              required
              value={form.worker_name}
              onChange={(e) => setForm((f) => ({ ...f, worker_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Date *</label>
            <input
              type="date"
              className="input-field"
              required
              value={form.advance_date}
              onChange={(e) => setForm((f) => ({ ...f, advance_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Project</label>
            <select
              className="input-field"
              value={form.project_id}
              onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Advance Amount (RM) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              required
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-field">Remarks</label>
            <textarea
              className="input-field"
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
