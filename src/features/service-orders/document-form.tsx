"use client";

import { useActionState } from "react";
import { Printer } from "lucide-react";
import { generateServiceOrderDocument } from "./actions";
import { Button } from "@/components/ui/button";

const initial:{error?:string}={};
export function ServiceOrderDocumentForm({serviceOrderId}:{serviceOrderId:string}){
  const [state,action,pending]=useActionState(generateServiceOrderDocument,initial);
  return <form action={action} className="space-y-4"><input type="hidden" name="serviceOrderId" value={serviceOrderId}/><label className="block text-sm font-medium">Documento<select name="type" className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="ENTRY">Entrada da O.S.</option><option value="QUOTE">Orçamento</option><option value="RECEIPT">Recibo</option><option value="WARRANTY">Termo de garantia</option><option value="TECHNICAL_REPORT">Laudo técnico</option></select></label><label className="block text-sm font-medium">Papel<select name="paperFormat" className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="A4">A4</option><option value="THERMAL_80">Térmica 80 mm</option><option value="THERMAL_58">Térmica 58 mm</option></select></label>{state.error&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}<Button variant="secondary" disabled={pending}><Printer className="h-4 w-4"/>{pending?'Gerando…':'Gerar documento'}</Button></form>;
}
