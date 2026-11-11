import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard, BedDouble, Users, Wrench, Receipt,
  BarChart3, Settings, LogOut, Menu, X, Building2, User
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'staff', 'resident'] },
  { to: '/rooms', icon: BedDouble, label: 'Rooms', roles: ['admin', 'staff'] },
  { to: '/residents', icon: Users, label: 'Residents', roles: ['admin', 'staff'] },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance', roles: ['admin', 'staff', 'resident'] },
  { to: '/billing', icon: Receipt, label: 'Billing', roles: ['admin', 'staff', 'resident'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'staff'] },
  { to: '/users', icon: Settings, label: 'Users', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));

  const Sidebar = () => (
    <aside className="w-64 h-full flex flex-col" style={{ background: '#0f172a', borderRight: '1px solid #1e293b' }}>
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm">HostelPro</div>
            <div className="text-xs text-slate-500">Management System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-800">
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} mb-1`} onClick={() => setSidebarOpen(false)}>
          <User size={18} />
          Profile
        </NavLink>
        <button onClick={handleLogout} className="sidebar-link w-full text-left text-red-400 hover:bg-red-900/20 hover:text-red-400">
          <LogOut size={18} />
          Logout
        </button>
        <div className="mt-3 p-3 rounded-xl" style={{ background: '#1e293b', border: '1px solid #334155' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(0,0,0,0.5)' }} />
          <div className="w-64 h-full" style={{ position: 'absolute', left: 0, top: 0 }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800" style={{ background: '#0f172a' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="text-sm text-slate-400">
              <span className="text-white font-medium">{user?.name}</span>
              <span className="ml-1 text-xs text-indigo-400 capitalize">({user?.role})</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: '#0f172a' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
