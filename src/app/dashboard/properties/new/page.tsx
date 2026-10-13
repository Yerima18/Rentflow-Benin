"use client";

import { useState } from "react";
import { ArrowLeft, Home, MapPin, Hash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DemoReadOnlyPanel, useIsDemoUser } from "@/components/DemoMode";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function NewPropertyPage() {
  const isDemo = useIsDemoUser();
  const { dict } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    units: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/dashboard/properties");
        router.refresh();
      } else {
        setError(dict.properties.createError);
      }
    } catch {
      setError(dict.properties.createError);
    } finally {
      setLoading(false);
    }
  };

  if (isDemo) return <DemoReadOnlyPanel />;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/properties" className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{dict.properties.createTitle}</h1>
          <p className="text-slate-500 mt-1 text-lg">{dict.properties.createSubtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.properties.propertyName}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Home className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={dict.properties.namePlaceholder}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.properties.address}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={dict.properties.addressPlaceholder}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.properties.unitsLabel}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder={dict.properties.unitsPlaceholder}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <Link href="/dashboard/properties" className="px-6 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              {dict.common.cancel}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {dict.common.saving}
                </>
              ) : (
                dict.properties.createAction
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
