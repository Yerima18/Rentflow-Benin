"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { User, Lock, Save, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { dict } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    currentPassword: "",
    newPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccessMsg("Profile updated successfully!");
        // Update next-auth session
        await update({ name: form.name, email: form.email });
        setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to update profile");
      }
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{dict.common.settings || "Settings"}</h1>
          <p className="text-slate-500 text-sm">Manage your personal profile and security.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 font-medium text-center">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 font-medium text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <User size={20} className="mr-2 text-indigo-500" />
              Profile Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Lock size={20} className="mr-2 text-indigo-500" />
              Security (Optional)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter to change password"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-70 flex items-center space-x-2"
            >
              {loading ? (
                <span className="animate-pulse">{dict.common.loading || "Saving..."}</span>
              ) : (
                <>
                  <Save size={20} />
                  <span>{dict.common.save || "Save Changes"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
