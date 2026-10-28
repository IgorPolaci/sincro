"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { publicOrderSchema, transitionOrderSchema } from "@/lib/validations/delivery";
import { rateLimit } from "@/lib/rate-limit";

export type PublicOrderResult = {
  error?: string;
  code?:
    "STORE_CLOSED" | "UNAVAILABLE" | "OUT_OF_STOCK" | "MINIMUM_ORDER" | "INVALID_COUPON" | "INVALID_CHANGE" | "UNKNOWN";
  order?: { number: string; public_code: string; total: number };
};
export type OrderActionState = { error?: string; success?: string };

export async function createPublicOrder(input: unknown): Promise<PublicOrderResult> {
  const parsed = publicOrderSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revise o pedido." };
  const limit = await rateLimit("public-checkout", `${parsed.data.slug}:${parsed.data.customerPhone}`, 8, 900);
  if (!limit.allowed) return { error: `Muitas tentativas. Aguarde ${limit.retryAfter} segundos.` };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_order", {
    p_slug: parsed.data.slug,
    p_customer_name: parsed.data.customerName,
    p_customer_phone: parsed.data.customerPhone,
    p_fulfillment: parsed.data.fulfillment,
    p_delivery_zone_id: parsed.data.deliveryZoneId,
    p_address: parsed.data.address,
    p_payment_method: parsed.data.paymentMethod,
    p_cash_change_for: parsed.data.cashChangeFor,
    p_coupon_code: parsed.data.couponCode || null,
    p_items: parsed.data.items,
    p_notes: parsed.data.notes || null,
  });
  if (error) {
    const mapped = mapPublicOrderError(error.message);
    return { error: mapped.error, code: mapped.code };
  }
  const order = data as { number: string; public_code: string; total: number };
  return { order };
}

export async function transitionOrder(_: OrderActionState, formData: FormData): Promise<OrderActionState> {
  const parsed = transitionOrderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { current } = await getBusinessUnitContext();
  if (current?.type !== "STORE_DELIVERY") return { error: "Selecione a unidade Loja e Delivery." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_online_order", {
    p_order_id: parsed.data.orderId,
    p_status: parsed.data.status,
    p_notes: parsed.data.notes || null,
    p_cash_session_id: parsed.data.cashSessionId,
  });
  if (error) return { error: mapOrderError(error.message) };
  revalidatePath("/pedidos");
  revalidatePath("/estoque");
  revalidatePath("/financeiro/fluxo-de-caixa");
  revalidatePath("/dashboard");
  return { success: "Status atualizado." };
}

function mapOrderError(message: string) {
  for (const known of [
    "Loja fechada",
    "Modalidade indisponível",
    "Estoque insuficiente",
    "Pedido abaixo do valor mínimo",
    "Cupom inválido",
    "Troco inválido",
    "Transição de status inválida",
    "Abra o caixa",
  ])
    if (message.includes(known)) return message;
  return "Não foi possível processar o pedido.";
}
function mapPublicOrderError(message: string): Pick<PublicOrderResult, "error" | "code"> {
  if (message.includes("Loja fechada"))
    return { error: "Loja fechada. Tente novamente no próximo horário de funcionamento.", code: "STORE_CLOSED" };
  if (message.includes("Modalidade indisponível")) return { error: message, code: "UNAVAILABLE" };
  if (message.includes("Estoque insuficiente")) return { error: message, code: "OUT_OF_STOCK" };
  if (message.includes("Pedido abaixo")) return { error: message, code: "MINIMUM_ORDER" };
  if (message.includes("Cupom inválido")) return { error: message, code: "INVALID_COUPON" };
  if (message.includes("Troco inválido")) return { error: message, code: "INVALID_CHANGE" };
  return { error: "Não foi possível processar o pedido.", code: "UNKNOWN" };
}
