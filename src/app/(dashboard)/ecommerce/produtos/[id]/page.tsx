import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EcommerceImageForm,
  EcommerceProductForm,
  EntityToggle,
  OptionForm,
  OptionGroupForm,
  ProductSuggestionsForm,
} from "@/features/ecommerce/management-forms";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency } from "@/lib/utils";

type Option = { id: string; name: string; price_delta: number | string; active: boolean };
type Group = {
  id: string;
  name: string;
  minimum_selections: number;
  maximum_selections: number;
  active: boolean;
  ecommerce_options: Option[];
};
type ImageRow = {
  id: string;
  storage_path: string;
  alt_text: string | null;
  is_primary: boolean;
  removed_at: string | null;
};
export default async function EcommerceProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  const unitId = current?.id ?? "00000000-0000-0000-0000-000000000000";
  const [
    { data: listing },
    { data: categories },
    { data: organizationId },
    { data: suggestionProducts },
    { data: suggestions },
  ] = await Promise.all([
    supabase
      .from("ecommerce_products")
      .select(
        "*,products(name,sku,sale_price),ecommerce_product_images(id,storage_path,alt_text,is_primary,removed_at),ecommerce_option_groups(id,name,minimum_selections,maximum_selections,active,ecommerce_options(id,name,price_delta,active))",
      )
      .eq("id", id)
      .eq("business_unit_id", unitId)
      .maybeSingle(),
    supabase.from("product_categories").select("id,name").eq("active", true).is("deleted_at", null).order("name"),
    supabase.rpc("current_organization_id"),
    supabase
      .from("ecommerce_products")
      .select("id,display_name")
      .eq("business_unit_id", unitId)
      .neq("id", id)
      .order("display_name"),
    supabase
      .from("ecommerce_product_suggestions")
      .select("suggested_ecommerce_product_id")
      .eq("ecommerce_product_id", id)
      .eq("active", true),
  ]);
  if (!listing || !organizationId) notFound();
  const product = listing.products as unknown as { name: string; sku: string; sale_price: number | string };
  const groups = (listing.ecommerce_option_groups ?? []) as unknown as Group[];
  const images = (listing.ecommerce_product_images ?? []) as ImageRow[];
  return (
    <>
      <PageHeader
        title={listing.display_name}
        description={`${product.sku} · cadastro-base: ${product.name}`}
        action={
          <Badge tone={listing.is_published ? "success" : "neutral"}>
            {listing.is_published ? "PUBLICADO" : "RASCUNHO"}
          </Badge>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="mb-5 font-semibold">Conteúdo comercial e publicação</h2>
            <EcommerceProductForm listing={listing} categories={categories ?? []} />
          </Card>
          <Card>
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Opções e complementos</h2>
              <p className="text-muted mt-1 text-xs">Ex.: voltagem, sabor, tamanho, adicionais ou embalagem.</p>
            </div>
            <div className="space-y-4 p-5">
              {groups.map((group) => (
                <div key={group.id} className={`rounded-xl border p-4 ${group.active ? "" : "opacity-50"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{group.name}</p>
                      <p className="text-muted text-xs">
                        Escolhas: {group.minimum_selections} a {group.maximum_selections}
                      </p>
                    </div>
                    <EntityToggle id={group.id} entity="GROUP" active={group.active} />
                  </div>
                  <div className="my-4 divide-y">
                    {group.ecommerce_options.map((option) => (
                      <div key={option.id} className="flex items-center justify-between py-2 text-sm">
                        <span>
                          {option.name}{" "}
                          {Number(option.price_delta) !== 0 && (
                            <span className="text-muted">
                              ({Number(option.price_delta) > 0 ? "+ " : ""}
                              {formatCurrency(option.price_delta)})
                            </span>
                          )}
                        </span>
                        <EntityToggle id={option.id} entity="OPTION" active={option.active} />
                      </div>
                    ))}
                  </div>
                  <OptionForm groupId={group.id} />
                </div>
              ))}
              <div className="border-t pt-5">
                <OptionGroupForm listingId={listing.id} />
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Produtos complementares</h2>
            <p className="text-muted mt-1 mb-4 text-xs">
              Sugestões exibidas no checkout quando este item estiver no carrinho.
            </p>
            <ProductSuggestionsForm
              listingId={listing.id}
              products={suggestionProducts ?? []}
              selectedIds={(suggestions ?? []).map((item) => item.suggested_ecommerce_product_id)}
            />
          </Card>
        </div>
        <aside className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Imagens do produto</h2>
            <div className="mb-5 grid grid-cols-2 gap-3">
              {images
                .filter((image) => !image.removed_at)
                .map((image) => {
                  const url = image.storage_path.startsWith("/")
                    ? image.storage_path
                    : supabase.storage.from("storefront-assets").getPublicUrl(image.storage_path).data.publicUrl;
                  return (
                    <div key={image.id}>
                      <div
                        className="aspect-square rounded-lg bg-slate-100 bg-cover bg-center"
                        style={{ backgroundImage: `url(${url})` }}
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-muted text-[10px]">{image.is_primary ? "PRINCIPAL" : "IMAGEM"}</span>
                        <EntityToggle id={image.id} entity="IMAGE" active />
                      </div>
                    </div>
                  );
                })}
            </div>
            <EcommerceImageForm listingId={listing.id} organizationId={organizationId} businessUnitId={unitId} />
          </Card>
          <Card className="p-5">
            <p className="text-muted text-sm">Preço do cadastro-base</p>
            <p className="mt-1 text-xl font-bold">{formatCurrency(product.sale_price)}</p>
            <p className="text-muted mt-3 text-xs">O preço online pode ser diferente sem alterar o PDV.</p>
          </Card>
        </aside>
      </div>
    </>
  );
}
