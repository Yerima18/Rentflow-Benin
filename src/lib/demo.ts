import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export function isDemoMode() {
  return process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL;
}

export function isDemoSession(session: Session | null) {
  return isDemoMode() || Boolean(
    session?.user && (session.user as Session["user"] & { isDemo?: boolean }).isDemo,
  );
}

export function demoReadOnlyResponse() {
  return NextResponse.json(
    {
      error: "Cette démo est en lecture seule. Modifications désactivées. / This demo is read-only. Changes are disabled.",
      readOnly: true,
    },
    { status: 403 },
  );
}
