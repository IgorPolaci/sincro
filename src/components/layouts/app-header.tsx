"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Headphones,
  Home,
  Landmark,
  LogOut,
  Menu,
  MessageCircleMore,
  Package,
  Repeat2,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";
import { logout } from "@/features/auth/actions";
import type { BusinessUnit } from "@/lib/business-units";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home; description?: string };
type NavGroup = { label: string; icon: typeof Home; items: NavItem[] };

const assistanceGroups: NavGroup[] = [
  {
    label: "Atendimento",
    icon: Headphones,
    items: [
      {
        href: "/ordens-de-servico",
        label: "Ordens de serviço",
        icon: Wrench,
        description: "Entrada, execução e retirada",
      },
      {
        href: "/ordens-de-servico/nova",
        label: "Nova O.S.",
        icon: ClipboardList,
        description: "Abrir atendimento técnico",
      },
      { href: "/clientes", label: "Clientes", icon: Users, description: "Base compartilhada" },
    ],
  },
  {
    label: "Operação",
    icon: Warehouse,
    items: [
      { href: "/produtos", label: "Peças e produtos", icon: Package },
      { href: "/estoque", label: "Estoque", icon: Warehouse },
      { href: "/vendas", label: "Venda no balcão", icon: ShoppingCart },
      { href: "/financeiro/fluxo-de-caixa", label: "Caixa", icon: Landmark },
    ],
  },
  {
    label: "Gestão",
    icon: BarChart3,
    items: [
      { href: "/financeiro", label: "Financeiro", icon: Landmark },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/auditoria", label: "Auditoria", icon: ShieldCheck },
    ],
  },
];
const deliveryGroups: NavGroup[] = [
  {
    label: "Pedidos",
    icon: ClipboardList,
    items: [
      { href: "/pedidos", label: "Gestão de pedidos", icon: ClipboardList, description: "Funil e histórico de vendas" },
      { href: "/clientes", label: "Clientes", icon: Users, description: "Base compartilhada" },
    ],
  },
  {
    label: "Loja online",
    icon: Store,
    items: [
      { href: "/ecommerce", label: "E-commerce", icon: Store },
      { href: "/ecommerce/produtos", label: "Catálogo online", icon: Package },
      { href: "/produtos", label: "Cadastro de produtos", icon: Package },
      { href: "/delivery/configuracoes", label: "Entrega e cupons", icon: Settings },
    ],
  },
  {
    label: "Gestão",
    icon: BarChart3,
    items: [
      { href: "/estoque", label: "Estoque", icon: Warehouse },
      { href: "/financeiro", label: "Financeiro", icon: Landmark },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/auditoria", label: "Auditoria", icon: ShieldCheck },
    ],
  },
];

export function AppHeader({
  name,
  organization,
  currentUnit,
}: {
  name: string;
  organization: string;
  currentUnit: BusinessUnit | null;
}) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = currentUnit?.type === "STORE_DELIVERY" ? deliveryGroups : assistanceGroups;
  return (
    <header className="app-topbar print:hidden">
      <div className="flex h-[54px] items-center gap-2 px-4 lg:px-5">
        <Link href="/dashboard" className="mr-2 flex shrink-0 items-center gap-2 font-black tracking-tight text-white">
          <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#ff3b30] text-[#ff3b30]">
            <MessageCircleMore className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">SINCRO</span>
        </Link>
        <nav className="hidden h-full items-center gap-1 lg:flex" aria-label="Navegação principal">
          <TopLink href="/dashboard" label="Início" icon={Home} active={path === "/dashboard"} />
          {groups.map((group) => (
            <NavDropdown key={group.label} group={group} path={path} />
          ))}
        </nav>
        <div className="ml-auto hidden h-full items-center gap-2 lg:flex">
          <TopLink href="/configuracoes" label="Config." icon={Settings} active={path.startsWith("/configuracoes")} />
          <span className="mx-1 h-6 w-px bg-white/10" />
          <details className="group relative h-full">
            <summary className="flex h-full cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-left hover:bg-white/5">
              <span className="relative grid h-8 w-8 place-items-center rounded-full bg-[#ff3b30] text-sm font-bold text-white">
                {name.slice(0, 1).toUpperCase()}
                <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#090d17]" />
              </span>
              <span>
                <span className="block max-w-32 truncate text-xs font-semibold text-white">{name}</span>
                <span className="block max-w-32 truncate text-[10px] text-slate-500">
                  {currentUnit?.name ?? organization}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition group-open:rotate-180" />
            </summary>
            <div className="app-dropdown right-0 w-64">
              <div className="border-b border-white/8 p-3">
                <p className="truncate text-sm font-semibold text-white">{organization}</p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {currentUnit?.type === "STORE_DELIVERY" ? "Loja e Delivery" : "Assistência Técnica"}
                </p>
              </div>
              <Link href="/selecionar-negocio" className="app-dropdown-item">
                <Repeat2 />
                Trocar negócio
              </Link>
              <form action={logout}>
                <button className="app-dropdown-item w-full text-red-300">
                  <LogOut />
                  Sair
                </button>
              </form>
            </div>
          </details>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      {mobileOpen && (
        <nav className="max-h-[calc(100vh-54px)] overflow-y-auto border-t border-white/8 bg-[#090d17] p-3 lg:hidden">
          <MobileLink href="/dashboard" label="Início" icon={Home} close={() => setMobileOpen(false)} />
          {groups.map((group) => (
            <div key={group.label} className="mt-4">
              <p className="px-3 pb-2 text-[10px] font-bold tracking-[.18em] text-slate-600 uppercase">{group.label}</p>
              {group.items.map((item) => (
                <MobileLink key={item.href} {...item} close={() => setMobileOpen(false)} />
              ))}
            </div>
          ))}
          <div className="mt-4 border-t border-white/8 pt-3">
            <MobileLink
              href="/configuracoes"
              label="Configurações"
              icon={Settings}
              close={() => setMobileOpen(false)}
            />
            <MobileLink
              href="/selecionar-negocio"
              label="Trocar negócio"
              icon={Repeat2}
              close={() => setMobileOpen(false)}
            />
            <form action={logout}>
              <button className="app-mobile-link w-full text-red-300">
                <LogOut />
                Sair
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}

function TopLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link href={href} className={cn("app-toplink", active && "app-toplink-active")}>
      <Icon />
      {label}
    </Link>
  );
}
function NavDropdown({ group, path }: { group: NavGroup; path: string }) {
  const active = group.items.some((item) => path === item.href || path.startsWith(`${item.href}/`));
  const Icon = group.icon;
  return (
    <details className="group relative h-full">
      <summary className={cn("app-toplink h-full cursor-pointer list-none", active && "app-toplink-active")}>
        <Icon />
        {group.label}
        <ChevronDown className="h-3 w-3 transition group-open:rotate-180" />
      </summary>
      <div className="app-dropdown left-0 w-72">
        {group.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="app-dropdown-item">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-slate-400">
                <ItemIcon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-200">{item.label}</span>
                {item.description && <span className="block text-[11px] text-slate-500">{item.description}</span>}
              </span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}
function MobileLink({
  href,
  label,
  icon: Icon,
  close,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  close: () => void;
}) {
  return (
    <Link href={href} onClick={close} className="app-mobile-link">
      <Icon />
      {label}
    </Link>
  );
}
