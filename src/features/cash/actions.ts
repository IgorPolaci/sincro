"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { can } from "@/lib/permissions";

export type CashActionState={error?:string;success?:string};

const money=z.coerce.number().min(0).max(999999999999);
const openSchema=z.object({cashRegisterId:z.uuid(),openingBalance:money});
const movementSchema=z.object({cashSessionId:z.uuid(),type:z.enum(['SUPPLY','WITHDRAWAL']),amount:money.positive(),description:z.string().trim().min(3).max(200)});
const closeSchema=z.object({cashSessionId:z.uuid(),closingBalance:money,notes:z.string().trim().max(500).optional()});

export async function openCashSession(_:CashActionState,formData:FormData):Promise<CashActionState>{
  const parsed=openSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const {current}=await getBusinessUnitContext();
  if(!current)return {error:'Selecione uma unidade operacional.'};
  if(!(await can({businessUnitId:current.id},'cash.manage')))return {error:'Você não possui permissão para operar o caixa.'};
  const supabase=await createClient();
  const {error}=await supabase.rpc('open_cash_session',{p_business_unit_id:current.id,p_cash_register_id:parsed.data.cashRegisterId,p_opening_balance:parsed.data.openingBalance});
  if(error)return {error:error.message.includes('já possui')?'Este caixa já está aberto.':'Não foi possível abrir o caixa.'};
  revalidatePath('/financeiro/fluxo-de-caixa');
  return {success:'Caixa aberto com sucesso.'};
}

export async function recordCashMovement(_:CashActionState,formData:FormData):Promise<CashActionState>{
  const parsed=movementSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  if(!(await can({},'cash.manage')))return {error:'Você não possui permissão para operar o caixa.'};
  const supabase=await createClient();
  const {error}=await supabase.rpc('record_cash_movement',{p_cash_session_id:parsed.data.cashSessionId,p_type:parsed.data.type,p_amount:parsed.data.amount,p_description:parsed.data.description});
  if(error)return {error:'Não foi possível registrar a movimentação.'};
  revalidatePath('/financeiro/fluxo-de-caixa');
  return {success:'Movimentação registrada.'};
}

export async function closeCashSession(_:CashActionState,formData:FormData):Promise<CashActionState>{
  const parsed=closeSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  if(!(await can({},'cash.manage')))return {error:'Você não possui permissão para operar o caixa.'};
  const supabase=await createClient();
  const {error}=await supabase.rpc('close_cash_session',{p_cash_session_id:parsed.data.cashSessionId,p_closing_balance:parsed.data.closingBalance,p_notes:parsed.data.notes||undefined});
  if(error)return {error:'Não foi possível fechar o caixa.'};
  revalidatePath('/financeiro/fluxo-de-caixa');
  return {success:'Caixa fechado e conferido.'};
}
