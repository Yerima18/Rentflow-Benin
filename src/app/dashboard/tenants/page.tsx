"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search } from "lucide-react";
import Link from "next/link";

type Tenant = { id: string; fullName: string; phone: string; unitNumber: string; rentAmount: number; dueDate: number; propertyId: string; property: { name: string } };
type Property = { id: string; name: string };

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");

  const fetchTenants = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/tenants').then(r => r.json()),
      fetch('/api/properties').then(r => r.json()),
    ]).then(([t, p]) => {
      setTenants(t);
      setProperties(p);
      setLoading(false);
    });
  };

  useEffect(() => { fetchTenants(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete tenant "${name}"? This will also delete all their payment records.`)) return;
    const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
    if (res.ok) fetchTenants();
  };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesProperty = propertyFilter === "" || t.propertyId === propertyFilter;
    return matchesSearch && matchesProperty;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tenants</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your tenants and lease agreements in one place.</p>
        </div>
        <Link href="/dashboard/tenants/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-md shadow-indigo-200 flex items-center transition-all">
          <Plus size={20} className="mr-2" />
          Add Tenant
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between gap-4 items-center bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tenants by name..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-slate-900 shadow-sm"
            />
          </div>
          <div className="hidden sm:block">
            <select
              value={propertyFilter}
              onChange={e => setPropertyFilter(e.target.value)}
              className="border-slate-200 border bg-white rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
            >
              <option value="">All Properties</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="bg-indigo-50 p-5 rounded-2xl mb-5 text-indigo-400 ring-1 ring-indigo-100/50 shadow-sm">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No tenants found</h3>
            <p className="text-slate-500 max-w-sm mb-8 text-lg">You haven&apos;t added any tenants yet.</p>
            <Link href="/dashboard/tenants/new" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 px-6 py-3 rounded-xl font-semibold transition-colors">
              Register a tenant now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-sm border-b border-slate-100">
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Tenant Details</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Contact Information</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Property & Unit</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Rental Terms (FCFA)</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 text-base">{tenant.fullName}</div>
                    </td>
                    <td className="px-8 py-5 text-slate-600 text-sm">{tenant.phone}</td>
                    <td className="px-8 py-5 text-sm">
                      <div className="text-slate-900 font-semibold">{tenant.property?.name}</div>
                      <div className="text-slate-500 font-medium">Unit: {tenant.unitNumber}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-indigo-600 font-bold text-base">{tenant.rentAmount.toLocaleString()}</div>
                      <div className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-1">Due: Day {tenant.dueDate}</div>
                    </td>
                    <td className="px-8 py-5 text-right space-x-4">
                      <button
                        onClick={() => handleDelete(tenant.id, tenant.fullName)}
                        className="text-slate-400 hover:text-rose-600 text-sm font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
