"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { completeSale } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type Product={id:string;name:string;sku:string|null;barcode:string|null;sale_price:number|string;stock:number|string};
type Customer={id:string;name:string};
type CartLine=Product&{quantity:number};
type Payment={method:"CASH"|"PIX"|"CREDIT_CARD"|"DEBIT_CARD"|"BANK_TRANSFER"|"BOLETO"|"OTHER";amount:string;reference:string};

const paymentLabels={CASH:"Dinheiro",PIX:"Pix",CREDIT_CARD:"Cartão de crédito",DEBIT_CARD:"Cartão de débito",BANK_TRANSFER:"Transferência",BOLETO:"Boleto",OTHER:"Outro"};

export function SaleForm({products,customers,cashSessionId}:{products:Product[];customers:Customer[];cashSessionId:string|null}){
  const router=useRouter();
  const [pending,startTransition]=useTransition();
  const [cart,setCart]=useState<CartLine[]>([]);
  const [selectedProduct,setSelectedProduct]=useState(products[0]?.id??"");
  const [customerId,setCustomerId]=useState("");
  const [discount,setDiscount]=useState("0");
  const [notes,setNotes]=useState("");
  const [payments,setPayments]=useState<Payment[]>([{method:"PIX",amount:"",reference:""}]);
  const [error,setError]=useState<string>();
  const subtotal=useMemo(()=>cart.reduce((sum,line)=>sum+Number(line.sale_price)*line.quantity,0),[cart]);
  const total=Math.max(0,subtotal-(Number(discount)||0));
  const paid=payments.reduce((sum,payment)=>sum+(Number(payment.amount)||0),0);
  const remaining=Math.round((total-paid)*100)/100;

  function addProduct(){
    const product=products.find(item=>item.id===selectedProduct);
    if(!product)return;
    setCart(current=>{
      const existing=current.find(item=>item.id===product.id);
      if(existing)return current.map(item=>item.id===product.id?{...item,quantity:Math.min(item.quantity+1,Number(item.stock))}:item);
      return [...current,{...product,quantity:1}];
    });
  }
  function setQuantity(id:string,quantity:number){
    const product=products.find(item=>item.id===id);
    const maximum=Number(product?.stock??0);
    setCart(current=>current.map(item=>item.id===id?{...item,quantity:Math.max(0.001,Math.min(quantity||0.001,maximum))}:item));
  }
  function updatePayment(index:number,patch:Partial<Payment>){setPayments(current=>current.map((item,i)=>i===index?{...item,...patch}:item));}
  function fillRemaining(index:number){updatePayment(index,{amount:String(Math.max(0,Math.round((total-(paid-(Number(payments[index]?.amount)||0)))*100)/100))});}
  function submit(event:FormEvent){
    event.preventDefault();setError(undefined);
    startTransition(async()=>{
      const result=await completeSale({
        customerId:customerId||null,cashSessionId,discount:Number(discount)||0,notes,
        items:cart.map(item=>({product_id:item.id,quantity:item.quantity})),
        payments:payments.map(payment=>({...payment,amount:Number(payment.amount)})),
      });
      if(result.error){setError(result.error);return;}
      router.push(`/vendas/${result.saleId}`);router.refresh();
    });
  }

  return <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_380px]">
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Produtos</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select value={selectedProduct} onChange={event=>setSelectedProduct(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border bg-white px-3 text-sm">
            {products.map(product=><option key={product.id} value={product.id}>{product.name} · {formatCurrency(product.sale_price)} · estoque {Number(product.stock)}</option>)}
          </select>
          <Button type="button" onClick={addProduct} disabled={!selectedProduct}><Plus className="h-4 w-4"/>Adicionar</Button>
        </div>
        <div className="mt-5 divide-y rounded-lg border">
          {cart.length===0?<div className="p-8 text-center text-sm text-muted"><ShoppingCart className="mx-auto mb-2 h-6 w-6"/>Adicione produtos à venda.</div>:cart.map(line=><div key={line.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_140px_110px_40px] sm:items-center">
            <div><p className="font-medium">{line.name}</p><p className="text-xs text-muted">{line.sku||line.barcode||"Sem código"} · disponível {Number(line.stock)}</p></div>
            <Input aria-label={`Quantidade de ${line.name}`} type="number" min="0.001" max={Number(line.stock)} step="0.001" value={line.quantity} onChange={event=>setQuantity(line.id,Number(event.target.value))}/>
            <p className="text-right font-semibold">{formatCurrency(Number(line.sale_price)*line.quantity)}</p>
            <Button aria-label={`Remover ${line.name}`} type="button" variant="ghost" className="px-2 text-red-600" onClick={()=>setCart(current=>current.filter(item=>item.id!==line.id))}><Trash2 className="h-4 w-4"/></Button>
          </div>)}
        </div>
      </section>
      <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Cliente e observações</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Cliente<select value={customerId} onChange={event=>setCustomerId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border bg-white px-3"><option value="">Consumidor não identificado</option>{customers.map(customer=><option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label className="text-sm font-medium">Desconto<Input className="mt-2" type="number" min="0" max={subtotal} step="0.01" value={discount} onChange={event=>setDiscount(event.target.value)}/></label>
        <label className="text-sm font-medium sm:col-span-2">Observações<textarea value={notes} onChange={event=>setNotes(event.target.value)} maxLength={1000} className="mt-2 min-h-24 w-full rounded-lg border p-3 text-sm"/></label>
      </div></section>
    </div>
    <aside className="h-fit space-y-5 rounded-xl border bg-white p-5 xl:sticky xl:top-24">
      <div><h2 className="font-semibold">Resumo</h2><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatCurrency(subtotal)}</dd></div><div className="flex justify-between"><dt className="text-muted">Desconto</dt><dd>- {formatCurrency(Number(discount)||0)}</dd></div><div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>Total</dt><dd>{formatCurrency(total)}</dd></div></dl></div>
      <div><div className="flex items-center justify-between"><h2 className="font-semibold">Pagamentos</h2><Button type="button" variant="ghost" className="h-8 px-2" onClick={()=>setPayments(current=>[...current,{method:"PIX",amount:"",reference:""}])}><Plus className="h-4 w-4"/></Button></div>
        <div className="mt-3 space-y-4">{payments.map((payment,index)=><div key={index} className="space-y-2 rounded-lg bg-slate-50 p-3">
          <div className="flex gap-2"><select value={payment.method} onChange={event=>updatePayment(index,{method:event.target.value as Payment["method"]})} className="h-10 min-w-0 flex-1 rounded-lg border bg-white px-2 text-sm">{Object.entries(paymentLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>{payments.length>1&&<Button type="button" variant="ghost" className="px-2" onClick={()=>setPayments(current=>current.filter((_,i)=>i!==index))}><Minus className="h-4 w-4"/></Button>}</div>
          <div className="flex gap-2"><Input aria-label="Valor do pagamento" type="number" min="0.01" step="0.01" value={payment.amount} onChange={event=>updatePayment(index,{amount:event.target.value})} placeholder="Valor"/><Button type="button" variant="secondary" className="px-2 text-xs" onClick={()=>fillRemaining(index)}>Restante</Button></div>
          <Input value={payment.reference} onChange={event=>updatePayment(index,{reference:event.target.value})} placeholder="Referência (opcional)"/>
          {payment.method==="CASH"&&!cashSessionId&&<p className="text-xs text-amber-700">Abra o caixa desta unidade para receber em dinheiro.</p>}
        </div>)}</div>
      </div>
      <div className={`rounded-lg p-3 text-sm ${remaining===0?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800"}`}><span className="font-medium">{remaining>=0?"Falta informar":"Excedente"}: </span>{formatCurrency(Math.abs(remaining))}</div>
      {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button className="w-full" disabled={pending||cart.length===0||remaining!==0||payments.some(payment=>payment.method==="CASH")&&!cashSessionId}>{pending?"Concluindo…":"Concluir venda"}</Button>
    </aside>
  </form>;
}
