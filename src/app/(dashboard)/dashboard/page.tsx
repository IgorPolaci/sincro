import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  MessageCircleMore,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Warehouse,
  Wrench,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  const unitId = current?.id ?? "00000000-0000-0000-0000-000000000000";
  const today = new Date().toISOString().slice(0, 10);
  const month = `${today.slice(0, 7)}-01`;
  const deliveryMode = current?.type === "STORE_DELIVERY";
  const [
    profileIdResult,
    activity,
    pendingServiceOrders,
    readyServiceOrders,
    activeOrders,
    deliveryToday,
    deliveryMonth,
  ] = await Promise.all([
    supabase.rpc("current_profile_id"),
    supabase
      .from("audit_logs")
      .select("id,action,entity,created_at,profiles(name)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("service_orders")
      .select("service_order_statuses!inner(code)", { count: "exact", head: true })
      .eq("business_unit_id", unitId)
      .not("service_order_statuses.code", "in", '("FECHADO","CANCELADO","ESTORNADO")'),
    supabase
      .from("service_orders")
      .select("service_order_statuses!inner(code)", { count: "exact", head: true })
      .eq("business_unit_id", unitId)
      .eq("service_order_statuses.code", "AGUARDANDO_RETIRADA"),
    supabase
      .from("online_orders")
      .select("*", { count: "exact", head: true })
      .eq("business_unit_id", unitId)
      .in("status", ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"]),
    supabase
      .from("online_orders")
      .select("total")
      .eq("business_unit_id", unitId)
      .eq("status", "DELIVERED")
      .gte("delivered_at", today),
    supabase
      .from("online_orders")
      .select("total")
      .eq("business_unit_id", unitId)
      .eq("status", "DELIVERED")
      .gte("delivered_at", month),
  ]);
  const { data: profile } = profileIdResult.data
    ? await supabase.from("profiles").select("name").eq("id", profileIdResult.data).maybeSingle()
    : { data: null };
  const sum = (rows: { total: number | string }[] | null) =>
    (rows ?? []).reduce((total, row) => total + Number(row.total), 0);
  const openCount = pendingServiceOrders.count ?? 0;
  const metrics = deliveryMode
    ? [
        {
          label: "Pedidos em andamento",
          value: String(activeOrders.count ?? 0),
          icon: ShoppingBag,
          accent: "bg-amber-400/10 text-amber-400",
        },
        {
          label: "Vendas hoje",
          value: formatCurrency(sum(deliveryToday.data)),
          icon: Clock3,
          accent: "bg-red-500/10 text-red-400",
        },
        {
          label: "Vendas no mês",
          value: formatCurrency(sum(deliveryMonth.data)),
          icon: Store,
          accent: "bg-blue-500/10 text-blue-400",
        },
      ]
    : [
        { label: "O.S. em aberto", value: String(openCount), icon: Wrench, accent: "bg-amber-400/10 text-amber-400" },
        {
          label: "Aguardando retirada",
          value: String(readyServiceOrders.count ?? 0),
          icon: Clock3,
          accent: "bg-red-500/10 text-red-400",
        },
        {
          label: "Total de O.S. abertas",
          value: String(openCount),
          icon: Wrench,
          accent: "bg-blue-500/10 text-blue-400",
        },
      ];
  const shortcuts = deliveryMode
    ? ([
        ["Pedidos", "/pedidos", ShoppingBag, "Acompanhe o funil de vendas"],
        ["E-commerce", "/ecommerce", Store, "Gerencie sua loja online"],
        ["Produtos", "/produtos", Package, "Catálogo e preços"],
        ["Estoque", "/estoque", Warehouse, "Saldos e movimentações"],
        ["Relatórios", "/relatorios", BarChart3, "Métricas e análises"],
        ["Configurações", "/delivery/configuracoes", Settings, "Entrega, horários e cupons"],
      ] as const)
    : ([
        ["Nova O.S.", "/ordens-de-servico/nova", Wrench, "Inicie um novo atendimento"],
        ["Clientes", "/clientes", Users, "Base de clientes"],
        ["Produtos / Peças", "/produtos", Package, "Catálogo de peças e serviços"],
        ["Estoque", "/estoque", Warehouse, "Saldos e movimentações"],
        ["Relatórios", "/relatorios", BarChart3, "Métricas e análises"],
        ["Configurações", "/configuracoes", Settings, "Ajustes da plataforma"],
      ] as const);
  const currentDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const localHour = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    ),
  );
  const greeting = localHour < 12 ? "Bom dia" : localHour < 18 ? "Boa tarde" : "Boa noite";
  return (
    <div className="text-slate-100">
      <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          <span className="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#ff3b30] text-[#ff3b30]">
            <MessageCircleMore className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {greeting}, <span className="text-[#ff3b30]">{profile?.name?.split(" ")[0] ?? "bem-vindo"}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 capitalize">
              {currentDate} · {current?.name ?? "Selecione uma unidade operacional"}
            </p>
          </div>
        </div>
        <Link
          href="/configuracoes/demonstracao"
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Dados de demonstração
        </Link>
      </header>
      <section className="grid gap-4 lg:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, accent }) => (
          <article
            key={label}
            className="rounded-2xl border border-[#252c3b] bg-[#0d111c]/95 p-5 shadow-xl shadow-black/10"
          >
            <div className={`mb-3 inline-flex rounded-lg p-2 ${accent}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-4xl font-black tracking-tight">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-wide text-slate-400 uppercase">
            <Zap className="h-4 w-4" />
            Acesso rápido
          </h2>
          <span className="text-xs tracking-widest text-slate-500 uppercase">
            {deliveryMode ? "Loja online" : "Assistência técnica"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shortcuts.map(([label, href, Icon, description]) => (
            <Link
              key={href}
              href={href}
              className="group min-h-36 rounded-xl border border-[#252c3b] bg-[#090d16]/75 p-5 transition hover:-translate-y-0.5 hover:border-[#ff3b30]/50 hover:bg-[#111724]"
            >
              <span className="inline-flex rounded-lg bg-[#ff3b30]/10 p-2.5 text-[#ff3b30]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-4 flex items-center font-semibold">
                {label}
                <ArrowRight className="ml-auto h-4 w-4 text-slate-700 transition group-hover:translate-x-1 group-hover:text-[#ff3b30]" />
              </span>
              <span className="mt-1 block text-xs text-slate-500">{description}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8 overflow-hidden rounded-2xl border border-white/8 bg-[#161b22]">
        <div className="border-b border-white/8 px-5 py-4">
          <h2 className="font-semibold">Atividades recentes</h2>
        </div>
        <div className="divide-y divide-white/5">
          {activity.data?.length ? (
            activity.data.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
                <div>
                  <span className="font-medium">
                    {(item.profiles as unknown as { name: string } | null)?.name ?? "Sistema"}
                  </span>{" "}
                  <span className="text-slate-400">
                    {item.action.toLowerCase()} em {item.entity}
                  </span>
                </div>
                <time className="text-xs text-slate-500">{formatDate(item.created_at)}</time>
              </div>
            ))
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">As ações auditadas aparecerão aqui.</p>
          )}
        </div>
      </section>
    </div>
  );
}
