import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, BedDouble, X, Edit2, Trash2 } from 'lucide-react';

const statusColors = { available: 'badge-green', occupied: 'badge-red', maintenance: 'badge-yellow', reserved: 'badge-blue' };
const typeIcons = { single: '🛏', double: '🛏🛏', triple: '🛏🛏🛏', dormitory: '🏠' };

function RoomModal({ room, onClose, onSave }) {
  const [form, setForm] = useState(room || { roomNumber: '', floor: 1, type: 'single', capacity: 1, pricePerMonth: '', status: 'available', amenities: '', block: 'A', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, amenities: typeof form.amenities === 'string' ? form.amenities.split(',').map(s => s.trim()).filter(Boolean) : form.amenities, floor: parseInt(form.floor), capacity: parseInt(form.capacity), pricePerMonth: parseFloat(form.pricePerMonth) };
      if (room?._id) await api.put(`/rooms/${room._id}`, data);
      else await api.post('/rooms', data);
      toast.success(room ? 'Room updated!' : 'Room created!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">{room ? 'Edit Room' : 'Add New Room'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Room Number*</label><input className="input" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} required /></div>
            <div><label className="label">Block</label><input className="input" value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))} /></div>
            <div><label className="label">Floor*</label><input type="number" className="input" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} min={0} required /></div>
            <div><label className="label">Capacity*</label><input type="number" className="input" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} min={1} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['single','double','triple','dormitory'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['available','occupied','maintenance','reserved'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Price / Month (₹)*</label><input type="number" className="input" value={form.pricePerMonth} onChange={e => setForm(f => ({ ...f, pricePerMonth: e.target.value }))} required /></div>
          <div><label className="label">Amenities (comma separated)</label><input className="input" placeholder="WiFi, AC, Bathroom..." value={Array.isArray(form.amenities) ? form.amenities.join(', ') : form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving...' : 'Save Room'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [modal, setModal] = useState(null);
  const [stats, setStats] = useState({});

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const [roomRes, statRes] = await Promise.all([
        api.get('/rooms', { params }),
        api.get('/rooms/stats/summary')
      ]);
      setRooms(roomRes.data.rooms || []);
      setStats(statRes.data.stats || {});
    } catch (err) { toast.error('Failed to load rooms'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, [filter, search]);

  const deleteRoom = async (id) => {
    if (!confirm('Delete this room?')) return;
    try { await api.delete(`/rooms/${id}`); toast.success('Room deleted'); fetchRooms(); }
    catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Room Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage hostel rooms and availability</p>
        </div>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: '#6366f1' },
          { label: 'Available', value: stats.available, color: '#10b981' },
          { label: 'Occupied', value: stats.occupied, color: '#ef4444' },
          { label: 'Maintenance', value: stats.maintenance, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value ?? 0}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search room number..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          {['available','occupied','maintenance','reserved'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
      ) : rooms.length === 0 ? (
        <div className="card p-16 text-center">
          <BedDouble size={40} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">No rooms found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map(room => (
            <div key={room._id} className="card p-5 hover:border-indigo-500/40 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl font-bold text-white">Room {room.roomNumber}</div>
                  <div className="text-sm text-slate-400">Block {room.block} · Floor {room.floor}</div>
                </div>
                <span className={`badge ${statusColors[room.status]}`}>{room.status}</span>
              </div>
              <div className="text-2xl mb-2">{typeIcons[room.type]}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Type:</span><span className="text-white capitalize">{room.type}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Capacity:</span><span className="text-white">{room.currentOccupants || 0}/{room.capacity}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rent:</span><span className="text-white font-semibold">₹{room.pricePerMonth?.toLocaleString()}/mo</span>
                </div>
              </div>
              {room.amenities?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {room.amenities.slice(0, 3).map(a => <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}>{a}</span>)}
                  {room.amenities.length > 3 && <span className="text-xs text-slate-500">+{room.amenities.length - 3}</span>}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setModal(room)} className="btn-secondary flex-1 flex items-center justify-center gap-1 text-xs py-1.5">
                  <Edit2 size={12} />Edit
                </button>
                <button onClick={() => deleteRoom(room._id)} className="btn-danger flex items-center justify-center px-3 py-1.5">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && <RoomModal room={modal?._id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchRooms(); }} />}
    </div>
  );
}
