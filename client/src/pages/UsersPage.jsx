import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { usersApi } from '../services/api';
import { ROLES } from '../config/permissions';

const emptyForm = { username: '', password: '', role: ROLES.VIEWER };

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('users:write');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ username: user.username, password: '', role: user.role });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    try {
      if (editing) {
        const body = { username: form.username, role: form.role };
        if (form.password) body.password = form.password;
        await usersApi.update(editing.id, body);
        toast.success('User updated');
      } else {
        if (!form.password) {
          toast.error('Password is required for new users');
          setSaving(false);
          return;
        }
        await usersApi.create({
          username: form.username,
          password: form.password,
          role: form.role,
        });
        toast.success('User created');
      }
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!canWrite) return;
    if (!confirm(`Delete user "${user.username}"?`)) return;
    try {
      await usersApi.remove(user.id);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'username', label: 'Username' },
    {
      key: 'role',
      label: 'Role',
      render: (r) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {r.role}
        </span>
      ),
    },
    { key: 'created_at', label: 'Created' },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Manage system login accounts and roles.</p>
        {canWrite && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Add User
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <DataTable data={users} columns={columns} searchKeys={['username', 'role']} />
      )}

      {canWrite && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'New User'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Username *</label>
              <input
                className="input-field"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label-field">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input
                type="password"
                className="input-field"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
                minLength={6}
              />
            </div>
            <div>
              <label className="label-field">Role *</label>
              <select
                className="input-field"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
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
