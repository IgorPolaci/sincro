import Link from "next/link";
import { ExternalLink, PackageCheck, PackageX, ShoppingBag, Tags } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { AppearanceForm, CategoryForm, StoreAssetUpload } from "@/features/ecommerce/management-forms";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";

export default async function EcommercePage() {
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  if (current?.type !== "STORE_DELIVERY")
    return (
      <>
        <PageHeader title="E-commerce" />
        <Card>
          <EmptyState title="Negócio incorreto" description="Selecione Loja Online & Delivery." />
        </Card>
      </>
    );
  const [
    { data: listings },
    { data: categories },
    { data: settings },
    { data: organization },
    { count: openOrders },
    { data: organizationId },
  ] = await Promise.all([
    supabase.from("ecommerce_products").select("id,is_published").eq("business_unit_id", current.id),
    supabase
      .from("product_categories")
      .select("id,name,description")
      .eq("active", true)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("delivery_settings")
      .select(
        "description,store_description,instagram_handle,whatsapp_contact,contact_email,contact_phone,accent_color,logo_path,banner_path",
      )
      .eq("business_unit_id", current.id)
      .single(),
    supabase.from("organizations").select("catalog_slug").single(),
    supabase
      .from("online_orders")
      .select("*", { count: "exact", head: true })
      .eq("business_unit_id", current.id)
      .in("status", ["NEW", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"]),
    supabase.rpc("current_organization_id"),
  ]);
  const published = listings?.filter((item) => item.is_published).length ?? 0;
  const unpublished = (listings?.length ?? 0) - published;
  return (
    <>
      <PageHeader
        title="Gerenciamento do e-commerce"
        description="Tudo que for publicado aqui alimenta o site de compras do cliente."
        action={
          <Link
            href={`/loja/${organization?.catalog_slug}`}
            target="_blank"
            className="bg-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir site da loja
          </Link>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<PackageCheck />} label="Produtos publicados" value={published} />
        <Metric icon={<PackageX />} label="Aguardando publicação" value={unpublished} />
        <Metric icon={<Tags />} label="Categorias" value={categories?.length ?? 0} />
        <Metric icon={<ShoppingBag />} label="Pedidos em andamento" value={openOrders ?? 0} />
      </section>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Catálogo online</h2>
              <p className="text-muted mt-1 text-sm">Configure textos, preços, fotos, promoções e complementos.</p>
            </div>
            <Link href="/ecommerce/produtos" className="rounded-lg border px-4 py-2 text-sm font-semibold">
              Gerenciar produtos
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {categories?.map((category) => (
              <div key={category.id} className="rounded-lg bg-slate-50 p-4">
                <p className="font-medium">{category.name}</p>
                <p className="text-muted mt-1 line-clamp-2 text-xs">{category.description || "Sem descrição"}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Nova categoria</h2>
          <CategoryForm />
        </Card>
      </div>
      {settings && (
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Aparência, apresentação e contato</h2>
          <AppearanceForm settings={settings} />
          {organizationId && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <StoreAssetUpload
                assetType="LOGO"
                currentPath={settings.logo_path}
                organizationId={organizationId}
                businessUnitId={current.id}
              />
              <StoreAssetUpload
                assetType="BANNER"
                currentPath={settings.banner_path}
                organizationId={organizationId}
                businessUnitId={current.id}
              />
            </div>
          )}
        </Card>
      )}
    </>
  );
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-5">
      <span className="text-primary">{icon}</span>
      <p className="text-muted mt-3 text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}
