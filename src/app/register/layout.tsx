import Link from "next/link";
import { isDemoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  if (isDemoMode()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <section className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950">
          <h1 className="text-2xl font-bold">Inscription désactivée · Registration disabled</h1>
          <p className="mt-3">La démo publique est en lecture seule. Les comptes des propriétaires restent séparés.</p>
          <p className="mt-2">The public demo is read-only. Normal landlord accounts remain separate.</p>
          <Link href="/login" className="mt-5 inline-block font-semibold text-blue-700 hover:underline">Open the demo login</Link>
        </section>
      </main>
    );
  }

  return children;
}
