import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { NewEcommerceProductForm } from "@/features/ecommerce/new-product-form";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";

export default async function NewEcommerceProductPage() {
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  if (current?.type !== "STORE_DELIVERY")
    return (
      <>
        <PageHeader title="Cadastrar produto" />
        <Card>
          <EmptyState title="Segmento incorreto" description="Selecione Loja e Delivery." />
        </Card>
      </>
    );
  const [{ data: categories }, { data: organizationId }] = await Promise.all([
    supabase.from("product_categories").select("id,name").eq("active", true).is("deleted_at", null).order("name"),
    supabase.rpc("current_organization_id"),
  ]);
  if (!organizationId) return null;
  return (
    <>
      <PageHeader
        title="Cadastrar produto do e-commerce"
        description="Cadastro-base, imagens e publicação em um único fluxo."
      />
      <Card className="p-6">
        <NewEcommerceProductForm
          categories={categories ?? []}
          organizationId={organizationId}
          businessUnitId={current.id}
        />
      </Card>
    </>
  );
}
