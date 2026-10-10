import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Providers } from "@/components/Providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const isDemo = Boolean((session.user as { isDemo?: boolean }).isDemo);

  return (
    <Providers session={session}>
      <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar />
          {isDemo && (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-950" role="status">
              <strong>Démo en lecture seule · Read-only demo.</strong>{" "}
              Données fictives de Cotonou; les modifications sont désactivées. / Fictional Cotonou sample data; changes are disabled.
            </div>
          )}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Providers>
  );
}
