import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─── Fast path: pure-static public endpoints ───
  // These don't touch the session, so skip the Supabase auth round-trip.
  // The landing page `/` is NOT included here because it redirects logged-in
  // users to the dashboard from the client. /manifest.json and /sw.js are
  // part of the PWA shell and must be served instantly without any network.
  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─── Public routes: landing page, auth pages, manifest, sw ───
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname === "/recuperar-senha" ||
    pathname.startsWith("/auth/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js";

  // ─── Protected routes: redirect to login if not authenticated ───
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ─── Redirect authenticated users away from auth pages ───
  if (user && (pathname === "/login" || pathname === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ─── Onboarding redirect: only check on first dashboard access ───
  const onboardingChecked = request.cookies.get("onboarding_completed")?.value;

  if (
    user &&
    pathname.startsWith("/dashboard") &&
    pathname !== "/onboarding" &&
    onboardingChecked !== "true"
  ) {
    const { data: professional } = await supabase
      .from("professionals")
      .select("onboarding_completed")
      .eq("auth_user_id", user.id)
      .single();

    if (!professional) {
      await supabase.from("professionals").insert({
        auth_user_id: user.id,
        name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Profissional",
        email: user.email ?? "",
        onboarding_completed: false,
      });
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (professional.onboarding_completed === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Cache the result so we don't query again on every navigation
    response.cookies.set("onboarding_completed", "true", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h
    });
  }

  // ─── Redirect from onboarding if already completed ───
  if (user && pathname === "/onboarding") {
    if (onboardingChecked === "true") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    const { data: professional } = await supabase
      .from("professionals")
      .select("onboarding_completed")
      .eq("auth_user_id", user.id)
      .single();

    if (professional?.onboarding_completed === true) {
      response.cookies.set("onboarding_completed", "true", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
