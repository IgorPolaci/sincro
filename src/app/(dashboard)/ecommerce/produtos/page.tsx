import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchBar } from "@/components/shared/search-bar";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency } from "@/lib/utils";

type Listing = {
  id: string;
  display_name: string;
  slug: string;
  online_price: number | string | null;
  promotional_price: number | string | null;
  is_published: boolean;
  is_featured: boolean;
  products: { sku: string; sale_price: number | string };
  product_categories: { name: string } | null;
  ecommerce_product_images: { storage_path: string; is_primary: boolean }[];
};
export default async function EcommerceProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  const unitId = current?.id ?? "00000000-0000-0000-0000-000000000000";
  let query = supabase
    .from("ecommerce_products")
    .select(
      "id,display_name,slug,online_price,promotional_price,is_published,is_featured,products!inner(sku,sale_price),product_categories(name),ecommerce_product_images(storage_path,is_primary,removed_at)",
    )
    .eq("business_unit_id", unitId)
    .is("ecommerce_product_images.removed_at", null)
    .order("sort_order")
    .order("display_name");
  if (q) query = query.ilike("display_name", `%${q}%`);
  const { data } = await query;
  const rows = (data ?? []) as unknown as Listing[];
  return (
    <>
      <PageHeader
        title="Produtos do e-commerce"
        description="Somente itens publicados aparecem no site. O estoque continua vindo da unidade Loja Online & Delivery."
        action={
          <div className="flex gap-2">
            <Link
              href="/ecommerce/produtos/novo"
              className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Cadastrar produto
            </Link>
            <Link
              href="/ecommerce"
              className="bg-primary inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-white"
            >
              Painel do e-commerce
            </Link>
          </div>
        }
      />
      <Card>
        <div className="p-4">
          <SearchBar placeholder="Nome comercial" defaultValue={q} />
        </div>
        {rows.length ? (
          <div className="divide-y">
            {rows.map((row) => {
              const image =
                row.ecommerce_product_images.find((item) => item.is_primary) ?? row.ecommerce_product_images[0];
              const imageUrl = image
                ? image.storage_path.startsWith("/")
                  ? image.storage_path
                  : supabase.storage.from("storefront-assets").getPublicUrl(image.storage_path).data.publicUrl
                : null;
              const price = row.promotional_price ?? row.online_price ?? row.products.sale_price;
              return (
                <Link
                  href={`/ecommerce/produtos/${row.id}`}
                  key={row.id}
                  className="grid gap-4 px-5 py-4 text-sm transition hover:bg-slate-50 sm:grid-cols-[64px_1fr_130px_120px] sm:items-center"
                >
                  <div
                    className="h-16 w-16 rounded-lg bg-slate-100 bg-cover bg-center"
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  />
                  <div>
                    <p className="font-semibold">{row.display_name}</p>
                    <p className="text-muted text-xs">
                      {row.products.sku} · {row.product_categories?.name ?? "Sem categoria"} · /{row.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={row.is_published ? "success" : "neutral"}>
                      {row.is_published ? "PUBLICADO" : "RASCUNHO"}
                    </Badge>
                    {row.is_featured && <Badge tone="warning">DESTAQUE</Badge>}
                  </div>
                  <strong className="text-right">{formatCurrency(price)}</strong>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Nenhum produto"
            description="Cadastre um produto-base para ele aparecer aqui como rascunho."
          />
        )}
      </Card>
      <p className="text-muted text-xs">
        <ExternalLink className="mr-1 inline h-3 w-3" />
        Alterações publicadas são refletidas no site na próxima atualização da página.
      </p>
    </>
  );
}
