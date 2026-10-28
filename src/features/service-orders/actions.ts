"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { can } from "@/lib/permissions";
import { checklistItemSchema,checklistUpdateSchema,serviceOrderBillingSchema,serviceOrderDocumentSchema,serviceOrderItemRemovalSchema,serviceOrderPartSchema,serviceOrderPhotoRegistrationSchema,serviceOrderRefundSchema,serviceOrderSchema,serviceOrderServiceSchema,serviceOrderStatusSchema } from "@/lib/validations/service-order";

export type ServiceOrderActionState={error?:string};
export type ServiceOrderBillingResult={error?:string;success?:string};

export async function createServiceOrder(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=serviceOrderSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const {current}=await getBusinessUnitContext();
  if(!current||current.type!=='TECHNICAL_ASSISTANCE')return {error:'Selecione o segmento Assistência Técnica.'};
  if(!(await can({businessUnitId:current.id},'service_order.create')))return {error:'Você não possui permissão para abrir O.S.'};
  const input=parsed.data;
  const supabase=await createClient();
  const {data,error}=await supabase.rpc('create_service_order',{
    p_business_unit_id:current.id,p_customer_id:input.customerId,p_equipment_name:input.equipmentName,
    p_reported_defect:input.reportedDefect,p_brand_name:input.brandName??undefined,p_model_name:input.modelName??undefined,
    p_serial_number:input.serialNumber??undefined,p_imei:input.imei??undefined,p_color:input.color??undefined,p_voltage:input.voltage??undefined,
    p_invoice_number:input.invoiceNumber??undefined,p_accessories:input.accessories??undefined,p_visible_damage:input.visibleDamage??undefined,
    p_general_notes:input.generalNotes??undefined,p_access_instructions:input.accessInstructions??undefined,
    p_assigned_technician_id:input.assignedTechnicianId??undefined,p_estimated_delivery_at:input.estimatedDeliveryAt??undefined,
    p_is_warranty:input.isWarranty,p_warranty_reference_id:input.warrantyReferenceId??undefined,
  });
  if(error)return {error:error.message.includes('Acesso negado')?'Você não possui permissão para abrir O.S.':'Não foi possível abrir a ordem de serviço.'};
  revalidatePath('/ordens-de-servico');
  redirect(`/ordens-de-servico/${data}`);
}

export async function changeServiceOrderStatus(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=serviceOrderStatusSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  if(!(await can({},'service_order.update')))return {error:'Você não possui permissão para alterar O.S.'};
  const supabase=await createClient();
  const {error}=await supabase.rpc('set_service_order_status',{p_service_order_id:parsed.data.serviceOrderId,p_status_code:parsed.data.statusCode,p_note:parsed.data.note??undefined});
  if(error)return {error:error.message.includes('motivo')?'Informe o motivo do cancelamento.':'Não foi possível alterar o status.'};
  revalidatePath('/ordens-de-servico');
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
  return {};
}

export async function billServiceOrder(input:unknown):Promise<ServiceOrderBillingResult>{
  const parsed=serviceOrderBillingSchema.safeParse(input);if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();const {error}=await supabase.rpc('bill_service_order',{p_service_order_id:parsed.data.serviceOrderId,p_payments:parsed.data.payments,p_cash_session_id:parsed.data.cashSessionId??undefined});
  if(error)return {error:error.message.includes('Estoque insuficiente')?error.message:error.message.includes('caixa')?error.message:error.message.includes('Pagamentos')?'A soma dos pagamentos deve ser igual ao restante da O.S.':'Não foi possível faturar a O.S.'};
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);revalidatePath('/ordens-de-servico');revalidatePath('/estoque');revalidatePath('/financeiro/fluxo-de-caixa');return {success:'O.S. faturada com estoque, caixa e financeiro atualizados.'};
}

export async function refundServiceOrder(_:ServiceOrderBillingResult,formData:FormData):Promise<ServiceOrderBillingResult>{
  const parsed=serviceOrderRefundSchema.safeParse(Object.fromEntries(formData));if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();const {error}=await supabase.rpc('reverse_service_order_billing',{p_service_order_id:parsed.data.serviceOrderId,p_reason:parsed.data.reason,p_cash_session_id:parsed.data.cashSessionId??undefined});
  if(error)return {error:error.message.includes('caixa')?error.message:'Não foi possível estornar a O.S.'};
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);revalidatePath('/ordens-de-servico');revalidatePath('/estoque');revalidatePath('/financeiro/fluxo-de-caixa');return {success:'Faturamento estornado e estoque revertido.'};
}

export async function addServiceOrderService(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=serviceOrderServiceSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();
  const {error}=await supabase.rpc('add_service_order_service',{p_service_order_id:parsed.data.serviceOrderId,p_description:parsed.data.description,p_quantity:parsed.data.quantity,p_unit_price:parsed.data.unitPrice,p_discount:parsed.data.discount,p_warranty_days:parsed.data.warrantyDays,p_service_id:null});
  if(error)return {error:error.message.includes('não permite')?'Esta O.S. não permite novos itens.':'Não foi possível adicionar o serviço.'};
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
  return {};
}

export async function addServiceOrderPart(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=serviceOrderPartSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();
  const {error}=await supabase.rpc('add_service_order_part',{p_service_order_id:parsed.data.serviceOrderId,p_product_id:parsed.data.productId,p_quantity:parsed.data.quantity,p_unit_price:parsed.data.unitPrice,p_discount:parsed.data.discount});
  if(error)return {error:error.message.includes('Estoque insuficiente')?'Estoque insuficiente no segmento Assistência Técnica.':error.message.includes('não permite')?'Esta O.S. não permite novos itens.':'Não foi possível adicionar a peça.'};
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
  return {};
}

export async function removeServiceOrderItem(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=serviceOrderItemRemovalSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();
  const {error}=await supabase.rpc('remove_service_order_item',{p_service_order_id:parsed.data.serviceOrderId,p_item_type:parsed.data.itemType,p_item_id:parsed.data.itemId,p_reason:parsed.data.reason});
  if(error)return {error:'Não foi possível remover o item.'};
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
  return {};
}

export async function addChecklistItem(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=checklistItemSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();
  const {error}=await supabase.rpc('add_service_order_checklist_item',{p_service_order_id:parsed.data.serviceOrderId,p_label:parsed.data.label});
  if(error)return {error:'Não foi possível adicionar o item ao check-list.'};
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
  return {};
}

export async function updateChecklistItem(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=checklistUpdateSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();
  const {error}=await supabase.rpc('set_service_order_checklist_item',{p_item_id:parsed.data.itemId,p_checked:parsed.data.checked,p_notes:parsed.data.notes??undefined});
  if(error)return {error:'Não foi possível atualizar o check-list.'};
  revalidatePath(`/ordens-de-servico/${parsed.data.serviceOrderId}`);
  return {};
}

export async function registerServiceOrderPhoto(input:unknown):Promise<ServiceOrderActionState>{
  const parsed=serviceOrderPhotoRegistrationSchema.safeParse(input);
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const {serviceOrderId,caption,storagePath}=parsed.data;
  const [{current},supabase]=await Promise.all([getBusinessUnitContext(),createClient()]);
  if(!current||current.type!=='TECHNICAL_ASSISTANCE')return {error:'Selecione Assistência Técnica.'};
  const [{data:org},{data:order}]=await Promise.all([supabase.rpc('current_organization_id'),supabase.from('service_orders').select('id').eq('id',serviceOrderId).eq('business_unit_id',current.id).maybeSingle()]);
  if(!org||!order)return {error:'Ordem de serviço não encontrada.'};
  const expectedPrefix=`${org}/${current.id}/${serviceOrderId}/`;
  if(!storagePath.startsWith(expectedPrefix))return {error:'Caminho da foto inválido.'};
  const {error}=await supabase.rpc('register_service_order_photo',{p_service_order_id:serviceOrderId,p_storage_path:storagePath,p_caption:caption??undefined});
  if(error)return {error:'Não foi possível vincular a foto à O.S.'};
  revalidatePath(`/ordens-de-servico/${serviceOrderId}`);
  return {};
}

export async function generateServiceOrderDocument(_:ServiceOrderActionState,formData:FormData):Promise<ServiceOrderActionState>{
  const parsed=serviceOrderDocumentSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient();
  const {error}=await supabase.rpc('record_service_order_document',{p_service_order_id:parsed.data.serviceOrderId,p_type:parsed.data.type,p_paper_format:parsed.data.paperFormat});
  if(error)return {error:'Não foi possível gerar o documento.'};
  const query=new URLSearchParams({type:parsed.data.type,format:parsed.data.paperFormat});
  redirect(`/ordens-de-servico/${parsed.data.serviceOrderId}/imprimir?${query}`);
}
