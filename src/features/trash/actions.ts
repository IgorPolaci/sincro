"use server";
import { revalidatePath } from "next/cache";import { z } from "zod";import { createClient } from "@/lib/supabase/server";
const input=z.object({entity:z.enum(['customers','products','suppliers']),id:z.uuid()});
export async function restoreEntity(formData:FormData){const parsed=input.safeParse(Object.fromEntries(formData));if(!parsed.success)return;const supabase=await createClient();const {data:actor}=await supabase.rpc('current_profile_id');await supabase.from(parsed.data.entity).update({deleted_at:null,deleted_by:null,updated_by:actor}).eq('id',parsed.data.id);revalidatePath('/configuracoes/lixeira');}
