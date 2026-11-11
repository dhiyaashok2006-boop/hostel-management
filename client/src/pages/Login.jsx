import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@hostel.com', password: 'password123' },
      staff: { email: 'staff@hostel.com', password: 'password123' },
      resident: { email: 'arjun@example.com', password: 'password123' }
    };
    setForm(creds[role]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 50%, #0f172a 100%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">HostelPro</h1>
          <p className="text-slate-400 mt-1">Management System</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 text-sm font-semibold" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-3 gap-2">
              {['admin', 'staff', 'resident'].map(role => (
                <button key={role} onClick={() => fillDemo(role)}
                  className="py-2 px-3 rounded-lg text-xs font-medium transition-colors capitalize"
                  style={{ background: '#334155', color: '#94a3b8', border: '1px solid #475569' }}
                  onMouseEnter={e => e.target.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.target.style.borderColor = '#475569'}>
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
