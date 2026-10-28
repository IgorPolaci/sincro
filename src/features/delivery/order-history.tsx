import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export type OrderHistoryRow = {
  id: string;
  number: string;
  public_code: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  fulfillment: string;
  status: string;
  total: number | string;
  payment_method: string;
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  online_order_items: { id: string; product_name: string; quantity: number | string }[];
};

export type OrderHistoryFilters = {
  q: string;
  status: string;
  from: string;
  to: string;
  page: number;
};

export function OrderHistory({
  rows,
  filters,
  total,
  counts,
  pageSize,
}: {
  rows: OrderHistoryRow[];
  filters: OrderHistoryFilters;
  total: number;
  counts: { delivered: number; active: number; cancelled: number };
  pageSize: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pedidos encontrados" value={String(total)} />
        <Metric label="Em andamento" value={String(counts.active)} tone="warning" />
        <Metric label="Entregues" value={String(counts.delivered)} tone="success" />
        <Metric label="Cancelados" value={String(counts.cancelled)} tone="danger" />
      </section>

      <Card className="p-4">
        <form className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_160px_160px_auto] lg:items-end">
          <input type="hidden" name="visualizacao" value="historico" />
          <label className="text-sm font-medium">
            Buscar
            <span className="relative mt-2 block">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                name="q"
                defaultValue={filters.q}
                maxLength={80}
                placeholder="Cliente, pedido ou telefone"
                className="focus:border-primary focus:ring-primary/15 h-10 w-full rounded-lg border bg-white pr-3 pl-9 text-sm outline-none focus:ring-2"
              />
            </span>
          </label>
          <label className="text-sm font-medium">
            Status
            <select
              name="status"
              defaultValue={filters.status}
              className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="NEW">Novo</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="PREPARING">Em preparação</option>
              <option value="READY">Pronto</option>
              <option value="OUT_FOR_DELIVERY">Em entrega</option>
              <option value="DELIVERED">Entregue</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            De
            <input
              name="from"
              type="date"
              defaultValue={filters.from}
              className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-sm"
            />
          </label>
          <label className="text-sm font-medium">
            Até
            <input
              name="to"
              type="date"
              defaultValue={filters.to}
              className="mt-2 h-10 w-full rounded-lg border bg-white px-3 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button className="bg-primary h-10 rounded-lg px-4 text-sm font-semibold text-white">Filtrar</button>
            <Link
              href="/pedidos?visualizacao=historico"
              className="inline-flex h-10 items-center rounded-lg border bg-white px-4 text-sm font-semibold"
            >
              Limpar
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {rows.length ? (
          <div className="divide-y">
            {rows.map((order) => (
              <article
                key={order.id}
                className="grid gap-4 px-5 py-5 hover:bg-slate-50/70 xl:grid-cols-[140px_minmax(220px,1.3fr)_minmax(220px,1fr)_150px_140px] xl:items-center"
              >
                <div>
                  <p className="font-semibold">Pedido #{order.number}</p>
                  <p className="text-muted mt-1 text-xs">{formatDateTime(order.created_at)}</p>
                </div>
                <div className="min-w-0">
                  {order.customer_id ? (
                    <Link
                      href={`/clientes/${order.customer_id}?aba=compras`}
                      className="hover:text-primary font-medium hover:underline"
                    >
                      {order.customer_name}
                    </Link>
                  ) : (
                    <p className="font-medium">{order.customer_name}</p>
                  )}
                  <p className="text-muted mt-1 text-xs">
                    {order.customer_phone} · {fulfillmentLabel(order.fulfillment)}
                  </p>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="truncate">{itemSummary(order)}</p>
                  <p className="text-muted mt-1 text-xs">{paymentLabel(order.payment_method)}</p>
                  {order.cancellation_reason && (
                    <p className="mt-1 truncate text-xs text-red-600">{order.cancellation_reason}</p>
                  )}
                </div>
                <div>
                  <StatusBadge status={order.status} />
                  <p className="text-muted mt-2 text-xs">{statusDate(order)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 xl:justify-end">
                  <strong>{formatCurrency(order.total)}</strong>
                  <Link
                    href={`/pedido/${order.public_code}`}
                    target="_blank"
                    aria-label={`Acompanhar pedido ${order.number}`}
                    className="rounded-lg border bg-white p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum pedido encontrado"
            description="Altere os filtros ou aguarde a entrada de novos pedidos."
          />
        )}
        <div className="flex items-center justify-between border-t bg-slate-50/50 px-5 py-3 text-sm">
          <span className="text-muted">
            {total} pedido{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={pageHref(filters, filters.page - 1)}
              aria-label="Página anterior"
              aria-disabled={filters.page <= 1}
              className="rounded-lg border bg-white p-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span>
              {filters.page} de {pages}
            </span>
            <Link
              href={pageHref(filters, filters.page + 1)}
              aria-label="Próxima página"
              aria-disabled={filters.page >= pages}
              className="rounded-lg border bg-white p-2 aria-disabled:pointer-events-none aria-disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const colors = {
    neutral: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  };
  return (
    <Card className="p-5">
      <p className="text-muted text-sm">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${colors[tone]}`}>{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    NEW: "Novo",
    CONFIRMED: "Confirmado",
    PREPARING: "Em preparação",
    READY: "Pronto",
    OUT_FOR_DELIVERY: "Em entrega",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
  };
  const tone =
    status === "DELIVERED" ? "success" : status === "CANCELLED" ? "danger" : status === "NEW" ? "warning" : "neutral";
  return <Badge tone={tone}>{labels[status] ?? status}</Badge>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function statusDate(order: OrderHistoryRow) {
  if (order.status === "DELIVERED" && order.delivered_at) return `Entregue em ${formatDateTime(order.delivered_at)}`;
  if (order.status === "CANCELLED" && order.cancelled_at) return `Cancelado em ${formatDateTime(order.cancelled_at)}`;
  return "Aguardando conclusão";
}

function itemSummary(order: OrderHistoryRow) {
  if (!order.online_order_items.length) return "Itens não disponíveis";
  const visible = order.online_order_items.slice(0, 2).map((item) => `${Number(item.quantity)}× ${item.product_name}`);
  const remaining = order.online_order_items.length - visible.length;
  return `${visible.join(" · ")}${remaining > 0 ? ` · +${remaining} item${remaining === 1 ? "" : "s"}` : ""}`;
}

function fulfillmentLabel(value: string) {
  return { DELIVERY: "Entrega", PICKUP: "Retirada", LOCAL: "Consumo local" }[value] ?? value;
}

function paymentLabel(value: string) {
  return (
    {
      CASH: "Dinheiro",
      PIX: "Pix",
      CREDIT_CARD: "Cartão de crédito",
      DEBIT_CARD: "Cartão de débito",
      BANK_TRANSFER: "Transferência",
      BOLETO: "Boleto",
      OTHER: "Outro",
    }[value] ?? value
  );
}

function pageHref(filters: OrderHistoryFilters, page: number) {
  const params = new URLSearchParams({ visualizacao: "historico", page: String(page) });
  if (filters.q) params.set("q", filters.q);
  if (filters.status !== "ALL") params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return `/pedidos?${params.toString()}`;
}
