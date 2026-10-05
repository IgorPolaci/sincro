"use client";
import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { login, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const initial:AuthState={};
export function LoginForm(){const [state,action,pending]=useActionState(login,initial);return <form action={action} className="mt-8 space-y-5"><label className="block text-sm font-medium">E-mail<div className="relative mt-2"><Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"/><Input className="pl-10" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com"/></div></label><label className="block text-sm font-medium">Senha<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-2.5 h-5 w-5 text-slate-400"/><Input className="pl-10" name="password" type="password" autoComplete="current-password" required/></div></label>{state.error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}<Button className="w-full" disabled={pending}>{pending?"Entrando…":"Entrar"}</Button><Link className="block text-center text-sm font-medium text-primary hover:underline" href="/recuperar-senha">Esqueci minha senha</Link></form>}
