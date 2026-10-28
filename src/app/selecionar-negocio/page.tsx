import { Building2,LogOut,ShoppingBag,Smartphone } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getBusinessUnitContext,type BusinessUnit } from "@/lib/business-units";
import { selectBusinessUnit } from "@/features/business-units/actions";
import { logout } from "@/features/auth/actions";

export const metadata={title:'Selecionar negócio'};

export default async function SelectBusinessPage(){
  const [profile,{units}]=await Promise.all([requireProfile(),getBusinessUnitContext()]);
  return <main className="min-h-screen bg-slate-100 p-5 sm:p-10"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary p-2.5 text-white"><Building2/></span><div><p className="font-bold">Sincro</p><p className="text-xs text-muted">{profile.name}</p></div></div><form action={logout}><button className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold"><LogOut className="h-4 w-4"/>Sair</button></form></header><section className="py-14 text-center"><p className="text-sm font-semibold uppercase tracking-widest text-primary">Ambiente de trabalho</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Qual negócio você deseja acessar?</h1><p className="mx-auto mt-3 max-w-2xl text-muted">Cada negócio possui sua própria operação, estoque e caixa. Clientes, usuários e alguns cadastros continuam compartilhados.</p></section><div className="grid gap-6 md:grid-cols-2">{units.map(unit=><BusinessChoice key={unit.id} unit={unit}/>)}</div></div></main>;
}

function BusinessChoice({unit}:{unit:BusinessUnit}){const assistance=unit.type==='TECHNICAL_ASSISTANCE';const Icon=assistance?Smartphone:ShoppingBag;return <form action={selectBusinessUnit}><input type="hidden" name="businessUnitId" value={unit.id}/><input type="hidden" name="returnTo" value="/dashboard"/><button className="group flex min-h-72 w-full flex-col rounded-2xl border bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg"><span className={`rounded-2xl p-4 ${assistance?'bg-blue-50 text-blue-700':'bg-emerald-50 text-emerald-700'}`}><Icon className="h-8 w-8"/></span><h2 className="mt-6 text-2xl font-bold">{unit.name}</h2><p className="mt-3 flex-1 text-sm leading-6 text-muted">{assistance?'Ordens de serviço, equipamentos, técnicos, peças, laudos, garantias e atendimento no balcão.':'Pedidos, catálogo online, PDV, preparo, entrega ou retirada, cupons, fidelidade e operação comercial.'}</p><span className="mt-6 font-semibold text-primary group-hover:underline">Acessar este negócio →</span></button></form>}
