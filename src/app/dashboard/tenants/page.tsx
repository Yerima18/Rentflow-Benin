"use client";

import { useCallback, useState, useEffect } from "react";
import { Users, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useIsDemoUser } from "@/components/DemoMode";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatXof } from "@/lib/money";
import { formatMessage } from "@/lib/i18n/formatMessage";

type Tenant = { id: string; fullName: string; phone: string; unitNumber: string; rentAmount: number; dueDate: number; propertyId: string; property: { name: string } };
type Property = { id: string; name: string };

export default function TenantsPage() {
  const isDemo = useIsDemoUser();
  const { locale, dict } = useLanguage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tenantResponse, propertyResponse] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/properties'),
      ]);
      if (!tenantResponse.ok || !propertyResponse.ok) throw new Error("Tenant data request failed");
      const [tenantData, propertyData] = await Promise.all([tenantResponse.json(), propertyResponse.json()]);
      if (!Array.isArray(tenantData) || !Array.isArray(propertyData)) throw new Error("Invalid tenant data response");
      setTenants(tenantData);
      setProperties(propertyData);
    } catch {
      setError(dict.tenants.loadError);
    } finally {
      setLoading(false);
    }
  }, [dict.tenants.loadError]);

  useEffect(() => { void fetchTenants(); }, [fetchTenants]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(formatMessage(dict.tenants.deleteConfirm, { name }))) return;
    try {
      const res = await fetch(`/api/tenants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Tenant deletion failed");
      await fetchTenants();
    } catch {
      setError(dict.tenants.deleteError);
    }
  };

  const filtered = tenants.filter(t => {
    const matchesSearch = t.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesProperty = propertyFilter === "" || t.propertyId === propertyFilter;
    return matchesSearch && matchesProperty;
  });
  const hasActiveFilters = search.trim().length > 0 || propertyFilter !== "";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{dict.tenants.title}</h1>
          <p className="text-slate-500 mt-2 text-lg">{dict.tenants.subtitle}</p>
        </div>
        {!isDemo && <Link href="/dashboard/tenants/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-md shadow-indigo-200 flex items-center transition-all">
          <Plus size={20} className="mr-2" /> {dict.tenants.add}
        </Link>}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between gap-4 items-center bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={dict.tenants.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow text-slate-900 shadow-sm"
            />
          </div>
          <div className="hidden sm:block">
            <select
              value={propertyFilter}
              onChange={e => setPropertyFilter(e.target.value)}
              className="border-slate-200 border bg-white rounded-xl px-4 py-3 text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-8"
            >
              <option value="">{dict.tenants.allProperties}</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <div role="alert" className="flex items-center justify-between gap-4 border-b border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-800"><span>{error}</span><button onClick={() => void fetchTenants()} className="font-semibold underline">{dict.common.retry}</button></div>}

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="bg-indigo-50 p-5 rounded-2xl mb-5 text-indigo-400 ring-1 ring-indigo-100/50 shadow-sm">
              <Users size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{hasActiveFilters ? dict.tenants.searchNoResults : dict.tenants.noResults}</h3>
            <p className="text-slate-500 max-w-sm mb-8 text-lg">{hasActiveFilters ? dict.tenants.searchEmptyDescription : dict.tenants.emptyDescription}</p>
            {!isDemo && tenants.length === 0 && <Link href="/dashboard/tenants/new" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 px-6 py-3 rounded-xl font-semibold transition-colors">{dict.tenants.emptyAction}</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-sm border-b border-slate-100">
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.tenants.tenantDetails}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.tenants.contactInformation}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.tenants.propertyAndUnit}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.tenants.rentalTerms}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs text-right">{dict.common.actions}</th>
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
                      <div className="text-slate-500 font-medium">{formatMessage(dict.tenants.unitLabel, { unit: tenant.unitNumber })}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-indigo-600 font-bold text-base">{formatXof(tenant.rentAmount, locale)}</div>
                      <div className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-1">{formatMessage(dict.tenants.dueDay, { day: tenant.dueDate })}</div>
                    </td>
                    <td className="px-8 py-5 text-right space-x-4">
                      {!isDemo && <button
                        onClick={() => handleDelete(tenant.id, tenant.fullName)}
                        className="text-slate-400 hover:text-rose-600 text-sm font-bold transition-colors"
                      >
                        {dict.common.delete}
                      </button>}
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
