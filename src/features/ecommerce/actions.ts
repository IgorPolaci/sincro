"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import {
  createEcommerceProductSchema,
  ecommerceCategorySchema,
  ecommerceImageSchema,
  ecommerceOptionSchema,
  ecommerceProductSchema,
  ecommerceSuggestionSchema,
  ecommerceToggleSchema,
  optionGroupSchema,
  storeAppearanceSchema,
  storeAssetSchema,
} from "@/lib/validations/ecommerce";

export type EcommerceState = { error?: string; success?: string };
export type EcommerceCreateResult = EcommerceState & { listingId?: string };
async function context() {
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  if (current?.type !== "STORE_DELIVERY") return null;
  const { data: organizationId } = await supabase.rpc("current_organization_id");
  return organizationId ? { supabase, current, organizationId } : null;
}

export async function createEcommerceProduct(input: unknown): Promise<EcommerceCreateResult> {
  const parsed = createEcommerceProductSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const value = parsed.data;
  const { data, error } = await ctx.supabase.rpc("create_ecommerce_product", {
    p_input: {
      business_unit_id: ctx.current.id,
      name: value.name,
      sku: value.sku,
      slug: value.slug,
      display_name: value.displayName,
      description: value.description ?? "",
      short_description: value.shortDescription ?? "",
      category_id: value.categoryId ?? "",
      cost_price: value.costPrice,
      sale_price: value.salePrice,
      online_price: value.onlinePrice,
      promotional_price: value.promotionalPrice ?? "",
      minimum_stock: value.minimumStock,
      unit: value.unit,
      max_per_order: value.maxPerOrder ?? "",
      seo_title: value.seoTitle ?? "",
      seo_description: value.seoDescription ?? "",
      is_published: value.isPublished,
      is_featured: value.isFeatured,
    },
  });
  if (error)
    return {
      error:
        error.code === "23505" ? "SKU ou endereço do produto já cadastrado." : "Não foi possível cadastrar o produto.",
    };
  const result = data as { listing_id: string };
  revalidatePath("/ecommerce");
  revalidatePath("/ecommerce/produtos");
  return { success: "Produto cadastrado.", listingId: result.listing_id };
}

export async function saveEcommerceProduct(_: EcommerceState, formData: FormData): Promise<EcommerceState> {
  const parsed = ecommerceProductSchema.safeParse({
    ...Object.fromEntries(formData),
    isPublished: formData.get("isPublished") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    availableForDelivery: formData.get("availableForDelivery") === "on",
    availableForPickup: formData.get("availableForPickup") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const value = parsed.data;
  const { error } = await ctx.supabase
    .from("ecommerce_products")
    .update({
      display_name: value.displayName,
      slug: value.slug,
      category_id: value.categoryId,
      short_description: value.shortDescription || null,
      description: value.description || null,
      online_price: value.onlinePrice,
      promotional_price: value.promotionalPrice,
      promotion_starts_at: value.promotionStartsAt,
      promotion_ends_at: value.promotionEndsAt,
      max_per_order: value.maxPerOrder,
      sort_order: value.sortOrder,
      seo_title: value.seoTitle || null,
      seo_description: value.seoDescription || null,
      is_published: value.isPublished,
      published_at: value.isPublished ? new Date().toISOString() : null,
      is_featured: value.isFeatured,
      available_for_delivery: value.availableForDelivery,
      available_for_pickup: value.availableForPickup,
    })
    .eq("id", value.listingId)
    .eq("business_unit_id", ctx.current.id);
  if (error)
    return {
      error:
        error.code === "23505"
          ? "Já existe outro produto com este endereço (slug)."
          : "Não foi possível salvar a publicação.",
    };
  revalidatePath("/ecommerce");
  revalidatePath("/ecommerce/produtos");
  revalidatePath(`/ecommerce/produtos/${value.listingId}`);
  return { success: "Produto atualizado na loja online." };
}
export async function createEcommerceCategory(_: EcommerceState, formData: FormData): Promise<EcommerceState> {
  const parsed = ecommerceCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const { error } = await ctx.supabase
    .from("product_categories")
    .insert({
      organization_id: ctx.organizationId,
      name: parsed.data.name,
      description: parsed.data.description || null,
    });
  if (error)
    return { error: error.code === "23505" ? "Esta categoria já existe." : "Não foi possível criar a categoria." };
  revalidatePath("/ecommerce");
  revalidatePath("/ecommerce/produtos");
  return { success: "Categoria criada." };
}
export async function createOptionGroup(_: EcommerceState, formData: FormData): Promise<EcommerceState> {
  const parsed = optionGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const { data: listing } = await ctx.supabase
    .from("ecommerce_products")
    .select("id")
    .eq("id", parsed.data.listingId)
    .eq("business_unit_id", ctx.current.id)
    .maybeSingle();
  if (!listing) return { error: "Produto não encontrado." };
  const { error } = await ctx.supabase
    .from("ecommerce_option_groups")
    .insert({
      organization_id: ctx.organizationId,
      ecommerce_product_id: listing.id,
      name: parsed.data.name,
      minimum_selections: parsed.data.minimumSelections,
      maximum_selections: parsed.data.maximumSelections,
      position: parsed.data.position,
    });
  if (error) return { error: "Não foi possível criar o grupo." };
  revalidatePath(`/ecommerce/produtos/${listing.id}`);
  return { success: "Grupo de opções criado." };
}
export async function createEcommerceOption(_: EcommerceState, formData: FormData): Promise<EcommerceState> {
  const parsed = ecommerceOptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const { data: group } = await ctx.supabase
    .from("ecommerce_option_groups")
    .select("id,ecommerce_product_id,ecommerce_products!inner(business_unit_id)")
    .eq("id", parsed.data.groupId)
    .eq("ecommerce_products.business_unit_id", ctx.current.id)
    .maybeSingle();
  if (!group) return { error: "Grupo não encontrado." };
  const { error } = await ctx.supabase
    .from("ecommerce_options")
    .insert({
      organization_id: ctx.organizationId,
      option_group_id: group.id,
      name: parsed.data.name,
      price_delta: parsed.data.priceDelta,
      position: parsed.data.position,
    });
  if (error) return { error: "Não foi possível criar a opção." };
  revalidatePath(`/ecommerce/produtos/${group.ecommerce_product_id}`);
  return { success: "Opção criada." };
}
export async function registerEcommerceImage(input: unknown): Promise<EcommerceState> {
  const parsed = ecommerceImageSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const { data: listing } = await ctx.supabase
    .from("ecommerce_products")
    .select("id")
    .eq("id", parsed.data.listingId)
    .eq("business_unit_id", ctx.current.id)
    .maybeSingle();
  if (!listing) return { error: "Produto não encontrado." };
  if (!parsed.data.storagePath.startsWith(`${ctx.organizationId}/${ctx.current.id}/${listing.id}/`))
    return { error: "Caminho de imagem inválido." };
  if (parsed.data.isPrimary)
    await ctx.supabase
      .from("ecommerce_product_images")
      .update({ is_primary: false })
      .eq("ecommerce_product_id", listing.id);
  const { error } = await ctx.supabase
    .from("ecommerce_product_images")
    .insert({
      organization_id: ctx.organizationId,
      ecommerce_product_id: listing.id,
      storage_path: parsed.data.storagePath,
      alt_text: parsed.data.altText || null,
      is_primary: parsed.data.isPrimary,
    });
  if (error) return { error: "Não foi possível registrar a imagem." };
  revalidatePath(`/ecommerce/produtos/${listing.id}`);
  return { success: "Imagem adicionada." };
}
export async function toggleEcommerceEntity(input: unknown): Promise<EcommerceState> {
  const parsed = ecommerceToggleSchema.safeParse(input);
  if (!parsed.success) return { error: "Operação inválida." };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  if (parsed.data.entity === "GROUP") {
    const { data, error } = await ctx.supabase
      .from("ecommerce_option_groups")
      .update({ active: parsed.data.active })
      .eq("id", parsed.data.id)
      .select("ecommerce_product_id")
      .single();
    if (error) return { error: "Não foi possível atualizar o grupo." };
    revalidatePath(`/ecommerce/produtos/${data.ecommerce_product_id}`);
  } else if (parsed.data.entity === "OPTION") {
    const { data, error } = await ctx.supabase
      .from("ecommerce_options")
      .update({ active: parsed.data.active })
      .eq("id", parsed.data.id)
      .select("option_group_id,ecommerce_option_groups(ecommerce_product_id)")
      .single();
    if (error) return { error: "Não foi possível atualizar a opção." };
    const group = data.ecommerce_option_groups as unknown as { ecommerce_product_id: string };
    revalidatePath(`/ecommerce/produtos/${group.ecommerce_product_id}`);
  } else {
    const { data, error } = await ctx.supabase
      .from("ecommerce_product_images")
      .update({ removed_at: parsed.data.active ? null : new Date().toISOString() })
      .eq("id", parsed.data.id)
      .select("ecommerce_product_id")
      .single();
    if (error) return { error: "Não foi possível atualizar a imagem." };
    revalidatePath(`/ecommerce/produtos/${data.ecommerce_product_id}`);
  }
  return { success: "Atualizado." };
}
export async function saveStoreAppearance(_: EcommerceState, formData: FormData): Promise<EcommerceState> {
  const parsed = storeAppearanceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const { error } = await ctx.supabase
    .from("delivery_settings")
    .update({
      description: parsed.data.description || null,
      store_description: parsed.data.storeDescription || null,
      instagram_handle: parsed.data.instagramHandle || null,
      whatsapp_contact: parsed.data.whatsappContact || null,
      contact_email: parsed.data.contactEmail || null,
      contact_phone: parsed.data.contactPhone || null,
      accent_color: parsed.data.accentColor,
    })
    .eq("business_unit_id", ctx.current.id);
  if (error) return { error: "Não foi possível salvar a aparência." };
  revalidatePath("/ecommerce");
  revalidatePath("/loja");
  return { success: "Aparência atualizada." };
}
export async function saveProductSuggestion(input: unknown): Promise<EcommerceState> {
  const parsed = ecommerceSuggestionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  const { data: listings } = await ctx.supabase
    .from("ecommerce_products")
    .select("id")
    .eq("business_unit_id", ctx.current.id)
    .in("id", [parsed.data.listingId, parsed.data.suggestedListingId]);
  if (listings?.length !== 2) return { error: "Produto sugerido inválido." };
  const { error } = await ctx.supabase
    .from("ecommerce_product_suggestions")
    .upsert(
      {
        organization_id: ctx.organizationId,
        ecommerce_product_id: parsed.data.listingId,
        suggested_ecommerce_product_id: parsed.data.suggestedListingId,
        active: parsed.data.active,
      },
      { onConflict: "ecommerce_product_id,suggested_ecommerce_product_id" },
    );
  if (error) return { error: "Não foi possível atualizar as sugestões." };
  revalidatePath(`/ecommerce/produtos/${parsed.data.listingId}`);
  return { success: "Sugestões atualizadas." };
}
export async function saveStoreAsset(input: unknown): Promise<EcommerceState> {
  const parsed = storeAssetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const ctx = await context();
  if (!ctx) return { error: "Selecione Loja Online & Delivery." };
  if (!parsed.data.storagePath.startsWith(`${ctx.organizationId}/${ctx.current.id}/store/`))
    return { error: "Caminho de imagem inválido." };
  const field = parsed.data.assetType === "LOGO" ? "logo_path" : "banner_path";
  const { error } = await ctx.supabase
    .from("delivery_settings")
    .update({ [field]: parsed.data.storagePath })
    .eq("business_unit_id", ctx.current.id);
  if (error) return { error: "Não foi possível salvar a imagem da loja." };
  revalidatePath("/ecommerce");
  return { success: parsed.data.assetType === "LOGO" ? "Logo atualizado." : "Banner atualizado." };
}
