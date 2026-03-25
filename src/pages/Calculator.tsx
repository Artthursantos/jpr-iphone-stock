import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateInstallment, formatCurrency, PaymentMethod, CardBrand } from "@/lib/installmentRates";
import sealStoreLogo from "@/assets/seal-store-logo.png";
import Navigation from "@/components/Navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Calculator = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Dados do produto
  const [productName, setProductName] = useState<string>("");
  const [storage, setStorage] = useState<string>("");
  const [condition, setCondition] = useState<string>("Novo");
  
  // Valores
  const [sealClubPrice, setSealClubPrice] = useState<string>("");
  const [normalPrice, setNormalPrice] = useState<string>("");
  const [tradeInValue, setTradeInValue] = useState<string>("");
  const [downPayment, setDownPayment] = useState<string>("");
  
  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('link');
  const [cardBrand, setCardBrand] = useState<CardBrand>('VISA');
  const [selectedInstallments, setSelectedInstallments] = useState<string>("12");
  
  // UI
  const [copied, setCopied] = useState(false);

  const parseBrazilianNumber = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    const cleaned = value.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      return parseFloat(normalized) || 0;
    }
    return parseFloat(cleaned) || 0;
  };

  const parsedSealClubPrice = parseBrazilianNumber(sealClubPrice);
  const parsedNormalPrice = parseBrazilianNumber(normalPrice);
  const parsedTradeIn = parseBrazilianNumber(tradeInValue);
  const parsedDownPayment = parseBrazilianNumber(downPayment);
  
  const baseValueSealClub = Math.max(0, parsedSealClubPrice - parsedTradeIn - parsedDownPayment);
  const baseValueNormal = Math.max(0, parsedNormalPrice - parsedTradeIn - parsedDownPayment);
  const savings = Math.max(0, parsedNormalPrice - parsedSealClubPrice);

  const installmentTable = useMemo(() => {
    const installments = Array.from({ length: 18 }, (_, i) => i + 1);
    return installments.map((installmentCount) => {
      const sealClubCalc = calculateInstallment(
        baseValueSealClub, 
        installmentCount,
        paymentMethod,
        paymentMethod === 'pagseguro' ? cardBrand : undefined
      );
      const normalCalc = calculateInstallment(
        baseValueNormal,
        installmentCount,
        paymentMethod,
        paymentMethod === 'pagseguro' ? cardBrand : undefined
      );
      return {
        installments: installmentCount,
        rate: sealClubCalc.rate,
        finalValueSealClub: sealClubCalc.finalValue,
        installmentValueSealClub: sealClubCalc.installmentValue,
        finalValueNormal: normalCalc.finalValue,
        installmentValueNormal: normalCalc.installmentValue,
      };
    });
  }, [baseValueSealClub, baseValueNormal, paymentMethod, cardBrand]);

  const hasTradeIn = parsedTradeIn > 0;
  const hasDownPayment = parsedDownPayment > 0;

  const handleCopy = () => {
    const productFullName = `${productName || "Produto"} ${storage ? `(${storage})` : ""} ${condition}`.trim();
    const hasSealClub = parsedSealClubPrice > 0;

    // Entry prefix helper
    const buildEntryPrefix = (forPix: boolean) => {
      if (!hasTradeIn && !hasDownPayment) return "";
      if (hasDownPayment && !hasTradeIn)
        return `Com a entrada de ${formatCurrency(parsedDownPayment)}${forPix ? ", o restante no PIX fica" : " fica"}`;
      if (hasTradeIn && !hasDownPayment)
        return `Com o aparelho de entrada${forPix ? ", o restante no PIX fica" : " fica"}`;
      return `Com o aparelho de entrada + ${formatCurrency(parsedDownPayment)}${forPix ? ", o restante no PIX fica" : " fica"}`;
    };

    let text = `📱 ${productFullName}\n`;

    if (!hasSealClub) {
      // ── MODO SIMPLES (sem SealClub) ── igual ao Sistema de Inventário
      if (paymentMethod === 'pix') {
        const prefix = buildEntryPrefix(true);
        if (prefix) text += `${prefix}:\n\n`;
        else text += `\n`;
        text += `💵 À vista no PIX: ${formatCurrency(baseValueNormal)}`;
      } else {
        const installments = parseInt(selectedInstallments);
        const selectedRow = installmentTable.find(row => row.installments === installments);
        const prefix = buildEntryPrefix(false);
        if (prefix) text += `${prefix}:\n\n`;
        else text += `\n`;
        if (selectedRow) {
          text += `💳 Parcelado em ${installments}x de ${formatCurrency(selectedRow.installmentValueNormal)}`;
        }
      }
      text += `\n\n1 ano de garantia pela Seal`;
    } else {
      // ── MODO COMPLETO (com comparação SealClub) ──
      text += `\n`;
      if (paymentMethod === 'pix') {
        const prefix = buildEntryPrefix(true);
        if (prefix) text += `${prefix}:\n\n`;
        text += `🟨 Valor normal:\n💵 À vista no PIX: ${formatCurrency(baseValueNormal)}\n\n`;
        text += `🟦 Para membros SealClub:\n💵 À vista no PIX: ${formatCurrency(baseValueSealClub)}\n\n`;
        text += `💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro\n1 ano de garantia pela Seal`;
      } else {
        const installments = parseInt(selectedInstallments);
        const selectedRow = installmentTable.find(row => row.installments === installments);
        const prefix = buildEntryPrefix(false);
        if (prefix) text += `${prefix}:\n\n`;
        if (selectedRow) {
          text += `🟨 Valor normal:\n💳 Parcelado em ${installments}x de ${formatCurrency(selectedRow.installmentValueNormal)}\n\n`;
          text += `🟦 Para membros SealClub:\n💳 Parcelado em ${installments}x de ${formatCurrency(selectedRow.installmentValueSealClub)}\n\n`;
          text += `💰 Economia imediata: ${formatCurrency(savings)} na compra só por ser membro\n1 ano de garantia pela Seal`;
        }
      }
    }

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Texto copiado!",
      description: "O texto foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
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
                <h1 className="text-4xl font-bold text-foreground tracking-tight">SEAL STORE</h1>
                <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão</p>
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
        <div className="mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground mb-3 block text-sm font-medium">Tipo de Taxa</Label>
                  <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                    <TabsList className="grid w-full max-w-lg grid-cols-3">
                      <TabsTrigger value="link">Link de Pagamento</TabsTrigger>
                      <TabsTrigger value="pagseguro">PagSeguro</TabsTrigger>
                      <TabsTrigger value="pix">PIX</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {paymentMethod === 'pagseguro' && (
                  <div>
                    <Label htmlFor="cardBrand" className="text-foreground">Bandeira do Cartão</Label>
                    <Select value={cardBrand} onValueChange={(value) => setCardBrand(value as CardBrand)}>
                      <SelectTrigger id="cardBrand" className="bg-card border-border mt-2">
                        <SelectValue placeholder="Selecione a bandeira" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="VISA">VISA</SelectItem>
                        <SelectItem value="MASTER">MASTER</SelectItem>
                        <SelectItem value="ELO">ELO</SelectItem>
                        <SelectItem value="HIPER">HIPER</SelectItem>
                        <SelectItem value="DEMAIS">DEMAIS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Dados do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="productName" className="text-foreground">Nome do Produto</Label>
                  <Input
                    id="productName"
                    type="text"
                    placeholder="Ex: iPhone 15 Pro Max"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage" className="text-foreground">Armazenamento</Label>
                  <Input
                    id="storage"
                    type="text"
                    placeholder="Ex: 256GB"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition" className="text-foreground">Condição</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger id="condition" className="bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Seminovo">Seminovo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Valores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sealClubPrice" className="text-foreground">Preço SealClub (R$)</Label>
                    <Input
                      id="sealClubPrice"
                      type="number"
                      placeholder="0.00"
                      value={sealClubPrice}
                      onChange={(e) => setSealClubPrice(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="normalPrice" className="text-foreground">Preço Normal (R$)</Label>
                    <Input
                      id="normalPrice"
                      type="number"
                      placeholder="0.00"
                      value={normalPrice}
                      onChange={(e) => setNormalPrice(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Entradas (opcional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tradeInValue" className="text-foreground">Aparelho Usado (R$)</Label>
                    <Input
                      id="tradeInValue"
                      type="number"
                      placeholder="0.00"
                      value={tradeInValue}
                      onChange={(e) => setTradeInValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="downPayment" className="text-foreground">Entrada em Dinheiro (R$)</Label>
                    <Input
                      id="downPayment"
                      type="number"
                      placeholder="0.00"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor Base SealClub:</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(baseValueSealClub)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor Base Normal:</span>
                  <span className="text-xl font-bold text-yellow-500">{formatCurrency(baseValueNormal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Economia SealClub:</span>
                  <span className="text-lg font-semibold text-green-500">{formatCurrency(savings)}</span>
                </div>
              </div>

              {paymentMethod !== 'pix' && (
                <div className="pt-4 border-t border-border">
                  <Label htmlFor="installments" className="text-foreground">Parcelas para copiar</Label>
                  <Select value={selectedInstallments} onValueChange={setSelectedInstallments}>
                    <SelectTrigger id="installments" className="bg-card border-border mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                onClick={handleCopy} 
                className="w-full"
                variant="default"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    📋 Copiar Texto
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {paymentMethod !== 'pix' ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">Tabela de Parcelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-foreground font-semibold">Parcelas</th>
                        <th className="text-left py-3 px-2 text-foreground font-semibold">Taxa</th>
                        <th className="text-right py-3 px-2 text-foreground font-semibold">Parcela Normal</th>
                        <th className="text-right py-3 px-2 text-foreground font-semibold">Parcela SealClub</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installmentTable.map((row) => (
                        <tr 
                          key={row.installments} 
                          className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${
                            row.installments.toString() === selectedInstallments ? 'bg-primary/10' : ''
                          }`}
                        >
                          <td className="py-3 px-2 text-foreground font-medium">{row.installments}x</td>
                          <td className="py-3 px-2 text-muted-foreground">{row.rate.toFixed(2)}%</td>
                          <td className="py-3 px-2 text-right text-yellow-500">{formatCurrency(row.installmentValueNormal)}</td>
                          <td className="py-3 px-2 text-right text-primary font-semibold">{formatCurrency(row.installmentValueSealClub)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">⚡ Pagamento PIX</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-muted-foreground mb-2">🟨 Valor Normal</p>
                  <p className="text-3xl font-bold text-yellow-500">{formatCurrency(baseValueNormal)}</p>
                </div>
                <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">🟦 Valor SealClub</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(baseValueSealClub)}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-muted-foreground mb-1">💰 Economia imediata</p>
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(savings)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Calculator;
