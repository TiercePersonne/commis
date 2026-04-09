import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars");
  }

  return { url, anonKey };
}

export async function middleware(request: NextRequest) {
  const { url, anonKey } = getEnv();

  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options: Partial<ResponseCookie> & { expires?: string | Date | number } }>,
      ) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          const { expires, ...rest } = options;
          response.cookies.set(name, value, {
            ...rest,
            ...(expires
              ? { expires: typeof expires === "string" ? new Date(expires) : expires }
              : {}),
          });
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/forgot-password" || 
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next");

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = next && next.startsWith("/") ? next : "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
