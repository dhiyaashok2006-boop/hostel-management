import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Residents from './pages/Residents';
import Maintenance from './pages/Maintenance';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Profile from './pages/Profile';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
      <div style={{ width: 36, height: 36, border: '4px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="rooms" element={<PrivateRoute roles={['admin','staff']}><Rooms /></PrivateRoute>} />
          <Route path="residents" element={<PrivateRoute roles={['admin','staff']}><Residents /></PrivateRoute>} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reports" element={<PrivateRoute roles={['admin','staff']}><Reports /></PrivateRoute>} />
          <Route path="users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
