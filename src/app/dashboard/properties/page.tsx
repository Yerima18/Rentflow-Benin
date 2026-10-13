"use client";

import { useCallback, useState, useEffect } from "react";
import { Building, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useIsDemoUser } from "@/components/DemoMode";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatMessage } from "@/lib/i18n/formatMessage";

type Property = { id: string; name: string; address: string; units: number; _count: { tenants: number } };

export default function PropertiesPage() {
  const isDemo = useIsDemoUser();
  const { dict } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch('/api/properties');
      if (!response.ok) throw new Error("Properties request failed");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid properties response");
      setProperties(data);
    } catch {
      setError(dict.properties.loadError);
    } finally {
      setLoading(false);
    }
  }, [dict.properties.loadError]);

  useEffect(() => { void fetchProperties(); }, [fetchProperties]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(formatMessage(dict.properties.deleteConfirm, { name }))) return;
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Property deletion failed");
      await fetchProperties();
    } catch {
      setError(dict.properties.deleteError);
    }
  };

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );
  const hasSearchResults = search.trim().length > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{dict.properties.title}</h1>
          <p className="text-slate-500 mt-2 text-lg">{dict.properties.subtitle}</p>
        </div>
        {!isDemo && (
          <Link href="/dashboard/properties/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-md shadow-indigo-200 flex items-center transition-all">
            <Plus size={20} className="mr-2" />
            {dict.properties.add}
          </Link>
        )}
      </div>

      {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"><span>{error}</span><button onClick={() => void fetchProperties()} className="font-semibold underline">{dict.common.retry}</button></div>}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={dict.properties.searchPlaceholder}
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
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{hasSearchResults ? dict.properties.searchNoResults : dict.properties.noResults}</h3>
            <p className="text-slate-500 max-w-sm mb-8 text-lg">{hasSearchResults ? dict.properties.searchEmptyDescription : dict.properties.emptyDescription}</p>
            {!isDemo && properties.length === 0 && <Link href="/dashboard/properties/new" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 px-6 py-3 rounded-xl font-semibold transition-colors">{dict.properties.emptyAction}</Link>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-sm border-b border-slate-100">
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.properties.propertyName}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.properties.address}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.properties.totalUnits}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs">{dict.properties.occupancy}</th>
                  <th className="px-8 py-5 font-bold uppercase tracking-wider text-xs text-right">{dict.properties.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900 text-base"><Link href={`/dashboard/properties/${prop.id}`} className="hover:text-indigo-700 hover:underline">{prop.name}</Link></td>
                    <td className="px-8 py-5 text-slate-600 text-sm">{prop.address}</td>
                    <td className="px-8 py-5 text-slate-900 font-semibold">{prop.units}</td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                        {prop._count?.tenants || 0} / {prop.units}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right space-x-4">
                      {!isDemo && <button
                        onClick={() => handleDelete(prop.id, prop.name)}
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
