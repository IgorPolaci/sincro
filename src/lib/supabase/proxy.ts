import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/recuperar-senha") || request.nextUrl.pathname.startsWith("/redefinir-senha") || request.nextUrl.pathname.startsWith("/auth/confirm");
  const isPublicRoute = isAuthRoute || request.nextUrl.pathname.startsWith("/loja/") || request.nextUrl.pathname.startsWith("/pedido/") || request.nextUrl.pathname === "/api/health";
  if (!user && !isPublicRoute) return NextResponse.redirect(new URL("/login", request.url));
  if (user && isAuthRoute) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}
