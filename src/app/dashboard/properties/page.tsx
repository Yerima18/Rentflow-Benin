"use client";

import { useState, useEffect } from "react";
import { Building, Plus, Search } from "lucide-react";
import Link from "next/link";

type Property = { id: string; name: string; address: string; units: number; _count: { tenants: number } };

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProperties = () => {
    setLoading(true);
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => { setProperties(data); setLoading(false); });
  };

  useEffect(() => { fetchProperties(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete property "${name}"? This will also delete all associated tenants and payments.`)) return;
    const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
    if (res.ok) fetchProperties();
  };

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Properties</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your rental properties and units.</p>
        </div>
        <Link href="/dashboard/properties/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-md shadow-indigo-200 flex items-center transition-all">
          <Plus size={20} className="mr-2" />
          Add Property
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search properties by name or address..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-slate-900 shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="bg-indigo-50 p-5 rounded-2xl mb-5 text-indigo-400 ring-1 ring-indigo-100/50 shadow-sm">
              <Building size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No properties found</h3>
            <p className="text-slate-500 max-w-sm mb-8 text-lg">Get started by creating your first property to track rent and manage tenants.</p>
            <Link href="/dashboard/properties/new" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 px-6 py-3 rounded-xl font-semibold transition-colors">
              Add Property Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-sm border-b border-slate-100">
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Property Name</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Address</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Total Units</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">Occupancy</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900 text-base">{prop.name}</td>
                    <td className="px-8 py-5 text-slate-600 text-sm">{prop.address}</td>
                    <td className="px-8 py-5 text-slate-900 font-semibold">{prop.units}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                        {prop._count?.tenants || 0} / {prop.units}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right space-x-4">
                      <button
                        onClick={() => handleDelete(prop.id, prop.name)}
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
