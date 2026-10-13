"use client";

import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function useIsDemoUser() {
  const { data: session } = useSession();
  return Boolean((session?.user as { isDemo?: boolean } | undefined)?.isDemo);
}

export function DemoReadOnlyPanel() {
  const { dict } = useLanguage();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950" role="status">
      <h1 className="text-xl font-bold">{dict.demo.panelTitle}</h1>
      <p className="mt-2">{dict.demo.panelBody}</p>
    </div>
  );
}
