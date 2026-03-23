"use client";

import { useState } from "react";
import { ArrowLeft, Home, MapPin, Hash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
        alert("Failed to create property.");
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
        <Link href="/dashboard/properties" className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Property</h1>
          <p className="text-slate-500 mt-1 text-lg">Enter the details of the new property below.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Property Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Home className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Résidence Les Cocotiers"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quartier Haie Vive, Cotonou"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold tracking-wide text-slate-700 uppercase mb-3">Total Units (Rooms/Apartments)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-6 w-6 text-slate-400" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 10"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all outline-none"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <Link href="/dashboard/properties" className="px-6 py-4 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Saving...
                </>
              ) : (
                "Create Property"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
