import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ShieldCheck, Smartphone, Wrench, Lock } from "lucide-react";
import {
  PARAMETROS_SEGURO,
  REGRAS_SEGURO,
  VIABILIDADE_SEGURO,
  VIABILIDADE_PONTO_CHAVE,
  montarTabelaSeguro,
  valorAnualComDesconto,
  formatBRL,
  formatPercent1,
} from "@/lib/sealShield";

const SeguroTela = () => {
  const tabela = useMemo(() => montarTabelaSeguro(), []);
  const anualPix = valorAnualComDesconto();

  return (
    <div className="space-y-6">
      {/* Parâmetros do produto + pitch */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-foreground">
              Seal Shield — Seguro de Tela
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Mensalidade</p>
              <p className="text-2xl font-bold text-primary">
                {formatBRL(PARAMETROS_SEGURO.mensalidade)}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Valor anual</p>
              <p className="text-2xl font-bold text-foreground">
                {formatBRL(PARAMETROS_SEGURO.valorAnual)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pix à vista: {formatBRL(anualPix)} (−5%)
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Sinistros / vigência</p>
              <p className="text-2xl font-bold text-foreground">
                {PARAMETROS_SEGURO.sinistrosPorVigencia}x
              </p>
              <p className="text-xs text-muted-foreground mt-1">por 12 meses</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Mão de obra</p>
              <p className="text-2xl font-bold text-green-500">Inclusa</p>
              <p className="text-xs text-muted-foreground mt-1">cliente paga só a peça</p>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">
              O cliente paga <span className="font-semibold text-foreground">{formatBRL(PARAMETROS_SEGURO.mensalidade)}/mês</span> e,
              se a tela quebrar, paga <span className="font-semibold text-foreground">só a franquia</span> (custo da peça).
              Ex.: reparo de mercado <span className="font-semibold text-foreground">{formatBRL(550)}</span> →
              cliente paga <span className="font-semibold text-foreground">{formatBRL(180)}</span>,
              economizando <span className="font-semibold text-green-500">{formatBRL(370)}</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de franquias (estática, tabelada) */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl text-foreground">
              Tabela de Franquias por Modelo
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            A franquia é o que o cliente paga no sinistro (custo da peça).
            <span className="text-yellow-500"> Valores provisórios — confirmar custo real da peça com o fornecedor.</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 text-foreground font-semibold">Modelo</th>
                  <th className="text-left py-3 px-2 text-foreground font-semibold">Tela</th>
                  <th className="text-right py-3 px-2 text-foreground font-semibold">Franquia (cliente paga)</th>
                  <th className="text-right py-3 px-2 text-foreground font-semibold">Preço Mercado</th>
                  <th className="text-right py-3 px-2 text-foreground font-semibold">Economia</th>
                  <th className="text-right py-3 px-2 text-foreground font-semibold">Economia %</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((linha) => (
                  <tr
                    key={linha.modelo}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-3 px-2 text-foreground font-medium">{linha.modelo}</td>
                    <td className="py-3 px-2 text-muted-foreground">{linha.tipoTela}</td>
                    <td className="py-3 px-2 text-right text-primary font-semibold">
                      {formatBRL(linha.franquia)}
                    </td>
                    <td className="py-3 px-2 text-right text-muted-foreground line-through">
                      {formatBRL(linha.precoMercado)}
                    </td>
                    <td className="py-3 px-2 text-right text-green-500 font-semibold">
                      {formatBRL(linha.economia)}
                    </td>
                    <td className="py-3 px-2 text-right text-green-500">
                      {formatPercent1(linha.economiaPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Regras e condições */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl text-foreground">Regras e Condições</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {REGRAS_SEGURO.map((regra) => (
              <div key={regra.titulo} className="space-y-1">
                <dt className="text-sm font-semibold text-foreground">{regra.titulo}</dt>
                <dd className="text-sm text-muted-foreground">{regra.descricao}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Análise de viabilidade (interno, recolhido) */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <Accordion type="single" collapsible>
            <AccordionItem value="viabilidade" className="border-none">
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Análise de Viabilidade
                  <span className="text-xs font-normal text-muted-foreground">(uso interno)</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-foreground font-semibold">Cenário</th>
                        <th className="text-right py-2 px-2 text-foreground font-semibold">Receita</th>
                        <th className="text-right py-2 px-2 text-foreground font-semibold">Custo MO</th>
                        <th className="text-right py-2 px-2 text-foreground font-semibold">Resultado</th>
                        <th className="text-left py-2 px-2 text-foreground font-semibold">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {VIABILIDADE_SEGURO.map((cenario) => (
                        <tr key={cenario.cenario} className="border-b border-border/50">
                          <td className="py-2 px-2 text-foreground">{cenario.cenario}</td>
                          <td className="py-2 px-2 text-right text-muted-foreground">
                            {formatBRL(cenario.receita)}
                          </td>
                          <td className="py-2 px-2 text-right text-muted-foreground">
                            {formatBRL(cenario.custoMO)}
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-semibold ${
                              cenario.resultado >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {formatBRL(cenario.resultado)}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">{cenario.observacao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4 rounded-lg bg-muted/30 p-3">
                  <span className="font-semibold text-foreground">Ponto-chave: </span>
                  {VIABILIDADE_PONTO_CHAVE}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeguroTela;
