import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Wrench, X, ChevronDown, User } from 'lucide-react';

const statusColors = { pending: 'badge-yellow', assigned: 'badge-blue', 'in-progress': 'badge-purple', resolved: 'badge-green', closed: 'badge-gray' };
const priorityColors = { urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
const categories = ['plumbing','electrical','furniture','cleaning','ac','internet','other'];

function CreateRequestModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/maintenance', form);
      toast.success('Request submitted!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Submit Maintenance Request</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Title*</label><input className="input" placeholder="Brief description of the issue" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div><label className="label">Description*</label><textarea className="input" rows={4} placeholder="Detailed description of the problem..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateModal({ request, staffList, onClose, onSave }) {
  const [form, setForm] = useState({ status: request.status, assignedTo: request.assignedTo?._id || '', resolutionNote: request.resolutionNote || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/maintenance/${request._id}`, form);
      toast.success('Request updated!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Update Request</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <div className="mb-4 p-3 rounded-lg" style={{ background: '#0f172a' }}>
          <p className="text-sm font-medium text-white">{request.title}</p>
          <p className="text-xs text-slate-400 mt-1">{request.description}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {['pending','assigned','in-progress','resolved','closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="label">Assign To (Staff)</label>
            <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
              <option value="">Unassigned</option>
              {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">Resolution Note</label><textarea className="input" rows={3} value={form.resolutionNote} onChange={e => setForm(f => ({ ...f, resolutionNote: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Maintenance() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [staffList, setStaffList] = useState([]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const res = await api.get('/maintenance', { params });
      let data = res.data.requests || [];
      if (search) data = data.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()));
      setRequests(data);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRequests();
    if (user.role !== 'resident') {
      api.get('/users', { params: { role: 'staff' } }).then(res => setStaffList(res.data.users || [])).catch(() => {});
    }
  }, [filterStatus, filterPriority, search]);

  const statusGroups = ['pending', 'assigned', 'in-progress', 'resolved'];

  if (user.role === 'admin' || user.role === 'staff') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Maintenance Requests</h1>
            <p className="text-slate-400 text-sm mt-1">Review and manage maintenance tasks</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {['pending','assigned','in-progress','resolved','closed'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className="input w-40" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All Priority</option>
            {['urgent','high','medium','low'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        {/* Kanban-style columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statusGroups.map(status => {
            const group = requests.filter(r => r.status === status);
            return (
              <div key={status} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${statusColors[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <span className="text-xs text-slate-500">{group.length}</span>
                </div>
                <div className="space-y-3">
                  {group.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-4">No requests</p>
                  ) : group.map(req => (
                    <div key={req._id} className="p-3 rounded-lg cursor-pointer hover:border-indigo-500/40 transition-colors" style={{ background: '#0f172a', border: '1px solid #334155' }} onClick={() => setUpdateModal(req)}>
                      <p className="text-sm font-medium text-white">{req.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-semibold capitalize ${priorityColors[req.priority]}`}>⚡ {req.priority}</span>
                        <span className="text-xs text-slate-500">· {req.category}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                        <User size={10} /> {req.resident?.name || 'Unknown'}
                        {req.roomNumber && <span>· Room {req.roomNumber}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {updateModal && <UpdateModal request={updateModal} staffList={staffList} onClose={() => setUpdateModal(null)} onSave={() => { setUpdateModal(null); fetchRequests(); }} />}
      </div>
    );
  }

  // Resident view
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Maintenance Requests</h1>
          <p className="text-slate-400 text-sm mt-1">Submit and track your maintenance requests</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Request
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : requests.length === 0 ? (
        <div className="card p-16 text-center">
          <Wrench size={40} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No maintenance requests yet</p>
          <button onClick={() => setCreateModal(true)} className="btn-primary mt-4">Submit First Request</button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{req.title}</p>
                  <p className="text-sm text-slate-400 mt-1">{req.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`badge ${statusColors[req.status]}`}>{req.status}</span>
                    <span className={`text-xs font-semibold capitalize ${priorityColors[req.priority]}`}>⚡ {req.priority}</span>
                    <span className="badge badge-gray">{req.category}</span>
                  </div>
                  {req.resolutionNote && <div className="mt-3 p-3 rounded-lg text-sm text-slate-300" style={{ background: '#0f172a' }}>✅ {req.resolutionNote}</div>}
                </div>
                <div className="text-xs text-slate-500 text-right whitespace-nowrap ml-4">
                  {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModal && <CreateRequestModal onClose={() => setCreateModal(false)} onSave={() => { setCreateModal(false); fetchRequests(); }} />}
    </div>
  );
}
