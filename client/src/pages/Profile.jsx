import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Shield, Save } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/users/${user._id}`, form);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const roleColors = { admin: '#8b5cf6', staff: '#3b82f6', resident: '#10b981' };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account information</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-bold text-white">{user?.name}</div>
            <div className="text-sm text-slate-400">{user?.email}</div>
            <span className="inline-block mt-1 badge" style={{ background: `${roleColors[user?.role]}20`, color: roleColors[user?.role] }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="label">
              <User size={13} className="inline mr-1" />Full Name
            </label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">
              <Mail size={13} className="inline mr-1" />Email
            </label>
            <input className="input" value={user?.email} disabled style={{ opacity: 0.5 }} />
          </div>
          <div>
            <label className="label">
              <Phone size={13} className="inline mr-1" />Phone
            </label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            <Save size={16} />{loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          <Shield size={16} className="inline mr-2" />Account Details
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
            { label: 'Account Status', value: 'Active' },
            { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—' },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-sm text-slate-400">{label}</span>
              <span className="text-sm text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
