import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next")! : "/redefinir-senha";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const supabase = await createClient();
  const result = code ? await supabase.auth.exchangeCodeForSession(code) : tokenHash && type ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "recovery" }) : { error: new Error("Link inválido") };
  if (result.error) return NextResponse.redirect(new URL("/recuperar-senha?erro=link", url));
  return NextResponse.redirect(new URL(next, url));
}
