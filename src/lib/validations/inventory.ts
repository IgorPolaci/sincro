import { z } from "zod";
export const inventoryMovementSchema = z.object({
  productId: z.uuid(), type: z.enum(["INITIAL","PURCHASE","RETURN","ADJUSTMENT","ENTRY","EXIT"]),
  quantity: z.coerce.number().refine((v) => v !== 0, "Quantidade não pode ser zero"), reason: z.string().trim().min(3).max(500),
});
export const inventoryTransferSchema=z.object({
  productId:z.uuid(),toBusinessUnitId:z.uuid(),quantity:z.coerce.number().positive().max(999999999),reason:z.string().trim().min(3).max(500),
});
