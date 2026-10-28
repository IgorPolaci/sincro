"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import { createPublicOrder } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Store = {
  name: string;
  slug: string;
  description: string | null;
  is_open: boolean;
  minimum_order: number | string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  local_enabled: boolean;
  whatsapp: string | null;
  opening_hours: string | null;
  accent_color: string;
  logo_path: string | null;
  banner_path: string | null;
  store_description?: string | null;
  instagram_handle?: string | null;
  whatsapp_contact?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};
type StoreStatus = {
  is_open: boolean;
  message: string;
  next_opening?: string | null;
  closes_at?: string | null;
  store_description?: string | null;
  instagram_handle?: string | null;
  whatsapp_contact?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};
type Suggestion = { source_product_id: string; suggested_product_id: string };
type ProductOption = { id: string; name: string; price_delta: number | string };
type OptionGroup = { id: string; name: string; minimum: number; maximum: number; options: ProductOption[] };
type ProductImage = { path: string; alt: string | null; primary: boolean };
type Product = {
  id: string;
  listing_id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  price: number | string;
  regular_price: number | string;
  promotional: boolean;
  available: number | string;
  featured: boolean;
  delivery: boolean;
  pickup: boolean;
  images: ProductImage[];
  option_groups: OptionGroup[];
};
type Category = { id: string; name: string; description?: string | null };
type Zone = { id: string; name: string; neighborhood: string; fee: number | string; minimum_order: number | string };
type CartItem = Product & {
  cartId: string;
  quantity: number;
  optionIds: string[];
  optionSummary: string;
  unitPrice: number;
};

export function Storefront({
  store,
  products,
  categories,
  zones,
  status,
  suggestions,
}: {
  store: Store;
  products: Product[];
  categories: Category[];
  zones: Zone[];
  status: StoreStatus;
  suggestions: Suggestion[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const assetUrl = (path: string) =>
    path.startsWith("/") ? path : supabase.storage.from("storefront-assets").getPublicUrl(path).data.publicUrl;
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [order, setOrder] = useState<{ number: string; public_code: string; total: number }>();
  const [customizing, setCustomizing] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP" | "LOCAL">(
    store.pickup_enabled ? "PICKUP" : store.delivery_enabled ? "DELIVERY" : "LOCAL",
  );
  const [zoneId, setZoneId] = useState("");
  const visible = products.filter(
    (product) =>
      (categoryId === "all" || product.category_id === categoryId) &&
      product.name.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")) &&
      (fulfillment !== "DELIVERY" || product.delivery) &&
      (fulfillment !== "PICKUP" || product.pickup),
  );
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const zone = zones.find((item) => item.id === zoneId);
  const fee = fulfillment === "DELIVERY" ? Number(zone?.fee ?? 0) : 0;
  const estimatedTotal = subtotal + fee;
  const suggestedProducts = useMemo(() => {
    const cartIds = new Set(cart.map((item) => item.id));
    const suggestedIds = new Set(
      suggestions.filter((edge) => cartIds.has(edge.source_product_id)).map((edge) => edge.suggested_product_id),
    );
    return products.filter((product) => suggestedIds.has(product.id) && !cartIds.has(product.id)).slice(0, 4);
  }, [cart, products, suggestions]);
  function beginAdd(product: Product) {
    if (Number(product.available) <= 0) return;
    if (product.option_groups.length) setCustomizing(product);
    else add(product, []);
  }
  function add(product: Product, optionIds: string[]) {
    const selected = product.option_groups.flatMap((group) =>
      group.options
        .filter((option) => optionIds.includes(option.id))
        .map((option) => ({ ...option, group: group.name })),
    );
    const unitPrice = Number(product.price) + selected.reduce((sum, option) => sum + Number(option.price_delta), 0);
    const cartId = `${product.id}:${[...optionIds].sort().join(",")}`;
    const optionSummary = selected.map((option) => `${option.group}: ${option.name}`).join(" · ");
    setCart((current) => {
      const existing = current.find((item) => item.cartId === cartId);
      return existing
        ? current.map((item) =>
            item.cartId === cartId ? { ...item, quantity: Math.min(item.quantity + 1, Number(item.available)) } : item,
          )
        : [...current, { ...product, cartId, quantity: 1, optionIds, optionSummary, unitPrice }];
    });
    setCustomizing(null);
  }
  function change(cartId: string, delta: number) {
    setCart((current) =>
      current.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: Math.max(1, Math.min(item.quantity + delta, Number(item.available))) }
          : item,
      ),
    );
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const values = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createPublicOrder({
        slug: store.slug,
        customerName: values.get("customerName"),
        customerPhone: values.get("customerPhone"),
        fulfillment,
        deliveryZoneId: zoneId || null,
        address:
          fulfillment === "DELIVERY"
            ? {
                street: String(values.get("street") ?? ""),
                number: String(values.get("number") ?? ""),
                complement: String(values.get("complement") ?? ""),
                neighborhood: zone?.neighborhood ?? "",
              }
            : null,
        paymentMethod: values.get("paymentMethod"),
        cashChangeFor:
          values.get("paymentMethod") === "CASH" && values.get("cashChangeFor")
            ? Number(values.get("cashChangeFor"))
            : null,
        couponCode: values.get("couponCode"),
        notes: values.get("notes"),
        items: cart.map((item) => ({ product_id: item.id, quantity: item.quantity, option_ids: item.optionIds })),
      });
      if (result.error) setError(result.error);
      else setOrder(result.order);
    });
  }
  if (order)
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center p-5">
        <div className="w-full rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <ShoppingBag />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Pedido recebido!</h1>
          <p className="text-muted mt-2">
            Pedido {order.number} · {formatCurrency(order.total)}
          </p>
          <Link
            href={`/pedido/${order.public_code}`}
            className="mt-6 inline-flex h-10 items-center rounded-lg px-5 text-sm font-semibold text-white"
            style={{ backgroundColor: store.accent_color }}
          >
            Acompanhar pedido
          </Link>
        </div>
      </main>
    );
  const logoUrl = store.logo_path ? assetUrl(store.logo_path) : null;
  const bannerUrl = store.banner_path ? assetUrl(store.banner_path) : null;
  return (
    <main
      className="min-h-screen bg-slate-50 pb-12"
      style={{ "--store-color": store.accent_color } as React.CSSProperties}
    >
      <header
        className="bg-[#123d32] text-white"
        style={
          bannerUrl
            ? {
                backgroundImage: `linear-gradient(rgb(0 0 0 / .55),rgb(0 0 0 / .55)),url(${bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="mx-auto flex min-h-64 max-w-7xl flex-col justify-end p-6 sm:p-10">
          {logoUrl && (
            <div
              className="mb-4 h-20 w-20 rounded-2xl bg-white bg-contain bg-center bg-no-repeat shadow"
              style={{ backgroundImage: `url(${logoUrl})` }}
            />
          )}
          <p className="text-sm font-semibold text-white/70">Loja online</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{store.name}</h1>
          {store.description && <p className="mt-3 max-w-2xl text-sm text-white/80">{store.description}</p>}
          <p className="mt-3 text-sm text-white/70">
            {status.is_open
              ? `Aberto para pedidos${status.closes_at ? ` · fecha às ${status.closes_at}` : ""}`
              : status.message}
            {store.opening_hours ? ` · ${store.opening_hours}` : ""}
          </p>
        </div>
      </header>
      {!status.is_open && (
        <div
          role="status"
          className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-900"
        >
          Loja fechada · {status.next_opening ?? status.message}
        </div>
      )}
      <div className="mx-auto mt-7 grid max-w-7xl gap-7 px-4 sm:px-8 lg:grid-cols-[1fr_390px]">
        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-5 w-5 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-10"
                placeholder="Buscar produtos"
              />
            </label>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-10 rounded-lg border bg-white px-3 text-sm"
            >
              <option value="all">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {products.some((product) => product.featured) && categoryId === "all" && !query && (
            <ProductSection
              title="Destaques"
              products={visible.filter((product) => product.featured)}
              assetUrl={assetUrl}
              onAdd={beginAdd}
            />
          )}
          <ProductSection
            title={
              categoryId === "all"
                ? "Todos os produtos"
                : (categories.find((category) => category.id === categoryId)?.name ?? "Produtos")
            }
            products={visible.filter((product) => !product.featured || categoryId !== "all" || Boolean(query))}
            assetUrl={assetUrl}
            onAdd={beginAdd}
          />
        </div>
        <form onSubmit={submit} className="h-fit space-y-5 rounded-2xl border bg-white p-5 lg:sticky lg:top-6">
          <div>
            <h2 className="text-lg font-bold">Seu carrinho</h2>
            <div className="mt-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-muted rounded-lg bg-slate-50 p-5 text-center text-sm">Seu carrinho está vazio.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex items-center gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      {item.optionSummary && (
                        <p className="text-muted line-clamp-2 text-[11px]">{item.optionSummary}</p>
                      )}
                      <p className="text-muted text-xs">{formatCurrency(item.unitPrice * item.quantity)}</p>
                    </div>
                    <button type="button" onClick={() => change(item.cartId, -1)} className="rounded border p-1">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => change(item.cartId, 1)} className="rounded border p-1">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCart((current) => current.filter((row) => row.cartId !== item.cartId))}
                      className="p-1 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="border-t pt-5">
            {suggestedProducts.length > 0 && (
              <div className="mb-5">
                <h3 className="font-semibold">Você também pode gostar</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {suggestedProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => beginAdd(product)}
                      className="rounded-lg border p-3 text-left text-xs transition hover:border-[var(--store-color)]"
                    >
                      <span className="block font-semibold">{product.name}</span>
                      <span className="text-muted">{formatCurrency(product.price)}</span>
                      <span className="mt-2 block font-semibold text-[var(--store-color)]">Adicionar</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <h3 className="font-semibold">1. Entrega</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {store.delivery_enabled && (
                <Choice active={fulfillment === "DELIVERY"} onClick={() => setFulfillment("DELIVERY")}>
                  Entrega
                </Choice>
              )}
              {store.pickup_enabled && (
                <Choice active={fulfillment === "PICKUP"} onClick={() => setFulfillment("PICKUP")}>
                  Retirada
                </Choice>
              )}
              {store.local_enabled && (
                <Choice active={fulfillment === "LOCAL"} onClick={() => setFulfillment("LOCAL")}>
                  No local
                </Choice>
              )}
            </div>
            {fulfillment === "DELIVERY" && (
              <div className="mt-3 space-y-3">
                <select
                  required
                  value={zoneId}
                  onChange={(event) => setZoneId(event.target.value)}
                  className="h-10 w-full rounded-lg border bg-white px-3 text-sm"
                >
                  <option value="">Área de entrega</option>
                  {zones.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {formatCurrency(item.fee)}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <Input name="street" required placeholder="Rua" />
                  <Input name="number" required placeholder="Número" />
                </div>
                <Input name="complement" placeholder="Complemento" />
              </div>
            )}
          </div>
          <div className="border-t pt-5">
            <h3 className="font-semibold">2. Seus dados e pagamento</h3>
            <div className="mt-3 space-y-3">
              <Input name="customerName" required placeholder="Nome" />
              <Input name="customerPhone" required placeholder="WhatsApp" />
              <select name="paymentMethod" className="h-10 w-full rounded-lg border bg-white px-3 text-sm">
                <option value="PIX">Pix</option>
                <option value="CASH">Dinheiro</option>
                <option value="CREDIT_CARD">Crédito na entrega</option>
                <option value="DEBIT_CARD">Débito na entrega</option>
              </select>
              <Input name="cashChangeFor" type="number" step="0.01" min="0" placeholder="Troco para (se dinheiro)" />
              <Input name="couponCode" placeholder="Cupom" />
              <textarea
                name="notes"
                maxLength={500}
                className="min-h-20 w-full rounded-lg border p-3 text-sm"
                placeholder="Observações"
              />
            </div>
          </div>
          <div className="border-t pt-5">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>Entrega</span>
              <span>{formatCurrency(fee)}</span>
            </div>
            <div className="mt-3 flex justify-between text-lg font-bold">
              <span>Total estimado</span>
              <span>{formatCurrency(estimatedTotal)}</span>
            </div>
            <p className="text-muted mt-1 text-xs">Cupons são validados ao finalizar.</p>
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            style={{ backgroundColor: store.accent_color }}
            disabled={pending || !status.is_open || cart.length === 0}
          >
            {pending ? "Enviando…" : "Confirmar pedido"}
          </Button>
        </form>
      </div>
      {customizing && (
        <ProductCustomizer product={customizing} assetUrl={assetUrl} onClose={() => setCustomizing(null)} onAdd={add} />
      )}
      <footer className="text-muted mx-auto mt-12 max-w-7xl border-t px-5 py-8 text-sm">
        <p className="max-w-3xl">{status.store_description ?? store.store_description ?? store.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {status.instagram_handle && (
            <a
              href={`https://instagram.com/${status.instagram_handle.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              Instagram {status.instagram_handle}
            </a>
          )}
          {status.whatsapp_contact && (
            <a href={`https://wa.me/${status.whatsapp_contact.replace(/\D/g, "")}`}>WhatsApp</a>
          )}
          {status.contact_email && <a href={`mailto:${status.contact_email}`}>{status.contact_email}</a>}
          {status.contact_phone && <span>{status.contact_phone}</span>}
        </div>
      </footer>
    </main>
  );
}

function ProductSection({
  title,
  products,
  assetUrl,
  onAdd,
}: {
  title: string;
  products: Product[];
  assetUrl: (path: string) => string;
  onAdd: (product: Product) => void;
}) {
  if (!products.length)
    return (
      <div className="text-muted rounded-xl border border-dashed bg-white p-10 text-center text-sm">
        Nenhum produto encontrado.
      </div>
    );
  return (
    <section className="mb-9">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const image = product.images.find((item) => item.primary) ?? product.images[0];
          const soldOut = Number(product.available) <= 0;
          return (
            <article
              key={product.id}
              className={`overflow-hidden rounded-xl border bg-white ${soldOut ? "opacity-75" : ""}`}
            >
              <div
                className="relative aspect-[4/3] bg-slate-100 bg-cover bg-center"
                style={image ? { backgroundImage: `url(${assetUrl(image.path)})` } : undefined}
              >
                {soldOut && (
                  <span className="absolute top-3 left-3 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    Esgotado
                  </span>
                )}
              </div>
              <div className="flex min-h-48 flex-col p-5">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-muted mt-2 line-clamp-2 flex-1 text-sm">
                  {product.description || "Produto disponível para pedido."}
                </p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    {product.promotional && (
                      <p className="text-muted text-xs line-through">{formatCurrency(product.regular_price)}</p>
                    )}
                    <p className="font-bold text-[var(--store-color)]">{formatCurrency(product.price)}</p>
                    <p className="text-muted text-xs">
                      {soldOut ? "Sem estoque" : `${Number(product.available)} disponíveis`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    disabled={soldOut}
                    className="px-3"
                    style={{ backgroundColor: "var(--store-color)" }}
                    onClick={() => onAdd(product)}
                  >
                    {!soldOut && <Plus className="h-4 w-4" />}
                    {soldOut ? "Esgotado" : product.option_groups.length ? "Escolher" : "Adicionar"}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
function ProductCustomizer({
  product,
  assetUrl,
  onClose,
  onAdd,
}: {
  product: Product;
  assetUrl: (path: string) => string;
  onClose: () => void;
  onAdd: (product: Product, optionIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const invalid = product.option_groups.some((group) => {
    const count = group.options.filter((option) => selected.includes(option.id)).length;
    return count < group.minimum || count > group.maximum;
  });
  function toggle(group: OptionGroup, id: string) {
    setSelected((current) => {
      const has = current.includes(id);
      if (has) return current.filter((value) => value !== id);
      const selectedInGroup = group.options.filter((option) => current.includes(option.id));
      if (group.maximum === 1)
        return [...current.filter((value) => !group.options.some((option) => option.id === value)), id];
      if (selectedInGroup.length >= group.maximum) return current;
      return [...current, id];
    });
  }
  const image = product.images.find((item) => item.primary) ?? product.images[0];
  const extra = product.option_groups
    .flatMap((group) => group.options)
    .filter((option) => selected.includes(option.id))
    .reduce((sum, option) => sum + Number(option.price_delta), 0);
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-5">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:max-w-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            {image && (
              <div
                className="mb-4 aspect-[3/1] rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${assetUrl(image.path)})` }}
              />
            )}
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-muted mt-1 text-sm">{product.description}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
            <X />
          </button>
        </div>
        <div className="mt-5 space-y-5">
          {product.option_groups.map((group) => (
            <fieldset key={group.id}>
              <legend className="font-semibold">
                {group.name}{" "}
                <span className="text-muted text-xs font-normal">
                  {group.minimum > 0 ? `escolha de ${group.minimum} a ${group.maximum}` : `até ${group.maximum}`}
                </span>
              </legend>
              <div className="mt-2 space-y-2">
                {group.options.map((option) => (
                  <label key={option.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="flex items-center gap-3">
                      <input
                        type={group.maximum === 1 ? "radio" : "checkbox"}
                        name={group.id}
                        checked={selected.includes(option.id)}
                        onChange={() => toggle(group, option.id)}
                      />
                      {option.name}
                    </span>
                    {Number(option.price_delta) !== 0 && (
                      <span>
                        {Number(option.price_delta) > 0 ? "+ " : ""}
                        {formatCurrency(option.price_delta)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t pt-5">
          <strong>{formatCurrency(Number(product.price) + extra)}</strong>
          <Button type="button" disabled={invalid} onClick={() => onAdd(product, selected)}>
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-xs font-semibold ${active ? "border-[var(--store-color)] bg-slate-50 text-[var(--store-color)]" : "bg-white"}`}
    >
      {children}
    </button>
  );
}
