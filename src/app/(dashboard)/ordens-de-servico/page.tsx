import Link from "next/link";
import { Plus } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchBar } from "@/components/shared/search-bar";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency, formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  number: string;
  equipment_name: string;
  imei: string | null;
  total: number | string;
  created_at: string;
  customers: { name: string; document: string | null } | null;
  service_order_statuses: { name: string; color: string } | null;
};
const tone = (color?: string): "neutral" | "success" | "warning" | "danger" =>
  color === "emerald"
    ? "success"
    : color === "amber" || color === "orange"
      ? "warning"
      : color === "red"
        ? "danger"
        : "neutral";

export default async function ServiceOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q: rawQuery = "" }, supabase, { current }] = await Promise.all([
    searchParams,
    createClient(),
    getBusinessUnitContext(),
  ]);
  const q = z.string().trim().max(80).catch("").parse(rawQuery);
  if (current?.type !== "TECHNICAL_ASSISTANCE")
    return (
      <>
        <PageHeader title="Ordens de serviço" description="Operação exclusiva da Assistência Técnica." />
        <Card className="p-10">
          <EmptyState
            title="Selecione Assistência Técnica"
            description="Use o seletor no topo para acessar as ordens de serviço e o estoque de peças deste segmento."
          />
        </Card>
      </>
    );
  let query = supabase
    .from("service_orders")
    .select(
      "id,number,equipment_name,imei,total,created_at,customers(name,document),service_order_statuses(name,color)",
    )
    .eq("business_unit_id", current.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) {
    const term = q.replace(/[,%()]/g, "");
    const { data: matchingCustomers } = await supabase
      .from("customers")
      .select("id")
      .or(`name.ilike.%${term}%,document.ilike.%${term}%`)
      .is("deleted_at", null)
      .limit(100);
    const customerFilter = matchingCustomers?.length
      ? `,customer_id.in.(${matchingCustomers.map((customer) => customer.id).join(",")})`
      : "";
    query = query.or(`number.ilike.%${term}%,equipment_name.ilike.%${term}%,imei.ilike.%${term}%${customerFilter}`);
  }
  const { data } = await query;
  const rows = (data ?? []) as unknown as OrderRow[];
  return (
    <>
      <PageHeader
        title="Ordens de serviço"
        description="Entrada, diagnóstico, execução, garantia e retirada."
        action={
          <Link
            href="/ordens-de-servico/nova"
            className="bg-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nova O.S.
          </Link>
        }
      />
      <Card>
        <div className="p-4">
          <SearchBar placeholder="Número, IMEI, cliente ou CPF" defaultValue={q} />
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted border-b bg-slate-50 text-left text-xs uppercase">
                <tr>
                  {["O.S.", "Cliente", "Equipamento", "Entrada", "Total", "Status"].map((label) => (
                    <th key={label} className="px-5 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-4">
                      <Link
                        href={`/ordens-de-servico/${order.id}`}
                        className="text-primary font-semibold hover:underline"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p>{order.customers?.name ?? "—"}</p>
                      <p className="text-muted text-xs">{order.customers?.document ?? ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{order.equipment_name}</p>
                      <p className="text-muted text-xs">{order.imei || "Sem IMEI"}</p>
                    </td>
                    <td className="px-5 py-4">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-4">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-4">
                      <Badge tone={tone(order.service_order_statuses?.color)}>
                        {order.service_order_statuses?.name ?? "—"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma ordem de serviço"
            description="Abra a primeira O.S. para iniciar o atendimento técnico."
          />
        )}
      </Card>
    </>
  );
}
