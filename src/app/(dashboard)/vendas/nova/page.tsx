import { createClient } from "@/lib/supabase/server";
import { getBusinessUnitContext } from "@/lib/business-units";
import { PageHeader } from "@/components/shared/page-header";
import { SaleForm } from "@/features/sales/sale-form";

type ProductRow={id:string;name:string;sku:string|null;barcode:string|null;sale_price:number|string};

export const metadata={title:"Nova venda"};

export default async function NewSalePage(){
  const [supabase,{current}]=await Promise.all([createClient(),getBusinessUnitContext()]);
  const unitId=current?.id??"00000000-0000-0000-0000-000000000000";
  const [{data:productRows},{data:inventory},{data:customers},{data:sessions}]=await Promise.all([
    supabase.from("products").select("id,name,sku,barcode,sale_price").eq("active",true).is("deleted_at",null).order("name"),
    supabase.from("inventory").select("product_id,quantity").eq("business_unit_id",unitId).gt("quantity",0),
    supabase.from("customers").select("id,name").eq("active",true).is("deleted_at",null).order("name"),
    supabase.from("cash_sessions").select("id").eq("business_unit_id",unitId).eq("status","OPEN").limit(1),
  ]);
  const stocks=new Map((inventory??[]).map(row=>[row.product_id,row.quantity]));
  const products=((productRows??[]) as ProductRow[]).flatMap(product=>{
    const stock=stocks.get(product.id);
    return Number(stock)>0?[{...product,stock:stock as number|string}]:[];
  });
  return <>
    <PageHeader title="Nova venda" description={`PDV de ${current?.name??"unidade não selecionada"}. Preços e estoque são confirmados no servidor.`}/>
    <SaleForm products={products} customers={customers??[]} cashSessionId={sessions?.[0]?.id??null}/>
  </>;
}
