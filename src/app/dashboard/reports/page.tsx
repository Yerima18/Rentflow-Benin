"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { PieChart, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function ReportsPage() {
  const { dict } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    expensesByCategory: {} as Record<string, number>,
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const [paymentsRes, expensesRes] = await Promise.all([
          fetch("/api/payments"),
          fetch("/api/expenses"),
        ]);

        const payments = await paymentsRes.json();
        const expenses = await expensesRes.json();

        let totalRevenue = 0;
        payments.forEach((p: { status: string; amount: number }) => {
          if (p.status === "PAID") totalRevenue += p.amount;
        });

        let totalExpenses = 0;
        const categoryMap: Record<string, number> = {};

        expenses.forEach((e: { amount: number; category: string }) => {
          totalExpenses += e.amount;
          categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
        });

        setReport({
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          expensesByCategory: categoryMap,
        });
      } catch (error) {
        console.error("Failed to fetch report data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
          <PieChart size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{dict.common.reports || "Financial Reports"}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center space-x-4">
          <div className="bg-emerald-50 p-4 rounded-full text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">All-Time Revenue</p>
            <p className="text-2xl font-bold text-slate-900">{report.totalRevenue.toLocaleString()} FCFA</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 flex items-center space-x-4">
          <div className="bg-rose-50 p-4 rounded-full text-rose-600">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">All-Time Expenses</p>
            <p className="text-2xl font-bold text-slate-900">{report.totalExpenses.toLocaleString()} FCFA</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex items-center space-x-4">
           <div className="bg-indigo-50 p-4 rounded-full text-indigo-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Net Profit</p>
            <p className={`text-2xl font-bold ${report.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {report.netProfit.toLocaleString()} FCFA
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Expenses by Category</h2>
        {Object.keys(report.expensesByCategory).length === 0 ? (
          <p className="text-slate-500">No expenses recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(report.expensesByCategory)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                <span className="font-semibold text-slate-700">{category}</span>
                <span className="font-bold text-rose-600">{amount.toLocaleString()} FCFA</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
