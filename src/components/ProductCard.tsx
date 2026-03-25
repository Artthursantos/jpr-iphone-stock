import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { useState } from "react";
import { Calculator } from "lucide-react";
import ProductInstallmentDialog from "./ProductInstallmentDialog";
import { cn } from "@/lib/utils";

type Product = Database['public']['Tables']['produtos']['Row'];

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"sealclub" | "normal">("sealclub");
  const conditionRaw = product.novo_seminovo?.trim().toLowerCase();
  const conditionLabel = conditionRaw === "novo" ? "Novo" : conditionRaw === "seminovo" ? "Seminovo" : undefined;
  const conditionClass =
    conditionLabel === "Novo"
      ? "bg-emerald-500 text-emerald-50"
      : conditionLabel === "Seminovo"
        ? "bg-amber-400 text-amber-950"
        : "";

  // Nome do produto + armazenamento
  const productName = product.produto?.trim() || "Produto sem nome";
  const storage = product.armazenamento ?? null;
  const displayName = storage ? `${productName} ${storage}` : productName;

  // Formata preço no padrão BRL (R$ 1.234,56)
  const formatPrice = () => {
    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (product.preco) {
      // Normaliza string de preço que possa vir com separadores locais
      const normalized = product.preco
        .replace(/[^\d,.-]/g, "") // remove símbolos
        .replace(/\./g, "") // remove separador de milhar com ponto
        .replace(",", "."); // converte decimal para ponto

      const value = Number(normalized);
      if (!Number.isNaN(value)) {
        return formatter.format(value);
      }
      // fallback para valor original caso parsing falhe
      return product.preco;
    }

    return "R$ 0,00";
  };

  return (
    <Card className="bg-gradient-card shadow-elegant hover:shadow-hover transition-all duration-300 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            {displayName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {product.cores && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Cor:</span>
            <span className="text-sm text-foreground">{product.cores}</span>
          </div>
        )}

        {product.revendedor && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Revendedor:</span>
            <span className="text-sm text-foreground">{product.revendedor}</span>
          </div>
        )}

        {conditionLabel && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("border-transparent font-semibold", conditionClass)}
            >
              {conditionLabel}
            </Badge>
          </div>
        )}

        {product.preco && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <span className="text-sm font-medium text-muted-foreground">Preço à vista:</span>
            <span className="text-lg font-bold text-primary">{formatPrice()}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            onClick={() => { setDialogMode("sealclub"); setDialogOpen(true); }}
            variant="default"
            size="sm"
          >
            <Calculator className="mr-1.5 h-3.5 w-3.5" />
            SealClub
          </Button>
          <Button
            onClick={() => { setDialogMode("normal"); setDialogOpen(true); }}
            variant="outline"
            size="sm"
          >
            <Calculator className="mr-1.5 h-3.5 w-3.5" />
            Valor Normal
          </Button>
        </div>

        {product.created_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span>Atualizado em:</span>
            <span>{new Date(product.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </CardContent>

      <ProductInstallmentDialog
        product={product}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
      />
    </Card>
  );
};

export default ProductCard;
