import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building, Users, CreditCard } from "lucide-react";
import { cookies } from "next/headers";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  const cookieStore = await cookies();
  const locale = (cookieStore.get("NEXT_LOCALE")?.value as "en" | "fr") || "fr";
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Building size={20} />
          </div>
          <span className="text-xl font-bold text-gray-900">RentFlow</span>
        </div>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            {dict.common.login}
          </Link>
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors">
            {dict.common.signUp}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <span className="inline-block bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-blue-100">
          {dict.landing.badge}
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          {dict.landing.title1}<br />
          <span className="text-blue-600">{dict.landing.title2}</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          {dict.landing.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all">
            {dict.landing.getStarted}
          </Link>
          <Link href="/login" className="w-full sm:w-auto border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg transition-all">
            {dict.common.signIn}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">{dict.landing.featuresTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 w-fit mb-5">
                <Building size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{dict.landing.feature1Title}</h3>
              <p className="text-gray-500">{dict.landing.feature1Desc}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 w-fit mb-5">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{dict.landing.feature2Title}</h3>
              <p className="text-gray-500">{dict.landing.feature2Desc}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="bg-violet-50 p-3 rounded-xl text-violet-600 w-fit mb-5">
                <CreditCard size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{dict.landing.feature3Title}</h3>
              <p className="text-gray-500">{dict.landing.feature3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Simple pricing</h2>
          <p className="text-gray-500 mb-10">No credit card required. Free while in beta.</p>
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-10 shadow-xl">
            <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Starter</span>
            <div className="text-5xl font-extrabold text-gray-900 mb-2">Free</div>
            <p className="text-gray-500 mb-8">During beta — all features included</p>
            <ul className="text-left space-y-3 mb-10 text-gray-700">
              {["Unlimited properties", "Unlimited tenants", "Payment tracking", "Multi-user (coming soon)"].map((f) => (
                <li key={f} className="flex items-center space-x-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} RentFlow. Built for landlords in Benin.
      </footer>
    </div>
  );
}
