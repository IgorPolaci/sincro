"use client";
import { useState,useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema,type ProductInput } from "@/lib/validations/product";
import { createProduct } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProductForm(){
  const [pending,start]=useTransition();const [serverError,setServerError]=useState<string>();
  const {register,handleSubmit,formState:{errors}}=useForm<ProductInput>({resolver:zodResolver(productSchema),defaultValues:{cost_price:0,sale_price:0,minimum_stock:0,unit:'UN'}});
  const submit=handleSubmit(values=>start(async()=>{const result=await createProduct(values);setServerError(result.error)}));
  const fields=[['sku','SKU','text'],['name','Nome','text'],['barcode','Código de barras','text'],['unit','Unidade','text'],['cost_price','Preço de custo','number'],['sale_price','Preço de venda','number'],['minimum_stock','Estoque mínimo','number'],['location','Localização','text']] as const;
  return <form onSubmit={submit} className="space-y-6"><div className="grid gap-5 sm:grid-cols-2">{fields.map(([name,label,type])=><label key={name} className="text-sm font-medium">{label}<Input className="mt-2" type={type} step={type==='number'?'0.01':undefined} {...register(name,type==='number'?{valueAsNumber:true}:{})}/>{errors[name]&&<span className="mt-1 block text-xs text-red-600">{errors[name]?.message}</span>}</label>)}</div><label className="block text-sm font-medium">Descrição<textarea {...register('description')} className="mt-2 min-h-28 w-full rounded-lg border bg-white p-3 outline-none focus:border-primary"/></label>{serverError&&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}<div className="flex justify-end"><Button disabled={pending}>{pending?'Salvando…':'Salvar produto'}</Button></div></form>
}
