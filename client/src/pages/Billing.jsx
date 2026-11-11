import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Receipt, X, CreditCard, Eye } from 'lucide-react';

const statusColors = { pending: 'badge-yellow', paid: 'badge-green', overdue: 'badge-red', partial: 'badge-blue', cancelled: 'badge-gray' };

function CreateInvoiceModal({ onClose, onSave }) {
  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState({ resident: '', roomNumber: '', billingMonth: new Date().toISOString().substring(0,7), dueDate: '', discount: 0, discountReason: '', notes: '', items: [{ description: 'Room Rent', amount: '', type: 'rent' }] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/residents', { params: { status: 'active' } }).then(res => setResidents(res.data.residents || []));
  }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: '', amount: '', type: 'other' }] }));
  const removeItem = idx => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) => setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: val } : item) }));

  const total = form.items.reduce((s, item) => s + (parseFloat(item.amount) || 0), 0) - parseFloat(form.discount || 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/billing', { ...form, totalAmount: total, items: form.items.map(i => ({ ...i, amount: parseFloat(i.amount) || 0 })) });
      toast.success('Invoice created!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const itemTypes = ['rent','electricity','water','internet','laundry','mess','late-fee','other'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6" style={{ maxWidth: '640px' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Create Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Resident*</label>
              <select className="input" value={form.resident} onChange={e => { const r = residents.find(r => r.user?._id === e.target.value); setForm(f => ({ ...f, resident: e.target.value, roomNumber: r?.roomNumber || '' })); }} required>
                <option value="">Select resident...</option>
                {residents.map(r => <option key={r.user?._id} value={r.user?._id}>{r.user?.name} - Room {r.roomNumber}</option>)}
              </select>
            </div>
            <div><label className="label">Room Number</label><input className="input" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} /></div>
            <div><label className="label">Billing Month</label><input type="month" className="input" value={form.billingMonth} onChange={e => setForm(f => ({ ...f, billingMonth: e.target.value }))} /></div>
            <div><label className="label">Due Date</label><input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Billing Items</label>
              <button type="button" onClick={addItem} className="text-xs text-indigo-400 hover:text-indigo-300">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input className="input flex-1" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  <input type="number" className="input w-28" placeholder="Amount" value={item.amount} onChange={e => updateItem(idx, 'amount', e.target.value)} />
                  <select className="input w-32" value={item.type} onChange={e => updateItem(idx, 'type', e.target.value)}>
                    {itemTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="p-2 hover:bg-red-900/30 rounded text-red-400"><X size={14} /></button>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Discount (₹)</label><input type="number" className="input" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} /></div>
            <div><label className="label">Discount Reason</label><input className="input" value={form.discountReason} onChange={e => setForm(f => ({ ...f, discountReason: e.target.value }))} /></div>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>

          <div className="p-4 rounded-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal:</span>
              <span className="text-white">₹{form.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0).toLocaleString()}</span>
            </div>
            {form.discount > 0 && <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Discount:</span><span className="text-green-400">-₹{form.discount}</span></div>}
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-slate-700">
              <span className="text-white">Total:</span><span className="text-indigo-400 text-lg">₹{Math.max(0, total).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating...' : 'Create Invoice'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({ invoice, onClose, onSave }) {
  const [form, setForm] = useState({ amount: invoice.totalAmount - invoice.amountPaid, method: 'cash', transactionId: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/billing/${invoice._id}/payment`, form);
      toast.success('Payment recorded!');
      onSave();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Record Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <div className="p-4 rounded-xl mb-4" style={{ background: '#0f172a' }}>
          <div className="flex justify-between text-sm"><span className="text-slate-400">Invoice:</span><span className="text-white">{invoice.invoiceNumber}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Total:</span><span className="text-white">₹{invoice.totalAmount.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm mt-1"><span className="text-slate-400">Paid:</span><span className="text-green-400">₹{invoice.amountPaid.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm mt-1 font-bold"><span className="text-slate-300">Balance:</span><span className="text-indigo-400">₹{(invoice.totalAmount - invoice.amountPaid).toLocaleString()}</span></div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Amount (₹)*</label><input type="number" className="input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} required max={invoice.totalAmount - invoice.amountPaid} /></div>
          <div><label className="label">Payment Method</label>
            <select className="input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {['cash','upi','card','bank-transfer'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="label">Transaction ID</label><input className="input" value={form.transactionId} onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} placeholder="Optional" /></div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Processing...' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/billing', { params });
      setInvoices(res.data.invoices || []);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [filterStatus]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
          <p className="text-slate-400 text-sm mt-1">{user.role === 'resident' ? 'View your invoices and payment history' : 'Manage invoices and payments'}</p>
        </div>
        {(user.role === 'admin' || user.role === 'staff') && (
          <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Invoice
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <select className="input w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {['pending','paid','overdue','partial','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: '#0f172a' }}>
              <tr>
                {['Invoice #','Resident','Room','Billing Month','Amount','Paid','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16 text-slate-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <Receipt size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-400">No invoices found</p>
                </td></tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="border-t border-slate-800 table-row">
                  <td className="px-4 py-3 text-sm font-mono text-indigo-400">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm text-white">{inv.resident?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{inv.roomNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{inv.billingMonth}</td>
                  <td className="px-4 py-3 text-sm text-white font-semibold">₹{inv.totalAmount?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-green-400">₹{inv.amountPaid?.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[inv.status]}`}>{inv.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setViewModal(inv)} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="View"><Eye size={14} /></button>
                      {inv.status !== 'paid' && inv.status !== 'cancelled' && (user.role === 'admin' || user.role === 'staff') && (
                        <button onClick={() => setPayModal(inv)} className="p-1.5 hover:bg-green-900/30 rounded text-green-400" title="Record Payment"><CreditCard size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice detail view modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewModal(null)}>
          <div className="modal-box p-6" style={{ maxWidth: '540px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Invoice Details</h2>
              <button onClick={() => setViewModal(null)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice #</span><span className="font-mono text-indigo-400">{viewModal.invoiceNumber}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Resident</span><span className="text-white">{viewModal.resident?.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Room</span><span className="text-white">{viewModal.roomNumber || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Month</span><span className="text-white">{viewModal.billingMonth}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Due Date</span><span className="text-white">{viewModal.dueDate ? new Date(viewModal.dueDate).toLocaleDateString() : '—'}</span></div>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm font-semibold text-white mb-3">Items</p>
                {viewModal.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-slate-400">{item.description}</span>
                    <span className="text-white">₹{item.amount?.toLocaleString()}</span>
                  </div>
                ))}
                {viewModal.discount > 0 && <div className="flex justify-between text-sm py-1 text-green-400"><span>Discount</span><span>-₹{viewModal.discount.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold pt-2 border-t border-slate-700 mt-2">
                  <span className="text-white">Total</span><span className="text-indigo-400">₹{viewModal.totalAmount?.toLocaleString()}</span>
                </div>
              </div>
              {viewModal.payments?.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-sm font-semibold text-white mb-3">Payment History</p>
                  {viewModal.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-slate-400">{new Date(p.paidAt).toLocaleDateString()} · {p.method}</span>
                      <span className="text-green-400">₹{p.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between pt-2"><span className="font-bold text-white">Balance Due</span><span className="font-bold text-red-400">₹{Math.max(0, viewModal.totalAmount - viewModal.amountPaid).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}

      {createModal && <CreateInvoiceModal onClose={() => setCreateModal(false)} onSave={() => { setCreateModal(false); fetchInvoices(); }} />}
      {payModal && <PaymentModal invoice={payModal} onClose={() => setPayModal(null)} onSave={() => { setPayModal(null); fetchInvoices(); }} />}
    </div>
  );
}
