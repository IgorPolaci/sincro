import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ServiceOrderForm } from "@/features/service-orders/service-order-form";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";

export default async function NewServiceOrderPage(){
  const [supabase,{current}]=await Promise.all([createClient(),getBusinessUnitContext()]);
  if(current?.type!=='TECHNICAL_ASSISTANCE')return <><PageHeader title="Nova ordem de serviço"/><Card><EmptyState title="Segmento incorreto" description="Selecione Assistência Técnica antes de abrir uma O.S."/></Card></>;
  const [{data:customers},{data:technicians}]=await Promise.all([
    supabase.from('customers').select('id,name').eq('active',true).is('deleted_at',null).order('name'),
    supabase.from('profiles').select('id,name').eq('active',true).order('name'),
  ]);
  return <><PageHeader title="Nova ordem de serviço" description="Registre a condição de entrada do equipamento com precisão."/><Card className="p-6"><ServiceOrderForm customers={customers??[]} technicians={technicians??[]}/></Card></>;
}
