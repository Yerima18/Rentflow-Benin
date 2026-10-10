"use client";

import { useSession } from "next-auth/react";

export function useIsDemoUser() {
  const { data: session } = useSession();
  return Boolean((session?.user as { isDemo?: boolean } | undefined)?.isDemo);
}

export function DemoReadOnlyPanel() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950" role="status">
      <h1 className="text-xl font-bold">Démo en lecture seule · Read-only demo</h1>
      <p className="mt-2">Les données sont fictives. Les modifications sont désactivées.</p>
      <p className="mt-1">All records are fictional. Changes are disabled in this public demo.</p>
    </div>
  );
}
