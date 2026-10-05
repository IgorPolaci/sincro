import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id,name,email,active,organization_id,organizations(name)").eq("auth_user_id", user.id).single();
  return profile;
});

export async function requireProfile() {
  const profile = await getSessionProfile();
  if (!profile?.active) redirect("/login?erro=usuario-inativo");
  return profile;
}
