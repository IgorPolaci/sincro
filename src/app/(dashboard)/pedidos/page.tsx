import Link from "next/link";
import { Columns3, ExternalLink, ListChecks, Settings } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusForm } from "@/features/delivery/order-status-form";
import { OrderHistory, type OrderHistoryFilters, type OrderHistoryRow } from "@/features/delivery/order-history";
import { NewOrderNotifier } from "@/features/delivery/new-order-notifier";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency, formatDate } from "@/lib/utils";

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number | string;
  online_order_item_options: { id: string; group_name: string; option_name: string; price_delta: number | string }[];
};
type KanbanOrder = {
  id: string;
  number: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  fulfillment: string;
  status: string;
  total: number | string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  online_order_items: OrderItem[];
};

const columns = ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];
const labels: Record<string, string> = {
  NEW: "Novos",
  CONFIRMED: "Confirmados",
  PREPARING: "Em preparação",
  READY: "Prontos",
  OUT_FOR_DELIVERY: "Em entrega",
  DELIVERED: "Entregues",
};
const activeStatuses = ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
const historySchema = z
  .object({
    visualizacao: z.enum(["funil", "historico"]).catch("funil"),
    q: z
      .string()
      .trim()
      .max(80)
      .regex(/^[\p{L}\p{N}\s.@+_-]*$/u)
      .catch(""),
    status: z
      .enum(["ALL", "NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"])
      .catch("ALL"),
    from: z.union([z.iso.date(), z.literal("")]).catch(""),
    to: z.union([z.iso.date(), z.literal("")]).catch(""),
    page: z.coerce.number().int().positive().max(10000).catch(1),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, { path: ["to"] });

export const metadata = { title: "Pedidos" };
const pageSize = 20;

export default async function OrdersPage({ searchParams }: PageProps<"/pedidos">) {
  const raw = await searchParams;
  const parsed = historySchema.safeParse({
    visualizacao: first(raw.visualizacao) ?? "funil",
    q: first(raw.q) ?? "",
    status: first(raw.status) ?? "ALL",
    from: first(raw.from) ?? "",
    to: first(raw.to) ?? "",
    page: first(raw.page) ?? "1",
  });
  const filters: OrderHistoryFilters & { visualizacao: "funil" | "historico" } = parsed.success
    ? parsed.data
    : { visualizacao: "funil", q: "", status: "ALL", from: "", to: "", page: 1 };
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  const unitId = current?.id ?? "00000000-0000-0000-0000-000000000000";
  const { data: organization } = await supabase.from("organizations").select("catalog_slug").maybeSingle();
  const slug = organization?.catalog_slug;

  return (
    <>
      <PageHeader
        title="Gestão de pedidos"
        description={`${filters.visualizacao === "funil" ? "Funil operacional" : "Consulta e histórico de vendas"} · ${current?.name ?? "unidade não selecionada"}.`}
        action={
          <div className="flex gap-2">
            {current?.type === "STORE_DELIVERY" && <NewOrderNotifier businessUnitId={unitId} />}
            <Link
              href="/delivery/configuracoes"
              className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold"
            >
              <Settings className="h-4 w-4" />
              Configurar
            </Link>
            {slug && (
              <Link
                href={`/loja/${slug}`}
                target="_blank"
                className="bg-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir loja
              </Link>
            )}
          </div>
        }
      />
      {current?.type !== "STORE_DELIVERY" ? (
        <Card>
          <EmptyState title="Segmento incorreto" description="Selecione Loja e Delivery para gerenciar pedidos." />
        </Card>
      ) : (
        <>
          <nav aria-label="Visualização dos pedidos" className="mb-5 flex gap-2 border-b">
            <ViewLink href="/pedidos" active={filters.visualizacao === "funil"} icon={<Columns3 className="h-4 w-4" />}>
              Funil operacional
            </ViewLink>
            <ViewLink
              href="/pedidos?visualizacao=historico"
              active={filters.visualizacao === "historico"}
              icon={<ListChecks className="h-4 w-4" />}
            >
              Histórico de pedidos
            </ViewLink>
          </nav>
          {filters.visualizacao === "historico" ? (
            <HistoryView unitId={unitId} filters={filters} />
          ) : (
            <KanbanView unitId={unitId} />
          )}
        </>
      )}
    </>
  );
}

async function KanbanView({ unitId }: { unitId: string }) {
  const supabase = await createClient();
  const [{ data: orders }, { data: sessions }] = await Promise.all([
    supabase
      .from("online_orders")
      .select(
        "id,number,public_code,customer_name,customer_phone,fulfillment,status,total,payment_method,notes,created_at,online_order_items(id,product_name,quantity,online_order_item_options(id,group_name,option_name,price_delta))",
      )
      .eq("business_unit_id", unitId)
      .neq("status", "CANCELLED")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("cash_sessions").select("id").eq("business_unit_id", unitId).eq("status", "OPEN").limit(1),
  ]);
  const rows = (orders ?? []) as KanbanOrder[];
  return (
    <div
      className="grid gap-4 overflow-x-auto pb-4"
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))` }}
    >
      {columns.map((status) => (
        <section key={status} className="min-h-72 rounded-xl bg-slate-100 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{labels[status]}</h2>
            <Badge>{rows.filter((order) => order.status === status).length}</Badge>
          </div>
          <div className="space-y-3">
            {rows
              .filter((order) => order.status === status)
              .map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">#{order.number}</p>
                      <p className="text-muted text-xs">
                        {order.customer_name} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <strong className="text-sm">{formatCurrency(order.total)}</strong>
                  </div>
                  <p className="text-muted mt-2 text-xs">
                    {order.fulfillment} · {order.payment_method} · {order.customer_phone}
                  </p>
                  <ul className="mt-3 space-y-2 text-xs">
                    {order.online_order_items.map((item) => (
                      <li key={item.id}>
                        <span>
                          {Number(item.quantity)}× {item.product_name}
                        </span>
                        {item.online_order_item_options.length > 0 && (
                          <span className="text-muted block pl-3">
                            {item.online_order_item_options
                              .map((option) => `${option.group_name}: ${option.option_name}`)
                              .join(" · ")}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {order.notes && <p className="mt-2 rounded bg-amber-50 p-2 text-xs">{order.notes}</p>}
                  <OrderStatusForm orderId={order.id} status={order.status} cashSessionId={sessions?.[0]?.id ?? null} />
                </Card>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

async function HistoryView({ unitId, filters }: { unitId: string; filters: OrderHistoryFilters }) {
  const supabase = await createClient();
  const select =
    "id,number,public_code,customer_id,customer_name,customer_phone,fulfillment,status,total,payment_method,created_at,delivered_at,cancelled_at,cancellation_reason,online_order_items(id,product_name,quantity)";
  let rowsQuery = supabase
    .from("online_orders")
    .select(select, { count: "exact" })
    .eq("business_unit_id", unitId)
    .order("created_at", { ascending: false });
  let deliveredQuery = supabase
    .from("online_orders")
    .select("*", { count: "exact", head: true })
    .eq("business_unit_id", unitId)
    .eq("status", "DELIVERED");
  let activeQuery = supabase
    .from("online_orders")
    .select("*", { count: "exact", head: true })
    .eq("business_unit_id", unitId)
    .in("status", activeStatuses);
  let cancelledQuery = supabase
    .from("online_orders")
    .select("*", { count: "exact", head: true })
    .eq("business_unit_id", unitId)
    .eq("status", "CANCELLED");

  if (filters.q) {
    const expression = `number.ilike.%${filters.q}%,customer_name.ilike.%${filters.q}%,customer_phone.ilike.%${filters.q}%`;
    rowsQuery = rowsQuery.or(expression);
    deliveredQuery = deliveredQuery.or(expression);
    activeQuery = activeQuery.or(expression);
    cancelledQuery = cancelledQuery.or(expression);
  }
  if (filters.from) {
    const value = `${filters.from}T00:00:00.000Z`;
    rowsQuery = rowsQuery.gte("created_at", value);
    deliveredQuery = deliveredQuery.gte("created_at", value);
    activeQuery = activeQuery.gte("created_at", value);
    cancelledQuery = cancelledQuery.gte("created_at", value);
  }
  if (filters.to) {
    const value = `${filters.to}T23:59:59.999Z`;
    rowsQuery = rowsQuery.lte("created_at", value);
    deliveredQuery = deliveredQuery.lte("created_at", value);
    activeQuery = activeQuery.lte("created_at", value);
    cancelledQuery = cancelledQuery.lte("created_at", value);
  }
  if (filters.status !== "ALL") rowsQuery = rowsQuery.eq("status", filters.status);
  const offset = (filters.page - 1) * pageSize;
  rowsQuery = rowsQuery.range(offset, offset + pageSize - 1);

  const [rowsResult, deliveredResult, activeResult, cancelledResult] = await Promise.all([
    rowsQuery,
    deliveredQuery,
    activeQuery,
    cancelledQuery,
  ]);
  return (
    <OrderHistory
      rows={(rowsResult.data ?? []) as unknown as OrderHistoryRow[]}
      filters={filters}
      total={rowsResult.count ?? 0}
      counts={{
        delivered: deliveredResult.count ?? 0,
        active: activeResult.count ?? 0,
        cancelled: cancelledResult.count ?? 0,
      }}
      pageSize={pageSize}
    />
  );
}

function ViewLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${active ? "border-primary text-primary" : "text-muted border-transparent hover:border-slate-300 hover:text-slate-700"}`}
    >
      {icon}
      {children}
    </Link>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
