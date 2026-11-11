import { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color: color || 'white' }}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Reports() {
  const [financial, setFinancial] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [finRes, occRes, mRes, invRes] = await Promise.all([
          api.get('/reports/financial', { params: { year } }),
          api.get('/reports/occupancy'),
          api.get('/reports/maintenance'),
          api.get('/reports/invoices')
        ]);
        setFinancial(finRes.data.data);
        setOccupancy(occRes.data.data);
        setMaintenance(mRes.data.data);
        setInvoiceSummary(invRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [year]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>;

  const tooltipStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' };

  const maintenanceStatusData = maintenance?.byStatus?.map(s => ({ name: s._id, value: s.count })) || [];
  const maintenancePriorityData = maintenance?.byPriority?.map(s => ({ name: s._id, value: s.count })) || [];
  const invoiceBreakdown = invoiceSummary?.breakdown?.map(b => ({ name: b._id, value: b.count, amount: b.total })) || [];
  const occupancyByType = occupancy?.byType?.map(t => ({ name: t._id, total: t.total, occupied: t.occupied })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Analytics and performance insights</p>
        </div>
        <div className="flex gap-3 items-center">
          <label className="text-sm text-slate-400">Year:</label>
          <select className="input w-28" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₹${(financial?.totalRevenue || 0).toLocaleString()}`} color="#6366f1" sub={`Year ${year}`} />
        <StatCard label="Pending Dues" value={`₹${(financial?.pendingAmount || 0).toLocaleString()}`} color="#f59e0b" />
        <StatCard label="Occupancy Rate" value={`${occupancy?.occupancyRate || 0}%`} color="#10b981" sub={`${occupancy?.occupiedRooms}/${occupancy?.totalRooms} rooms`} />
        <StatCard label="Total Residents" value={occupancy?.totalResidents || 0} sub="Currently active" />
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-5">Monthly Revenue — {year}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={financial?.monthlyRevenue || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="url(#revGrad)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: Occupancy by Type + Invoice Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Occupancy by Room Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={occupancyByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              <Bar dataKey="total" name="Total" fill="#334155" radius={[4,4,0,0]} />
              <Bar dataKey="occupied" name="Occupied" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Invoice Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={invoiceBreakdown} cx="50%" cy="50%" outerRadius={65} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                {invoiceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, name, props) => [v, props.payload.name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {invoiceBreakdown.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-slate-400 capitalize">{item.name}:</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Maintenance charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Maintenance by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={maintenanceStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value">
                {maintenanceStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Maintenance by Priority</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={maintenancePriorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
