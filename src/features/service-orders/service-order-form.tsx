"use client";

import { useActionState } from "react";
import { createServiceOrder } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Option={id:string;name:string};
const initialState:{error?:string}={};

export function ServiceOrderForm({customers,technicians}:{customers:Option[];technicians:Option[]}){
  const [state,action,pending]=useActionState(createServiceOrder,initialState);
  return <form action={action} className="space-y-7">
    <section><h2 className="font-semibold">Cliente e equipamento</h2><div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-medium">Cliente<select name="customerId" required className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="">Selecione</option>{customers.map(customer=><option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
      <Field name="equipmentName" label="Equipamento" required placeholder="Ex.: Smartphone"/><Field name="brandName" label="Marca"/><Field name="modelName" label="Modelo"/><Field name="serialNumber" label="Número de série"/><Field name="imei" label="IMEI"/><Field name="color" label="Cor"/><Field name="voltage" label="Voltagem"/><Field name="invoiceNumber" label="Nota fiscal"/>
      <label className="text-sm font-medium">Técnico responsável<select name="assignedTechnicianId" className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="">Não definido</option>{technicians.map(technician=><option key={technician.id} value={technician.id}>{technician.name}</option>)}</select></label>
      <label className="text-sm font-medium">Previsão de entrega<Input className="mt-2" name="estimatedDeliveryAt" type="datetime-local"/></label>
    </div></section>
    <section><h2 className="font-semibold">Condição de entrada</h2><div className="mt-4 grid gap-5 sm:grid-cols-2">
      <TextArea name="reportedDefect" label="Defeito relatado" required/><TextArea name="visibleDamage" label="Avarias visíveis"/><TextArea name="accessories" label="Acessórios entregues"/><TextArea name="generalNotes" label="Observações gerais"/><TextArea name="accessInstructions" label="Senha ou padrão de acesso" hint="Visível somente para perfis autorizados."/>
    </div></section>
    <label className="flex items-center gap-3 text-sm font-medium"><input name="isWarranty" type="checkbox" className="h-4 w-4 rounded border"/>Atendimento em garantia</label>
    {state.error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <div className="flex justify-end"><Button disabled={pending}>{pending?'Abrindo O.S.…':'Abrir ordem de serviço'}</Button></div>
  </form>;
}

function Field({name,label,required,placeholder}:{name:string;label:string;required?:boolean;placeholder?:string}){return <label className="text-sm font-medium">{label}<Input className="mt-2" name={name} required={required} placeholder={placeholder}/></label>}
function TextArea({name,label,required,hint}:{name:string;label:string;required?:boolean;hint?:string}){return <label className="text-sm font-medium">{label}<textarea name={name} required={required} className="mt-2 min-h-28 w-full rounded-lg border bg-white p-3 outline-none focus:border-primary"/>{hint&&<span className="mt-1 block text-xs text-muted">{hint}</span>}</label>}
