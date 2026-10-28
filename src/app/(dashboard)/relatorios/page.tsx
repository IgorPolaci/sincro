import Link from "next/link";
import { Download,TrendingUp,Receipt,PackageMinus,Clock3 } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency } from "@/lib/utils";

const filtersSchema=z.object({scope:z.enum(["current","all"]).catch("current"),from:z.iso.date().optional(),to:z.iso.date().optional()});
type AmountRow={total:number|string};

export default async function ReportsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const raw=await searchParams;const now=new Date();const startDefault=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10);const parsed=filtersSchema.parse(raw);const from=parsed.from??startDefault;const to=parsed.to??now.toISOString().slice(0,10);const toIso=`${to}T23:59:59.999Z`;
  const [supabase,{current,units}]=await Promise.all([createClient(),getBusinessUnitContext()]);const unitIds=parsed.scope==="all"?units.map(unit=>unit.id):current?[current.id]:[];const scopedIds=unitIds.length?unitIds:["00000000-0000-0000-0000-000000000000"];
  const [salesResult,ordersResult,osResult,inventoryResult,receivableResult]=await Promise.all([
    supabase.from("sales").select("total,business_unit_id").eq("status","COMPLETED").gte("created_at",`${from}T00:00:00Z`).lte("created_at",toIso).in("business_unit_id",scopedIds),
    supabase.from("online_orders").select("total,business_unit_id").eq("status","DELIVERED").gte("delivered_at",`${from}T00:00:00Z`).lte("delivered_at",toIso).in("business_unit_id",scopedIds),
    supabase.from("service_orders").select("total,business_unit_id,service_order_statuses!inner(code)").in("service_order_statuses.code",["FATURADO","FECHADO"]).gte("updated_at",`${from}T00:00:00Z`).lte("updated_at",toIso).in("business_unit_id",scopedIds),
    supabase.from("inventory").select("quantity,products!inner(minimum_stock)").in("business_unit_id",scopedIds),
    supabase.from("accounts_receivable").select("amount,status").in("status",["PENDING","PARTIAL","OVERDUE"]).in("business_unit_id",scopedIds),
  ]);
  const sales=[...(salesResult.data??[]),...(ordersResult.data??[]),...(osResult.data??[])] as AmountRow[];const revenue=sales.reduce((sum,row)=>sum+Number(row.total),0);const ticket=sales.length?revenue/sales.length:0;const lowStock=(inventoryResult.data??[]).filter(row=>Number(row.quantity)<=Number((row.products as unknown as {minimum_stock:number}).minimum_stock)).length;const pending=(receivableResult.data??[]).reduce((sum,row)=>sum+Number(row.amount),0);
  const params=new URLSearchParams({scope:parsed.scope,from,to});
  return <><PageHeader title="Relatórios" description="Indicadores por unidade ou visão consolidada, com exportação auditada." action={<Link href={`/api/relatorios/vendas.csv?${params}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white"><Download className="h-4 w-4"/>Exportar CSV</Link>}/><Card className="p-5"><form className="grid gap-4 sm:grid-cols-4 sm:items-end"><label className="text-sm font-medium">Visão<select name="scope" defaultValue={parsed.scope} className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="current">Unidade atual</option><option value="all">Consolidado</option></select></label><label className="text-sm font-medium">De<input name="from" type="date" defaultValue={from} className="mt-2 h-10 w-full rounded-lg border bg-white px-3"/></label><label className="text-sm font-medium">Até<input name="to" type="date" defaultValue={to} className="mt-2 h-10 w-full rounded-lg border bg-white px-3"/></label><button className="h-10 rounded-lg border bg-white px-4 text-sm font-semibold">Aplicar filtros</button></form></Card><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<TrendingUp/>} label="Faturamento" value={formatCurrency(revenue)}/><Metric icon={<Receipt/>} label="Operações faturadas" value={String(sales.length)}/><Metric icon={<Receipt/>} label="Ticket médio" value={formatCurrency(ticket)}/><Metric icon={<Clock3/>} label="A receber em aberto" value={formatCurrency(pending)}/></section><Card className="p-6"><div className="flex items-start gap-4"><span className="rounded-lg bg-amber-50 p-3 text-amber-700"><PackageMinus/></span><div><p className="text-sm text-muted">Produtos no mínimo ou abaixo</p><p className="mt-1 text-2xl font-bold">{lowStock}</p><p className="mt-2 text-xs text-muted">Escopo: {parsed.scope==="all"?"todas as unidades":current?.name??"unidade atual"} · período de {from} a {to}.</p></div></div></Card></>;
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <Card className="p-5"><span className="text-primary">{icon}</span><p className="mt-3 text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></Card>}
