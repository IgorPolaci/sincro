import { z } from "zod";

const optionalText=(max:number)=>z.string().trim().max(max).optional().transform(value=>value||undefined);

export const serviceOrderSchema=z.object({
  customerId:z.uuid('Selecione um cliente.'),
  equipmentName:z.string().trim().min(2,'Informe o equipamento.').max(120),
  brandName:optionalText(100),modelName:optionalText(100),serialNumber:optionalText(100),imei:optionalText(30),
  color:optionalText(50),voltage:optionalText(30),invoiceNumber:optionalText(60),accessories:optionalText(500),
  reportedDefect:z.string().trim().min(5,'Descreva o defeito relatado.').max(2000),
  visibleDamage:optionalText(2000),generalNotes:optionalText(3000),accessInstructions:optionalText(500),
  assignedTechnicianId:z.union([z.uuid(),z.literal('')]).optional().transform(value=>value||undefined),
  estimatedDeliveryAt:z.union([z.iso.datetime({local:true}),z.literal('')]).optional().transform(value=>value||undefined),
  isWarranty:z.preprocess(value=>value==='on'||value===true,z.boolean()),
  warrantyReferenceId:z.union([z.uuid(),z.literal('')]).optional().transform(value=>value||undefined),
});

export const serviceOrderStatusSchema=z.object({
  serviceOrderId:z.uuid(),statusCode:z.string().trim().regex(/^[A-Z_]+$/),note:optionalText(500),
});

export const serviceOrderServiceSchema=z.object({
  serviceOrderId:z.uuid(),description:z.string().trim().min(2).max(500),quantity:z.coerce.number().positive(),
  unitPrice:z.coerce.number().min(0),discount:z.coerce.number().min(0).default(0),
  warrantyDays:z.coerce.number().int().min(0).max(3650).default(90),
});

export const serviceOrderPartSchema=z.object({
  serviceOrderId:z.uuid(),productId:z.uuid('Selecione uma peça.'),quantity:z.coerce.number().positive(),
  unitPrice:z.coerce.number().min(0),discount:z.coerce.number().min(0).default(0),
});

export const serviceOrderItemRemovalSchema=z.object({
  serviceOrderId:z.uuid(),itemId:z.uuid(),itemType:z.enum(['SERVICE','PART']),reason:z.string().trim().min(3).max(500),
});

export const checklistItemSchema=z.object({serviceOrderId:z.uuid(),label:z.string().trim().min(2).max(200)});
export const checklistUpdateSchema=z.object({itemId:z.uuid(),serviceOrderId:z.uuid(),checked:z.preprocess(value=>value==='on'||value===true,z.boolean()),notes:optionalText(500)});
export const serviceOrderPhotoRegistrationSchema=z.object({
  serviceOrderId:z.uuid(),storagePath:z.string().trim().min(10).max(1000),caption:optionalText(300),
});
export const serviceOrderDocumentSchema=z.object({
  serviceOrderId:z.uuid(),type:z.enum(['ENTRY','QUOTE','RECEIPT','WARRANTY','TECHNICAL_REPORT']),
  paperFormat:z.enum(['A4','THERMAL_80','THERMAL_58']),
});
export const serviceOrderBillingSchema=z.object({
  serviceOrderId:z.uuid(),cashSessionId:z.uuid().nullable().optional(),
  payments:z.array(z.object({method:z.enum(['CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','BOLETO','OTHER']),amount:z.number().positive(),reference:optionalText(200)})).max(20),
});
export const serviceOrderRefundSchema=z.object({serviceOrderId:z.uuid(),reason:z.string().trim().min(5).max(500),cashSessionId:z.union([z.uuid(),z.literal('')]).optional().transform(value=>value||null)});

export type ServiceOrderInput=z.input<typeof serviceOrderSchema>;
