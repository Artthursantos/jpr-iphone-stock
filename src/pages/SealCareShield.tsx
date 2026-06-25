import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, ShieldCheck } from "lucide-react";
import sealStoreLogo from "@/assets/seal-store-logo.png";
import Navigation from "@/components/Navigation";
import SeguroTela from "@/components/seal-care/SeguroTela";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PRAZOS_VALIDOS,
  MARGENS_RAPIDA,
  FAIXAS_VALOR,
  calcularTabela,
  calcularPreco,
  formatBRL,
  formatPercent,
  isPrazoValido,
  isValorValido,
  type PrazoMeses,
} from "@/lib/sealCareShield";

const ExtendedWarrantyCalculator = () => {
  const [valorInput, setValorInput] = useState<string>("");
  const [prazo, setPrazo] = useState<PrazoMeses>(12);

  const valorAparelho = Number.parseFloat(valorInput.replace(",", "."));
  const valorValido = isValorValido(valorAparelho);

  const tabela = useMemo(
    () =>
      valorValido && isPrazoValido(prazo)
        ? calcularTabela(valorAparelho, prazo)
        : [],
    [valorAparelho, prazo, valorValido],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
      {/* Inputs */}
      <Card className="bg-card border-border lg:col-span-1 h-full">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-foreground">
              Calculadora de Garantia Estendida
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 md:gap-x-6">
            <div className="space-y-2">
              <Label htmlFor="valorAparelho" className="text-foreground text-sm font-medium">
                Valor do aparelho (R$)
              </Label>
              <Input
                id="valorAparelho"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="Ex: 3000"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazo" className="text-foreground text-sm font-medium">
                Prazo (meses)
              </Label>
              <Select
                value={String(prazo)}
                onValueChange={(v) => setPrazo(Number(v) as PrazoMeses)}
              >
                <SelectTrigger id="prazo" className="bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {PRAZOS_VALIDOS.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p} meses
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-muted-foreground">
              Comece oferecendo no <span className="font-semibold text-foreground">20% (Máximo)</span> e
              ceda até no máximo <span className="font-semibold text-foreground">10% (Mínimo)</span>.
              Margem recomendada: <span className="font-semibold text-green-500">15%</span>.
            </p>
          </div>

          {/* Âncoras da negociação: atalho dos 3 pontos-chave */}
          {valorValido && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-semibold text-foreground">
                Âncoras da negociação
              </p>
              {tabela
                .filter((linha) => linha.nivel !== null)
                .map((linha) => {
                  const isReferencia = linha.nivel === "Referência";
                  return (
                    <div
                      key={linha.margem}
                      className={`rounded-lg border p-3 ${
                        isReferencia
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            isReferencia ? "text-green-500" : "text-foreground"
                          }`}
                        >
                          {linha.nivel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatPercent(linha.margem)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-end justify-between">
                        <span
                          className={`text-xl font-bold ${
                            isReferencia ? "text-green-500" : "text-primary"
                          }`}
                        >
                          {formatBRL(linha.precoGarantia)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          6x {formatBRL(linha.parcela6x)} · 10x{" "}
                          {formatBRL(linha.parcela10x)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela principal (dinâmica) */}
      <Card className="bg-card border-border lg:col-span-2 h-full">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            Tabela de Negociação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!valorValido ? (
            <p className="text-muted-foreground py-8 text-center">
              Informe um valor de aparelho maior que zero para ver os preços.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-foreground font-semibold">Margem</th>
                    <th className="text-left py-3 px-2 text-foreground font-semibold">Nível</th>
                    <th className="text-right py-3 px-2 text-foreground font-semibold">Preço Garantia</th>
                    <th className="text-right py-3 px-2 text-foreground font-semibold">Até 6x</th>
                    <th className="text-right py-3 px-2 text-foreground font-semibold">Até 10x</th>
                    <th className="text-right py-3 px-2 text-foreground font-semibold">Preço/Mês</th>
                  </tr>
                </thead>
                <tbody>
                  {tabela.map((linha) => {
                    const isReferencia = linha.nivel === "Referência";
                    return (
                      <tr
                        key={linha.margem}
                        className={`border-b border-border/50 transition-colors hover:bg-accent/50 ${
                          isReferencia ? "bg-green-500/10" : ""
                        }`}
                      >
                        <td className="py-3 px-2 text-foreground font-medium">
                          {formatPercent(linha.margem)}
                        </td>
                        <td className="py-3 px-2">
                          {linha.nivel && (
                            <span
                              className={`font-semibold ${
                                isReferencia
                                  ? "text-green-500"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {linha.nivel}
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3 px-2 text-right font-semibold ${
                            isReferencia ? "text-green-500" : "text-primary"
                          }`}
                        >
                          {formatBRL(linha.precoGarantia)}
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          {formatBRL(linha.parcela6x)}
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          {formatBRL(linha.parcela10x)}
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          {formatBRL(linha.precoPorMes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Tabela rápida (estática, colinha) */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            Tabela Rápida (consulta)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Valores de referência fixos — não dependem dos campos acima.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th
                    rowSpan={2}
                    className="text-left py-2 px-2 text-foreground font-semibold align-bottom"
                  >
                    Faixa
                  </th>
                  <th
                    rowSpan={2}
                    className="text-right py-2 px-2 text-foreground font-semibold align-bottom"
                  >
                    Valor Ref.
                  </th>
                  {PRAZOS_VALIDOS.map((p) => (
                    <th
                      key={p}
                      colSpan={MARGENS_RAPIDA.length}
                      className="text-center py-2 px-2 text-foreground font-semibold border-l border-border"
                    >
                      {p}m
                    </th>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  {PRAZOS_VALIDOS.map((p) =>
                    MARGENS_RAPIDA.map((m, idx) => (
                      <th
                        key={`${p}-${m}`}
                        className={`text-right py-2 px-2 text-muted-foreground font-medium ${
                          idx === 0 ? "border-l border-border" : ""
                        }`}
                      >
                        {formatPercent(m)}
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {FAIXAS_VALOR.map((faixa) => (
                  <tr
                    key={faixa.label}
                    className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-2 px-2 text-foreground">{faixa.label}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">
                      {formatBRL(faixa.valorRef)}
                    </td>
                    {PRAZOS_VALIDOS.map((p) =>
                      MARGENS_RAPIDA.map((m, idx) => (
                        <td
                          key={`${faixa.label}-${p}-${m}`}
                          className={`py-2 px-2 text-right ${
                            idx === 0 ? "border-l border-border" : ""
                          } ${m === 0.15 ? "text-green-500 font-medium" : "text-foreground"}`}
                        >
                          {formatBRL(calcularPreco(faixa.valorRef, m, p))}
                        </td>
                      )),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SealCareShield = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-elegant">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={sealStoreLogo}
                alt="Seal Store Logo"
                className="h-16 object-contain"
              />
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  SEAL STORE
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Sistema de Gestão
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="garantia-estendida" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="garantia-estendida">
              Calculadora de Garantia Estendida
            </TabsTrigger>
            <TabsTrigger value="seguro-tela">Seguro de Tela</TabsTrigger>
          </TabsList>
          <TabsContent value="garantia-estendida">
            <ExtendedWarrantyCalculator />
          </TabsContent>
          <TabsContent value="seguro-tela">
            <SeguroTela />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SealCareShield;
