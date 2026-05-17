import { useMemo } from "react";
import { useLeads, Lead } from "./useLeads";

export interface BuyerMatch {
  id: string;
  buyerLead: Lead;
  score: number;
  scoreLabel: string;
  potentialValue: number;
}

export interface MatchGroup {
  id: string;
  tradeInLead: Lead;
  buyers: BuyerMatch[];
  bestScore: number;
  totalPotential: number;
}

// Backwards-compatible alias
export type Match = MatchGroup;

export const useMatching = () => {
  const { leads, isLoading } = useLeads();

  const matches = useMemo(() => {
    if (!leads || leads.length === 0) return [] as Match[];

    const uniqueLeadsMap = new Map<string, Lead>();
    leads.forEach((lead) => {
      const key = lead.kommo_lead_id || String(lead.id);
      if (!uniqueLeadsMap.has(key)) {
        uniqueLeadsMap.set(key, lead);
      }
    });

    const uniqueLeads = Array.from(uniqueLeadsMap.values());

    const isClosedStage = (lead: Lead) => {
      const stage = (lead.interesse || "").toLowerCase();
      return stage.includes("venda ganha") || stage.includes("venda perdida");
    };

    const tradeInLeads = uniqueLeads.filter(
      (l) => l.status === "ativo" && !isClosedStage(l) && l.modelo_entrada && l.modelo_entrada.trim() !== ""
    );

    const buyerLeads = uniqueLeads.filter(
      (l) =>
        l.status === "ativo" &&
        !isClosedStage(l) &&
        l.modelo_desejado &&
        l.modelo_desejado.trim() !== "" &&
        (!l.modelo_entrada || l.modelo_entrada.trim() === "")
    );

    const matchGroups = new Map<string, MatchGroup>();

    const sanitizeModel = (m: string) => m.replace(/\([ns]\)\s*/gi, "").trim();

    tradeInLeads.forEach((tradeIn) => {
      const buyersMap = new Map<string, BuyerMatch>();
      const tradeInKey = tradeIn.kommo_lead_id || String(tradeIn.id);

      buyerLeads.forEach((buyer) => {
        const modelIn = (tradeIn.modelo_entrada || "").toLowerCase().trim();
        const modelOut = (buyer.modelo_desejado || "").toLowerCase().trim();

        const cleanModelIn = sanitizeModel(modelIn);
        const cleanModelOut = sanitizeModel(modelOut);

        const familyIn = cleanModelIn.split(" ").slice(0, 2).join(" ");
        const familyOut = cleanModelOut.split(" ").slice(0, 2).join(" ");

        let score = 0;
        let scoreLabel = "";

        // Allow same model or adjacent generation ONLY when variant matches (e.g., Pro with Pro)
        const storageIn = (tradeIn.armazenamento_entrada || "").toLowerCase().trim();
        const storageOut = (buyer.armazenamento_desejado || "").toLowerCase().trim();
        const storageMatches = !storageIn || !storageOut || storageIn === storageOut;

        const extractModelInfo = (model: string) => {
          const base = model.replace(/(\d+)gb/g, "").trim();
          const numberMatch = base.match(/iphone\s+(\d+)/i);
          const number = numberMatch ? Number(numberMatch[1]) : null;
          const variant = base
            .replace(/iphone\s+\d+/i, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
          return { number, variant };
        };

        const normalizeVariant = (variant: string) => {
          if (!variant) return "base";
          if (variant.includes("pro max")) return "pro max";
          if (variant.includes("pro")) return "pro";
          if (variant.includes("plus")) return "plus";
          return variant;
        };

        const infoIn = extractModelInfo(cleanModelIn);
        const infoOut = extractModelInfo(cleanModelOut);
        const variantIn = normalizeVariant(infoIn.variant);
        const variantOut = normalizeVariant(infoOut.variant);

        const hasNumbers = infoIn.number !== null && infoOut.number !== null;
        const variantMatches = variantIn === variantOut;

        if (storageMatches && variantMatches) {
          if (cleanModelIn === cleanModelOut) {
            score = 100;
            scoreLabel = "Match 100%";
          } else if (hasNumbers && Math.abs(infoIn.number! - infoOut.number!) === 1) {
            score = 85;
            scoreLabel = "Match 85% — Quente";
          }
        }

        if (score >= 70) {
          const potentialValue = buyer.orcamento || 0;
          const buyerKey = buyer.kommo_lead_id || String(buyer.id);
          const existing = buyersMap.get(buyerKey);
          if (!existing || score > existing.score || potentialValue > existing.potentialValue) {
            buyersMap.set(buyerKey, {
              id: `${tradeInKey}-${buyerKey}`,
              buyerLead: buyer,
              score,
              scoreLabel,
              potentialValue,
            });
          }
        }
      });

      const buyers = Array.from(buyersMap.values());

      if (buyers.length > 0) {
        const bestScore = Math.max(...buyers.map((b) => b.score));
        const totalPotential = Math.max(...buyers.map((b) => b.potentialValue || 0));

        matchGroups.set(tradeInKey, {
          id: String(tradeInKey),
          tradeInLead: tradeIn,
          buyers,
          bestScore,
          totalPotential,
        });
      }
    });

    return Array.from(matchGroups.values()).sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      return b.totalPotential - a.totalPotential;
    });
  }, [leads]);

  return {
    matches,
    isLoading,
  };
};
