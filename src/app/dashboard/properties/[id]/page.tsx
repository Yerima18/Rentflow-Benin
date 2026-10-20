import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building, Users, Wallet } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { isDemoMode, isDemoSession } from "@/lib/demo";
import { getDemoProperty } from "@/lib/demo-data";
import prisma from "@/lib/prisma";

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const property = isDemoMode() || isDemoSession(session)
    ? getDemoProperty(id)
    : await prisma.property.findFirst({
        where: { id, landlordId: (session.user as { id: string }).id },
        include: { tenants: true, expenses: true },
      });

  if (!property) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/dashboard/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline">
        <ArrowLeft size={18} /> Back to properties
      </Link>
      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-700"><Building size={28} /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Property details · Détails du bien</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{property.name}</h1>
            <p className="mt-2 text-slate-600">{property.address}</p>
            <p className="mt-1 text-sm text-slate-500">{property.units} units · {"tenants" in property ? property.tenants.length : 0} tenant(s)</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900"><Users size={20} /> Tenants · Locataires</h2>
        <div className="divide-y divide-slate-100">
          {("tenants" in property ? property.tenants : []).map((tenant) => (
            <div key={tenant.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div><p className="font-semibold text-slate-900">{tenant.fullName}</p><p className="text-sm text-slate-500">Unit {tenant.unitNumber} · Due day {tenant.dueDate}</p></div>
              <p className="font-bold text-indigo-700">{tenant.rentAmount.toLocaleString("fr-FR")} FCFA / month</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900"><Wallet size={20} /> Expenses · Dépenses</h2>
        {("expenses" in property ? property.expenses : []).length ? ("expenses" in property ? property.expenses : []).map((expense) => (
          <div key={expense.id} className="flex justify-between gap-3 border-t border-slate-100 py-4">
            <p className="text-slate-700">{expense.description} <span className="text-sm text-slate-500">({expense.category})</span></p>
            <strong className="whitespace-nowrap text-rose-700">{expense.amount.toLocaleString("fr-FR")} FCFA</strong>
          </div>
        )) : <p className="text-slate-500">No expenses recorded · Aucune dépense enregistrée</p>}
      </section>
    </div>
  );
}
