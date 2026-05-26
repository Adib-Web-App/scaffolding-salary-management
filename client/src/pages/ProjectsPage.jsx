import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { projectsApi, formatRM } from '../services/api';

const emptyForm = { project_name: '', erection_rate: '', dismantle_rate: '' };

export default function ProjectsPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('projects:write');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsApi.list();
      setProjects(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setForm({
      project_name: project.project_name,
      erection_rate: String(project.erection_rate),
      dismantle_rate: String(project.dismantle_rate),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        project_name: form.project_name,
        erection_rate: parseFloat(form.erection_rate) || 0,
        dismantle_rate: parseFloat(form.dismantle_rate) || 0,
      };
      if (editing) {
        await projectsApi.update(editing.id, body);
        toast.success('Project updated');
      } else {
        await projectsApi.create(body);
        toast.success('Project created');
      }
      setModalOpen(false);
      loadProjects();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project) => {
    if (!confirm(`Delete project "${project.project_name}"?`)) return;
    try {
      await projectsApi.remove(project.id);
      toast.success('Project deleted');
      loadProjects();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'project_name', label: 'Project Name' },
    {
      key: 'erection_rate',
      label: 'Erection Rate',
      render: (r) => formatRM(r.erection_rate),
    },
    {
      key: 'dismantle_rate',
      label: 'Dismantle Rate',
      render: (r) => formatRM(r.dismantle_rate),
    },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Manage projects and their erection/dismantle rates per volume unit.</p>
        {canWrite && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Add Project
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <DataTable columns={columns} data={projects} searchPlaceholder="Search projects..." />
        )}
      </div>

      {canWrite && (
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Project Name *</label>
            <input
              className="input-field"
              required
              value={form.project_name}
              onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Erection Rate *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                required
                value={form.erection_rate}
                onChange={(e) => setForm((f) => ({ ...f, erection_rate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-field">Dismantle Rate *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                required
                value={form.dismantle_rate}
                onChange={(e) => setForm((f) => ({ ...f, dismantle_rate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
