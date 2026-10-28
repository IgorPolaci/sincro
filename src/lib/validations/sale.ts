import { z } from "zod";
export const saleSchema = z.object({
  customerId: z.uuid().nullable(),
  cashSessionId: z.uuid().nullable().optional(),
  discount: z.number().nonnegative().max(999999999999).default(0),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(z.object({ product_id: z.uuid(), quantity: z.number().positive().max(999999999) })).min(1).max(200),
  payments: z.array(z.object({
    method: z.enum(["CASH","PIX","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","BOLETO","OTHER"]),
    amount: z.number().positive().max(999999999999),
    reference: z.string().trim().max(200).optional(),
  })).min(1).max(20),
});

export const cancelSaleSchema=z.object({
  saleId:z.uuid(),
  reason:z.string().trim().min(5,"Informe um motivo com ao menos 5 caracteres.").max(500),
  cashSessionId:z.union([z.uuid(),z.literal("")]).optional().transform(value=>value||null),
});

export type SaleInput=z.infer<typeof saleSchema>;
