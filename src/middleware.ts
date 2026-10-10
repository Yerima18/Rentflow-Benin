import { withAuth } from "next-auth/middleware";
import { isDemoMode } from "@/lib/demo";
import { PUBLIC_DEMO_SESSION_SECRET } from "@/lib/demo-user";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || (isDemoMode() ? PUBLIC_DEMO_SESSION_SECRET : undefined),
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
