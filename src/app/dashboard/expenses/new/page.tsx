"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ArrowLeft, Save } from "lucide-react";
import DatePicker from "@/components/DatePicker";

export default function NewExpensePage() {
  const router = useRouter();
  const { dict } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [expenseDate, setExpenseDate] = useState<Date | null>(new Date());

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => setProperties(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      propertyId: formData.get("propertyId"),
      category: formData.get("category"),
      description: formData.get("description"),
      amount: formData.get("amount"),
      date: expenseDate ? expenseDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/dashboard/expenses");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add expense");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center space-x-4 mb-8">
        <Link
          href="/dashboard/expenses"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Expense</h1>
          <p className="text-slate-500">Record a maintenance or operational cost</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="propertyId" className="text-sm font-semibold text-slate-700">
                Property
              </label>
              <select
                id="propertyId"
                name="propertyId"
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Utilities">Utilities</option>
                <option value="Taxes">Taxes</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                Description
              </label>
              <input
                id="description"
                name="description"
                type="text"
                required
                placeholder="e.g., Plumbing repair in Unit 3"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-semibold text-slate-700">
                Amount (FCFA)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                required
                min="0"
                step="1"
                placeholder="25000"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Date
              </label>
              <DatePicker
                selected={expenseDate}
                onChange={(date) => setExpenseDate(date)}
                placeholderText="Select expense date"
                required
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <Link
              href="/dashboard/expenses"
              className="px-6 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
            >
              {dict.common.cancel}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-70 flex items-center space-x-2"
            >
              {loading ? (
                <span className="animate-pulse">{dict.common.loading}</span>
              ) : (
                <>
                  <Save size={20} />
                  <span>{dict.common.save}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
