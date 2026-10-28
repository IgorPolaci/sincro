import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ServiceOrderStatusForm } from "@/features/service-orders/status-form";
import {
  AddChecklistItemForm,
  AddPartForm,
  AddServiceForm,
  ChecklistItemForm,
  PhotoUploadForm,
  RemoveOrderItemForm,
} from "@/features/service-orders/operations-forms";
import { ServiceOrderDocumentForm } from "@/features/service-orders/document-form";
import { ServiceOrderBillingForm, ServiceOrderRefundForm } from "@/features/service-orders/billing-form";
import { can } from "@/lib/permissions";

type Status = { id: string; code: string; name: string; color: string };
type History = {
  id: string;
  from_status_id: string | null;
  to_status_id: string;
  note: string | null;
  changed_at: string;
  profiles: { name: string } | null;
};
type ServiceItem = {
  id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  discount: number | string;
  total: number | string;
  warranty_days: number;
};
type PartItem = {
  id: string;
  product_name: string;
  sku: string;
  quantity: number | string;
  unit_price: number | string;
  discount: number | string;
  total: number | string;
  inventory_applied: boolean;
};
type ChecklistItem = { id: string; label: string; checked: boolean; notes: string | null };
type Photo = { id: string; storage_path: string; caption: string | null; created_at: string; signedUrl?: string };
type ProductRow = {
  id: string;
  name: string;
  sku: string;
  sale_price: number | string;
  inventory: { quantity: number | string }[];
};
const tone = (color?: string): "neutral" | "success" | "warning" | "danger" =>
  color === "emerald"
    ? "success"
    : color === "amber" || color === "orange"
      ? "warning"
      : color === "red"
        ? "danger"
        : "neutral";

export default async function ServiceOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ id }, { mode }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("service_orders")
    .select(
      "*,customers(name,document,email,phone,whatsapp),profiles!service_orders_assigned_technician_id_fkey(name),service_order_statuses(id,code,name,color)",
    )
    .eq("id", id)
    .single();
  if (!order) notFound();
  const [
    { data: statuses },
    { data: history },
    { data: secret },
    { data: services },
    { data: parts },
    { data: checklist },
    { data: photos },
    { data: products },
    { data: cashSessions },
    { data: orderPayments },
  ] = await Promise.all([
    supabase
      .from("service_order_statuses")
      .select("id,code,name,color")
      .eq("business_unit_id", order.business_unit_id)
      .eq("active", true)
      .order("position"),
    supabase
      .from("service_order_status_history")
      .select(
        "id,from_status_id,to_status_id,note,changed_at,profiles!service_order_status_history_changed_by_fkey(name)",
      )
      .eq("service_order_id", id)
      .order("changed_at", { ascending: false }),
    supabase
      .from("service_order_access_secrets")
      .select("access_instructions")
      .eq("service_order_id", id)
      .maybeSingle(),
    supabase
      .from("service_order_services")
      .select("id,description,quantity,unit_price,discount,total,warranty_days")
      .eq("service_order_id", id)
      .is("removed_at", null)
      .order("created_at"),
    supabase
      .from("service_order_parts")
      .select("id,product_name,sku,quantity,unit_price,discount,total,inventory_applied")
      .eq("service_order_id", id)
      .is("removed_at", null)
      .order("created_at"),
    supabase.from("service_order_checklist").select("id,label,checked,notes").eq("service_order_id", id).order("label"),
    supabase
      .from("service_order_photos")
      .select("id,storage_path,caption,created_at")
      .eq("service_order_id", id)
      .order("created_at"),
    supabase
      .from("products")
      .select("id,name,sku,sale_price,inventory!inner(quantity,business_unit_id)")
      .eq("inventory.business_unit_id", order.business_unit_id)
      .gt("inventory.quantity", 0)
      .eq("active", true)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("cash_sessions")
      .select("id")
      .eq("business_unit_id", order.business_unit_id)
      .eq("status", "OPEN")
      .limit(1),
    supabase.from("service_order_payments").select("method,amount,status").eq("service_order_id", id),
  ]);
  const photoRows = (photos ?? []) as Photo[];
  if (photoRows.length) {
    const { data: signed } = await supabase.storage.from("service-order-photos").createSignedUrls(
      photoRows.map((photo) => photo.storage_path),
      3600,
    );
    signed?.forEach((result, index) => {
      if (result.signedUrl) photoRows[index].signedUrl = result.signedUrl;
    });
  }
  const statusRows = (statuses ?? []) as Status[];
  const historyRows = (history ?? []) as unknown as History[];
  const serviceRows = (services ?? []) as ServiceItem[];
  const partRows = (parts ?? []) as PartItem[];
  const checklistRows = (checklist ?? []) as ChecklistItem[];
  const productRows = ((products ?? []) as unknown as ProductRow[]).map((product) => ({
    ...product,
    stock: product.inventory[0]?.quantity ?? 0,
  }));
  const currentStatus = order.service_order_statuses as unknown as Status;
  const customer = order.customers as unknown as {
    name: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  const technician = order.profiles as unknown as { name: string } | null;
  const statusName = (statusId: string | null) => statusRows.find((status) => status.id === statusId)?.name ?? "Início";
  const whatsapp = (customer.whatsapp || customer.phone || "").replace(/\D/g, "");
  const remaining = Number(order.total) - Number(order.advance_amount);
  const canUpdate = await can({ businessUnitId: order.business_unit_id }, "service_order.update");
  const editing = mode === "edit" && canUpdate;
  const itemChangesAllowed = editing && !["FATURADO", "FECHADO", "CANCELADO", "ESTORNADO"].includes(currentStatus.code);
  const selectableStatuses = statusRows.filter(
    (status) =>
      status.code !== "FATURADO" &&
      !(currentStatus.code === "FATURADO" && ["CANCELADO", "ESTORNADO"].includes(status.code)),
  );
  const cashSessionId = cashSessions?.[0]?.id ?? null;
  const hasCashPayment =
    orderPayments?.some((payment) => payment.method === "CASH" && payment.status === "PAID") ?? false;
  const { data: notes } = await supabase
    .from("service_order_notes")
    .select("id,note,internal,created_at,profiles!service_order_notes_created_by_fkey(name)")
    .eq("service_order_id", id)
    .order("created_at", { ascending: false });
  return (
    <>
      <PageHeader
        title={`${order.number} · ${customer.name}`}
        description={`${order.equipment_name}${order.brand_name ? ` · ${order.brand_name}` : ""}${order.model_name ? ` ${order.model_name}` : ""}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && (
              <Link
                href={editing ? `/ordens-de-servico/${id}` : `/ordens-de-servico/${id}?mode=edit`}
                className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold"
              >
                <Pencil className="h-4 w-4" />
                {editing ? "Concluir edição" : "Editar O.S."}
              </Link>
            )}
            {whatsapp && (
              <Link
                href={`https://wa.me/55${whatsapp}`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Link>
            )}
            <Badge tone={tone(currentStatus.color)}>{currentStatus.name}</Badge>
          </div>
        }
      />
      <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-1 text-sm">
        {[
          ["Entrada", "entrada"],
          ["Serviços", "servicos"],
          ["Peças", "pecas"],
          ["Laudo técnico", "laudo"],
          ["Saída / Faturamento", "faturamento"],
          ["Anotações internas", "anotacoes"],
        ].map(([label, anchor]) => (
          <a
            key={anchor}
            href={`#${anchor}`}
            className="rounded-lg px-3 py-2 font-medium whitespace-nowrap hover:bg-slate-100"
          >
            {label}
          </a>
        ))}
      </nav>
      <section className="grid gap-4 md:grid-cols-4">
        <Summary label="Serviços" value={formatCurrency(order.service_total)} />
        <Summary label="Peças" value={formatCurrency(order.parts_total)} />
        <Summary label="Total" value={formatCurrency(order.total)} />
        <Summary label="Restante" value={formatCurrency(remaining)} />
      </section>
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card id="entrada" className="p-6">
            <h2 className="font-semibold">Entrada do equipamento</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Cliente" value={customer.name} />
              <Info label="CPF / CNPJ" value={customer.document} />
              <Info label="Contato" value={customer.whatsapp || customer.phone} />
              <Info label="E-mail" value={customer.email} />
              <Info label="Defeito relatado" value={order.reported_defect} />
              <Info label="Avarias visíveis" value={order.visible_damage} />
              <Info label="Acessórios" value={order.accessories} />
              <Info label="Série" value={order.serial_number} />
              <Info label="IMEI" value={order.imei} />
              <Info label="Cor / voltagem" value={[order.color, order.voltage].filter(Boolean).join(" · ")} />
              <Info label="Técnico" value={technician?.name} />
              <Info label="Previsão" value={formatDate(order.estimated_delivery_at)} />
              <Info label="Garantia" value={order.is_warranty ? "Sim" : "Não"} />
            </div>
          </Card>
          {secret?.access_instructions && (
            <Card className="border-amber-200 bg-amber-50/40 p-6">
              <h2 className="font-semibold">Acesso ao aparelho</h2>
              <p className="mt-2 text-sm">{secret.access_instructions}</p>
              <p className="text-muted mt-2 text-xs">Informação restrita a perfis autorizados.</p>
            </Card>
          )}
          <div id="servicos">
            <ItemsCard title="Serviços" form={itemChangesAllowed ? <AddServiceForm serviceOrderId={id} /> : undefined}>
              {serviceRows.map((item) => (
                <ItemRow
                  key={item.id}
                  title={item.description}
                  detail={`${item.quantity} × ${formatCurrency(item.unit_price)} · garantia ${item.warranty_days} dias`}
                  total={item.total}
                  action={
                    itemChangesAllowed ? (
                      <RemoveOrderItemForm serviceOrderId={id} itemId={item.id} itemType="SERVICE" />
                    ) : undefined
                  }
                />
              ))}
            </ItemsCard>
          </div>
          <div id="pecas">
            <ItemsCard
              title="Peças"
              form={itemChangesAllowed ? <AddPartForm serviceOrderId={id} products={productRows} /> : undefined}
            >
              {partRows.map((item) => (
                <ItemRow
                  key={item.id}
                  title={`${item.sku} · ${item.product_name}`}
                  detail={`${item.quantity} × ${formatCurrency(item.unit_price)}${item.inventory_applied ? " · estoque baixado" : " · aguardando faturamento"}`}
                  total={item.total}
                  action={
                    itemChangesAllowed ? (
                      <RemoveOrderItemForm serviceOrderId={id} itemId={item.id} itemType="PART" />
                    ) : undefined
                  }
                />
              ))}
            </ItemsCard>
          </div>
          <Card id="laudo">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Laudo técnico e check-list</h2>
            </div>
            <div className="divide-y">
              {checklistRows.map((item) =>
                editing ? (
                  <ChecklistItemForm key={item.id} serviceOrderId={id} item={item} />
                ) : (
                  <div key={item.id} className="flex justify-between px-5 py-3 text-sm">
                    <span>{item.label}</span>
                    <span className={item.checked ? "text-emerald-600" : "text-muted"}>
                      {item.checked ? "Conferido" : "Pendente"}
                      {item.notes ? ` · ${item.notes}` : ""}
                    </span>
                  </div>
                ),
              )}
            </div>
            {editing && (
              <div className="border-t p-5">
                <AddChecklistItemForm serviceOrderId={id} />
              </div>
            )}
            <div className="border-t p-5">
              <Info label="Observações / laudo" value={order.general_notes} />
            </div>
          </Card>
          <Card>
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Fotos do equipamento</h2>
            </div>
            {photoRows.length > 0 && (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {photoRows.map((photo) =>
                  photo.signedUrl ? (
                    <figure key={photo.id}>
                      <Image
                        unoptimized
                        src={photo.signedUrl}
                        alt={photo.caption || "Foto da ordem de serviço"}
                        width={600}
                        height={400}
                        className="aspect-[3/2] w-full rounded-lg object-cover"
                      />
                      <figcaption className="text-muted mt-2 text-xs">
                        {photo.caption || formatDate(photo.created_at)}
                      </figcaption>
                    </figure>
                  ) : null,
                )}
              </div>
            )}
            {editing && (
              <div className="border-t p-5">
                <PhotoUploadForm serviceOrderId={id} />
              </div>
            )}
          </Card>
          <Card id="anotacoes">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Anotações internas</h2>
            </div>
            <div className="divide-y">
              {notes?.length ? (
                notes.map((note) => (
                  <div key={note.id} className="px-5 py-4 text-sm">
                    <p>{note.note}</p>
                    <p className="text-muted mt-1 text-xs">
                      {(note.profiles as unknown as { name: string } | null)?.name ?? "Sistema"} ·{" "}
                      {formatDate(note.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted px-5 py-8 text-center text-sm">Nenhuma anotação interna.</p>
              )}
            </div>
          </Card>
          <Card>
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Histórico de status</h2>
            </div>
            <div className="divide-y">
              {historyRows.map((entry) => (
                <div key={entry.id} className="px-5 py-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <p>
                      <span className="text-muted">{statusName(entry.from_status_id)}</span> →{" "}
                      <span className="font-semibold">{statusName(entry.to_status_id)}</span>
                    </p>
                    <time className="text-muted text-xs">{formatDate(entry.changed_at)}</time>
                  </div>
                  <p className="text-muted mt-1 text-xs">
                    {entry.profiles?.name ?? "Sistema"}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div id="faturamento" className="space-y-4">
          {editing ? (
            <>
              <Card className="p-6">
                <h2 className="mb-4 font-semibold">Andamento</h2>
                <ServiceOrderStatusForm
                  serviceOrderId={id}
                  statuses={selectableStatuses}
                  currentCode={currentStatus.code}
                />
                <p className="text-muted mt-4 text-xs">
                  O faturamento possui fluxo próprio para manter estoque, pagamentos, caixa e financeiro na mesma
                  transação.
                </p>
              </Card>
              {itemChangesAllowed && (
                <Card className="p-6">
                  <h2 className="mb-4 font-semibold">Faturamento</h2>
                  <ServiceOrderBillingForm serviceOrderId={id} amount={remaining} cashSessionId={cashSessionId} />
                </Card>
              )}
              {currentStatus.code === "FATURADO" && (
                <Card className="p-6">
                  <h2 className="mb-4 font-semibold">Estorno</h2>
                  <ServiceOrderRefundForm
                    serviceOrderId={id}
                    cashSessionId={cashSessionId}
                    hasCashPayment={hasCashPayment}
                  />
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6">
              <h2 className="font-semibold">Saída e faturamento</h2>
              <p className="text-muted mt-3 text-sm">Status atual</p>
              <p className="font-semibold">{currentStatus.name}</p>
              <p className="text-muted mt-3 text-sm">Valor restante</p>
              <p className="text-xl font-bold">{formatCurrency(remaining)}</p>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">Documentos</h2>
            {editing ? (
              <ServiceOrderDocumentForm serviceOrderId={id} />
            ) : (
              <Link
                href={`/ordens-de-servico/${id}/imprimir`}
                className="text-primary text-sm font-semibold hover:underline"
              >
                Visualizar ficha para impressão
              </Link>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-muted text-sm">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </Card>
  );
}
function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-sm whitespace-pre-wrap">{String(value || "—")}</p>
    </div>
  );
}
function ItemsCard({ title, form, children }: { title: string; form?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="divide-y">{children}</div>
      {form && <div className="border-t p-5">{form}</div>}
    </Card>
  );
}
function ItemRow({
  title,
  detail,
  total,
  action,
}: {
  title: string;
  detail: string;
  total: number | string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 px-5 py-4 text-sm lg:flex-row lg:items-center">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted text-xs">{detail}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <p className="font-semibold">{formatCurrency(total)}</p>
        {action}
      </div>
    </div>
  );
}
