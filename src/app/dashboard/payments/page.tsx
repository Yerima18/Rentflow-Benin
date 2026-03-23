"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Search, X, MessageCircle } from "lucide-react";
import DatePicker from "@/components/DatePicker";

type Payment = { id: string; amount: number; status: string; month: string; date: string; tenant: { fullName: string; unitNumber: string; property: { name: string } } };
type Tenant = { id: string; fullName: string; unitNumber: string; property: { name: string } };

const STATUSES = ["PAID", "PENDING", "OVERDUE"] as const;

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PAID':
      return <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 uppercase tracking-wider">Paid</span>;
    case 'PENDING':
      return <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 uppercase tracking-wider">Pending</span>;
    case 'OVERDUE':
      return <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 ring-1 ring-rose-600/20 uppercase tracking-wider">Overdue</span>;
    default:
      return <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 ring-1 ring-slate-600/20 uppercase tracking-wider">{status}</span>;
  }
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Record payment modal
  const [showRecord, setShowRecord] = useState(false);
  const [recordForm, setRecordForm] = useState({ tenantId: "", amount: "", status: "PAID", month: new Date().toISOString().slice(0, 7) });
  const [recordMonth, setRecordMonth] = useState<Date | null>(new Date());
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");

  // Edit payment modal
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/payments').then(r => r.json()),
      fetch('/api/tenants').then(r => r.json()),
    ]).then(([p, t]) => {
      setPayments(p);
      setTenants(t);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordError("");
    setRecordLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recordForm, amount: parseFloat(recordForm.amount) }),
      });
      const data = await res.json();
      if (!res.ok) { setRecordError(data.error || 'Failed to record payment'); return; }
      setShowRecord(false);
      setRecordForm({ tenantId: "", amount: "", status: "PAID", month: new Date().toISOString().slice(0, 7) });
      setRecordMonth(new Date());
      fetchData();
    } catch {
      setRecordError("An unexpected error occurred");
    } finally {
      setRecordLoading(false);
    }
  };

  const openEdit = (p: Payment) => {
    setEditPayment(p);
    setEditStatus(p.status);
    setEditAmount(String(p.amount));
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayment) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/payments/${editPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, amount: parseFloat(editAmount) }),
      });
      if (res.ok) { setEditPayment(null); fetchData(); }
    } finally {
      setEditLoading(false);
    }
  };

  const filtered = payments.filter(p =>
    p.tenant?.fullName.toLowerCase().includes(search.toLowerCase()) ||
    p.tenant?.property?.name.toLowerCase().includes(search.toLowerCase())
  );

  const generateWhatsAppLink = (p: Payment) => {
    const text = `Bonjour ${p.tenant?.fullName}, votre paiement de loyer de ${p.amount.toLocaleString()} FCFA pour le mois de ${p.month} a bien été reçu pour l'unité ${p.tenant?.unitNumber} (${p.tenant?.property?.name}). Merci!`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-slate-500 mt-2 text-lg">Track rent payments and history.</p>
        </div>
        <button
          onClick={() => setShowRecord(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-md shadow-violet-200 flex items-center transition-all"
        >
          <Plus size={20} className="mr-2" />
          Record Payment
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between gap-4 items-center bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by tenant or property..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow text-slate-900 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="bg-violet-50 p-5 rounded-2xl mb-5 text-violet-400 ring-1 ring-violet-100/50 shadow-sm">
              <CreditCard size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No payments recorded</h3>
            <p className="text-slate-500 max-w-sm mb-8 text-lg">You haven&apos;t logged any rent payments yet.</p>
            <button
              onClick={() => setShowRecord(true)}
              className="bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Record First Payment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-sm border-b border-slate-100">
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Date & Month</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Tenant / Property</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Amount</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 text-base">{new Date(payment.date).toLocaleDateString()}</div>
                      <div className="text-slate-500 font-medium text-sm">For: {payment.month}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-slate-900 font-bold text-base">{payment.tenant?.fullName}</div>
                      <div className="text-slate-500 text-sm">{payment.tenant?.property?.name} (Unit {payment.tenant?.unitNumber})</div>
                    </td>
                    <td className="px-8 py-5 text-base font-bold text-indigo-600">
                      {payment.amount.toLocaleString()} FCFA
                    </td>
                    <td className="px-8 py-5">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-8 py-5 text-right space-x-3">
                      {payment.status === "PAID" && (
                        <a
                          href={generateWhatsAppLink(payment)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-800 text-sm font-bold transition-colors inline-flex items-center"
                          title="Send WhatsApp Receipt"
                        >
                          <MessageCircle size={18} className="mr-1" />
                          Receipt
                        </a>
                      )}
                      <button
                        onClick={() => openEdit(payment)}
                        className="text-violet-600 hover:text-violet-800 text-sm font-bold transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
              <button onClick={() => setShowRecord(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRecord} className="p-6 space-y-4">
              {recordError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{recordError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant</label>
                <select
                  value={recordForm.tenantId}
                  onChange={e => setRecordForm(f => ({ ...f, tenantId: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900"
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} — {t.property?.name} (Unit {t.unitNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (FCFA)</label>
                <input
                  type="number"
                  value={recordForm.amount}
                  onChange={e => setRecordForm(f => ({ ...f, amount: e.target.value }))}
                  required
                  min={0}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900"
                  placeholder="e.g. 75000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={recordForm.status}
                  onChange={e => setRecordForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                <DatePicker
                  selected={recordMonth}
                  onChange={(date) => {
                    setRecordMonth(date);
                    if (date) {
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      setRecordForm(f => ({ ...f, month: `${y}-${m}` }));
                    }
                  }}
                  showMonthYearPicker
                  placeholderText="Select month"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRecord(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={recordLoading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-70 flex justify-center items-center">
                  {recordLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Edit Payment</h2>
              <button onClick={() => setEditPayment(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (FCFA)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  required
                  min={0}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-900"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditPayment(null)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editLoading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-70 flex justify-center items-center">
                  {editLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
