import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, User, X, Edit2, LogIn, LogOut } from 'lucide-react';

function CheckInModal({ resident, onClose, onSave }) {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ roomId: '', checkInDate: new Date().toISOString().split('T')[0], monthlyRent: '', securityDeposit: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/rooms', { params: { status: 'available' } }).then(res => {
      setRooms(res.data.rooms || []);
    });
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.roomId) return toast.error('Please select a room');
    setLoading(true);
    try {
      await api.post('/residents/checkin', { residentId: resident._id, ...form });
      toast.success('Check-in successful!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Check-In: {resident.user?.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Select Room*</label>
            <select className="input" value={form.roomId} onChange={e => { const r = rooms.find(r => r._id === e.target.value); setForm(f => ({ ...f, roomId: e.target.value, monthlyRent: r?.pricePerMonth || '' })); }} required>
              <option value="">Choose available room...</option>
              {rooms.map(r => <option key={r._id} value={r._id}>Room {r.roomNumber} - {r.type} - ₹{r.pricePerMonth}/mo (Block {r.block})</option>)}
            </select>
          </div>
          <div><label className="label">Check-In Date</label><input type="date" className="input" value={form.checkInDate} onChange={e => setForm(f => ({ ...f, checkInDate: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Monthly Rent (₹)</label><input type="number" className="input" value={form.monthlyRent} onChange={e => setForm(f => ({ ...f, monthlyRent: e.target.value }))} /></div>
            <div><label className="label">Security Deposit (₹)</label><input type="number" className="input" value={form.securityDeposit} onChange={e => setForm(f => ({ ...f, securityDeposit: e.target.value }))} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Processing...' : 'Check In'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResidentModal({ resident, onClose, onSave }) {
  const [form, setForm] = useState({
    idProofType: resident?.idProofType || '',
    idProofNumber: resident?.idProofNumber || '',
    occupation: resident?.occupation || '',
    emergencyContactName: resident?.emergencyContact?.name || '',
    emergencyContactPhone: resident?.emergencyContact?.phone || '',
    emergencyContactRelationship: resident?.emergencyContact?.relationship || '',
    notes: resident?.notes || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/residents/${resident._id}`, {
        ...form,
        emergencyContact: { name: form.emergencyContactName, phone: form.emergencyContactPhone, relationship: form.emergencyContactRelationship }
      });
      toast.success('Resident updated!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Edit Resident: {resident.user?.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">ID Type</label>
              <select className="input" value={form.idProofType} onChange={e => setForm(f => ({ ...f, idProofType: e.target.value }))}>
                <option value="">Select...</option>
                {['aadhar','passport','driving-license','voter-id','other'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">ID Number</label><input className="input" value={form.idProofNumber} onChange={e => setForm(f => ({ ...f, idProofNumber: e.target.value }))} /></div>
          </div>
          <div><label className="label">Occupation</label><input className="input" value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} /></div>
          <div className="pt-2 pb-1"><p className="text-sm font-medium text-slate-300">Emergency Contact</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name</label><input className="input" value={form.emergencyContactName} onChange={e => setForm(f => ({ ...f, emergencyContactName: e.target.value }))} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.emergencyContactPhone} onChange={e => setForm(f => ({ ...f, emergencyContactPhone: e.target.value }))} /></div>
          </div>
          <div><label className="label">Relationship</label><input className="input" value={form.emergencyContactRelationship} onChange={e => setForm(f => ({ ...f, emergencyContactRelationship: e.target.value }))} /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [checkInModal, setCheckInModal] = useState(null);

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const res = await api.get('/residents', { params });
      setResidents(res.data.residents || []);
    } catch { toast.error('Failed to load residents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchResidents(); }, [filter, search]);

  const handleCheckout = async (resident) => {
    if (!confirm(`Check out ${resident.user?.name}?`)) return;
    try {
      await api.post(`/residents/checkout/${resident._id}`);
      toast.success('Checkout successful');
      fetchResidents();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const statusColors = { active: 'badge-green', 'checked-out': 'badge-gray', pending: 'badge-yellow' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Residents</h1>
          <p className="text-slate-400 text-sm mt-1">Manage hostel residents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          {['active','pending','checked-out'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: '#0f172a' }}>
              <tr>
                {['Resident','Room','Check-In','Monthly Rent','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400">Loading...</td></tr>
              ) : residents.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <User size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-400">No residents found</p>
                </td></tr>
              ) : residents.map(r => (
                <tr key={r._id} className="border-t border-slate-800 table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {r.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{r.user?.name}</div>
                        <div className="text-xs text-slate-400">{r.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{r.roomNumber || <span className="text-slate-500">Not Assigned</span>}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{r.checkInDate ? new Date(r.checkInDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-sm text-white">{r.monthlyRent ? `₹${r.monthlyRent.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(r)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="Edit"><Edit2 size={14} /></button>
                      {r.status === 'pending' && <button onClick={() => setCheckInModal(r)} className="p-1.5 hover:bg-green-900/30 rounded text-green-400" title="Check In"><LogIn size={14} /></button>}
                      {r.status === 'active' && <button onClick={() => handleCheckout(r)} className="p-1.5 hover:bg-red-900/30 rounded text-red-400" title="Check Out"><LogOut size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <ResidentModal resident={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchResidents(); }} />}
      {checkInModal && <CheckInModal resident={checkInModal} onClose={() => setCheckInModal(null)} onSave={() => { setCheckInModal(null); fetchResidents(); }} />}
    </div>
  );
}
