import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function recordAuthEvent(email:string,action:"LOGIN"|"LOGIN_FAILED",ipAddress?:string,userAgent?:string){
  const supabase=await createClient();
  await supabase.rpc('record_auth_event',{p_email:email,p_action:action,p_ip_address:ipAddress??undefined,p_user_agent:userAgent??undefined});
}
