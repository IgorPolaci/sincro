import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tabs = [
  { id: "dados", label: "Dados gerais" },
  { id: "endereco", label: "Endereço" },
  { id: "compras", label: "Compras" },
  { id: "orcamentos", label: "Orçamentos" },
  { id: "financeiro", label: "Financeiro" },
  { id: "historico", label: "Histórico" },
] as const;

type TabId = (typeof tabs)[number]["id"];
type Customer = {
  id: string;
  name: string;
  type: "PERSON" | "COMPANY";
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  legal_name: string | null;
  state_registration: string | null;
  birth_date: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};
type Address = {
  id: string;
  type: string;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string;
  is_primary: boolean;
};
type Purchase = {
  id: string;
  source: "SALE" | "ORDER" | "SERVICE_ORDER";
  number: string;
  status: string;
  total: number | string;
  created_at: string;
};
type Quote = {
  id: string;
  number: string;
  status: string;
  total: number | string;
  valid_until: string | null;
  created_at: string;
};
type Receivable = {
  id: string;
  description: string;
  amount: number | string;
  due_date: string;
  paid_at: string | null;
  status: string;
  created_at: string;
};
type TimelineEvent = { id: string; title: string; description: string; date: string; href?: string };

export default async function CustomerDetail({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const activeTab = isTab(query.aba) ? query.aba : "dados";
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const customer = data as Customer;

  return (
    <>
      <PageHeader
        title={customer.name}
        description={customer.document || "Cliente sem documento cadastrado"}
        action={<Badge tone={customer.active ? "success" : "neutral"}>{customer.active ? "Ativo" : "Inativo"}</Badge>}
      />
      <nav aria-label="Seções do cliente" className="flex gap-2 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "dados" ? `/clientes/${id}` : `/clientes/${id}?aba=${tab.id}`}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "text-muted border-transparent hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <CustomerTabContent tab={activeTab} customer={customer} />
    </>
  );
}

async function CustomerTabContent({ tab, customer }: { tab: TabId; customer: Customer }) {
  if (tab === "dados") return <GeneralData customer={customer} />;
  if (tab === "endereco") return <Addresses customerId={customer.id} />;
  if (tab === "compras") return <Purchases customerId={customer.id} />;
  if (tab === "orcamentos") return <Quotes customerId={customer.id} />;
  if (tab === "financeiro") return <Financial customerId={customer.id} />;
  return <History customer={customer} />;
}

function GeneralData({ customer }: { customer: Customer }) {
  const fields = [
    ["Tipo", customer.type === "PERSON" ? "Pessoa física" : "Pessoa jurídica"],
    ["E-mail", customer.email],
    ["Telefone", customer.phone],
    ["WhatsApp", customer.whatsapp],
    ["Razão social", customer.legal_name],
    ["Inscrição estadual", customer.state_registration],
    ["Nascimento", formatDate(customer.birth_date)],
    ["Cliente desde", formatDate(customer.created_at)],
    ["Observações", customer.notes],
  ];
  return (
    <Card className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value]) => (
        <div key={label}>
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
          <p className="mt-1 text-sm whitespace-pre-wrap">{value || "—"}</p>
        </div>
      ))}
    </Card>
  );
}

async function Addresses({ customerId }: { customerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("id,type,zip_code,street,number,complement,neighborhood,city,state,country,is_primary")
    .eq("customer_id", customerId)
    .order("is_primary", { ascending: false })
    .order("created_at");
  const addresses = (data ?? []) as Address[];
  if (!addresses.length)
    return (
      <Card>
        <EmptyState title="Nenhum endereço cadastrado" description="Este cliente ainda não possui um endereço salvo." />
      </Card>
    );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {addresses.map((address) => (
        <Card key={address.id} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-primary h-4 w-4" />
              <h2 className="font-semibold">{address.type === "MAIN" ? "Endereço principal" : address.type}</h2>
            </div>
            {address.is_primary && <Badge tone="success">Principal</Badge>}
          </div>
          <p className="mt-4 text-sm">{formatStreet(address)}</p>
          <p className="text-muted mt-1 text-sm">{formatCity(address)}</p>
          <p className="text-muted mt-1 text-sm">CEP {address.zip_code || "não informado"}</p>
        </Card>
      ))}
    </div>
  );
}

async function Purchases({ customerId }: { customerId: string }) {
  const supabase = await createClient();
  const [salesResult, ordersResult, serviceOrdersResult] = await Promise.all([
    supabase
      .from("sales")
      .select("id,number,status,total,created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("online_orders")
      .select("id,number,status,total,created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_orders")
      .select("id,number,total,created_at,service_order_statuses(name)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),
  ]);
  const purchases: Purchase[] = [
    ...(salesResult.data ?? []).map((row) => ({ ...row, source: "SALE" as const })),
    ...(ordersResult.data ?? []).map((row) => ({ ...row, source: "ORDER" as const })),
    ...(serviceOrdersResult.data ?? []).map((row) => ({
      id: row.id,
      number: row.number,
      total: row.total,
      created_at: row.created_at,
      status: (row.service_order_statuses as unknown as { name: string } | null)?.name ?? "Em andamento",
      source: "SERVICE_ORDER" as const,
    })),
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (!purchases.length)
    return (
      <Card>
        <EmptyState
          title="Nenhuma compra encontrada"
          description="Vendas, pedidos online e ordens de serviço deste cliente aparecerão aqui."
        />
      </Card>
    );
  const total = purchases
    .filter((item) => !["CANCELLED", "CANCELADO"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.total), 0);
  return (
    <div className="space-y-4">
      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <Metric label="Operações encontradas" value={String(purchases.length)} />
        <Metric label="Valor movimentado" value={formatCurrency(total)} />
      </Card>
      <Card className="divide-y">
        {purchases.map((purchase) => {
          const href =
            purchase.source === "SALE"
              ? `/vendas/${purchase.id}`
              : purchase.source === "SERVICE_ORDER"
                ? `/ordens-de-servico/${purchase.id}`
                : "/pedidos";
          return (
            <Link
              key={`${purchase.source}-${purchase.id}`}
              href={href}
              className="grid gap-3 px-5 py-4 text-sm hover:bg-slate-50 sm:grid-cols-[1fr_160px_130px] sm:items-center"
            >
              <div>
                <p className="font-semibold">
                  {purchaseLabel(purchase.source)} {purchase.number}
                </p>
                <p className="text-muted mt-1 text-xs">{formatDateTime(purchase.created_at)}</p>
              </div>
              <StatusBadge status={purchase.status} />
              <strong className="sm:text-right">{formatCurrency(purchase.total)}</strong>
            </Link>
          );
        })}
      </Card>
    </div>
  );
}

async function Quotes({ customerId }: { customerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id,number,status,total,valid_until,created_at")
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const quotes = (data ?? []) as Quote[];
  if (!quotes.length)
    return (
      <Card>
        <EmptyState
          title="Nenhum orçamento encontrado"
          description="Os orçamentos emitidos para este cliente aparecerão aqui."
        />
      </Card>
    );
  return (
    <Card className="divide-y">
      {quotes.map((quote) => (
        <Link
          key={quote.id}
          href={`/orcamentos/${quote.id}`}
          className="grid gap-3 px-5 py-4 text-sm hover:bg-slate-50 sm:grid-cols-[1fr_160px_130px] sm:items-center"
        >
          <div>
            <p className="font-semibold">Orçamento {quote.number}</p>
            <p className="text-muted mt-1 text-xs">
              Criado em {formatDate(quote.created_at)} · validade {formatDate(quote.valid_until)}
            </p>
          </div>
          <StatusBadge status={quote.status} />
          <strong className="sm:text-right">{formatCurrency(quote.total)}</strong>
        </Link>
      ))}
    </Card>
  );
}

async function Financial({ customerId }: { customerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("accounts_receivable")
    .select("id,description,amount,due_date,paid_at,status,created_at")
    .eq("customer_id", customerId)
    .order("due_date", { ascending: false });
  const receivables = (data ?? []) as Receivable[];
  const pending = receivables
    .filter((item) => ["PENDING", "PARTIAL", "OVERDUE"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const paid = receivables.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.amount), 0);
  return (
    <div className="space-y-4">
      <Card className="grid gap-4 p-5 sm:grid-cols-3">
        <Metric label="A receber" value={formatCurrency(pending)} />
        <Metric label="Recebido" value={formatCurrency(paid)} />
        <Metric label="Lançamentos" value={String(receivables.length)} />
      </Card>
      <Card>
        {receivables.length ? (
          <div className="divide-y">
            {receivables.map((receivable) => (
              <div
                key={receivable.id}
                className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-[1fr_160px_130px] sm:items-center"
              >
                <div>
                  <p className="font-semibold">{receivable.description}</p>
                  <p className="text-muted mt-1 text-xs">
                    Vencimento {formatDate(receivable.due_date)}
                    {receivable.paid_at ? ` · pago em ${formatDate(receivable.paid_at)}` : ""}
                  </p>
                </div>
                <StatusBadge status={receivable.status} />
                <strong className="sm:text-right">{formatCurrency(receivable.amount)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum lançamento financeiro"
            description="Contas a receber vinculadas ao cliente aparecerão aqui."
          />
        )}
      </Card>
    </div>
  );
}

async function History({ customer }: { customer: Customer }) {
  const supabase = await createClient();
  const [auditResult, salesResult, ordersResult, quotesResult, serviceOrdersResult] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id,action,created_at")
      .eq("entity", "customers")
      .eq("entity_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("sales")
      .select("id,number,status,created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("online_orders")
      .select("id,number,status,created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("quotes")
      .select("id,number,status,created_at")
      .eq("customer_id", customer.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("service_orders")
      .select("id,number,created_at")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const events: TimelineEvent[] = [
    {
      id: `customer-${customer.id}`,
      title: "Cliente cadastrado",
      description: "Cadastro criado no sistema",
      date: customer.created_at,
    },
    ...(auditResult.data ?? []).map((row) => ({
      id: `audit-${row.id}`,
      title: auditTitle(row.action),
      description: "Dados cadastrais do cliente",
      date: row.created_at,
    })),
    ...(salesResult.data ?? []).map((row) => ({
      id: `sale-${row.id}`,
      title: `Venda ${row.number}`,
      description: statusLabel(row.status),
      date: row.created_at,
      href: `/vendas/${row.id}`,
    })),
    ...(ordersResult.data ?? []).map((row) => ({
      id: `order-${row.id}`,
      title: `Pedido online ${row.number}`,
      description: statusLabel(row.status),
      date: row.created_at,
      href: "/pedidos",
    })),
    ...(quotesResult.data ?? []).map((row) => ({
      id: `quote-${row.id}`,
      title: `Orçamento ${row.number}`,
      description: statusLabel(row.status),
      date: row.created_at,
      href: `/orcamentos/${row.id}`,
    })),
    ...(serviceOrdersResult.data ?? []).map((row) => ({
      id: `service-${row.id}`,
      title: `Ordem de serviço ${row.number}`,
      description: "Atendimento técnico",
      date: row.created_at,
      href: `/ordens-de-servico/${row.id}`,
    })),
  ]
    .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 100);
  return (
    <Card className="p-5">
      <div className="space-y-0">
        {events.map((event, index) => {
          const content = (
            <div className="pb-6 pl-8">
              <p className="font-semibold">{event.title}</p>
              <p className="text-muted mt-1 text-sm">{event.description}</p>
              <p className="text-muted mt-1 text-xs">{formatDateTime(event.date)}</p>
            </div>
          );
          return (
            <div key={event.id} className="relative">
              {index < events.length - 1 && <div className="absolute top-4 left-[7px] h-full w-px bg-slate-200" />}
              <div className="bg-primary absolute top-1.5 left-0 h-4 w-4 rounded-full border-4 border-white shadow-sm" />
              {event.href ? (
                <Link href={event.href} className="block rounded-lg hover:bg-slate-50">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return <Badge tone={tone}>{statusLabel(status)}</Badge>;
}

function isTab(value: string | string[] | undefined): value is TabId {
  return typeof value === "string" && tabs.some((tab) => tab.id === value);
}

function formatStreet(address: Address) {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  return [street, address.complement].filter(Boolean).join(" · ") || "Logradouro não informado";
}

function formatCity(address: Address) {
  const city = [address.city, address.state].filter(Boolean).join(" / ");
  return (
    [address.neighborhood, city, address.country !== "BR" ? address.country : null].filter(Boolean).join(" · ") ||
    "Localidade não informada"
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function purchaseLabel(source: Purchase["source"]) {
  if (source === "SALE") return "Venda";
  if (source === "ORDER") return "Pedido online";
  return "Ordem de serviço";
}

function auditTitle(action: string) {
  const labels: Record<string, string> = {
    CREATE: "Cliente cadastrado",
    UPDATE: "Cadastro atualizado",
    DELETE: "Cliente movido para a lixeira",
    RESTORE: "Cliente restaurado",
  };
  return labels[action] ?? `Cadastro: ${action}`;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    OPEN: "Aberta",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
    REFUNDED: "Estornada",
    NEW: "Novo",
    CONFIRMED: "Confirmado",
    PREPARING: "Em preparação",
    READY: "Pronto",
    OUT_FOR_DELIVERY: "Saiu para entrega",
    DELIVERED: "Entregue",
    DRAFT: "Rascunho",
    SENT: "Enviado",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    EXPIRED: "Expirado",
    CONVERTED: "Convertido",
    PENDING: "Pendente",
    PAID: "Pago",
    PARTIAL: "Parcial",
    OVERDUE: "Vencido",
  };
  return labels[status] ?? status;
}

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (["COMPLETED", "DELIVERED", "PAID", "APPROVED", "CONVERTED"].includes(status)) return "success";
  if (["CANCELLED", "REFUNDED", "REJECTED", "EXPIRED", "OVERDUE"].includes(status)) return "danger";
  if (
    ["OPEN", "NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "SENT", "PENDING", "PARTIAL"].includes(
      status,
    )
  )
    return "warning";
  return "neutral";
}
