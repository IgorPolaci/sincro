"use client";

import { useActionState } from "react";
import {
  createCoupon,
  createDeliveryZone,
  createStoreClosure,
  updateDeliverySettings,
  updateOpeningHours,
} from "./settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Settings = {
  store_name: string;
  minimum_order: number | string;
  whatsapp: string | null;
  opening_hours: string | null;
  is_open: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  local_enabled: boolean;
};
type OpeningHour = {
  day_of_week: number;
  opening_time: string | null;
  closing_time: string | null;
  closed_all_day: boolean;
};
const initial = {};
export function StoreSettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(updateDeliverySettings, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="storeName" label="Nome da loja" defaultValue={settings.store_name} />
        <Field
          name="minimumOrder"
          label="Pedido mínimo"
          type="number"
          step="0.01"
          defaultValue={settings.minimum_order}
        />
        <Field name="whatsapp" label="WhatsApp" defaultValue={settings.whatsapp ?? ""} />
        <Field name="openingHours" label="Texto auxiliar de horário" defaultValue={settings.opening_hours ?? ""} />
      </div>
      <div className="flex flex-wrap gap-5">
        {[
          ["isOpen", "Aceitando pedidos", settings.is_open],
          ["deliveryEnabled", "Entrega", settings.delivery_enabled],
          ["pickupEnabled", "Retirada", settings.pickup_enabled],
          ["localEnabled", "No local", settings.local_enabled],
        ].map(([name, label, checked]) => (
          <label key={String(name)} className="flex items-center gap-2 text-sm font-medium">
            <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} />
            {String(label)}
          </label>
        ))}
      </div>
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Salvando…" : "Salvar loja"}</Button>
    </form>
  );
}
export function ZoneForm() {
  const [state, action, pending] = useActionState(createDeliveryZone, initial);
  return (
    <form action={action} className="space-y-3">
      <Field name="name" label="Nome da área" />
      <Field name="neighborhood" label="Bairro" />
      <div className="grid grid-cols-2 gap-3">
        <Field name="fee" label="Taxa" type="number" step="0.01" defaultValue="0" />
        <Field name="minimumOrder" label="Pedido mínimo" type="number" step="0.01" defaultValue="0" />
      </div>
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Criando…" : "Adicionar área"}</Button>
    </form>
  );
}
export function CouponForm() {
  const [state, action, pending] = useActionState(createCoupon, initial);
  return (
    <form action={action} className="space-y-3">
      <Field name="code" label="Código" />
      <label className="block text-sm font-medium">
        Tipo
        <select name="discountType" className="mt-2 h-10 w-full rounded-lg border bg-white px-3">
          <option value="PERCENT">Percentual</option>
          <option value="FIXED">Valor fixo</option>
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field name="discountValue" label="Desconto" type="number" step="0.01" />
        <Field name="minimumOrder" label="Pedido mínimo" type="number" step="0.01" defaultValue="0" />
      </div>
      <Field name="usageLimit" label="Limite de usos" type="number" />
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Criando…" : "Criar cupom"}</Button>
    </form>
  );
}
const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
export function OpeningHoursForm({ hours }: { hours: OpeningHour[] }) {
  const [state, action, pending] = useActionState(updateOpeningHours, initial);
  return (
    <form action={action} className="space-y-3">
      {dayNames.map((label, day) => {
        const value = hours.find((item) => item.day_of_week === day);
        return (
          <div
            key={label}
            className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-center"
          >
            <strong className="text-sm">{label}</strong>
            <Input name={`day${day}Open`} type="time" defaultValue={value?.opening_time?.slice(0, 5) ?? "09:00"} />
            <Input name={`day${day}Close`} type="time" defaultValue={value?.closing_time?.slice(0, 5) ?? "18:00"} />
            <label className="flex items-center gap-2 text-xs">
              <input name={`day${day}Closed`} type="checkbox" defaultChecked={value?.closed_all_day ?? false} />
              Fechado
            </label>
          </div>
        );
      })}
      <Feedback state={state} />
      <Button disabled={pending}>{pending ? "Salvando…" : "Salvar horários"}</Button>
    </form>
  );
}
export function StoreClosureForm() {
  const [state, action, pending] = useActionState(createStoreClosure, initial);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
      <Field name="closureDate" label="Data" type="date" />
      <Field name="reason" label="Motivo" />
      <Button disabled={pending}>{pending ? "Salvando…" : "Adicionar fechamento"}</Button>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}
function Field(props: { name: string; label: string; type?: string; step?: string; defaultValue?: string | number }) {
  return (
    <label className="block text-sm font-medium">
      {props.label}
      <Input
        className="mt-2"
        required={!["whatsapp", "openingHours", "usageLimit", "reason"].includes(props.name)}
        {...props}
      />
    </label>
  );
}
function Feedback({ state }: { state: { error?: string; success?: string } }) {
  return (
    <>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
    </>
  );
}
