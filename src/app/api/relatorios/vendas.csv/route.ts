import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";

const schema=z.object({scope:z.enum(["current","all"]),from:z.iso.date(),to:z.iso.date()}).refine(value=>value.from<=value.to);
type ExportRow={source:string;number:string;status:string;total:number|string;date:string;business_unit_id:string};

export async function GET(request:Request){
  const parsed=schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));if(!parsed.success)return new Response("Filtros inválidos",{status:400});
  const [supabase,{current,units}]=await Promise.all([createClient(),getBusinessUnitContext()]);const unitIds=parsed.data.scope==="all"?units.map(unit=>unit.id):current?[current.id]:[];if(!unitIds.length)return new Response("Unidade não encontrada",{status:400});const to=`${parsed.data.to}T23:59:59.999Z`;
  const [{data:sales},{data:orders},audit]=await Promise.all([
    supabase.from("sales").select("number,status,total,created_at,business_unit_id").in("business_unit_id",unitIds).gte("created_at",`${parsed.data.from}T00:00:00Z`).lte("created_at",to).order("created_at"),
    supabase.from("online_orders").select("number,status,total,created_at,business_unit_id").in("business_unit_id",unitIds).gte("created_at",`${parsed.data.from}T00:00:00Z`).lte("created_at",to).order("created_at"),
    supabase.rpc("record_report_export",{p_report:"vendas",p_filters:parsed.data}),
  ]);
  if(audit.error)return new Response("Acesso negado",{status:403});const unitNames=new Map(units.map(unit=>[unit.id,unit.name]));const rows:ExportRow[]=[...(sales??[]).map(row=>({source:"PDV",number:row.number,status:row.status,total:row.total,date:row.created_at,business_unit_id:row.business_unit_id})),...(orders??[]).map(row=>({source:"DELIVERY",number:row.number,status:row.status,total:row.total,date:row.created_at,business_unit_id:row.business_unit_id}))];const csv=[["Origem","Número","Unidade","Status","Data","Total"],...rows.map(row=>[row.source,row.number,unitNames.get(row.business_unit_id)??"",row.status,row.date,String(row.total)])].map(line=>line.map(csvCell).join(";")).join("\r\n");return new Response(`\uFEFF${csv}`,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="vendas-${parsed.data.from}-${parsed.data.to}.csv"`,"Cache-Control":"no-store"}});
}
function csvCell(value:string){const safe=/^[=+\-@]/.test(value)?`'${value}`:value;return `"${safe.replaceAll('"','""')}"`}
