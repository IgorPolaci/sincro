"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createEcommerceProduct, registerEcommerceImage } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string };

export function NewEcommerceProductForm({
  categories,
  organizationId,
  businessUnitId,
}: {
  categories: Category[];
  organizationId: string;
  businessUnitId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<string>();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const images = values.getAll("images").filter((item): item is File => item instanceof File && item.size > 0);
    if (images.length > 6) {
      setError("Envie no máximo 6 imagens.");
      return;
    }
    if (
      images.some(
        (image) => !["image/jpeg", "image/png", "image/webp"].includes(image.type) || image.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Use até 6 imagens JPG, PNG ou WebP com no máximo 5 MB cada.");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      setProgress("Criando produto…");
      const result = await createEcommerceProduct({
        name: values.get("name"),
        sku: values.get("sku"),
        slug: values.get("slug"),
        displayName: values.get("displayName"),
        description: values.get("description"),
        shortDescription: values.get("shortDescription"),
        categoryId: values.get("categoryId"),
        costPrice: values.get("costPrice"),
        salePrice: values.get("salePrice"),
        onlinePrice: values.get("onlinePrice"),
        promotionalPrice: values.get("promotionalPrice"),
        minimumStock: values.get("minimumStock"),
        unit: values.get("unit"),
        maxPerOrder: values.get("maxPerOrder"),
        seoTitle: values.get("seoTitle"),
        seoDescription: values.get("seoDescription"),
        isPublished: values.get("isPublished") === "on",
        isFeatured: values.get("isFeatured") === "on",
      });
      if (result.error || !result.listingId) {
        setError(result.error ?? "Não foi possível criar o produto.");
        setProgress(undefined);
        return;
      }
      if (images.length) {
        const supabase = createClient();
        for (let index = 0; index < images.length; index++) {
          const image = images[index];
          setProgress(`Enviando imagem ${index + 1} de ${images.length}…`);
          const extension: { [key: string]: string } = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
          };
          const path = `${organizationId}/${businessUnitId}/${result.listingId}/${crypto.randomUUID()}.${extension[image.type]}`;
          const { error: uploadError } = await supabase.storage
            .from("storefront-assets")
            .upload(path, image, { contentType: image.type, upsert: false });
          if (uploadError) {
            setError("Produto criado, mas uma imagem não pôde ser enviada. Você pode adicioná-la na edição.");
            break;
          }
          const registered = await registerEcommerceImage({
            listingId: result.listingId,
            storagePath: path,
            altText: String(values.get("displayName") ?? ""),
            isPrimary: index === 0,
          });
          if (registered.error) {
            await supabase.storage.from("storefront-assets").remove([path]);
            setError("Produto criado, mas uma imagem não pôde ser registrada.");
            break;
          }
        }
      }
      router.push(`/ecommerce/produtos/${result.listingId}`);
      router.refresh();
    });
  }
  return (
    <form onSubmit={submit} className="space-y-8">
      <Section title="1. Dados básicos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Nome do produto" required />
          <Field name="sku" label="SKU" required />
          <Field name="salePrice" label="Preço de venda" type="number" step="0.01" defaultValue="0" required />
          <Field name="costPrice" label="Preço de custo" type="number" step="0.01" defaultValue="0" required />
          <Field name="minimumStock" label="Estoque mínimo" type="number" step="0.001" defaultValue="0" required />
          <Field name="unit" label="Unidade" defaultValue="UN" required />
        </div>
      </Section>
      <Section title="2. Imagens">
        <label className="block text-sm font-medium">
          Fotos do produto
          <input
            name="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="mt-2 block w-full rounded-lg border bg-white p-2 text-sm"
          />
        </label>
        <p className="text-muted mt-2 text-xs">
          Até 6 imagens; a primeira será a principal. JPG, PNG ou WebP, até 5 MB cada.
        </p>
      </Section>
      <Section title="3. Configurações do site">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="displayName" label="Nome comercial" required />
          <Field name="slug" label="Endereço (slug)" required />
          <label className="text-sm font-medium">
            Categoria
            <select name="categoryId" className="mt-2 h-10 w-full rounded-lg border bg-white px-3">
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <Field name="onlinePrice" label="Preço online" type="number" step="0.01" defaultValue="0" required />
          <Field name="promotionalPrice" label="Preço promocional" type="number" step="0.01" />
          <Field name="maxPerOrder" label="Limite por pedido" type="number" step="0.001" />
          <Field name="seoTitle" label="Título SEO" />
        </div>
        <label className="mt-4 block text-sm font-medium">
          Descrição curta
          <textarea name="shortDescription" maxLength={300} className="mt-2 min-h-20 w-full rounded-lg border p-3" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Descrição completa
          <textarea name="description" maxLength={5000} className="mt-2 min-h-32 w-full rounded-lg border p-3" />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Descrição SEO
          <textarea name="seoDescription" maxLength={170} className="mt-2 min-h-20 w-full rounded-lg border p-3" />
        </label>
        <div className="mt-4 flex flex-wrap gap-5">
          <Check name="isPublished" label="Publicar no site" />
          <Check name="isFeatured" label="Produto em destaque" />
        </div>
        <p className="text-muted mt-3 text-xs">
          Complementos e produtos relacionados podem ser configurados após salvar.
        </p>
      </Section>
      {progress && <p className="text-primary text-sm">{progress}</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "Salvando…" : "Cadastrar produto"}</Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-5">
      <h2 className="mb-5 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Field({
  name,
  label,
  type = "text",
  step,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <Input name={name} type={type} step={step} defaultValue={defaultValue} required={required} className="mt-2" />
    </label>
  );
}
function Check({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input name={name} type="checkbox" className="h-4 w-4" />
      {label}
    </label>
  );
}
