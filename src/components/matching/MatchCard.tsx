import { Match } from "@/hooks/useMatching";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calculator, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/installmentRates";

interface MatchCardProps {
  match: Match;
}

export const MatchCard = ({ match }: MatchCardProps) => {
  const { tradeInLead: tradeIn, buyerLead: buyer, score, scoreLabel, potentialValue } = match;

  const getBorderColor = () => {
    if (score === 100) return "border-l-green-500";
    if (score === 85) return "border-l-orange-500";
    return "border-l-yellow-500";
  };

  const getBadgeColor = () => {
    if (score === 100) return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    if (score === 85) return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
    return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
  };

  const getUrgencyText = (u: string | null) => {
    if (u === 'imediata') return 'Urgência: imediata';
    if (u === 'curto_prazo') return 'Urgência: curto prazo';
    return 'Urgência: longo prazo';
  };

  const getTempText = (t: string | null) => {
    if (t === 'quente') return 'Temp: Quente';
    if (t === 'morno') return 'Temp: Morno';
    return 'Temp: Frio';
  };

  return (
    <div className={`mt-4 rounded-xl border border-border bg-card/40 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden border-l-[3px] ${getBorderColor()}`}>
      
      {/* Top Header */}
      <div className="flex justify-between items-start mb-6">
        <Badge className={`rounded-full px-3 py-1 font-medium border-none ${getBadgeColor()}`}>
          {scoreLabel}
        </Badge>
        
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-lg font-bold text-green-500">{formatCurrency(potentialValue)}</span>
            <span className="text-sm text-muted-foreground">potencial</span>
          </div>
        </div>
      </div>

      {/* Leads Columns */}
      <div className="flex items-center justify-between gap-4 mb-6">
        
        {/* Trade-in Lead */}
        <div className="flex-1 bg-secondary/50 rounded-lg p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Lead Trade-in</p>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-base font-bold text-foreground truncate">{tradeIn.nome}</h4>
            {tradeIn.kommo_lead_id && (
              <a 
                href={`https://sealstore.kommo.com/leads/detail/${tradeIn.kommo_lead_id}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-green-500 transition-colors bg-background/50 hover:bg-green-500/10 px-2 py-1.5 rounded-md border border-border/50 hover:border-green-500/30"
                title="Abrir conversa no Kommo"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Ir até a conversa
              </a>
            )}
          </div>
          
          <div className="space-y-1 mb-3">
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Quer:</span> {tradeIn.modelo_desejado} {tradeIn.armazenamento_desejado || ""}
            </p>
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Tem:</span> {tradeIn.modelo_entrada} {tradeIn.armazenamento_entrada || ""}
            </p>
          </div>

          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-normal">
            trade-in
          </Badge>
        </div>

        {/* Arrow */}
        <div className="text-muted-foreground shrink-0">
          <ArrowRight className="h-5 w-5 opacity-50" />
        </div>

        {/* Buyer Lead */}
        <div className="flex-1 bg-secondary/50 rounded-lg p-4 border border-border/50">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Lead Comprador</p>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h4 className="text-base font-bold text-foreground truncate">{buyer.nome}</h4>
            {buyer.kommo_lead_id && (
              <a 
                href={`https://sealstore.kommo.com/leads/detail/${buyer.kommo_lead_id}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-blue-500 transition-colors bg-background/50 hover:bg-blue-500/10 px-2 py-1.5 rounded-md border border-border/50 hover:border-blue-500/30"
                title="Abrir conversa no Kommo"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Ir até a conversa
              </a>
            )}
          </div>
          
          <div className="space-y-1 mb-3">
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Quer:</span> {buyer.modelo_desejado} {buyer.armazenamento_desejado || ""}
            </p>
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Orçamento:</span> {buyer.orcamento ? formatCurrency(buyer.orcamento) : "Sem orçamento"}
            </p>
          </div>

          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-normal">
            comprador
          </Badge>
        </div>

      </div>

      {/* Footer Tags & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-2">
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-background/50 font-normal text-muted-foreground border-border/50">
            {getUrgencyText(buyer.urgencia)}
          </Badge>
          <Badge variant="secondary" className="bg-background/50 font-normal text-muted-foreground border-border/50">
            {getTempText(buyer.temperatura)}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="h-8 shadow-none group">
            Calcular entrada <Calculator className="h-3.5 w-3.5 ml-2 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Button>
        </div>
      </div>

    </div>
  );
};
