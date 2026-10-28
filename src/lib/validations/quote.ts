import { z } from "zod";
export const quoteSchema=z.object({customerId:z.uuid(),discount:z.number().nonnegative().max(999999999),validUntil:z.union([z.iso.date(),z.literal("")]).optional(),notes:z.string().trim().max(1000).optional(),items:z.array(z.object({product_id:z.uuid(),quantity:z.number().positive().max(999999)})).min(1).max(200)});
export const quoteStatusSchema=z.object({quoteId:z.uuid(),status:z.enum(["SENT","APPROVED","REJECTED","EXPIRED","CANCELLED"])});
export const quoteConversionSchema=z.object({quoteId:z.uuid(),method:z.enum(["CASH","PIX","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","BOLETO","OTHER"]),amount:z.coerce.number().positive(),reference:z.string().trim().max(200).optional(),cashSessionId:z.union([z.uuid(),z.literal("")]).optional().transform(value=>value||null)});
