import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Permissões usadas pela aplicação. O banco continua sendo a fonte de verdade via RLS/RPC. */
export const permissions = [
  "customer.view", "customer.create", "customer.update", "customer.delete",
  "product.view", "product.create", "product.update", "product.delete", "product.view_cost",
  "inventory.view", "inventory.entry", "inventory.adjust", "inventory.transfer",
  "quote.view", "quote.create", "quote.update",
  "sale.view", "sale.create", "sale.cancel",
  "finance.view", "finance.manage", "report.view", "audit.view",
  "user.manage", "settings.manage", "service_order.view", "service_order.create",
  "service_order.update", "service_order.bill", "service_order.refund", "delivery.manage",
  "ecommerce.manage", "cash.manage",
] as const;

export type Permission = (typeof permissions)[number];

export type PermissionContext = { organizationId?: string | null; businessUnitId?: string | null };

/**
 * Aplicar esta verificação antes da mutation; RLS continua a proteger a operação
 * no banco. O id da organização não é aceito do navegador.
 */
export async function can(_context: PermissionContext, permission: Permission): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", { requested: permission });
  return !error && data === true;
}

export async function requirePermission(context: PermissionContext, permission: Permission): Promise<void> {
  if (!(await can(context, permission))) throw new Error("FORBIDDEN");
}
