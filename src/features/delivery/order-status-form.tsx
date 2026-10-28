"use client";

import { useActionState } from "react";
import { transitionOrder } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const nextStatuses:Record<string,{value:string;label:string}[]>={NEW:[{value:"CONFIRMED",label:"Confirmar"},{value:"CANCELLED",label:"Cancelar"}],CONFIRMED:[{value:"PREPARING",label:"Iniciar preparo"},{value:"CANCELLED",label:"Cancelar"}],PREPARING:[{value:"READY",label:"Marcar pronto"},{value:"CANCELLED",label:"Cancelar"}],READY:[{value:"OUT_FOR_DELIVERY",label:"Saiu para entrega"},{value:"DELIVERED",label:"Entregue"},{value:"CANCELLED",label:"Cancelar"}],OUT_FOR_DELIVERY:[{value:"DELIVERED",label:"Entregue"},{value:"CANCELLED",label:"Cancelar"}]};

export function OrderStatusForm({orderId,status,cashSessionId}:{orderId:string;status:string;cashSessionId:string|null}){
  const [state,action,pending]=useActionState(transitionOrder,{});const options=nextStatuses[status]??[];if(!options.length)return null;
  return <form action={action} className="mt-4 space-y-2 border-t pt-4"><input type="hidden" name="orderId" value={orderId}/><input type="hidden" name="cashSessionId" value={cashSessionId??""}/><select name="status" className="h-9 w-full rounded-lg border bg-white px-2 text-sm">{options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><Input name="notes" className="h-9" placeholder="Observação / motivo" maxLength={500}/>{state.error&&<p className="text-xs text-red-600">{state.error}</p>}{state.success&&<p className="text-xs text-emerald-600">{state.success}</p>}<Button className="h-9 w-full" disabled={pending}>{pending?"Atualizando…":"Atualizar status"}</Button></form>;
}
