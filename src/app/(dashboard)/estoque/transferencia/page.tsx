import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { TransferForm } from "@/features/inventory/transfer-form";
import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
export default async function InventoryTransferPage(){const [supabase,{current,units}]=await Promise.all([createClient(),getBusinessUnitContext()]);const {data}=current?await supabase.from('inventory').select('quantity,products!inner(id,name,sku)').eq('business_unit_id',current.id).gt('quantity',0).order('updated_at',{ascending:false}):{data:[]};const products=(data??[]).map(row=>{const product=row.products as unknown as {id:string;name:string;sku:string};return {...product,quantity:row.quantity}});return <><PageHeader title="Transferência entre unidades" description={`Origem: ${current?.name??'não selecionada'}. Cada lado gera seu próprio movimento auditável.`}/><Card className="max-w-2xl p-6"><TransferForm products={products} destinations={units.filter(unit=>unit.id!==current?.id)}/></Card></>}
