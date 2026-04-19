import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - Static files (images, fonts, icons)
     * - Service worker & manifest
     * - /api/* — API routes handle their own auth via getAuthenticatedProfessional(),
     *   so running the session-refresh middleware on them just doubles latency
     *   (extra Supabase Auth HTTP call per request). This was the single biggest
     *   perf hit observed during dev: ~200-400ms added to every fetch from the UI.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|icons/|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
