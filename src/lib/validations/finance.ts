import { z } from "zod";
export const payableSchema=z.object({supplierId:z.union([z.uuid(),z.literal('')]).optional().transform(value=>value||null),description:z.string().trim().min(3).max(300),category:z.string().trim().max(100).optional(),amount:z.coerce.number().positive().max(999999999999),dueDate:z.iso.date()});
export const settlePayableSchema=z.object({payableId:z.uuid(),paymentMethod:z.enum(['CASH','PIX','CREDIT_CARD','DEBIT_CARD','BANK_TRANSFER','BOLETO','OTHER']),cashSessionId:z.union([z.uuid(),z.literal('')]).optional().transform(value=>value||null)});
export const cancelPayableSchema=z.object({payableId:z.uuid(),reason:z.string().trim().min(5).max(500)});
