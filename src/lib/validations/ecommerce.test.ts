import { describe, expect, it } from "vitest";
import {
  createEcommerceProductSchema,
  ecommerceProductSchema,
  ecommerceSuggestionSchema,
  optionGroupSchema,
  storeAssetSchema,
} from "./ecommerce";

const product = {
  listingId: "7bd9f55a-e470-4414-b2c1-4eb19a7d261c",
  displayName: "Combo família",
  slug: "combo-familia",
  categoryId: "",
  shortDescription: "",
  description: "",
  onlinePrice: "50",
  promotionalPrice: "40",
  promotionStartsAt: "",
  promotionEndsAt: "",
  maxPerOrder: "5",
  sortOrder: "0",
  seoTitle: "",
  seoDescription: "",
  isPublished: true,
  isFeatured: false,
  availableForDelivery: true,
  availableForPickup: true,
};

describe("validação do e-commerce", () => {
  it("aceita uma publicação comercial válida", () =>
    expect(ecommerceProductSchema.safeParse(product).success).toBe(true));
  it("rejeita promoção acima do preço normal", () =>
    expect(ecommerceProductSchema.safeParse({ ...product, promotionalPrice: "60" }).success).toBe(false));
  it("rejeita slug inseguro", () =>
    expect(ecommerceProductSchema.safeParse({ ...product, slug: "Combo Família" }).success).toBe(false));
  it("rejeita grupo cujo mínimo supera o máximo", () =>
    expect(
      optionGroupSchema.safeParse({
        listingId: product.listingId,
        name: "Sabores",
        minimumSelections: "2",
        maximumSelections: "1",
        position: "0",
      }).success,
    ).toBe(false));
  it("aceita somente os tipos previstos de imagem da loja", () => {
    expect(storeAssetSchema.safeParse({ assetType: "LOGO", storagePath: "org/unit/store/logo.webp" }).success).toBe(
      true,
    );
    expect(storeAssetSchema.safeParse({ assetType: "AVATAR", storagePath: "org/unit/store/logo.webp" }).success).toBe(
      false,
    );
  });
  it("valida o cadastro unificado de produto", () =>
    expect(
      createEcommerceProductSchema.safeParse({
        name: "Produto teste",
        sku: "TESTE-1",
        slug: "produto-teste",
        displayName: "Produto teste",
        description: "",
        shortDescription: "",
        categoryId: "",
        costPrice: "10",
        salePrice: "20",
        onlinePrice: "19",
        promotionalPrice: "",
        minimumStock: "0",
        unit: "UN",
        maxPerOrder: "",
        seoTitle: "",
        seoDescription: "",
        isPublished: false,
        isFeatured: false,
      }).success,
    ).toBe(true));
  it("impede que um produto sugira a si próprio", () =>
    expect(
      ecommerceSuggestionSchema.safeParse({
        listingId: product.listingId,
        suggestedListingId: product.listingId,
        active: true,
      }).success,
    ).toBe(false));
});
