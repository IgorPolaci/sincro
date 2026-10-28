import { notFound } from "next/navigation";
import { PrintToolbar } from "@/features/service-orders/print-toolbar";
import { serviceOrderDocumentSchema } from "@/lib/validations/service-order";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatCurrency,formatDate } from "@/lib/utils";

const titles={ENTRY:'Entrada de ordem de serviço',QUOTE:'Orçamento',RECEIPT:'Recibo',WARRANTY:'Termo de garantia',TECHNICAL_REPORT:'Laudo técnico'} as const;
const paperClasses={A4:'print-sheet--a4',THERMAL_80:'print-sheet--80',THERMAL_58:'print-sheet--58'} as const;
type Item={id:string;description?:string;product_name?:string;quantity:number|string;unit_price:number|string;total:number|string};

export default async function PrintServiceOrderPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{type?:string;format?:string}>}){
  const [{id},query]=await Promise.all([params,searchParams]);
  const parsed=serviceOrderDocumentSchema.safeParse({serviceOrderId:id,type:query.type,paperFormat:query.format});
  if(!parsed.success)notFound();
  const [supabase,profile]=await Promise.all([createClient(),requireProfile()]);
  const {data:order}=await supabase.from('service_orders').select('*,customers(name,document,phone,whatsapp,email),profiles!service_orders_assigned_technician_id_fkey(name),service_order_statuses(name)').eq('id',id).single();
  if(!order)notFound();
  const [{data:services},{data:parts}]=await Promise.all([
    supabase.from('service_order_services').select('id,description,quantity,unit_price,total').eq('service_order_id',id).is('removed_at',null).order('created_at'),
    supabase.from('service_order_parts').select('id,product_name,quantity,unit_price,total').eq('service_order_id',id).is('removed_at',null).order('created_at'),
  ]);
  const organization=profile.organizations as unknown as {name:string}|null;
  const customer=order.customers as unknown as {name:string;document:string|null;phone:string|null;whatsapp:string|null;email:string|null};
  const technician=order.profiles as unknown as {name:string}|null;
  const status=order.service_order_statuses as unknown as {name:string};
  const documentType=parsed.data.type;
  const compact=parsed.data.paperFormat!=='A4';
  return <div className="print-document">
    <PrintToolbar/>
    <article className={`print-sheet ${paperClasses[parsed.data.paperFormat]}`}>
      <header className="border-b-2 border-slate-900 pb-4 text-center"><h1 className={compact?'text-lg font-bold':'text-2xl font-bold'}>{organization?.name??'Sincro'}</h1><p className="mt-1 text-xs uppercase tracking-widest">{titles[documentType]}</p><p className="mt-2 font-bold">{order.number}</p></header>
      <section className="mt-5 grid grid-cols-2 gap-3 text-sm"><PrintInfo label="Cliente" value={customer.name}/><PrintInfo label="CPF/CNPJ" value={customer.document}/><PrintInfo label="Contato" value={customer.whatsapp||customer.phone}/><PrintInfo label="Entrada" value={formatDate(order.created_at)}/><PrintInfo label="Equipamento" value={order.equipment_name}/><PrintInfo label="Marca / modelo" value={[order.brand_name,order.model_name].filter(Boolean).join(' ')}/><PrintInfo label="Série" value={order.serial_number}/><PrintInfo label="IMEI" value={order.imei}/><PrintInfo label="Status" value={status.name}/><PrintInfo label="Técnico" value={technician?.name}/></section>
      {(documentType==='ENTRY'||documentType==='TECHNICAL_REPORT')&&<section className="mt-5 space-y-3 border-t pt-4 text-sm"><PrintInfo label="Defeito relatado" value={order.reported_defect}/><PrintInfo label="Avarias visíveis" value={order.visible_damage}/><PrintInfo label="Acessórios" value={order.accessories}/><PrintInfo label={documentType==='TECHNICAL_REPORT'?'Laudo / observações técnicas':'Observações'} value={order.general_notes}/></section>}
      {(documentType==='QUOTE'||documentType==='RECEIPT'||documentType==='WARRANTY')&&<section className="mt-5 border-t pt-4"><DocumentItems title="Serviços" items={(services??[]) as Item[]}/><DocumentItems title="Peças" items={(parts??[]) as Item[]}/><div className="mt-4 space-y-1 border-t pt-3 text-right text-sm"><p>Serviços: {formatCurrency(order.service_total)}</p><p>Peças: {formatCurrency(order.parts_total)}</p><p>Desconto: {formatCurrency(order.discount)}</p><p className="text-base font-bold">Total: {formatCurrency(order.total)}</p>{documentType==='RECEIPT'&&<><p>Adiantamento: {formatCurrency(order.advance_amount)}</p><p className="font-bold">Restante: {formatCurrency(Number(order.total)-Number(order.advance_amount))}</p></>}</div></section>}
      {documentType==='WARRANTY'&&<section className="mt-5 border-t pt-4 text-xs leading-relaxed"><p>A garantia cobre exclusivamente os serviços e peças descritos neste documento, conforme condições informadas no atendimento. Danos por mau uso, líquidos, quedas, violação ou intervenção de terceiros não estão cobertos.</p>{order.warranty_until&&<p className="mt-2 font-bold">Garantia válida até {formatDate(order.warranty_until)}.</p>}</section>}
      <section className="mt-10 grid grid-cols-2 gap-8 text-center text-xs"><div className="border-t pt-2">Responsável pela empresa</div><div className="border-t pt-2">{customer.name}</div></section>
      <footer className="mt-8 border-t pt-3 text-center text-[10px] text-slate-500">Documento gerado em {new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date())} · {order.number}</footer>
    </article>
  </div>;
}

function PrintInfo({label,value}:{label:string;value:unknown}){return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-0.5 whitespace-pre-wrap">{String(value||'—')}</p></div>}
function DocumentItems({title,items}:{title:string;items:Item[]}){if(!items.length)return null;return <div className="mb-4"><h2 className="mb-2 text-sm font-bold">{title}</h2><table className="w-full text-xs"><thead><tr className="border-b text-left"><th className="py-1">Descrição</th><th>Qtd.</th><th>Unit.</th><th className="text-right">Total</th></tr></thead><tbody>{items.map(item=><tr key={item.id} className="border-b"><td className="py-1.5">{item.description??item.product_name}</td><td>{item.quantity}</td><td>{formatCurrency(item.unit_price)}</td><td className="text-right">{formatCurrency(item.total)}</td></tr>)}</tbody></table></div>}
