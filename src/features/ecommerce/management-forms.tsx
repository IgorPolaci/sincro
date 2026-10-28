"use client";

import { FormEvent, useActionState, useState, useTransition } from "react";
import Image from "next/image";
import {
  createEcommerceCategory,
  createEcommerceOption,
  createOptionGroup,
  registerEcommerceImage,
  saveEcommerceProduct,
  saveStoreAppearance,
  saveStoreAsset,
  saveProductSuggestion,
  toggleEcommerceEntity,
  type EcommerceState,
} from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: EcommerceState = {};
type Listing = {
  id: string;
  display_name: string;
  slug: string;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  online_price: number | string | null;
  promotional_price: number | string | null;
  promotion_starts_at: string | null;
  promotion_ends_at: string | null;
  max_per_order: number | string | null;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  is_featured: boolean;
  available_for_delivery: boolean;
  available_for_pickup: boolean;
};
type Category = { id: string; name: string };
type SuggestionProduct = { id: string; display_name: string };

export function ProductSuggestionsForm({
  listingId,
  products,
  selectedIds,
}: {
  listingId: string;
  products: SuggestionProduct[];
  selectedIds: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<EcommerceState>({});
  const [selected, setSelected] = useState(selectedIds);
  function toggle(id: string) {
    const active = !selected.includes(id);
    startTransition(async () => {
      const result = await saveProductSuggestion({ listingId, suggestedListingId: id, active });
      setState(result);
      if (!result.error)
        setSelected((current) => (active ? [...current, id] : current.filter((value) => value !== id)));
    });
  }
  return (
    <div className="space-y-2">
      {products.map((product) => (
        <label key={product.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(product.id)}
            disabled={pending}
            onChange={() => toggle(product.id)}
          />
          <span>{product.display_name}</span>
        </label>
      ))}
      {!products.length && <p className="text-muted text-sm">Cadastre outro produto para criar sugestões.</p>}
      <Feedback state={state} />
      <p className="text-muted text-xs">
        Marque de 2 a 4 itens complementares. Apenas produtos publicados e em estoque aparecem no checkout.
      </p>
    </div>
  );
}

export function EcommerceProductForm({ listing, categories }: { listing: Listing; categories: Category[] }) {
  const [state, action, pending] = useActionState(saveEcommerceProduct, initial);
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="listingId" value={listing.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="displayName" label="Nome exibido" defaultValue={listing.display_name} />
        <Field name="slug" label="Endereço do produto" defaultValue={listing.slug} />
        <label className="text-sm font-medium">
          Categoria
          <select
            name="categoryId"
            defaultValue={listing.category_id ?? ""}
            className="mt-2 h-10 w-full rounded-lg border bg-white px-3"
          >
            <option value="">Sem categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <Field name="sortOrder" label="Ordem de exibição" type="number" defaultValue={listing.sort_order} />
        <Field
          name="onlinePrice"
          label="Preço online"
          type="number"
          step="0.01"
          defaultValue={listing.online_price ?? ""}
        />
        <Field
          name="promotionalPrice"
          label="Preço promocional"
          type="number"
          step="0.01"
          defaultValue={listing.promotional_price ?? ""}
        />
        <Field
          name="promotionStartsAt"
          label="Início da promoção"
          type="datetime-local"
          defaultValue={toLocalDate(listing.promotion_starts_at)}
        />
        <Field
          name="promotionEndsAt"
          label="Fim da promoção"
          type="datetime-local"
          defaultValue={toLocalDate(listing.promotion_ends_at)}
        />
        <Field
          name="maxPerOrder"
          label="Máximo por pedido"
          type="number"
          step="0.001"
          defaultValue={listing.max_per_order ?? ""}
        />
        <Field name="seoTitle" label="Título para busca" defaultValue={listing.seo_title ?? ""} />
      </div>
      <label className="block text-sm font-medium">
        Descrição curta
        <textarea
          name="shortDescription"
          defaultValue={listing.short_description ?? ""}
          maxLength={300}
          className="mt-2 min-h-20 w-full rounded-lg border p-3 text-sm"
        />
      </label>
      <label className="block text-sm font-medium">
        Descrição completa
        <textarea
          name="description"
          defaultValue={listing.description ?? ""}
          maxLength={5000}
          className="mt-2 min-h-32 w-full rounded-lg border p-3 text-sm"
        />
      </label>
      <label className="block text-sm font-medium">
        Descrição para mecanismos de busca
        <textarea
          name="seoDescription"
          defaultValue={listing.seo_description ?? ""}
          maxLength={170}
          className="mt-2 min-h-20 w-full rounded-lg border p-3 text-sm"
        />
      </label>
      <div className="flex flex-wrap gap-5">
        {[
          ["isPublished", "Publicado no site", listing.is_published],
          ["isFeatured", "Produto em destaque", listing.is_featured],
          ["availableForDelivery", "Disponível para entrega", listing.available_for_delivery],
          ["availableForPickup", "Disponível para retirada", listing.available_for_pickup],
        ].map(([name, label, checked]) => (
          <label key={String(name)} className="flex items-center gap-2 text-sm font-medium">
            <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} className="h-4 w-4" />
            {String(label)}
          </label>
        ))}
      </div>
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Salvando…" : "Salvar publicação"}</Button>
    </form>
  );
}

export function CategoryForm() {
  const [state, action, pending] = useActionState(createEcommerceCategory, initial);
  return (
    <form action={action} className="space-y-3">
      <Field name="name" label="Nome da categoria" />
      <label className="block text-sm font-medium">
        Descrição
        <textarea name="description" maxLength={500} className="mt-2 min-h-20 w-full rounded-lg border p-3 text-sm" />
      </label>
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Criando…" : "Criar categoria"}</Button>
    </form>
  );
}
export function OptionGroupForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(createOptionGroup, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <input type="hidden" name="listingId" value={listingId} />
      <Field name="name" label="Grupo" />
      <Field name="minimumSelections" label="Mínimo" type="number" defaultValue="0" />
      <Field name="maximumSelections" label="Máximo" type="number" defaultValue="1" />
      <input type="hidden" name="position" value="0" />
      <Button disabled={pending}>{pending ? "Criando…" : "Adicionar grupo"}</Button>
      <div className="sm:col-span-4">
        <Feedback state={state} />
      </div>
    </form>
  );
}
export function OptionForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState(createEcommerceOption, initial);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_130px_auto] sm:items-end">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="position" value="0" />
      <Field name="name" label="Opção" />
      <Field name="priceDelta" label="Adicional" type="number" step="0.01" defaultValue="0" />
      <Button className="h-10" disabled={pending}>
        {pending ? "…" : "Adicionar"}
      </Button>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}
export function EntityToggle({
  id,
  entity,
  active,
}: {
  id: string;
  entity: "GROUP" | "OPTION" | "IMAGE";
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      className="h-8 px-2 text-xs"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleEcommerceEntity({ id, entity, active: !active });
        })
      }
    >
      {active ? "Desativar" : "Reativar"}
    </Button>
  );
}

export function EcommerceImageForm({
  listingId,
  organizationId,
  businessUnitId,
}: {
  listingId: string;
  organizationId: string;
  businessUnitId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<EcommerceState>({});
  const [progress, setProgress] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const image = values.get("image");
    const altText = String(values.get("altText") ?? "");
    const isPrimary = values.get("isPrimary") === "on";
    if (!(image instanceof File) || image.size === 0) {
      setState({ error: "Selecione uma imagem." });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      setState({ error: "Use JPG, PNG ou WebP." });
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      setState({ error: "A imagem deve ter no máximo 5 MB." });
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const extension: { [key: string]: string } = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const path = `${organizationId}/${businessUnitId}/${listingId}/${crypto.randomUUID()}.${extension[image.type]}`;
      setProgress("Enviando imagem…");
      const { error } = await supabase.storage
        .from("storefront-assets")
        .upload(path, image, { contentType: image.type, upsert: false });
      if (error) {
        setState({ error: "Não foi possível enviar a imagem." });
        setProgress("");
        return;
      }
      const result = await registerEcommerceImage({ listingId, storagePath: path, altText, isPrimary });
      if (result.error) {
        await supabase.storage.from("storefront-assets").remove([path]);
        setState(result);
        setProgress("");
        return;
      }
      form.reset();
      setState({ success: "Imagem adicionada." });
      setProgress("");
    });
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium">
        Imagem
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="mt-2 block w-full rounded-lg border bg-white p-2 text-sm"
        />
      </label>
      <Field name="altText" label="Texto alternativo" />
      <label className="flex items-center gap-2 text-sm">
        <input name="isPrimary" type="checkbox" />
        Usar como imagem principal
      </label>
      <p className="text-muted text-xs">JPG, PNG ou WebP, até 5 MB.</p>
      {progress && <p className="text-primary text-sm">{progress}</p>}
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Enviando…" : "Adicionar imagem"}</Button>
    </form>
  );
}

export function AppearanceForm({
  settings,
}: {
  settings: {
    description: string | null;
    store_description: string | null;
    instagram_handle: string | null;
    whatsapp_contact: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    accent_color: string;
    logo_path: string | null;
    banner_path: string | null;
  };
}) {
  const [state, action, pending] = useActionState(saveStoreAppearance, initial);
  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm font-medium">
        Apresentação da loja
        <textarea
          name="description"
          defaultValue={settings.description ?? ""}
          maxLength={1000}
          className="mt-2 min-h-24 w-full rounded-lg border p-3 text-sm"
        />
      </label>
      <label className="block text-sm font-medium">
        Descrição completa da loja
        <textarea
          name="storeDescription"
          defaultValue={settings.store_description ?? ""}
          maxLength={5000}
          className="mt-2 min-h-32 w-full rounded-lg border p-3 text-sm"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="instagramHandle" label="Instagram" defaultValue={settings.instagram_handle ?? ""} />
        <Field name="whatsappContact" label="WhatsApp de contato" defaultValue={settings.whatsapp_contact ?? ""} />
        <Field name="contactEmail" label="E-mail de contato" type="email" defaultValue={settings.contact_email ?? ""} />
        <Field name="contactPhone" label="Telefone de contato" defaultValue={settings.contact_phone ?? ""} />
      </div>
      <label className="block max-w-xs text-sm font-medium">
        Cor principal
        <Input name="accentColor" className="mt-2 h-12" type="color" defaultValue={settings.accent_color} />
      </label>
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Salvando…" : "Salvar aparência"}</Button>
    </form>
  );
}

export function StoreAssetUpload({
  assetType,
  currentPath,
  organizationId,
  businessUnitId,
}: {
  assetType: "LOGO" | "BANNER";
  currentPath: string | null;
  organizationId: string;
  businessUnitId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<EcommerceState>({});
  const label = assetType === "LOGO" ? "Logo" : "Banner";
  const preview = currentPath
    ? currentPath.startsWith("/")
      ? currentPath
      : createClient().storage.from("storefront-assets").getPublicUrl(currentPath).data.publicUrl
    : null;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const image = new FormData(form).get("image");
    if (!(image instanceof File) || image.size === 0) {
      setState({ error: "Selecione uma imagem." });
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      setState({ error: "Use JPG, PNG ou WebP." });
      return;
    }
    if (image.size > 5 * 1024 * 1024) {
      setState({ error: "A imagem deve ter no máximo 5 MB." });
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const extension: { [key: string]: string } = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const path = `${organizationId}/${businessUnitId}/store/${assetType.toLowerCase()}-${crypto.randomUUID()}.${extension[image.type]}`;
      const { error } = await supabase.storage
        .from("storefront-assets")
        .upload(path, image, { contentType: image.type, upsert: false });
      if (error) {
        setState({ error: "Não foi possível enviar a imagem." });
        return;
      }
      const result = await saveStoreAsset({ assetType, storagePath: path });
      if (result.error) {
        await supabase.storage.from("storefront-assets").remove([path]);
        setState(result);
        return;
      }
      form.reset();
      setState(result);
    });
  }
  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
      {preview && (
        <Image
          unoptimized
          src={preview}
          width={assetType === "LOGO" ? 240 : 900}
          height={assetType === "LOGO" ? 120 : 300}
          alt={`${label} atual`}
          className={
            assetType === "LOGO" ? "h-20 w-auto max-w-full object-contain" : "h-32 w-full rounded-lg object-cover"
          }
        />
      )}
      <label className="block text-sm font-medium">
        {label} da loja
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="mt-2 block w-full rounded-lg border bg-white p-2 text-sm"
        />
      </label>
      <p className="text-muted text-xs">JPG, PNG ou WebP, até 5 MB.</p>
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Enviando…" : `Atualizar ${label.toLowerCase()}`}</Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  step,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  step?: string;
  defaultValue?: string | number;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <Input name={name} className="mt-2" type={type} step={step} defaultValue={defaultValue} />
    </label>
  );
}
function Feedback({ state }: { state: EcommerceState }) {
  return (
    <>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {state.success}
        </p>
      )}
    </>
  );
}
function toLocalDate(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}
