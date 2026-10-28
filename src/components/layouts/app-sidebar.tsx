"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Landmark,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Users,
  WalletCards,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessUnit } from "@/lib/business-units";

const shared = [
  ["/dashboard", "Visão geral", LayoutDashboard],
  ["/clientes", "Clientes", Users],
  ["/financeiro", "Financeiro", WalletCards],
  ["/relatorios", "Relatórios", BarChart3],
  ["/auditoria", "Auditoria", ShieldCheck],
  ["/configuracoes", "Configurações", Settings],
] as const;
const assistance = [
  ["/produtos", "Peças e produtos", Package],
  ["/estoque", "Estoque de peças", Warehouse],
  ["/ordens-de-servico", "Ordens de serviço", Wrench],
  ["/vendas", "Venda no balcão", ShoppingCart],
  ["/financeiro/fluxo-de-caixa", "Caixa", Landmark],
] as const;
const delivery = [
  ["/ecommerce", "E-commerce", Store],
  ["/pedidos", "Gestão de pedidos", ClipboardList],
  ["/produtos", "Cadastro de produtos", Package],
  ["/estoque", "Estoque da loja", Warehouse],
  ["/delivery/configuracoes", "Entrega e cupons", SlidersHorizontal],
] as const;

export function AppSidebar({ unit }: { unit: BusinessUnit | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const operational = unit?.type === "STORE_DELIVERY" ? delivery : assistance;
  const items = [shared[0], ...operational, ...shared.slice(1)];
  return (
    <>
      <button
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-30 rounded-lg border bg-white p-2 lg:hidden print:hidden"
      >
        <Menu />
      </button>
      {open && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden print:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-[#123d32] text-white transition-transform lg:translate-x-0 print:hidden",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-18 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex items-center gap-3 text-lg font-bold">
            <span className="rounded-lg bg-emerald-400/15 p-2 text-emerald-300">
              <Boxes />
            </span>
            Sincro
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden">
            <X />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pt-3 text-[11px] font-semibold tracking-widest text-emerald-100/40 uppercase">
            {unit?.type === "STORE_DELIVERY" ? "Loja e Delivery" : "Assistência Técnica"}
          </p>
          <p className="px-3 pt-1 pb-3 text-xs text-emerald-50/60">{unit?.name}</p>
          {items.map(([href, label, Icon]) => {
            const active = path === href || (href !== "/financeiro" && path.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-emerald-50/70 transition hover:bg-white/8 hover:text-white",
                  active && "bg-white/12 font-semibold text-white",
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-emerald-50/40">Sincro · ambiente seguro</div>
      </aside>
    </>
  );
}
