import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export async function rateLimit(scope: string, identifier: string, limit: number, windowSeconds: number) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const key = createHash("sha256").update(`${scope}:${ip}:${identifier.toLowerCase().trim()}`).digest("hex");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  if (error || !data?.[0]) return { allowed: false, retryAfter: windowSeconds };
  return { allowed: Boolean(data[0].allowed), retryAfter: Number(data[0].retry_after) };
}
