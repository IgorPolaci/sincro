"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const selectionSchema = z.object({ businessUnitId: z.uuid(), returnTo:z.enum(["/dashboard"]).optional() });

export async function selectBusinessUnit(formData: FormData) {
  const parsed = selectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("business_units")
    .select("id")
    .eq("id", parsed.data.businessUnitId)
    .eq("active", true)
    .maybeSingle();

  if (!data) return;

  (await cookies()).set("sincro_business_unit", data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  if(parsed.data.returnTo)redirect(parsed.data.returnTo);
}
