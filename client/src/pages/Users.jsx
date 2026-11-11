import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit2, X, Shield } from 'lucide-react';

const roleColors = { admin: 'badge-purple', staff: 'badge-blue', resident: 'badge-green' };

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', phone: user?.phone || '', role: user?.role || 'staff' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user?._id) {
        await api.put(`/users/${user._id}`, form);
        toast.success('User updated!');
      } else {
        await api.post('/auth/admin-create', form);
        toast.success('User created!');
      }
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{user ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Full Name*</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div><label className="label">Email*</label><input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={!!user} /></div>
          {!user && <div><label className="label">Password*</label><input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>}
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
          <div><label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {['admin','staff','resident'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : user ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modal, setModal] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterRole) params.role = filterRole;
      if (search) params.search = search;
      const res = await api.get('/users', { params });
      setUsers(res.data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filterRole, search]);

  const deleteUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deleted'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const roleSummary = { admin: users.filter(u => u.role === 'admin').length, staff: users.filter(u => u.role === 'staff').length, resident: users.filter(u => u.role === 'resident').length };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system users and roles</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add User</button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Admins', key: 'admin', color: '#8b5cf6' }, { label: 'Staff', key: 'staff', color: '#3b82f6' }, { label: 'Residents', key: 'resident', color: '#10b981' }].map(r => (
          <div key={r.key} className="card p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg" style={{ background: `${r.color}20` }}><Shield size={18} style={{ color: r.color }} /></div>
            <div><div className="text-2xl font-bold text-white">{roleSummary[r.key]}</div><div className="text-xs text-slate-400">{r.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {['admin','staff','resident'].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: '#0f172a' }}>
              <tr>
                {['User','Email','Phone','Role','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u._id} className="border-t border-slate-800 table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{u.phone || '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(u)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Edit2 size={14} /></button>
                      <button onClick={() => deleteUser(u._id)} className="p-1.5 hover:bg-red-900/30 rounded text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && <UserModal user={modal?._id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchUsers(); }} />}
    </div>
  );
}
