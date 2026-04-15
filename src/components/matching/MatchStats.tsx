import { Match } from "@/hooks/useMatching";
import { formatCurrency } from "@/lib/installmentRates";

interface MatchStatsProps {
  matches: Match[];
}

export const MatchStats = ({ matches }: MatchStatsProps) => {
  const totalMatches = matches.length;
  const perfectMatches = matches.filter(m => m.score === 100).length;
  
  const potentialTotal = matches.reduce((acc, curr) => acc + curr.potentialValue, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Matches */}
      <div className="bg-card/40 border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-1">Matches hoje</p>
        <p className="text-3xl font-bold text-foreground mb-1">{totalMatches}</p>
        <p className="text-xs text-muted-foreground">+3 vs ontem</p>
      </div>

      {/* Perfect Matches */}
      <div className="bg-card/40 border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-1">Match perfeito</p>
        <p className="text-3xl font-bold text-foreground mb-1">{perfectMatches}</p>
        <p className="text-xs text-muted-foreground">Prontos p/ fechar</p>
      </div>

      {/* Potential */}
      <div className="bg-card/40 border border-border rounded-xl p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-1">Potencial</p>
        <p className="text-3xl font-bold text-green-500 mb-1">{formatCurrency(potentialTotal)}</p>
        <p className="text-xs text-muted-foreground">em negócios cruzados</p>
      </div>
    </div>
  );
};
