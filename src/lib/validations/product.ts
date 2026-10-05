import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().trim().min(1).max(60), name: z.string().trim().min(3).max(180),
  barcode: z.string().trim().max(80).optional(), description: z.string().trim().max(2000).optional(),
  cost_price: z.number().nonnegative(), sale_price: z.number().nonnegative(),
  minimum_stock: z.number().nonnegative(), unit: z.string().trim().min(1).max(10),
  location: z.string().trim().max(80).optional(), notes: z.string().trim().max(2000).optional(),
});
export type ProductInput = z.infer<typeof productSchema>;
