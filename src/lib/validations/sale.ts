import { z } from "zod";
export const saleSchema = z.object({
  customerId: z.uuid().nullable(), discount: z.number().nonnegative().default(0), notes: z.string().max(1000).optional(),
  items: z.array(z.object({ product_id: z.uuid(), quantity: z.number().positive() })).min(1),
  payments: z.array(z.object({ method: z.enum(["CASH","PIX","CREDIT_CARD","DEBIT_CARD","BANK_TRANSFER","BOLETO","OTHER"]), amount: z.number().positive(), reference: z.string().optional() })).min(1),
});
