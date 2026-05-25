import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { formatCurrency } from '@/lib/installmentRates';
import { Loader2, LogOut, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import sealStoreLogo from '@/assets/seal-store-logo.png';
import Navigation from '@/components/Navigation';
import { ProductSearchBar } from '@/components/pricing/ProductSearchBar';
import { DeductionRow } from '@/components/pricing/DeductionRow';
import { PresetsDrawer } from '@/components/pricing/PresetsDrawer';
import { usePricingPresets, DeductionConfig, DeductionField } from '@/hooks/usePricingPresets';

type Product = Database['public']['Tables']['produtos']['Row'];

const DEDUCTION_FIELDS = [
  { key: 'txCartao', label: 'Tx Cartão' },
  { key: 'comissaoVendedor', label: 'Comissão Vendedor' },
  { key: 'impostos', label: 'Impostos' },
  { key: 'outrasDeducoes', label: 'Outras Deduções' },
  { key: 'embalagem', label: 'Embalagem' },
  { key: 'comissaoPorVenda', label: 'Comissão por Venda' },
  { key: 'outrosCustos', label: 'Outros Custos' },
] as const;

const parsePrice = (priceStr: string | null): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d,.-]/g, '');
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }
  return parseFloat(cleaned) || 0;
};

const Pricing = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { loadPreset } = usePricingPresets();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Price inputs
  const [precoDesejado, setPrecoDesejado] = useState('');
  const [custoProduto, setCustoProduto] = useState('');

  // Deductions
  const [deductions, setDeductions] = useState<DeductionConfig>(() => loadPreset('default'));

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle');

  // Parse numeric values
  const parsedPreco = parseFloat(precoDesejado) || 0;
  const parsedCusto = parseFloat(custoProduto) || 0;

  // Compute deduction values
  const computeToReais = (field: DeductionField, preco: number): number => {
    if (field.mode === 'reais') return parseFloat(field.val) || 0;
    return (preco * (parseFloat(field.val) || 0)) / 100;
  };

  const computeToPct = (reais: number, preco: number): number => {
    if (preco === 0) return 0;
    return (reais / preco) * 100;
  };

  // Results
  const results = useMemo(() => {
    const lucroBruto = parsedPreco - parsedCusto;
    const totalPago = Object.values(deductions).reduce(
      (sum, field) => sum + computeToReais(field, parsedPreco),
      0
    );
    const margemContribuicao = lucroBruto - totalPago;

    return {
      lucroBruto,
      totalPago,
      margemContribuicao,
      lucroMarginPct: parsedPreco > 0 ? (lucroBruto / parsedPreco) * 100 : 0,
      deducaoMarginPct: parsedPreco > 0 ? (totalPago / parsedPreco) * 100 : 0,
      margemMarginPct: parsedPreco > 0 ? (margemContribuicao / parsedPreco) * 100 : 0,
    };
  }, [parsedPreco, parsedCusto, deductions]);

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setPrecoDesejado(parsePrice(product.preco).toString());
    setCustoProduto(product.custo ? parsePrice(product.custo).toString() : '');
  };

  const handleProductClear = () => {
    setSelectedProduct(null);
    setPrecoDesejado('');
    setCustoProduto('');
  };

  // Handle deduction change
  const handleDeductionChange = (key: string, field: DeductionField) => {
    setDeductions((prev) => ({
      ...prev,
      [key]: field,
    }));
  };

  // Handle load preset
  const handleLoadPreset = (config: DeductionConfig) => {
    setDeductions(config);
    toast({
      title: 'Preset carregado',
      description: 'As deduções foram atualizadas.',
    });
  };

  // Handle save to sheet
  const handleSave = async () => {
    if (!selectedProduct) {
      toast({
        title: 'Erro',
        description: 'Selecione um produto antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setSaveState('idle');

    try {
      const { data, error } = await supabase.functions.invoke('google-sheet-price-update', {
        body: {
          sheetId: import.meta.env.VITE_GOOGLE_SHEET_ID?.trim(),
          sheetTitle: import.meta.env.VITE_GOOGLE_SHEET_TITLE?.trim(),
          produto: selectedProduct.produto,
          armazenamento: selectedProduct.armazenamento || '',
          cores: selectedProduct.cores || '',
          newPrice: parsedPreco,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao salvar preço');

      setSaveState('success');
      toast({
        title: 'Sucesso!',
        description: `Preço atualizado na planilha para ${formatCurrency(parsedPreco)}`,
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setSaveState('idle');
        handleProductClear();
      }, 3000);
    } catch (err) {
      setSaveState('error');
      console.error('Erro ao salvar:', err);
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Erro ao atualizar preço na planilha',
        variant: 'destructive',
      });
      setTimeout(() => setSaveState('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
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
                <p className="text-sm text-muted-foreground mt-1">Precificação</p>
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Product Search */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">Buscar Produto</h2>
              <PresetsDrawer currentConfig={deductions} onLoadPreset={handleLoadPreset} />
            </div>
            <ProductSearchBar
              selectedProduct={selectedProduct}
              onSelect={handleProductSelect}
              onClear={handleProductClear}
            />
          </div>

          {/* Price Inputs */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Valores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="preco" className="text-foreground font-semibold">
                    Preço Desejado
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground font-semibold">R$</span>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={precoDesejado}
                      onChange={(e) => setPrecoDesejado(e.target.value)}
                      className="pl-10 text-lg font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custo" className="text-foreground font-semibold">
                    Custo do Produto
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground font-semibold">R$</span>
                    <Input
                      id="custo"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={custoProduto}
                      onChange={(e) => setCustoProduto(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">Deduções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {DEDUCTION_FIELDS.map(({ key, label }) => (
                <DeductionRow
                  key={key}
                  label={label}
                  field={deductions[key as keyof DeductionConfig]}
                  preco={parsedPreco}
                  onChange={(field) => handleDeductionChange(key, field)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-card border-border shadow-elegant">
              <CardContent className="pt-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">LUCRO BRUTO</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(results.lucroBruto)}</p>
                <p className="text-xs text-muted-foreground mt-2">{results.lucroMarginPct.toFixed(1)}% do preço</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-elegant">
              <CardContent className="pt-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">TOTAL DEDUÇÕES</p>
                <p className="text-2xl font-bold text-yellow-500">{formatCurrency(results.totalPago)}</p>
                <p className="text-xs text-muted-foreground mt-2">{results.deducaoMarginPct.toFixed(1)}% do preço</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border shadow-elegant">
              <CardContent className="pt-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">MARGEM CONTRIBUIÇÃO</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(results.margemContribuicao)}</p>
                <p className="text-xs text-muted-foreground mt-2">{results.margemMarginPct.toFixed(1)}% do preço</p>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!selectedProduct || isSaving}
              size="lg"
              className="flex-1 gap-2"
              variant={saveState === 'error' ? 'destructive' : 'default'}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : saveState === 'success' ? (
                <>
                  <Check className="h-4 w-4" />
                  Salvo com sucesso!
                </>
              ) : saveState === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Erro ao salvar
                </>
              ) : (
                `Salvar na planilha — ${formatCurrency(parsedPreco)}`
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
