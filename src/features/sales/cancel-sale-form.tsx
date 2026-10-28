"use client";

import { useActionState } from "react";
import { cancelSale } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CancelSaleForm({saleId,cashSessionId,hasCashPayment}:{saleId:string;cashSessionId:string|null;hasCashPayment:boolean}){
  const [state,action,pending]=useActionState(cancelSale,{});
  return <form action={action} className="space-y-3">
    <input type="hidden" name="saleId" value={saleId}/><input type="hidden" name="cashSessionId" value={cashSessionId??""}/>
    <label className="block text-sm font-medium">Motivo do cancelamento<Input name="reason" className="mt-2" required minLength={5} maxLength={500}/></label>
    {hasCashPayment&&!cashSessionId&&<p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Abra o caixa desta unidade antes de estornar o pagamento em dinheiro.</p>}
    {state.error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    {state.success&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p>}
    <Button variant="danger" disabled={pending||(hasCashPayment&&!cashSessionId)}>{pending?"Cancelando…":"Cancelar venda e estornar"}</Button>
  </form>;
}
