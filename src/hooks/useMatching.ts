import { useMemo } from "react";
import { useLeads, Lead } from "./useLeads";

export interface Match {
  id: string; // unique string pairing
  tradeInLead: Lead;
  buyerLead: Lead;
  score: number; // 100, 85, 70
  scoreLabel: string; // "Match 100%", "Match 85% — Quente"
  potentialValue: number;
}

export const useMatching = () => {
  const { leads, isLoading } = useLeads();

  const matches = useMemo(() => {
    if (!leads || leads.length === 0) return [];

    const tradeInLeads = leads.filter(
      (l) => l.status === "ativo" && l.modelo_entrada && l.modelo_entrada.trim() !== ""
    );

    const buyerLeads = leads.filter(
      (l) => l.status === "ativo" && l.modelo_desejado && l.modelo_desejado.trim() !== ""
        && (!l.modelo_entrada || l.modelo_entrada.trim() === "")
    );

    const generatedMatches: Match[] = [];

    tradeInLeads.forEach((tradeIn) => {
      buyerLeads.forEach((buyer) => {
        // Compare tradeIn.modelo_entrada with buyer.modelo_desejado
        const modelIn = tradeIn.modelo_entrada!.toLowerCase().trim();
        const modelOut = buyer.modelo_desejado.toLowerCase().trim();

        const storageIn = (tradeIn.armazenamento_entrada || "").toLowerCase().trim();
        const storageOut = (buyer.armazenamento_desejado || "").toLowerCase().trim();

        // Helper to remove prefixes like (n) and (s)
        const sanitizeModel = (m: string) => m.replace(/\([ns]\)\s*/gi, '').trim();
        const cleanModelIn = sanitizeModel(modelIn);
        const cleanModelOut = sanitizeModel(modelOut);

        // Calculate a base model grouping (e.g., "iphone 13 pro max" -> "iphone 13")
        // We assume "iphone XX" is the family.
        const familyIn = cleanModelIn.split(" ").slice(0, 2).join(" ");
        const familyOut = cleanModelOut.split(" ").slice(0, 2).join(" ");

        let score = 0;
        let scoreLabel = "";

        // 1. Exact match
        if (cleanModelIn === cleanModelOut) {
          score = 100;
          scoreLabel = "Match 100%";
        } 
        // 2. Partial match 85% (Same exact device line, like iPhone 13 Pro Max vs iPhone 13 Pro Max xGB)
        // If cleanModelIn is contained within cleanModelOut or vice versa, and they have the same family
        else if (cleanModelOut.includes(cleanModelIn) || cleanModelIn.includes(cleanModelOut)) {
          if (familyIn === familyOut && familyIn.includes('iphone')) {
             // Let's ensure it's not matching iPhone 13 Pro with just iPhone 13
             // if they share the same word count logic or if one is just adding storage
             const baseWordsIn = cleanModelIn.replace(/(\d+)gb/g, '').trim();
             const baseWordsOut = cleanModelOut.replace(/(\d+)gb/g, '').trim();
             if (baseWordsIn === baseWordsOut) {
                score = 85;
                scoreLabel = 'Match 85% — Quente';
             } else {
                score = 70;
                scoreLabel = "Match 70% — Morno";
             }
          }
        }
        // 3. Family match 70% (e.g. iPhone 15 Pro vs iPhone 15)
        else if (familyIn === familyOut && familyIn.includes('iphone')) {
          score = 70;
          scoreLabel = "Match 70% — Morno";
        }

        if (score >= 70) {
          // Calculate potential based on buyer's budget
          const potentialValue = buyer.orcamento || 0;

          generatedMatches.push({
            id: `${tradeIn.id}-${buyer.id}`,
            tradeInLead: tradeIn,
            buyerLead: buyer,
            score,
            scoreLabel,
            potentialValue
          });
        }
      });
    });

    // Sort by score descending, then by potential value
    return generatedMatches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.potentialValue - a.potentialValue;
    });

  }, [leads]);

  return {
    matches,
    isLoading
  };
};
