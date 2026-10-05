import { createClient } from "@supabase/supabase-js";

export async function recordAuthEvent(email:string,action:"LOGIN"|"LOGIN_FAILED",ipAddress?:string,userAgent?:string){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!serviceKey)return;
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:profile}=await admin.from('profiles').select('id,organization_id').eq('email',email).maybeSingle();
  if(!profile)return;
  await admin.from('audit_logs').insert({organization_id:profile.organization_id,user_id:profile.id,action,entity:'auth',ip_address:ipAddress||null,user_agent:userAgent||null,new_data:{email}});
}
