import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type BusinessUnit = {
  id: string;
  name: string;
  code: string;
  type: "TECHNICAL_ASSISTANCE" | "STORE_DELIVERY";
};

export const getBusinessUnitContext = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_units")
    .select("id,name,code,type")
    .eq("active", true)
    .order("type");

  if (error) throw new Error("Não foi possível carregar as unidades operacionais.");

  const units = (data ?? []) as BusinessUnit[];
  const selectedId = (await cookies()).get("sincro_business_unit")?.value;
  const selected = units.find((unit) => unit.id === selectedId) ?? null;
  const current = selected ?? units[0] ?? null;

  return { units, current, hasSelection: Boolean(selected) };
});
