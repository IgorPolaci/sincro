import { z } from "zod";
export const inventoryMovementSchema = z.object({
  productId: z.uuid(), type: z.enum(["INITIAL","PURCHASE","RETURN","ADJUSTMENT","ENTRY","EXIT"]),
  quantity: z.coerce.number().refine((v) => v !== 0, "Quantidade não pode ser zero"), reason: z.string().trim().min(3).max(500),
});
