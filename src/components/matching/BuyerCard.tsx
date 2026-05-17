import { BuyerMatch } from "@/hooks/useMatching";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/installmentRates";
import { useState } from "react";

interface BuyerCardProps {
  buyer: BuyerMatch;
  matchChance: number;
  onRemove?: (buyerId: string) => void;
}

export const BuyerCard = ({ buyer, matchChance, onRemove }: BuyerCardProps) => {
  const { buyerLead } = buyer;
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    // Fade out animation before removal
    await new Promise(resolve => setTimeout(resolve, 200));
    onRemove?.(buyer.id);
  };

  return (
    <div
      className={`relative flex-shrink-0 w-56 rounded-lg border border-border bg-card p-3 transition-all ${
        isRemoving ? "opacity-10" : "opacity-100"
      }`}
      style={{ width: "224px" }}
    >
      {/* Name */}
      <h4 className="text-sm font-bold text-foreground truncate mb-1 text-center">
        {buyerLead.nome}
      </h4>

      {/* Model */}
      <p className="text-xs text-muted-foreground truncate mb-2 text-center">
        {buyerLead.modelo_desejado}
        {buyerLead.armazenamento_desejado && ` ${buyerLead.armazenamento_desejado}`}
      </p>

      {/* Price */}
      <p className="text-sm font-semibold text-green-500 mb-2 text-center">
        {formatCurrency(buyer.potentialValue)}
      </p>

      {/* Tag */}
      <div className="flex justify-center">
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs font-normal mb-2"
        >
          comprador
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-2">
        {/* Message Button */}
        {buyerLead.kommo_lead_id && (
          <a
            href={`https://sealstore.kommo.com/leads/detail/${buyerLead.kommo_lead_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-7 h-7 rounded-md text-base hover:bg-blue-500/10 transition-colors"
            title="Abrir conversa no Kommo"
          >
            💬
          </a>
        )}

        <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
          {matchChance}%
        </div>

        {/* Check Button */}
        <button
          onClick={handleRemove}
          className="flex items-center justify-center w-7 h-7 rounded-full border border-border hover:border-green-500 hover:bg-green-500/10 text-muted-foreground hover:text-green-500 transition-all"
          title="Remover comprador"
        >
          ✓
        </button>
      </div>
    </div>
  );
};
