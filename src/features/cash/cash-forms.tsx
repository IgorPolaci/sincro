"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { closeCashSession,openCashSession,recordCashMovement,type CashActionState } from "./actions";

const initial:CashActionState={};
function Feedback({state}:{state:CashActionState}){return <>{state.error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}{state.success&&<p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p>}</>}

export function OpenCashForm({registerId}:{registerId:string}){
  const [state,action,pending]=useActionState(openCashSession,initial);
  return <form action={action} className="space-y-4"><input type="hidden" name="cashRegisterId" value={registerId}/><label className="block text-sm font-medium">Saldo inicial<Input className="mt-2" name="openingBalance" type="number" min="0" step="0.01" defaultValue="0" required/></label><Feedback state={state}/><Button disabled={pending}>{pending?'Abrindo…':'Abrir caixa'}</Button></form>;
}
export function CashMovementForm({sessionId}:{sessionId:string}){
  const [state,action,pending]=useActionState(recordCashMovement,initial);
  return <form action={action} className="space-y-4"><input type="hidden" name="cashSessionId" value={sessionId}/><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Operação<select name="type" className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="SUPPLY">Suprimento</option><option value="WITHDRAWAL">Sangria</option></select></label><label className="text-sm font-medium">Valor<Input className="mt-2" name="amount" type="number" min="0.01" step="0.01" required/></label></div><label className="block text-sm font-medium">Descrição<Input className="mt-2" name="description" required/></label><Feedback state={state}/><Button disabled={pending}>{pending?'Registrando…':'Registrar movimentação'}</Button></form>;
}

export function CloseCashForm({sessionId}:{sessionId:string}){
  const [state,action,pending]=useActionState(closeCashSession,initial);
  return <form action={action} className="space-y-4"><input type="hidden" name="cashSessionId" value={sessionId}/><label className="block text-sm font-medium">Saldo contado<Input className="mt-2" name="closingBalance" type="number" min="0" step="0.01" required/></label><label className="block text-sm font-medium">Observações<Input className="mt-2" name="notes"/></label><Feedback state={state}/><Button variant="danger" disabled={pending}>{pending?'Fechando…':'Fechar caixa'}</Button></form>;
}
