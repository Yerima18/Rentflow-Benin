"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, MapPin, DollarSign, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/DatePicker";

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, propertyId: data[0].id }));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
        alert("Failed to register tenant.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/tenants" className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Register New Tenant</h1>
          <p className="text-slate-500 mt-1 text-lg">Enter the tenant and lease details below.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Koffi Aballo"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +229 97 00 11 22"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 pt-4">Lease Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Property</label>
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
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Unit Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. A1 or Villa 2"
                  className="block w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Monthly Rent (FCFA)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 150000"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Due Date (Day of Month)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-6 w-6 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    placeholder="e.g. 5"
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Lease Start Date</label>
                <DatePicker
                  selected={leaseStart}
                  onChange={(date) => setLeaseStart(date)}
                  placeholderText="Select lease start date"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <Link href="/dashboard/tenants" className="px-6 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || properties.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md shadow-emerald-200 transition-all disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Saving...
                </>
              ) : (
                "Register Tenant"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
