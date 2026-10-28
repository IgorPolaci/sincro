import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Storefront } from "@/features/delivery/storefront";

type StorefrontProps = Parameters<typeof Storefront>[0];
type Catalog = {
  store: StorefrontProps["store"];
  products: StorefrontProps["products"];
  categories: StorefrontProps["categories"];
  zones: StorefrontProps["zones"];
};

export default async function PublicStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data, error }, { data: status }, { data: suggestions }] = await Promise.all([
    supabase.rpc("get_public_catalog", { p_slug: slug }),
    supabase.rpc("get_public_store_status", { p_slug: slug }),
    supabase.rpc("get_public_store_suggestions", { p_slug: slug }),
  ]);
  if (error || !data) notFound();
  const catalog = data as Catalog;
  const publicStatus = status as StorefrontProps["status"] | null;
  return (
    <Storefront
      {...catalog}
      status={publicStatus ?? { is_open: false, message: "Loja fechada" }}
      suggestions={(suggestions ?? []) as StorefrontProps["suggestions"]}
    />
  );
}
