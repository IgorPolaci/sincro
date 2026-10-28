import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { DemoDataButton, SneakerDemoDataButton } from "@/features/demo/demo-data-button";
export default function DemonstrationPage() {
  return (
    <>
      <PageHeader
        title="Dados de demonstração"
        description="Cria massas realistas, idempotentes e auditadas dentro da sua organização."
      />
      <div className="grid max-w-5xl gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">Apresentação comercial</p>
          <h2 className="mt-2 text-lg font-semibold">Sincro Sneakers</h2>
          <p className="text-muted mt-2 text-sm">
            Monta uma loja de tênis completa na organização atual com identidade visual, cinco categorias, cinco marcas,
            18 produtos publicados, descrições comerciais, promoções, tamanhos, estoque, dez clientes, fidelidade,
            regiões de entrega e cupons.
          </p>
          <p className="text-muted mt-3 text-sm">
            A carga não remove registros nem redefine estoque existente e pode ser usada mesmo que a massa genérica já
            tenha sido carregada.
          </p>
          <div className="mt-5">
            <SneakerDemoDataButton />
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">Cenário geral</p>
          <h2 className="mt-2 text-lg font-semibold">Massa multinegócio</h2>
          <p className="text-muted mt-2 text-sm">
            Adiciona seis clientes, oito produtos genéricos, estoque separado nas duas unidades, catálogo publicado,
            áreas de entrega e cupons para testar os fluxos gerais.
          </p>
          <p className="text-muted mt-3 text-sm">
            Os dados não substituem nem removem registros existentes. Cada carga pode ser executada somente uma vez por
            organização.
          </p>
          <div className="mt-5">
            <DemoDataButton />
          </div>
        </Card>
      </div>
    </>
  );
}
