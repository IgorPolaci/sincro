import { z } from "zod";

const paymentMethod = z.enum(["CASH", "PIX", "CREDIT_CARD", "DEBIT_CARD"]);
export const publicOrderSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .regex(/^[a-z0-9-]+$/),
    customerName: z.string().trim().min(2).max(150),
    customerPhone: z.string().trim().min(8).max(30),
    fulfillment: z.enum(["DELIVERY", "PICKUP", "LOCAL"]),
    deliveryZoneId: z.uuid().nullable(),
    address: z
      .object({
        street: z.string().trim().max(150),
        number: z.string().trim().max(30),
        complement: z.string().trim().max(100),
        neighborhood: z.string().trim().max(100),
      })
      .nullable(),
    paymentMethod,
    cashChangeFor: z.number().nonnegative().nullable(),
    couponCode: z.string().trim().max(50).optional(),
    notes: z.string().trim().max(500).optional(),
    items: z
      .array(
        z.object({
          product_id: z.uuid(),
          quantity: z.number().positive().max(999),
          option_ids: z.array(z.uuid()).max(50).default([]),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((value, context) => {
    if (value.fulfillment === "DELIVERY" && (!value.deliveryZoneId || !value.address?.street || !value.address.number))
      context.addIssue({ code: "custom", message: "Informe a área e o endereço de entrega." });
  });

export const transitionOrderSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  notes: z.string().trim().max(500).optional(),
  cashSessionId: z
    .union([z.uuid(), z.literal("")])
    .optional()
    .transform((value) => value || null),
});

export const deliverySettingsSchema = z.object({
  storeName: z.string().trim().min(2).max(150),
  minimumOrder: z.coerce.number().min(0).max(999999),
  whatsapp: z.string().trim().max(30).optional(),
  openingHours: z.string().trim().max(200).optional(),
  isOpen: z.boolean(),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  localEnabled: z.boolean(),
});
const timeValue = z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")]);
export const openingHoursSchema = z
  .object({
    days: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          openingTime: timeValue,
          closingTime: timeValue,
          closedAllDay: z.boolean(),
        }),
      )
      .length(7),
  })
  .superRefine((value, context) => {
    value.days.forEach((day, index) => {
      if (!day.closedAllDay && (!day.openingTime || !day.closingTime || day.openingTime >= day.closingTime))
        context.addIssue({
          code: "custom",
          path: ["days", index],
          message: "Informe um intervalo válido para todos os dias abertos.",
        });
    });
  });
export const storeClosureSchema = z.object({
  closureDate: z.iso.date(),
  reason: z.string().trim().max(200).optional(),
});
export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2).max(100),
  neighborhood: z.string().trim().min(2).max(100),
  fee: z.coerce.number().min(0).max(99999),
  minimumOrder: z.coerce.number().min(0).max(999999),
});
export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .transform((value) => value.toUpperCase()),
  discountType: z.enum(["PERCENT", "FIXED"]),
  discountValue: z.coerce.number().positive().max(999999),
  minimumOrder: z.coerce.number().min(0).max(999999),
  usageLimit: z
    .union([z.coerce.number().int().positive(), z.literal("")])
    .optional()
    .transform((value) => (value === "" ? null : (value ?? null))),
});
