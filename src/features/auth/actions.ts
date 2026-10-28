"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerEnv } from "@/lib/env.server";
import { cookies,headers } from "next/headers";
import { recordAuthEvent } from "@/services/auth-audit";
import { rateLimit } from "@/lib/rate-limit";

export type AuthState = { error?: string };
export type PasswordState = { error?: string; success?: string };
const loginSchema=z.object({email:z.email("E-mail inválido"),password:z.string().min(6,"Senha inválida")});
const passwordSchema=z.object({password:z.string().min(10,"Use ao menos 10 caracteres."),confirmation:z.string()}).refine(value=>value.password===value.confirmation,{message:"As senhas não conferem.",path:['confirmation']});
export async function login(_:AuthState,formData:FormData):Promise<AuthState>{
  if(!isSupabaseConfigured()) return {error:"Configure as variáveis do Supabase antes de entrar."};
  const parsed=loginSchema.safeParse(Object.fromEntries(formData)); if(!parsed.success)return {error:parsed.error.issues[0]?.message};
  const limit=await rateLimit('login',parsed.data.email,10,900);if(!limit.allowed)return {error:`Muitas tentativas. Aguarde ${limit.retryAfter} segundos.`};
  const supabase=await createClient(); const {error}=await supabase.auth.signInWithPassword(parsed.data);
  const requestHeaders=await headers();const ip=requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim();const agent=requestHeaders.get('user-agent')??undefined;
  if(error){await recordAuthEvent(parsed.data.email,'LOGIN_FAILED',ip,agent);return {error:"E-mail ou senha inválidos."};}
  await recordAuthEvent(parsed.data.email,'LOGIN',ip,agent);redirect("/selecionar-negocio");
}
export async function logout(){const supabase=await createClient();await supabase.auth.signOut();(await cookies()).delete('sincro_business_unit');redirect("/login");}
export async function requestPasswordReset(formData:FormData):Promise<void>{
  const email=z.email().safeParse(formData.get("email"));if(!email.success)return;
  const limit=await rateLimit('password-reset',email.data,3,900);if(!limit.allowed)return;
  const { APP_URL }=getServerEnv();
  const supabase=await createClient();await supabase.auth.resetPasswordForEmail(email.data,{redirectTo:`${APP_URL}/auth/confirm?next=/redefinir-senha`});
}
export async function updatePassword(_:PasswordState,formData:FormData):Promise<PasswordState>{const parsed=passwordSchema.safeParse(Object.fromEntries(formData));if(!parsed.success)return {error:parsed.error.issues[0]?.message};const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return {error:'O link expirou ou esta sessão não é válida. Solicite uma nova recuperação.'};const {error}=await supabase.auth.updateUser({password:parsed.data.password});if(error)return {error:'Não foi possível atualizar a senha. Solicite um novo link.'};return {success:'Senha atualizada. Entre novamente para continuar.'};}
