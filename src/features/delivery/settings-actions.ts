"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import {
  couponSchema,
  deliverySettingsSchema,
  deliveryZoneSchema,
  openingHoursSchema,
  storeClosureSchema,
} from "@/lib/validations/delivery";

export type DeliverySettingsState = { error?: string; success?: string };

async function context() {
  const { current } = await getBusinessUnitContext();
  if (current?.type !== "STORE_DELIVERY") return null;
  const supabase = await createClient();
  const { data } = await supabase.from("business_units").select("organization_id").eq("id", current.id).single();
  return data ? { supabase, current, organizationId: data.organization_id } : null;
}

export async function updateDeliverySettings(
  _: DeliverySettingsState,
  formData: FormData,
): Promise<DeliverySettingsState> {
  const parsed = deliverySettingsSchema.safeParse({
    storeName: formData.get("storeName"),
    minimumOrder: formData.get("minimumOrder"),
    whatsapp: formData.get("whatsapp"),
    openingHours: formData.get("openingHours"),
    isOpen: formData.get("isOpen") === "on",
    deliveryEnabled: formData.get("deliveryEnabled") === "on",
    pickupEnabled: formData.get("pickupEnabled") === "on",
    localEnabled: formData.get("localEnabled") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja e Delivery." };
  const { error } = await ctx.supabase
    .from("delivery_settings")
    .update({
      store_name: parsed.data.storeName,
      minimum_order: parsed.data.minimumOrder,
      whatsapp: parsed.data.whatsapp || null,
      opening_hours: parsed.data.openingHours || null,
      is_open: parsed.data.isOpen,
      delivery_enabled: parsed.data.deliveryEnabled,
      pickup_enabled: parsed.data.pickupEnabled,
      local_enabled: parsed.data.localEnabled,
    })
    .eq("business_unit_id", ctx.current.id);
  if (error) return { error: "Não foi possível salvar a loja." };
  revalidatePath("/delivery/configuracoes");
  return { success: "Configurações salvas." };
}

export async function createDeliveryZone(_: DeliverySettingsState, formData: FormData): Promise<DeliverySettingsState> {
  const parsed = deliveryZoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja e Delivery." };
  const { error } = await ctx.supabase
    .from("delivery_zones")
    .insert({
      organization_id: ctx.organizationId,
      business_unit_id: ctx.current.id,
      name: parsed.data.name,
      neighborhood: parsed.data.neighborhood,
      fee: parsed.data.fee,
      minimum_order: parsed.data.minimumOrder,
    });
  if (error)
    return { error: error.code === "23505" ? "Este bairro já foi cadastrado." : "Não foi possível criar a área." };
  revalidatePath("/delivery/configuracoes");
  return { success: "Área de entrega criada." };
}

export async function createCoupon(_: DeliverySettingsState, formData: FormData): Promise<DeliverySettingsState> {
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja e Delivery." };
  const { error } = await ctx.supabase
    .from("coupons")
    .insert({
      organization_id: ctx.organizationId,
      business_unit_id: ctx.current.id,
      code: parsed.data.code,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      minimum_order: parsed.data.minimumOrder,
      usage_limit: parsed.data.usageLimit,
    });
  if (error) return { error: error.code === "23505" ? "Este cupom já existe." : "Não foi possível criar o cupom." };
  revalidatePath("/delivery/configuracoes");
  return { success: "Cupom criado." };
}

export async function updateOpeningHours(_: DeliverySettingsState, formData: FormData): Promise<DeliverySettingsState> {
  const days = Array.from({ length: 7 }, (_, day) => ({
    dayOfWeek: day,
    openingTime: String(formData.get(`day${day}Open`) ?? ""),
    closingTime: String(formData.get(`day${day}Close`) ?? ""),
    closedAllDay: formData.get(`day${day}Closed`) === "on",
  }));
  const parsed = openingHoursSchema.safeParse({ days });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja e Delivery." };
  const rows = parsed.data.days.map((day) => ({
    organization_id: ctx.organizationId,
    business_unit_id: ctx.current.id,
    day_of_week: day.dayOfWeek,
    opening_time: day.closedAllDay ? null : day.openingTime,
    closing_time: day.closedAllDay ? null : day.closingTime,
    closed_all_day: day.closedAllDay,
  }));
  const { error } = await ctx.supabase
    .from("store_opening_hours")
    .upsert(rows, { onConflict: "organization_id,business_unit_id,day_of_week" });
  if (error) return { error: "Não foi possível salvar os horários." };
  revalidatePath("/delivery/configuracoes");
  return { success: "Horários atualizados." };
}
export async function createStoreClosure(_: DeliverySettingsState, formData: FormData): Promise<DeliverySettingsState> {
  const parsed = storeClosureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja e Delivery." };
  const { error } = await ctx.supabase
    .from("store_closures")
    .upsert(
      {
        organization_id: ctx.organizationId,
        business_unit_id: ctx.current.id,
        closure_date: parsed.data.closureDate,
        reason: parsed.data.reason || null,
        active: true,
      },
      { onConflict: "organization_id,business_unit_id,closure_date" },
    );
  if (error) return { error: "Não foi possível cadastrar o fechamento." };
  revalidatePath("/delivery/configuracoes");
  return { success: "Fechamento cadastrado." };
}
