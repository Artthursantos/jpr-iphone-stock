import React from "react";
import { MatchGroup } from "@/hooks/useMatching";
import { BuyerCard } from "./BuyerCard";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check } from "lucide-react";
import { formatCurrency } from "@/lib/installmentRates";

interface MatchCardProps {
  match: MatchGroup;
  onRemoveTradeIn?: (tradeInId: string) => void;
  onRemoveBuyer?: (buyerId: string) => void;
}

const GREEN = "#22c55e";
const BLUE = "#3a7fd4";

const borderColorForScore = (score: number) => {
  if (score === 100) return GREEN;
  if (score === 85) return "#f97316"; // orange
  return "#f59e0b"; // yellow
};

export const MatchCard: React.FC<MatchCardProps> = ({ match, onRemoveTradeIn, onRemoveBuyer }) => {
  const { tradeInLead: tradeIn, buyers, bestScore, totalPotential } = match;
  const getBuyerChance = (buyerLead: MatchGroup["buyers"][number]["buyerLead"]) => {
    const temp = (buyerLead.temperatura || "").toLowerCase();
    const urgency = (buyerLead.urgencia || "").toLowerCase();
    const isHot = temp === "quente";
    const isWarm = temp === "morno";
    const isFast = urgency === "curto_prazo" || urgency === "imediata" || urgency === "rapida" || urgency === "rápida";

    let score = 0;
    if (isHot) score += 60;
    else if (isWarm) score += 40;
    else score += 20;

    if (isFast) score += 40;

    return Math.min(100, score);
  };

  const sortedBuyers = [...buyers].sort((a, b) => {
    const aChance = getBuyerChance(a.buyerLead);
    const bChance = getBuyerChance(b.buyerLead);
    return bChance - aChance;
  });

  const borderColor = borderColorForScore(bestScore);

  return (
    <div
      className="mt-4 rounded-xl border bg-card/40 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden min-h-[300px]"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      {/* Top: trade-in info & actions */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-2">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-foreground truncate">{tradeIn.nome}</h3>

                <Badge className="text-xs font-normal" style={{ backgroundColor: `${GREEN}1A`, color: GREEN, borderColor: `${GREEN}33` }}>
                  trade-in
                </Badge>
              </div>
              <div className="mt-1 text-base font-semibold text-foreground">
                {tradeIn.modelo_entrada || "-"} {tradeIn.armazenamento_entrada || ""}
              </div>
            </div>

            <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-center gap-2">
              <span className="px-3 py-1 rounded-full border border-border/50 bg-card/60">
                {tradeIn.urgencia ? `Urgência: ${tradeIn.urgencia}` : "Urgência: —"}
              </span>
              <span className="px-3 py-1 rounded-full border border-border/50 bg-card/60">
                {tradeIn.temperatura ? `Temperatura: ${tradeIn.temperatura}` : "Temperatura: —"}
              </span>
              <span className="px-3 py-1 rounded-full border border-border/50 bg-card/60">
                {tradeIn.interesse ? `Etapa: ${tradeIn.interesse}` : "Etapa: —"}
              </span>
            </div>

            <div />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {tradeIn.kommo_lead_id && (
            <a
              href={`https://sealstore.kommo.com/leads/detail/${tradeIn.kommo_lead_id}`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors text-center min-w-[96px]"
              title="Abrir conversa no Kommo"
            >
              Conversa
            </a>
          )}

          <button
            onClick={() => onRemoveTradeIn?.(String(tradeIn.id))}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-500 transition-colors text-center min-w-[96px]"
            title="Completar / remover lead"
          >
            Concluir
          </button>
          <div className="text-sm mt-1">
            <span className="text-muted-foreground">Potencial:</span> <span className="font-semibold" style={{ color: GREEN }}>{formatCurrency(totalPotential)}</span>
          </div>
        </div>
      </div>


      {/* Buyers horizontal scroll */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <h4 className="text-sm font-semibold">Compradores Compatíveis ({buyers.length})</h4>
        </div>

        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-2 matching-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
            {sortedBuyers.map((b) => (
              <BuyerCard
                key={b.id}
                buyer={b}
                matchChance={getBuyerChance(b.buyerLead)}
                onRemove={(id) => onRemoveBuyer?.(id)}
              />
            ))}
          </div>

          {/* Right-side fade overlay */}
          <div className="pointer-events-none absolute top-0 right-0 h-full w-20" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 100%)' }} />
        </div>

        <div className="text-xs text-muted-foreground text-right mt-2">← deslize →</div>
      </div>

      {/* Footer spacer */}
      <div className="pt-2" />
    </div>
  );
};

export default MatchCard;
