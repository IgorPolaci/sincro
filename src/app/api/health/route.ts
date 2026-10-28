import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET() { const supabase=await createClient(); const { error }=await supabase.rpc("health_check"); return NextResponse.json({ status:error?"indisponível":"ok" },{status:error?503:200,headers:{"Cache-Control":"no-store"}}); }
