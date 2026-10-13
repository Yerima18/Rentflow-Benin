import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building, Users, Wallet } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { isDemoMode, isDemoSession } from "@/lib/demo";
import { getDemoProperty } from "@/lib/demo-data";
import prisma from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/formatMessage";
import { formatXof } from "@/lib/money";

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "fr";
  const dict = await getDictionary(locale);
  const { id } = await params;
  const property = isDemoMode() || isDemoSession(session)
    ? getDemoProperty(id)
    : await prisma.property.findFirst({
        where: { id, landlordId: (session.user as { id: string }).id },
        include: { tenants: true, expenses: true },
      });

  if (!property) {
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{dict.properties.notFoundTitle}</h1>
        <p className="mt-3 text-slate-600">{dict.properties.notFoundDescription}</p>
        <Link href="/dashboard/properties" className="mt-6 inline-flex font-semibold text-indigo-700 hover:underline">
          {dict.properties.back}
        </Link>
      </section>
    );
  }

  const tenants = "tenants" in property ? property.tenants : [];
  const expenses = "expenses" in property ? property.expenses : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/dashboard/properties" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline">
        <ArrowLeft size={18} /> {dict.properties.back}
      </Link>
      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-700"><Building size={28} /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">{dict.properties.details}</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">{property.name}</h1>
            <p className="mt-2 text-slate-600">{property.address}</p>
            <p className="mt-1 text-sm text-slate-500">{formatMessage(dict.properties.unitAndTenantCount, { units: property.units, tenants: "tenants" in property ? property.tenants.length : 0 })}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900"><Users size={20} /> {dict.properties.tenantSection}</h2>
        <div className="divide-y divide-slate-100">
          {tenants.length ? tenants.map((tenant) => (
            <div key={tenant.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold text-slate-900">{tenant.fullName}</p>
                <p className="text-sm text-slate-500">{formatMessage(dict.properties.unitLabel, { unit: tenant.unitNumber })} · {formatMessage(dict.properties.dueDay, { day: tenant.dueDate })}</p>
              </div>
              <p className="font-bold text-indigo-700">{formatMessage(dict.properties.rentPerMonth, { amount: formatXof(tenant.rentAmount, locale) })}</p>
            </div>
          )) : <p className="py-4 text-slate-500">{dict.properties.emptyTenants}</p>}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900"><Wallet size={20} /> {dict.properties.expensesSection}</h2>
        {expenses.length ? expenses.map((expense) => (
          <div key={expense.id} className="flex justify-between gap-3 border-t border-slate-100 py-4">
            <p className="text-slate-700">{expense.description} <span className="text-sm text-slate-500">({dict.expenseCategories[expense.category as keyof typeof dict.expenseCategories] || expense.category})</span></p>
            <strong className="whitespace-nowrap text-rose-700">{formatXof(expense.amount, locale)}</strong>
          </div>
        )) : <p className="text-slate-500">{dict.properties.emptyExpenses}</p>}
      </section>
    </div>
  );
}
