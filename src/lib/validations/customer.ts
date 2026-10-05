import { z } from "zod";

const optionalEmail = z.union([z.literal(""), z.email("E-mail inválido")]);
export const customerSchema = z.object({
  type: z.enum(["PERSON", "COMPANY"]),
  name: z.string().trim().min(3, "Informe ao menos 3 caracteres").max(160),
  legal_name: z.string().trim().max(180).optional(),
  document: z.string().trim().max(18).optional(),
  phone: z.string().trim().max(20).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  email: optionalEmail.optional(),
  notes: z.string().trim().max(2000).optional(),
});
export type CustomerInput = z.infer<typeof customerSchema>;
