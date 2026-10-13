"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, MapPin, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";
import { DemoReadOnlyPanel, useIsDemoUser } from "@/components/DemoMode";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function NewTenantPage() {
  const isDemo = useIsDemoUser();
  const { dict } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [error, setError] = useState("");
  const [propertyError, setPropertyError] = useState("");
  const [properties, setProperties] = useState<Array<{ id: string, name: string }>>([]);
  const [leaseStart, setLeaseStart] = useState<Date | null>(new Date());
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    propertyId: "",
    unitNumber: "",
    rentAmount: "",
    dueDate: "",
  });
  const propertyLoadError = dict.tenants.propertyLoadError;

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const response = await fetch('/api/properties');
        if (!response.ok) throw new Error("Properties request failed");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid properties response");
        setProperties(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, propertyId: data[0].id }));
        }
      } catch {
        setPropertyError(propertyLoadError);
      } finally {
        setPropertiesLoading(false);
      }
    };
    void loadProperties();
  }, [propertyLoadError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          leaseStart: leaseStart ? leaseStart.toISOString() : null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/tenants");
        router.refresh();
      } else {
        setError(dict.tenants.createError);
      }
    } catch {
      setError(dict.tenants.createError);
    } finally {
      setLoading(false);
    }
  };

  if (isDemo) return <DemoReadOnlyPanel />;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/tenants" className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{dict.tenants.createTitle}</h1>
          <p className="text-slate-500 mt-1 text-lg">{dict.tenants.createSubtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
          {propertyError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{propertyError}</p>}
          {!propertiesLoading && properties.length === 0 && !propertyError && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{dict.tenants.noProperties}</p>}
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">{dict.tenants.personalInformation}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.tenants.fullName}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={dict.tenants.fullNamePlaceholder}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.tenants.phoneNumber}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder={dict.tenants.phonePlaceholder}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 pt-4">{dict.tenants.leaseDetails}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.tenants.property}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-6 w-6 text-slate-400" />
                  </div>
                  <select
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none appearance-none"
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  >
                    <option value="" disabled>{dict.tenants.selectProperty}</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.tenants.unitNumber}</label>
                <input
                  type="text"
                  required
                  placeholder={dict.tenants.unitPlaceholder}
                  className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.tenants.monthlyRent}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder={dict.tenants.rentPlaceholder}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.tenants.dueDate}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    placeholder={dict.tenants.dueDatePlaceholder}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">{dict.tenants.leaseStartDate}</label>
                <DatePicker
                  selected={leaseStart}
                  onChange={(date) => setLeaseStart(date)}
                  placeholderText={dict.tenants.leaseStartPlaceholder}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <Link href="/dashboard/tenants" className="px-6 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              {dict.common.cancel}
            </Link>
            <button
              type="submit"
              disabled={loading || propertiesLoading || properties.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {dict.common.saving}
                </>
              ) : (
                dict.tenants.registerAction
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
