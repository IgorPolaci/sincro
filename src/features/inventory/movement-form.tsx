"use client";
import { useActionState } from "react";
import { moveInventory } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Product={id:string;name:string;sku:string};
const initialState:{error?:string}={};
export function MovementForm({products}:{products:Product[]}){
  const [state,action,pending]=useActionState(moveInventory,initialState);
  return <form action={action} className="space-y-5">
    <label className="block text-sm font-medium">Produto<select name="productId" required className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="">Selecione</option>{products.map(p=><option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}</select></label>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-medium">Tipo<select name="type" className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="ENTRY">Entrada</option><option value="PURCHASE">Compra</option><option value="RETURN">Devolução</option><option value="EXIT">Saída</option><option value="ADJUSTMENT">Ajuste positivo</option></select></label><label className="text-sm font-medium">Quantidade<Input name="quantity" type="number" min="0.001" step="0.001" className="mt-2" required/></label></div>
    <label className="block text-sm font-medium">Motivo<Input name="reason" className="mt-2" required/></label>
    {state.error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
    <div className="flex justify-end"><Button disabled={pending}>{pending?'Processando…':'Confirmar movimentação'}</Button></div>
  </form>
}
