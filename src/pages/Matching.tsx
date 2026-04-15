import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import sealStoreLogo from "@/assets/seal-store-logo.png";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMatching, Match } from "@/hooks/useMatching";
import { MatchCard } from "@/components/matching/MatchCard";
import { MatchStats } from "@/components/matching/MatchStats";
import { LeadFormDialog } from "@/components/matching/LeadFormDialog";
import { useLeads } from "@/hooks/useLeads";
import { RefreshCw } from "lucide-react";

const Matching = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { matches, isLoading } = useMatching();
  const { syncKommo } = useLeads();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  
  // Filter matches based on search term
  const filteredMatches = matches.filter(match => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    
    return (
      match.tradeInLead.nome.toLowerCase().includes(term) ||
      match.buyerLead.nome.toLowerCase().includes(term) ||
      (match.tradeInLead.modelo_entrada || "").toLowerCase().includes(term) ||
      (match.buyerLead.modelo_desejado || "").toLowerCase().includes(term) ||
      (match.tradeInLead.armazenamento_entrada || "").toLowerCase().includes(term) ||
      (match.buyerLead.armazenamento_desejado || "").toLowerCase().includes(term)
    );
  });

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMatches = filteredMatches.slice(startIndex, startIndex + itemsPerPage);

  const scrollToTop = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(p => p + 1);
      scrollToTop();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
      scrollToTop();
    }
  };

  const jumpToPage = (p: number) => {
    setCurrentPage(p);
    scrollToTop();
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
                <p className="text-sm text-muted-foreground mt-1">Sistema de Gestão</p>
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
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              Matching de Trade-in
            </h2>
            <p className="text-muted-foreground mt-1">
              Leads com aparelho pra dar de entrada × compradores
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card/50 border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground transition-all placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex gap-2 items-center w-full sm:w-auto">
              <Button 
                variant="default" 
                className="bg-primary/20 text-primary border-primary/50 hover:bg-primary/30 flex-1 sm:flex-auto"
                onClick={() => syncKommo.mutate()}
                disabled={syncKommo.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncKommo.isPending ? 'animate-spin' : ''}`} />
                {syncKommo.isPending ? "Sincronizando..." : "Sincronizar Kommo"}
              </Button>
              <LeadFormDialog />
            </div>
          </div>
        </div>

        {/* Stats */}
        <MatchStats matches={matches} />

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 text-center text-muted-foreground">
            Buscando oportunidades de match...
          </div>
        )}

        {/* Matches Lists */}
        {!isLoading && filteredMatches.length === 0 && searchTerm ? (
          <div className="py-12 text-center bg-card/40 border border-border rounded-xl">
            <p className="text-foreground font-medium mb-2">Nenhum match encontrado para "{searchTerm}"</p>
            <p className="text-sm text-muted-foreground">Tente usar outros termos como o nome do aparelho ou capacidade.</p>
          </div>
        ) : !isLoading && matches.length === 0 ? (
          <div className="py-12 text-center bg-card/40 border border-border rounded-xl">
            <p className="text-foreground font-medium mb-2">Nenhum match encontrado ainda</p>
            <p className="text-sm text-muted-foreground">Adicione mais leads de trade-in e compradores para cruzar oportunidades.</p>
          </div>
        ) : null}

        {!isLoading && filteredMatches.length > 0 && (
          <div className="mb-10">
            <div className="space-y-4">
              {currentMatches.map((match, index) => {
                const isFirstPartial = match.score < 100 && (index === 0 || currentMatches[index - 1].score === 100);
                const isFirstPerfect = match.score === 100 && index === 0 && currentPage === 1;

                return (
                  <div key={match.id}>
                    {isFirstPerfect && (
                      <h3 className="text-sm font-bold text-muted-foreground tracking-wider mb-4 uppercase mt-2">
                        Matches Perfeitos — Mesma Geração
                      </h3>
                    )}
                    {isFirstPartial && (
                      <h3 className="text-sm font-bold text-muted-foreground tracking-wider mb-4 uppercase mt-8">
                        Oportunidades de Upsell — O lead comprador pode precisar inteirar
                      </h3>
                    )}
                    <MatchCard match={match} />
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border mt-8 pt-6">
                <p className="text-sm text-muted-foreground shrink-0">
                  Página <span className="font-medium text-foreground">{currentPage}</span> de <span className="font-medium text-foreground">{totalPages}</span>
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  
                  {/* Jump to Page */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const p = parseInt(formData.get('page')?.toString() || '0');
                      if (p >= 1 && p <= totalPages) jumpToPage(p);
                      e.currentTarget.reset();
                    }} 
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Ir para:</span>
                    <input 
                      type="number" 
                      name="page" 
                      min={1} 
                      max={totalPages}
                      className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-center"
                      placeholder="#"
                    />
                    <Button variant="outline" size="sm" type="submit" className="border-border/50 bg-secondary/20 hover:bg-secondary/50 text-muted-foreground hover:text-foreground h-9">
                      Ir
                    </Button>
                  </form>

                  {/* Prev / Next */}
                  <div className="flex items-center gap-1 sm:gap-2 sm:border-l sm:border-border sm:pl-4 w-full sm:w-auto justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => jumpToPage(1)}
                      disabled={currentPage === 1}
                      className="border-border/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground h-9 px-2.5"
                      title="Primeira página"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="border-border/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground h-9"
                    >
                      <ChevronLeft className="h-4 w-4 mr-0 sm:mr-1" />
                      <span className="hidden sm:inline">Anterior</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="border-border/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground h-9"
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRight className="h-4 w-4 ml-0 sm:ml-1" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => jumpToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="border-border/50 hover:bg-secondary/50 text-muted-foreground hover:text-foreground h-9 px-2.5"
                      title="Última página"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default Matching;
