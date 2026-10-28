import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { PageHeader } from "@/components/shared/page-header";
import { SearchBar } from "@/components/shared/search-bar";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Sale={id:string;number:string;status:string;total:number|string;created_at:string;customer_id:string|null};

export const metadata={title:"Vendas"};

export default async function SalesPage({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){
  const {q="",page="1"}=await searchParams;
  const currentPage=Math.max(1,Number(page)||1);
  const [supabase,{current}]=await Promise.all([createClient(),getBusinessUnitContext()]);
  const unitId=current?.id??"00000000-0000-0000-0000-000000000000";
  let query=supabase.from("sales").select("id,number,status,total,created_at,customer_id",{count:"exact"}).eq("business_unit_id",unitId).order("created_at",{ascending:false}).range((currentPage-1)*25,currentPage*25-1);
  if(q)query=query.ilike("number",`%${q}%`);
  const {data,count}=await query;
  const sales=(data??[]) as Sale[];
  const customerIds=[...new Set(sales.flatMap(sale=>sale.customer_id?[sale.customer_id]:[]))];
  const {data:customers}=customerIds.length?await supabase.from("customers").select("id,name").in("id",customerIds):{data:[]};
  const customerNames=new Map((customers??[]).map(customer=>[customer.id,customer.name]));
  return <>
    <PageHeader title="Vendas" description={`PDV e histórico de ${current?.name??"unidade não selecionada"}.`} action={<Link href="/vendas/nova" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4"/>Nova venda</Link>}/>
    <Card><div className="p-4"><SearchBar placeholder="Número da venda" defaultValue={q}/></div>{sales.length?<div className="divide-y">{sales.map(sale=><Link href={`/vendas/${sale.id}`} key={sale.id} className="grid gap-3 px-5 py-4 text-sm transition hover:bg-slate-50 sm:grid-cols-[1fr_140px_140px] sm:items-center"><div><p className="font-semibold">Venda {sale.number}</p><p className="mt-1 text-xs text-muted">{sale.customer_id?customerNames.get(sale.customer_id)??"Cliente":"Consumidor não identificado"} · {formatDate(sale.created_at)}</p></div><div><Badge tone={sale.status==="COMPLETED"?"success":"danger"}>{sale.status==="COMPLETED"?"CONCLUÍDA":"CANCELADA"}</Badge></div><p className="text-right font-semibold">{formatCurrency(sale.total)}</p></Link>)}</div>:<EmptyState title="Nenhuma venda encontrada" description="Inicie uma nova venda no PDV desta unidade."/>}<Pagination page={currentPage} total={count??0} q={q}/></Card>
  </>;
}
