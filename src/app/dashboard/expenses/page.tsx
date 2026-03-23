"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PlusCircle, Trash2, PieChart } from "lucide-react";

type Expense = {
  id: string;
  amount: number;
  date: string;
  description: string;
  category: string;
  property: { name: string };
};

export default function ExpensesPage() {
  const { dict } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!confirm(dict.common.delete + "?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExpenses(expenses.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="bg-rose-100 p-3 rounded-xl text-rose-600">
            <PieChart size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{dict.common.expenses}</h1>
        </div>
        <Link
          href="/dashboard/expenses/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors flex items-center space-x-2"
        >
          <PlusCircle size={20} />
          <span className="hidden sm:inline">Add Expense</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">{dict.common.loading}</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <PieChart size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No expenses recorded</h3>
            <p className="text-slate-500 mb-6">Track your property maintenance and tax costs here.</p>
            <Link
              href="/dashboard/expenses/new"
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              Add your first expense &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Property</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-600">{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-slate-900">{expense.property.name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{expense.description}</td>
                    <td className="p-4 text-right font-semibold text-rose-600">
                      {expense.amount.toLocaleString()} FCFA
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title={dict.common.delete}
                      >
                        <Trash2 size={18} />
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
