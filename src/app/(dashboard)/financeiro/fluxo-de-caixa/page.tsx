import { ArrowDownRight,ArrowUpRight,Landmark } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency,formatDate } from "@/lib/utils";
import { CashMovementForm,CloseCashForm,OpenCashForm } from "@/features/cash/cash-forms";
import { calculateCashSummary } from "@/features/cash/calculate";

type Movement={id:string;type:string;amount:number|string;description:string;created_at:string};

export default async function CashFlowPage(){
  const [supabase,{current}]=await Promise.all([createClient(),getBusinessUnitContext()]);
  const unitId=current?.id??"00000000-0000-0000-0000-000000000000";
  const [{data:registers},{data:sessions}]=await Promise.all([
    supabase.from('cash_registers').select('id,name').eq('business_unit_id',unitId).eq('active',true).order('name'),
    supabase.from('cash_sessions').select('*').eq('business_unit_id',unitId).order('opened_at',{ascending:false}).limit(20),
  ]);
  const openSession=sessions?.find(session=>session.status==='OPEN')??null;
  const selectedSession=openSession??sessions?.[0]??null;
  const {data:movements}=selectedSession?await supabase.from('cash_movements').select('id,type,amount,description,created_at').eq('cash_session_id',selectedSession.id).order('created_at',{ascending:false}):{data:[]};
  const rows=(movements??[]) as Movement[];
  const summary=calculateCashSummary(rows);
  return <>
    <PageHeader title="Fluxo de caixa" description={`Caixa independente de ${current?.name??'unidade não selecionada'}.`}/>
    <section className="grid gap-4 md:grid-cols-3">
      <Card className="p-5"><Landmark className="h-5 w-5 text-primary"/><p className="mt-3 text-sm text-muted">Situação</p><div className="mt-2"><Badge tone={openSession?'success':'neutral'}>{openSession?'ABERTO':'FECHADO'}</Badge></div></Card>
      <Card className="p-5"><ArrowUpRight className="h-5 w-5 text-emerald-600"/><p className="mt-3 text-sm text-muted">Entradas da sessão</p><p className="mt-2 text-2xl font-bold">{formatCurrency(summary.entries)}</p></Card>
      <Card className="p-5"><ArrowDownRight className="h-5 w-5 text-red-600"/><p className="mt-3 text-sm text-muted">Saldo esperado</p><p className="mt-2 text-2xl font-bold">{formatCurrency(summary.balance)}</p><p className="mt-1 text-xs text-muted">Saídas: {formatCurrency(summary.exits)}</p></Card>
    </section>
    {!openSession&&registers?.[0]&&<Card className="p-6"><h2 className="mb-4 font-semibold">Abrir {registers[0].name}</h2><OpenCashForm registerId={registers[0].id}/></Card>}
    {openSession&&<div className="grid gap-4 lg:grid-cols-2"><Card className="p-6"><h2 className="mb-4 font-semibold">Suprimento ou sangria</h2><CashMovementForm sessionId={openSession.id}/></Card><Card className="p-6"><h2 className="mb-4 font-semibold">Fechamento</h2><CloseCashForm sessionId={openSession.id}/></Card></div>}
    <Card><div className="border-b px-5 py-4"><h2 className="font-semibold">Movimentações {selectedSession?`· ${formatDate(selectedSession.opened_at)}`:''}</h2></div>{rows.length?<div className="divide-y">{rows.map(row=><div key={row.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm"><div><p className="font-semibold">{row.description}</p><p className="text-xs text-muted">{row.type} · {formatDate(row.created_at)}</p></div><p className={Number(row.amount)<0?'font-semibold text-red-600':'font-semibold text-emerald-600'}>{formatCurrency(row.amount)}</p></div>)}</div>:<EmptyState title="Nenhuma movimentação" description="Abra o caixa para iniciar a operação deste segmento."/>}</Card>
  </>;
}
