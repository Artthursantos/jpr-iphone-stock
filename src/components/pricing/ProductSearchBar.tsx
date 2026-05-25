import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/installmentRates';

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductSearchBarProps {
  onSelect: (product: Product) => void;
  selectedProduct: Product | null;
  onClear: () => void;
}

const parsePrice = (priceStr: string | null): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d,.-]/g, '');
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }
  return parseFloat(cleaned) || 0;
};

export const ProductSearchBar = ({ onSelect, selectedProduct, onClear }: ProductSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .limit(1000);
      if (error) throw error;
      return (data as Product[]) || [];
    },
  });

  const filteredProducts = useMemo(() => {
    if (!products || !query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return products.filter(
      (p) =>
        p.produto?.toLowerCase().includes(lowerQuery) ||
        p.sku?.toLowerCase().includes(lowerQuery) ||
        p.armazenamento?.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  }, [products, query]);

  const handleSelect = (product: Product) => {
    onSelect(product);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do produto, SKU ou armazenamento..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="pl-10"
            />
          </div>
        </PopoverTrigger>
        {open && filteredProducts.length > 0 && (
          <PopoverContent className="w-full p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
            <Command>
              <CommandList>
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                <CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={`${product.id}_${product.cores}_${product.armazenamento}`}
                      value={product.id?.toString() || ''}
                      onSelect={() => handleSelect(product)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {product.produto}
                          {product.armazenamento && ` (${product.armazenamento})`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.cores && `${product.cores} • `}
                          {product.sku && `SKU: ${product.sku}`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>

      {selectedProduct && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{selectedProduct.novo_seminovo}</Badge>
                <span className="text-sm font-medium text-foreground">{selectedProduct.produto}</span>
                {selectedProduct.armazenamento && (
                  <Badge variant="secondary">{selectedProduct.armazenamento}</Badge>
                )}
                {selectedProduct.cores && (
                  <span className="text-xs text-muted-foreground">{selectedProduct.cores}</span>
                )}
                {selectedProduct.sku && (
                  <span className="text-xs text-muted-foreground">SKU: {selectedProduct.sku}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Preço atual: </span>
                  <span className="font-semibold text-foreground">{formatCurrency(parsePrice(selectedProduct.preco))}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
