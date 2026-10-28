import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CouponForm,
  OpeningHoursForm,
  StoreClosureForm,
  StoreSettingsForm,
  ZoneForm,
} from "@/features/delivery/settings-forms";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { formatCurrency } from "@/lib/utils";

export default async function DeliverySettingsPage() {
  const [supabase, { current }] = await Promise.all([createClient(), getBusinessUnitContext()]);
  if (current?.type !== "STORE_DELIVERY")
    return (
      <>
        <PageHeader title="Configurações do delivery" />
        <Card>
          <EmptyState title="Segmento incorreto" description="Selecione Loja e Delivery." />
        </Card>
      </>
    );
  const [
    { data: settings },
    { data: zones },
    { data: coupons },
    { data: organization },
    { data: hours },
    { data: closures },
  ] = await Promise.all([
    supabase.from("delivery_settings").select("*").eq("business_unit_id", current.id).single(),
    supabase
      .from("delivery_zones")
      .select("id,name,neighborhood,fee,minimum_order,active")
      .eq("business_unit_id", current.id)
      .order("name"),
    supabase
      .from("coupons")
      .select("id,code,discount_type,discount_value,minimum_order,usage_count,usage_limit,active")
      .eq("business_unit_id", current.id)
      .order("created_at", { ascending: false }),
    supabase.from("organizations").select("catalog_slug").single(),
    supabase
      .from("store_opening_hours")
      .select("day_of_week,opening_time,closing_time,closed_all_day")
      .eq("business_unit_id", current.id)
      .order("day_of_week"),
    supabase
      .from("store_closures")
      .select("id,closure_date,reason")
      .eq("business_unit_id", current.id)
      .eq("active", true)
      .gte("closure_date", new Date().toISOString().slice(0, 10))
      .order("closure_date")
      .limit(20),
  ]);
  if (!settings) return null;
  return (
    <>
      <PageHeader
        title="Configurações do delivery"
        description="Loja pública, horários, áreas, taxas e campanhas."
        action={
          <Link
            href={`/loja/${organization?.catalog_slug}`}
            target="_blank"
            className="bg-primary inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Ver catálogo
          </Link>
        }
      />
      <Card className="p-6">
        <h2 className="mb-5 font-semibold">Loja</h2>
        <StoreSettingsForm settings={settings} />
      </Card>
      <Card className="p-6">
        <h2 className="font-semibold">Horário de funcionamento</h2>
        <p className="text-muted mt-1 mb-5 text-sm">O checkout é bloqueado automaticamente fora destes intervalos.</p>
        <OpeningHoursForm hours={hours ?? []} />
        <div className="mt-7 border-t pt-5">
          <h3 className="mb-3 font-medium">Feriados e fechamentos</h3>
          <StoreClosureForm />
          {closures?.length ? (
            <ul className="mt-4 divide-y text-sm">
              {closures.map((item) => (
                <li key={item.id} className="flex justify-between py-3">
                  <span>{item.closure_date}</span>
                  <span className="text-muted">{item.reason ?? "Fechado"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mt-4 text-sm">Nenhum fechamento futuro cadastrado.</p>
          )}
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-5 font-semibold">Nova área de entrega</h2>
          <ZoneForm />
        </Card>
        <Card className="p-6">
          <h2 className="mb-5 font-semibold">Novo cupom</h2>
          <CouponForm />
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Áreas ativas</h2>
          </div>
          <div className="divide-y">
            {zones?.map((zone) => (
              <div key={zone.id} className="flex justify-between px-5 py-4 text-sm">
                <div>
                  <p className="font-medium">{zone.name}</p>
                  <p className="text-muted text-xs">
                    {zone.neighborhood} · mínimo {formatCurrency(zone.minimum_order)}
                  </p>
                </div>
                <strong>{formatCurrency(zone.fee)}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Cupons</h2>
          </div>
          <div className="divide-y">
            {coupons?.map((coupon) => (
              <div key={coupon.id} className="flex justify-between px-5 py-4 text-sm">
                <div>
                  <p className="font-medium">{coupon.code}</p>
                  <p className="text-muted text-xs">
                    Mínimo {formatCurrency(coupon.minimum_order)} · {coupon.usage_count}/{coupon.usage_limit ?? "∞"}{" "}
                    usos
                  </p>
                </div>
                <strong>
                  {coupon.discount_type === "PERCENT"
                    ? `${coupon.discount_value}%`
                    : formatCurrency(coupon.discount_value)}
                </strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
