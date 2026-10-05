"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { headers } from "next/headers";
import { recordAuthEvent } from "@/services/auth-audit";

export type AuthState = { error?: string };
const loginSchema=z.object({email:z.email("E-mail inválido"),password:z.string().min(6,"Senha inválida")});
export async function login(_:AuthState,formData:FormData):Promise<AuthState>{
  if(!isSupabaseConfigured()) return {error:"Configure as variáveis do Supabase antes de entrar."};
  const parsed=loginSchema.safeParse(Object.fromEntries(formData)); if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const supabase=await createClient(); const {error}=await supabase.auth.signInWithPassword(parsed.data);
  const requestHeaders=await headers();const ip=requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();const agent=requestHeaders.get('user-agent')??undefined;
  if(error){await recordAuthEvent(parsed.data.email,'LOGIN_FAILED',ip,agent);return {error:"E-mail ou senha inválidos."};}
  await recordAuthEvent(parsed.data.email,'LOGIN',ip,agent);redirect("/dashboard");
}
export async function logout(){const supabase=await createClient();await supabase.auth.signOut();redirect("/login");}
export async function requestPasswordReset(formData:FormData):Promise<void>{
  const email=z.email().safeParse(formData.get("email"));if(!email.success)return;
  const supabase=await createClient();await supabase.auth.resetPasswordForEmail(email.data,{redirectTo:`${process.env.APP_URL}/atualizar-senha`});
}
