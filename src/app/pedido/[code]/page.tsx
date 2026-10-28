import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCurrency,formatDate } from "@/lib/utils";

type PublicOrder={number:string;code:string;customer_name:string;status:string;fulfillment:string;total:number|string;created_at:string;updated_at:string};
const labels:Record<string,string>={NEW:"Recebido",CONFIRMED:"Confirmado",PREPARING:"Em preparação",READY:"Pronto",OUT_FOR_DELIVERY:"Saiu para entrega",DELIVERED:"Entregue",CANCELLED:"Cancelado"};
export default async function TrackOrderPage({params}:{params:Promise<{code:string}>}){const {code}=await params;const supabase=await createClient();const {data}=await supabase.rpc("get_public_order",{p_code:code});if(!data)notFound();const order=data as PublicOrder;return <main className="mx-auto flex min-h-screen max-w-xl items-center p-5"><div className="w-full rounded-2xl border bg-white p-8 shadow-sm"><p className="text-sm text-muted">Pedido {order.number}</p><h1 className="mt-2 text-2xl font-bold">Olá, {order.customer_name}</h1><div className="mt-6 rounded-xl bg-slate-50 p-5"><Badge tone={order.status==="CANCELLED"?"danger":order.status==="DELIVERED"?"success":"warning"}>{labels[order.status]??order.status}</Badge><p className="mt-3 text-sm text-muted">Última atualização em {formatDate(order.updated_at)}</p></div><div className="mt-6 flex justify-between border-t pt-5"><span>Total</span><strong>{formatCurrency(order.total)}</strong></div></div></main>}
