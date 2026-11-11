import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  };

  const typeColors = {
    maintenance: 'bg-orange-500',
    billing: 'bg-green-500',
    room: 'bg-blue-500',
    alert: 'bg-red-500',
    general: 'bg-purple-500'
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold text-white" style={{ background: '#ef4444', fontSize: '10px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 card animate-fade-in z-50" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <span className="font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
          ) : (
            notifications.map(n => (
              <div key={n._id} className={`p-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer ${!n.read ? 'bg-indigo-500/5' : ''}`}
                onClick={async () => { await api.put(`/notifications/${n._id}/read`); setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x)); setUnreadCount(c => Math.max(0, c - (n.read ? 0 : 1))); }}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeColors[n.type] || 'bg-gray-500'}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{n.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{n.message}</div>
                    <div className="text-xs text-slate-600 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1" />}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
