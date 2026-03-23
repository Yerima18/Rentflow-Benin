"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Building, Users, CreditCard, TrendingUp, DollarSign, PlusCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    properties: 0,
    tenants: 0,
    monthlyRevenue: 0,
    collectedThisMonth: 0,
    expensesThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [propsRes, tenantsRes, paymentsRes, expensesRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/tenants'),
          fetch('/api/payments'),
          fetch('/api/expenses')
        ]);
        
        const properties = await propsRes.json();
        const tenants = await tenantsRes.json();
        const payments = await paymentsRes.json();
        const expenses = await expensesRes.json();

        const currentMonth = new Date().toISOString().slice(0, 7);
        const collected = payments
          .filter((p: { month: string, status: string, amount: number }) => p.month === currentMonth && p.status === 'PAID')
          .reduce((acc: number, p: { amount: number }) => acc + p.amount, 0);

        const expected = tenants.reduce((acc: number, t: { rentAmount: number }) => acc + t.rentAmount, 0);

        const expensesThisMonth = expenses
          .filter((e: { date: string, amount: number }) => e.date.startsWith(currentMonth))
          .reduce((acc: number, e: { amount: number }) => acc + e.amount, 0);

        setStats({
          properties: properties?.length || 0,
          tenants: tenants?.length || 0,
          monthlyRevenue: expected || 0,
          collectedThisMonth: collected || 0,
          expensesThisMonth: expensesThisMonth || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    { name: "Total Properties", value: stats.properties, icon: Building, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
    { name: "Total Tenants", value: stats.tenants, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { name: "Expected Revenue", value: `${stats.monthlyRevenue.toLocaleString()} FCFA`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    { name: "Collected This Month", value: `${stats.collectedThisMonth.toLocaleString()} FCFA`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bonjour, {session?.user?.name || 'Landlord'}! 👋</h1>
          <p className="text-slate-500 mt-2 text-lg">Here is a summary of your properties and rentals today.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link href="/dashboard/properties/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-semibold shadow-md shadow-indigo-200 transition-all flex items-center space-x-2">
            <PlusCircle size={20} />
            <span>New Property</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`bg-white rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow duration-300 border ${card.border} flex items-center space-x-5 relative overflow-hidden group`}>
              <div className={`p-4 rounded-2xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={28} strokeWidth={2} />
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.name}</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 drop-shadow-sm">{card.value}</h3>
              </div>
              <div className={`absolute -right-6 -bottom-6 opacity-5 ${card.color}`}>
                <Icon size={120} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
             <h2 className="text-xl font-bold text-slate-900 flex items-center"><TrendingUp className="mr-2 text-indigo-500" /> Revenue Overview</h2>
             <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">This Month</span>
          </div>
          <div className="p-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-medium text-slate-500">Collected Revenue</p>
                <p className="text-2xl font-bold text-slate-900">{stats.collectedThisMonth.toLocaleString()} FCFA</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-500">Total Expenses</p>
                <p className="text-2xl font-bold text-rose-600">{stats.expensesThisMonth.toLocaleString()} FCFA</p>
              </div>
            </div>
            
            {/* Simple bar chart representing net vs expense */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex mt-6">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000" 
                style={{ width: `${Math.max(0, 100 - (stats.expensesThisMonth / Math.max(stats.collectedThisMonth, 1)) * 100)}%` }}
              ></div>
              <div 
                className="h-full bg-rose-500 transition-all duration-1000" 
                style={{ width: `${Math.min(100, (stats.expensesThisMonth / Math.max(stats.collectedThisMonth, 1)) * 100)}%` }}
              ></div>
            </div>
            
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-100">
              <span className="font-semibold text-slate-700">Net Profit</span>
              <span className={`text-xl font-black ${stats.collectedThisMonth >= stats.expensesThisMonth ? 'text-emerald-600' : 'text-rose-600'}`}>
                {(stats.collectedThisMonth - stats.expensesThisMonth).toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <Link href="/dashboard/properties/new" className="w-full text-left p-5 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm transition-all group flex justify-between items-center bg-white">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Building size={20} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-indigo-900 text-lg">Add New Property</span>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={20} />
            </Link>
            
            <Link href="/dashboard/tenants/new" className="w-full text-left p-5 rounded-2xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm transition-all group flex justify-between items-center bg-white">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users size={20} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-emerald-900 text-lg">Register Tenant</span>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" size={20} />
            </Link>

            <Link href="/dashboard/payments" className="w-full text-left p-5 rounded-2xl border border-slate-100 hover:border-violet-300 hover:bg-violet-50 hover:shadow-sm transition-all group flex justify-between items-center bg-white">
              <div className="flex items-center space-x-4">
                <div className="bg-violet-100 p-3 rounded-xl text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <CreditCard size={20} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-violet-900 text-lg">Record Payment</span>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-violet-600 transition-colors" size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
