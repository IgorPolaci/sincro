"use client";

import { FormEvent,useActionState,useState,useTransition } from "react";
import { addChecklistItem,addServiceOrderPart,addServiceOrderService,registerServiceOrderPhoto,removeServiceOrderItem,updateChecklistItem,type ServiceOrderActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const initial:ServiceOrderActionState={};
function ErrorMessage({error}:{error?:string}){return error?<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}

export function AddServiceForm({serviceOrderId}:{serviceOrderId:string}){
  const [state,action,pending]=useActionState(addServiceOrderService,initial);
  return <form action={action} className="space-y-4"><input type="hidden" name="serviceOrderId" value={serviceOrderId}/><label className="block text-sm font-medium">Descrição<Input name="description" className="mt-2" required/></label><div className="grid gap-4 sm:grid-cols-4"><NumberField name="quantity" label="Qtd." defaultValue="1" step="0.001"/><NumberField name="unitPrice" label="Valor unitário" defaultValue="0"/><NumberField name="discount" label="Desconto" defaultValue="0"/><NumberField name="warrantyDays" label="Garantia (dias)" defaultValue="90" step="1"/></div><ErrorMessage error={state.error}/><Button disabled={pending}>{pending?'Adicionando…':'Adicionar serviço'}</Button></form>;
}

type ProductOption={id:string;name:string;sku:string;sale_price:number|string;stock:number|string};
export function AddPartForm({serviceOrderId,products}:{serviceOrderId:string;products:ProductOption[]}){
  const [state,action,pending]=useActionState(addServiceOrderPart,initial);
  return <form action={action} className="space-y-4"><input type="hidden" name="serviceOrderId" value={serviceOrderId}/><label className="block text-sm font-medium">Peça<select name="productId" required className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="">Selecione</option>{products.map(product=><option key={product.id} value={product.id}>{product.sku} · {product.name} · saldo {product.stock}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-3"><NumberField name="quantity" label="Qtd." defaultValue="1" step="0.001"/><NumberField name="unitPrice" label="Valor unitário" defaultValue="0"/><NumberField name="discount" label="Desconto" defaultValue="0"/></div><p className="text-xs text-muted">A peça é conferida agora e baixada do estoque somente quando a O.S. for faturada.</p><ErrorMessage error={state.error}/><Button disabled={pending||!products.length}>{pending?'Adicionando…':'Adicionar peça'}</Button></form>;
}

export function RemoveOrderItemForm({serviceOrderId,itemId,itemType}:{serviceOrderId:string;itemId:string;itemType:'SERVICE'|'PART'}){
  const [state,action,pending]=useActionState(removeServiceOrderItem,initial);
  return <form action={action} className="flex min-w-64 items-center gap-2"><input type="hidden" name="serviceOrderId" value={serviceOrderId}/><input type="hidden" name="itemId" value={itemId}/><input type="hidden" name="itemType" value={itemType}/><Input name="reason" required placeholder="Motivo da remoção"/><Button variant="danger" disabled={pending}>{pending?'…':'Remover'}</Button><ErrorMessage error={state.error}/></form>;
}

export function AddChecklistItemForm({serviceOrderId}:{serviceOrderId:string}){
  const [state,action,pending]=useActionState(addChecklistItem,initial);
  return <form action={action} className="flex flex-wrap gap-2"><input type="hidden" name="serviceOrderId" value={serviceOrderId}/><Input name="label" required placeholder="Ex.: Tela sem trincas" className="min-w-64 flex-1"/><Button disabled={pending}>{pending?'Adicionando…':'Adicionar item'}</Button><ErrorMessage error={state.error}/></form>;
}

export function ChecklistItemForm({serviceOrderId,item}:{serviceOrderId:string;item:{id:string;label:string;checked:boolean;notes:string|null}}){
  const [state,action,pending]=useActionState(updateChecklistItem,initial);
  return <form action={action} className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-center"><input type="hidden" name="itemId" value={item.id}/><input type="hidden" name="serviceOrderId" value={serviceOrderId}/><input name="checked" type="checkbox" defaultChecked={item.checked} className="h-5 w-5 rounded border"/><span className="text-sm font-medium">{item.label}</span><Input name="notes" defaultValue={item.notes??''} placeholder="Observação"/><Button variant="secondary" disabled={pending}>{pending?'Salvando…':'Salvar'}</Button><ErrorMessage error={state.error}/></form>;
}

export function PhotoUploadForm({serviceOrderId}:{serviceOrderId:string}){
  const [pending,startTransition]=useTransition();const [state,setState]=useState<ServiceOrderActionState>({});const [progress,setProgress]=useState('');
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const values=new FormData(form);const photo=values.get('photo');const caption=String(values.get('caption')??'');setState({});
    if(!(photo instanceof File)||photo.size===0){setState({error:'Selecione uma foto.'});return}if(!['image/jpeg','image/png','image/webp'].includes(photo.type)){setState({error:'Formato permitido: JPG, PNG ou WebP.'});return}if(photo.size>10*1024*1024){setState({error:'A foto deve ter no máximo 10 MB.'});return}
    startTransition(async()=>{const supabase=createClient();setProgress('Preparando envio…');const [{data:org},{data:order}]=await Promise.all([supabase.rpc('current_organization_id'),supabase.from('service_orders').select('business_unit_id').eq('id',serviceOrderId).maybeSingle()]);if(!org||!order){setProgress('');setState({error:'Ordem de serviço não encontrada.'});return}const extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[photo.type];const path=`${org}/${order.business_unit_id}/${serviceOrderId}/${crypto.randomUUID()}.${extension}`;setProgress('Enviando ao armazenamento…');const {error:uploadError}=await supabase.storage.from('service-order-photos').upload(path,photo,{contentType:photo.type,upsert:false});if(uploadError){setProgress('');setState({error:'Não foi possível enviar a foto.'});return}setProgress('Registrando foto…');const result=await registerServiceOrderPhoto({serviceOrderId,storagePath:path,caption});if(result.error){await supabase.storage.from('service-order-photos').remove([path]);setProgress('');setState(result);return}form.reset();setProgress('');setState({});});
  }
  return <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Foto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-2 block w-full rounded-lg border bg-white p-2 text-sm"/></label><label className="block text-sm font-medium">Legenda<Input name="caption" className="mt-2" maxLength={300}/></label><p className="text-xs text-muted">JPG, PNG ou WebP, até 10 MB. O arquivo é enviado diretamente ao armazenamento seguro.</p>{progress&&<p role="status" className="text-sm text-primary">{progress}</p>}<ErrorMessage error={state.error}/><Button disabled={pending}>{pending?'Enviando…':'Enviar foto'}</Button></form>;
}

function NumberField({name,label,defaultValue,step='0.01'}:{name:string;label:string;defaultValue:string;step?:string}){return <label className="text-sm font-medium">{label}<Input className="mt-2" name={name} type="number" min="0" step={step} defaultValue={defaultValue} required/></label>}
