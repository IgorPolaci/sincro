import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CancelSaleForm } from "@/features/sales/cancel-sale-form";
import { formatCurrency, formatDate } from "@/lib/utils";

type Sale={id:string;number:string;customer_id:string|null;status:string;subtotal:number|string;discount:number|string;total:number|string;notes:string|null;created_at:string;cancelled_at:string|null;cancellation_reason:string|null};
type Item={id:string;product_name:string;sku:string|null;quantity:number|string;unit_price:number|string;total:number|string};
type Payment={id:string;method:string;amount:number|string;status:string;reference:string|null};
const paymentLabels:Record<string,string>={CASH:"Dinheiro",PIX:"Pix",CREDIT_CARD:"Cartão de crédito",DEBIT_CARD:"Cartão de débito",BANK_TRANSFER:"Transferência",BOLETO:"Boleto",OTHER:"Outro"};

export default async function SaleDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const [supabase,{current}]=await Promise.all([createClient(),getBusinessUnitContext()]);
  const unitId=current?.id??"00000000-0000-0000-0000-000000000000";
  const {data}=await supabase.from("sales").select("id,number,customer_id,status,subtotal,discount,total,notes,created_at,cancelled_at,cancellation_reason").eq("id",id).eq("business_unit_id",unitId).maybeSingle();
  if(!data)notFound();
  const sale=data as Sale;
  const [{data:items},{data:payments},{data:customer},{data:sessions}]=await Promise.all([
    supabase.from("sale_items").select("id,product_name,sku,quantity,unit_price,total").eq("sale_id",id).order("product_name"),
    supabase.from("payments").select("id,method,amount,status,reference").eq("sale_id",id),
    sale.customer_id?supabase.from("customers").select("name").eq("id",sale.customer_id).maybeSingle():Promise.resolve({data:null}),
    supabase.from("cash_sessions").select("id").eq("business_unit_id",unitId).eq("status","OPEN").limit(1),
  ]);
  const paymentRows=(payments??[]) as Payment[];
  return <>
    <PageHeader title={`Venda ${sale.number}`} description={`${customer?.name??"Consumidor não identificado"} · ${formatDate(sale.created_at)}`} action={<Badge tone={sale.status==="COMPLETED"?"success":"danger"}>{sale.status==="COMPLETED"?"CONCLUÍDA":"CANCELADA"}</Badge>}/>
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5"><Card><div className="border-b px-5 py-4"><h2 className="font-semibold">Itens</h2></div><div className="divide-y">{((items??[]) as Item[]).map(item=><div key={item.id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_100px_120px]"><div><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted">{item.sku||"Sem SKU"} · {formatCurrency(item.unit_price)} por unidade</p></div><p>{Number(item.quantity)} un.</p><p className="text-right font-semibold">{formatCurrency(item.total)}</p></div>)}</div></Card>
        {sale.status==="CANCELLED"&&<Card className="border-red-200 bg-red-50 p-5"><h2 className="font-semibold text-red-800">Venda cancelada</h2><p className="mt-2 text-sm text-red-700">{sale.cancellation_reason}</p><p className="mt-1 text-xs text-red-600">{formatDate(sale.cancelled_at)}</p></Card>}
        {sale.notes&&<Card className="p-5"><h2 className="font-semibold">Observações</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted">{sale.notes}</p></Card>}
      </div>
      <aside className="space-y-5"><Card className="p-5"><h2 className="font-semibold">Totais</h2><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatCurrency(sale.subtotal)}</dd></div><div className="flex justify-between"><dt className="text-muted">Desconto</dt><dd>- {formatCurrency(sale.discount)}</dd></div><div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>Total</dt><dd>{formatCurrency(sale.total)}</dd></div></dl></Card>
        <Card className="p-5"><h2 className="font-semibold">Pagamentos</h2><div className="mt-3 space-y-3">{paymentRows.map(payment=><div key={payment.id} className="flex justify-between gap-3 text-sm"><div><p>{paymentLabels[payment.method]??payment.method}</p>{payment.reference&&<p className="text-xs text-muted">{payment.reference}</p>}</div><p className="font-medium">{formatCurrency(payment.amount)}</p></div>)}</div></Card>
        {sale.status==="COMPLETED"&&<Card className="p-5"><h2 className="mb-4 font-semibold">Cancelamento</h2><CancelSaleForm saleId={sale.id} cashSessionId={sessions?.[0]?.id??null} hasCashPayment={paymentRows.some(payment=>payment.method==="CASH"&&payment.status==="PAID")}/></Card>}
      </aside>
    </div>
  </>;
}
