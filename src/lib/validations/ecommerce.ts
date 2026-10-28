import { z } from "zod";

const optionalMoney = z
  .union([z.coerce.number().min(0).max(999999999), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? null : (value ?? null)));
const optionalDateTime = z
  .union([z.iso.datetime({ local: true }), z.literal("")])
  .optional()
  .transform((value) => value || null);
export const ecommerceProductSchema = z
  .object({
    listingId: z.uuid(),
    displayName: z.string().trim().min(2).max(180),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use somente letras minúsculas, números e hífens."),
    categoryId: z
      .union([z.uuid(), z.literal("")])
      .optional()
      .transform((value) => value || null),
    shortDescription: z.string().trim().max(300).optional(),
    description: z.string().trim().max(5000).optional(),
    onlinePrice: optionalMoney,
    promotionalPrice: optionalMoney,
    promotionStartsAt: optionalDateTime,
    promotionEndsAt: optionalDateTime,
    maxPerOrder: optionalMoney,
    sortOrder: z.coerce.number().int().min(-9999).max(9999),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(170).optional(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    availableForDelivery: z.boolean(),
    availableForPickup: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.onlinePrice !== null && value.promotionalPrice !== null && value.promotionalPrice > value.onlinePrice)
      context.addIssue({ code: "custom", message: "O preço promocional não pode superar o preço online." });
    if (value.promotionStartsAt && value.promotionEndsAt && value.promotionStartsAt >= value.promotionEndsAt)
      context.addIssue({ code: "custom", message: "O término da promoção deve ser posterior ao início." });
  });

export const createEcommerceProductSchema = z
  .object({
    name: z.string().trim().min(3).max(180),
    sku: z.string().trim().min(1).max(60),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(180)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use somente letras minúsculas, números e hífens."),
    displayName: z.string().trim().min(3).max(180),
    description: z.string().trim().max(5000).optional(),
    shortDescription: z.string().trim().max(300).optional(),
    categoryId: z
      .union([z.uuid(), z.literal("")])
      .optional()
      .transform((value) => value || null),
    costPrice: z.coerce.number().min(0).max(999999999),
    salePrice: z.coerce.number().min(0).max(999999999),
    onlinePrice: z.coerce.number().min(0).max(999999999),
    promotionalPrice: optionalMoney,
    minimumStock: z.coerce.number().min(0).max(999999999),
    unit: z.string().trim().min(1).max(10),
    maxPerOrder: optionalMoney,
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(170).optional(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.promotionalPrice !== null && value.promotionalPrice > value.onlinePrice)
      context.addIssue({ code: "custom", message: "O preço promocional não pode superar o preço online." });
  });

export const ecommerceCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});
export const optionGroupSchema = z
  .object({
    listingId: z.uuid(),
    name: z.string().trim().min(2).max(100),
    minimumSelections: z.coerce.number().int().min(0).max(20),
    maximumSelections: z.coerce.number().int().min(1).max(20),
    position: z.coerce.number().int().min(0).max(999),
  })
  .refine((value) => value.maximumSelections >= value.minimumSelections, {
    message: "O máximo deve ser maior ou igual ao mínimo.",
  });
export const ecommerceOptionSchema = z.object({
  groupId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  priceDelta: z.coerce.number().min(-999999).max(999999),
  position: z.coerce.number().int().min(0).max(999),
});
export const ecommerceImageSchema = z.object({
  listingId: z.uuid(),
  storagePath: z.string().trim().min(10).max(1000),
  altText: z.string().trim().max(180).optional(),
  isPrimary: z.boolean(),
});
export const ecommerceToggleSchema = z.object({
  id: z.uuid(),
  entity: z.enum(["GROUP", "OPTION", "IMAGE"]),
  active: z.boolean(),
});
export const storeAppearanceSchema = z.object({
  description: z.string().trim().max(1000).optional(),
  storeDescription: z.string().trim().max(5000).optional(),
  instagramHandle: z.string().trim().max(80).optional(),
  whatsappContact: z.string().trim().max(30).optional(),
  contactEmail: z.union([z.email(), z.literal("")]).optional(),
  contactPhone: z.string().trim().max(30).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
export const storeAssetSchema = z.object({
  assetType: z.enum(["LOGO", "BANNER"]),
  storagePath: z.string().trim().min(10).max(1000),
});
export const ecommerceSuggestionSchema = z
  .object({ listingId: z.uuid(), suggestedListingId: z.uuid(), active: z.boolean() })
  .refine((value) => value.listingId !== value.suggestedListingId, { message: "Selecione outro produto." });
