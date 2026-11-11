import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BedDouble, Users, Wrench, Receipt, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="stat-card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className="p-3 rounded-xl" style={{ background: `${color}20` }}>
        <Icon size={22} style={{ color }} />
      </div>
    </div>
  </div>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role !== 'resident') {
          const [dashRes, finRes] = await Promise.all([
            api.get('/reports/dashboard'),
            api.get('/reports/financial')
          ]);
          setStats(dashRes.data.data);
          setRevenueData(finRes.data.data.monthlyRevenue || []);
        } else {
          const [residentRes, mainRes] = await Promise.all([
            api.get('/residents/me'),
            api.get('/maintenance')
          ]);
          setStats({ residentData: residentRes.data.resident, maintenanceData: mainRes.data });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  if (user.role === 'resident') {
    const r = stats?.residentData;
    const myRequests = stats?.maintenanceData?.requests || [];
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user.name} 👋</h1>
          <p className="text-slate-400 mt-1">Here's your hostel overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-slate-400">Room Number</p>
            <p className="text-3xl font-bold text-white mt-1">{r?.roomNumber || 'Not Assigned'}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-400">Status</p>
            <p className={`text-2xl font-bold mt-1 capitalize ${r?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>{r?.status || 'pending'}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-400">Monthly Rent</p>
            <p className="text-3xl font-bold text-white mt-1">₹{r?.monthlyRent?.toLocaleString() || 0}</p>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">My Maintenance Requests</h2>
          {myRequests.length === 0 ? (
            <p className="text-slate-500 text-sm">No maintenance requests yet</p>
          ) : (
            <div className="space-y-3">
              {myRequests.slice(0, 5).map(req => (
                <div key={req._id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#0f172a' }}>
                  <div>
                    <p className="text-sm font-medium text-white">{req.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{req.category} · {req.priority} priority</p>
                  </div>
                  <span className={`badge ${req.status === 'resolved' ? 'badge-green' : req.status === 'in-progress' ? 'badge-blue' : req.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const occupancyData = [
    { name: 'Occupied', value: stats?.occupiedRooms || 0 },
    { name: 'Available', value: stats?.availableRooms || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Hostel operations overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Rooms" value={stats?.totalRooms} icon={BedDouble} color="#6366f1" sub={`${stats?.availableRooms} available`} />
        <StatCard label="Active Residents" value={stats?.totalResidents} icon={Users} color="#10b981" />
        <StatCard label="Pending Maintenance" value={stats?.pendingMaintenance} icon={Wrench} color="#f59e0b" />
        <StatCard label="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon={TrendingUp} color="#8b5cf6" sub={`${stats?.pendingInvoices} pending invoices`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Occupancy Pie */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Room Occupancy</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {occupancyData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {occupancyData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, label: 'Rooms Available', value: stats?.availableRooms, color: '#10b981' },
          { icon: AlertCircle, label: 'Pending Invoices', value: stats?.pendingInvoices, color: '#f59e0b' },
          { icon: Clock, label: 'Pending Maintenance', value: stats?.pendingMaintenance, color: '#ef4444' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl" style={{ background: `${color}20` }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value ?? 0}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
