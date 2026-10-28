"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { can } from "@/lib/permissions";
import { cancelSaleSchema, saleSchema } from "@/lib/validations/sale";

export type SaleActionResult={error?:string;saleId?:string};
export type CancelSaleState={error?:string;success?:string};

export async function completeSale(input:unknown):Promise<SaleActionResult>{
  const parsed=saleSchema.safeParse(input);
  if(!parsed.success)return {error:parsed.error.issues[0]?.message??"Revise os dados da venda."};
  const {current}=await getBusinessUnitContext();
  if(!current)return {error:"Selecione uma unidade operacional."};
  if(!(await can({businessUnitId:current.id},"sale.create")))return {error:"Você não possui permissão para concluir vendas."};
  const supabase=await createClient();
  const {data,error}=await supabase.rpc("complete_sale",{
    p_business_unit_id:current.id,
    p_customer_id:parsed.data.customerId ?? undefined,
    p_items:parsed.data.items,
    p_payments:parsed.data.payments,
    p_discount:parsed.data.discount,
    p_notes:parsed.data.notes||undefined,
    p_cash_session_id:parsed.data.cashSessionId??undefined,
  });
  if(error)return {error:mapSaleError(error.message)};
  revalidatePath("/vendas");
  revalidatePath("/estoque");
  revalidatePath("/financeiro/fluxo-de-caixa");
  revalidatePath("/dashboard");
  return {saleId:String(data)};
}

export async function cancelSale(_:CancelSaleState,formData:FormData):Promise<CancelSaleState>{
  const parsed=cancelSaleSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message??"Revise o cancelamento."};
  if(!(await can({},"sale.cancel")))return {error:"Você não possui permissão para cancelar vendas."};
  const supabase=await createClient();
  const {error}=await supabase.rpc("cancel_sale",{
    p_sale_id:parsed.data.saleId,
    p_reason:parsed.data.reason,
    p_cash_session_id:parsed.data.cashSessionId ?? undefined,
  });
  if(error)return {error:mapSaleError(error.message)};
  revalidatePath(`/vendas/${parsed.data.saleId}`);
  revalidatePath("/vendas");
  revalidatePath("/estoque");
  revalidatePath("/financeiro/fluxo-de-caixa");
  revalidatePath("/dashboard");
  return {success:"Venda cancelada, estoque revertido e financeiro atualizado."};
}

function mapSaleError(message:string){
  if(message.includes("Estoque insuficiente"))return message;
  if(message.includes("caixa")||message.includes("Caixa")||message.includes("Sessão"))return message;
  if(message.includes("Pagamentos não conferem"))return "A soma dos pagamentos deve ser igual ao total da venda.";
  if(message.includes("Somente vendas"))return "Esta venda não pode mais ser cancelada.";
  if(message.includes("Acesso negado"))return "Seu perfil não possui permissão para esta operação.";
  return "Não foi possível concluir a operação de venda.";
}
