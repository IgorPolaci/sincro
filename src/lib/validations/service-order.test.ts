import { describe,expect,it } from "vitest";
import { serviceOrderDocumentSchema,serviceOrderPartSchema,serviceOrderSchema,serviceOrderServiceSchema,serviceOrderStatusSchema } from "./service-order";

describe('serviceOrderSchema',()=>{
  it('aceita a entrada mínima de uma ordem de serviço',()=>{
    const result=serviceOrderSchema.safeParse({
      customerId:'11111111-1111-4111-8111-111111111111',equipmentName:'Smartphone',
      reportedDefect:'Não liga após queda',isWarranty:false,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita uma descrição de defeito insuficiente',()=>{
    const result=serviceOrderSchema.safeParse({
      customerId:'11111111-1111-4111-8111-111111111111',equipmentName:'Notebook',reportedDefect:'Ruim',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita códigos de status fora do padrão interno',()=>{
    expect(serviceOrderStatusSchema.safeParse({serviceOrderId:'11111111-1111-4111-8111-111111111111',statusCode:'cancelado<script>'}).success).toBe(false);
  });

  it('rejeita serviço e peça com quantidade zero',()=>{
    const base={serviceOrderId:'11111111-1111-4111-8111-111111111111',quantity:0,unitPrice:10,discount:0};
    expect(serviceOrderServiceSchema.safeParse({...base,description:'Troca de tela',warrantyDays:90}).success).toBe(false);
    expect(serviceOrderPartSchema.safeParse({...base,productId:'22222222-2222-4222-8222-222222222222'}).success).toBe(false);
  });

  it('rejeita formato de impressão não suportado',()=>{
    expect(serviceOrderDocumentSchema.safeParse({serviceOrderId:'11111111-1111-4111-8111-111111111111',type:'ENTRY',paperFormat:'A3'}).success).toBe(false);
  });
});
