"use client";
import { useActionState } from "react";
import { updatePassword, type PasswordState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: PasswordState = {};
export function PasswordResetForm() { const [state, action, pending] = useActionState(updatePassword, initial); return <form action={action} className="mt-6 space-y-4"><label className="block text-sm font-medium">Nova senha<Input className="mt-2" name="password" type="password" autoComplete="new-password" minLength={10} required /></label><label className="block text-sm font-medium">Confirme a nova senha<Input className="mt-2" name="confirmation" type="password" autoComplete="new-password" minLength={10} required /></label>{state.error&&<p role="alert" className="text-sm text-red-700">{state.error}</p>}{state.success&&<p role="status" className="text-sm text-emerald-700">{state.success}</p>}<Button className="w-full" disabled={pending}>{pending?"Atualizando…":"Atualizar senha"}</Button></form>; }
