"use client";

import { useActionState } from "react";
import { changeServiceOrderStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status={code:string;name:string};
const initialState:{error?:string}={};

export function ServiceOrderStatusForm({serviceOrderId,statuses,currentCode}:{serviceOrderId:string;statuses:Status[];currentCode:string}){
  const [state,action,pending]=useActionState(changeServiceOrderStatus,initialState);
  return <form action={action} className="space-y-4"><input type="hidden" name="serviceOrderId" value={serviceOrderId}/><label className="block text-sm font-medium">Novo status<select name="statusCode" defaultValue={currentCode} className="mt-2 h-10 w-full rounded-lg border bg-white px-3">{statuses.map(status=><option key={status.code} value={status.code}>{status.name}</option>)}</select></label><label className="block text-sm font-medium">Observação<Input className="mt-2" name="note" placeholder="Obrigatória para cancelamento"/></label>{state.error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}<Button disabled={pending}>{pending?'Atualizando…':'Atualizar status'}</Button></form>;
}
