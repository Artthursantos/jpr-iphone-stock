import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { calculateInstallment, formatCurrency, PaymentMethod, CardBrand, INSTALLMENT_RATES } from "@/lib/installmentRates";
import { toast } from "@/hooks/use-toast";

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductInstallmentDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductInstallmentDialog = ({ product, open, onOpenChange }: ProductInstallmentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pagseguro");
  const [cardBrand, setCardBrand] = useState<CardBrand>("VISA");
  const [installments, setInstallments] = useState<string>("1");
  const [entryOption, setEntryOption] = useState<string>("sem");
  const [entryType, setEntryType] = useState<string>("dinheiro");
  const [entryValue, setEntryValue] = useState<string>("0");
  const [phoneEntryValue, setPhoneEntryValue] = useState<string>("0");
  const [cashEntryValue, setCashEntryValue] = useState<string>("0");

  // Parse price string from DB (e.g. "1.234,56" or "1234.56")
  const parsePriceString = (priceString: string | null | undefined): number => {
    if (!priceString || typeof priceString !== 'string') return 0;
    const cleaned = priceString.trim().replace(/\s/g, "").replace(/[^\d,.-]/g, "");
    if (!cleaned || cleaned.length === 0) return 0;
    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      const value = parseFloat(normalized);
      return isNaN(value) ? 0 : value;
    }
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
  };

  // Parse user-typed number inputs
  const parseBrazilianNumber = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    const cleaned = value.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
    if (cleaned.includes(",")) {
      const normalized = cleaned.replace(/\./g, "").replace(",", ".");
      return parseFloat(normalized) || 0;
    }
    return parseFloat(cleaned) || 0;
  };

  // Base price: always product.preco (preço à vista)
  const basePrice = parsePriceString(product.preco);

  // Entry value
  const parsedEntryValue = entryType === "celular_dinheiro"
    ? parseBrazilianNumber(phoneEntryValue) + parseBrazilianNumber(cashEntryValue)
    : parseBrazilianNumber(entryValue);
  const hasEntry = entryOption === "com";

  const activeBasePrice = hasEntry ? Math.max(0, basePrice - parsedEntryValue) : basePrice;

  const installmentData = useMemo(() => {
    if (paymentMethod === "pix") {
      return { finalValue: activeBasePrice, installmentValue: activeBasePrice, rate: 0 };
    }
    return calculateInstallment(
      activeBasePrice,
      parseInt(installments),
      paymentMethod,
      paymentMethod === "pagseguro" ? cardBrand : undefined
    );
  }, [activeBasePrice, installments, paymentMethod, cardBrand]);

  // Build display name: "Nome Armazenamento Condição"
  const condition = product.novo_seminovo?.trim() || '';
  const storage = product.armazenamento ?? null;
  const productHeader = [
    product.produto?.trim() || 'Produto',
    storage,
    condition,
  ].filter(Boolean).join(' ');

  const handleCopy = () => {
    const installmentCount = parseInt(installments);

    // Entry prefix (same logic as Calculator.tsx)
    let entryPrefix = "";
    if (hasEntry) {
      if (entryType === "celular") {
        entryPrefix = `Com o aparelho de entrada`;
      } else if (entryType === "dinheiro") {
        entryPrefix = `Com a entrada de ${formatCurrency(parsedEntryValue)}`;
      } else {
        entryPrefix = `Com o aparelho de entrada + ${formatCurrency(parseBrazilianNumber(cashEntryValue))}`;
      }
    }

    let text = `📱 ${productHeader}\n`;

    if (entryPrefix) {
      text += paymentMethod === "pix"
        ? `${entryPrefix}, o restante no PIX fica:\n\n`
        : `${entryPrefix} fica:\n\n`;
    } else {
      text += `\n`;
    }

    if (paymentMethod === "pix") {
      text += `💵 À vista no PIX: ${formatCurrency(installmentData.finalValue)}`;
    } else {
      text += `💳 Parcelado em ${installmentCount}x de ${formatCurrency(installmentData.installmentValue)}`;
    }

    text += `\n\n1 ano de garantia pela Seal`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{productHeader}</DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            📋 Gerar mensagem de venda
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de Pagamento */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tipo de pagamento</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="cursor-pointer">PIX</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pagseguro" id="pagseguro" />
                <Label htmlFor="pagseguro" className="cursor-pointer">PagSeguro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="cursor-pointer">Link de Pagamento</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Bandeira (só se PagSeguro) */}
          {paymentMethod === "pagseguro" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Bandeira</Label>
              <RadioGroup value={cardBrand} onValueChange={(value) => setCardBrand(value as CardBrand)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="VISA" id="visa" />
                  <Label htmlFor="visa" className="cursor-pointer">Visa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MASTER" id="master" />
                  <Label htmlFor="master" className="cursor-pointer">Master</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ELO" id="elo" />
                  <Label htmlFor="elo" className="cursor-pointer">Elo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="HIPER" id="hiper" />
                  <Label htmlFor="hiper" className="cursor-pointer">Hiper</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DEMAIS" id="demais" />
                  <Label htmlFor="demais" className="cursor-pointer">Demais</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Número de Parcelas (não mostra para PIX) */}
          {paymentMethod !== "pix" && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Número de parcelas</Label>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(INSTALLMENT_RATES).filter(key => key !== 'debito').map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Entrada */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Entrada</Label>
            <Select value={entryOption} onValueChange={setEntryOption}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sem">Sem entrada</SelectItem>
                <SelectItem value="com">Com entrada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Entrada */}
          {entryOption === "com" && (
            <>
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipo de entrada</Label>
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celular">Celular</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="celular_dinheiro">Celular + Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {entryType === "celular_dinheiro" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Valor do celular de entrada</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={phoneEntryValue}
                      onChange={(e) => setPhoneEntryValue(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Valor em dinheiro</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={cashEntryValue}
                      onChange={(e) => setCashEntryValue(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Valor da entrada</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={entryValue}
                    onChange={(e) => setEntryValue(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </>
          )}

          {/* Resultado do Cálculo */}
          <div className="bg-accent/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Preço à vista:</span>
              <span className="font-semibold">{formatCurrency(basePrice)}</span>
            </div>
            {hasEntry && (
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Entrada:</span>
                <span className="font-semibold">- {formatCurrency(parsedEntryValue)}</span>
              </div>
            )}
            {paymentMethod === "pix" ? (
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-medium text-muted-foreground">Valor PIX:</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(installmentData.finalValue)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Taxa ({installments}x):</span>
                  <span className="font-semibold">{installmentData.rate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-medium text-muted-foreground">Parcela:</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(installmentData.installmentValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Total:</span>
                  <span className="font-semibold">{formatCurrency(installmentData.finalValue)}</span>
                </div>
              </>
            )}
          </div>

          {/* Prévia da mensagem */}
          <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Prévia da mensagem</p>
            <p className="text-sm font-medium">📱 {productHeader}</p>
            {hasEntry && (
              <p className="text-sm text-muted-foreground">
                {entryType === "celular"
                  ? "Com o aparelho de entrada fica:"
                  : entryType === "dinheiro"
                    ? `Com a entrada de ${formatCurrency(parsedEntryValue)} fica:`
                    : `Com o aparelho de entrada + ${formatCurrency(parseBrazilianNumber(cashEntryValue))} fica:`}
              </p>
            )}
            <p className="text-sm">
              {paymentMethod === "pix"
                ? `💵 À vista no PIX: ${formatCurrency(installmentData.finalValue)}`
                : `💳 Parcelado em ${installments}x de ${formatCurrency(installmentData.installmentValue)}`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">1 ano de garantia pela Seal</p>
          </div>

          {/* Botão Copiar */}
          <Button onClick={handleCopy} className="w-full" size="lg">
            <Copy className="mr-2 h-4 w-4" />
            COPIAR TEXTO
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductInstallmentDialog;