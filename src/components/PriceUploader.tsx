import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PriceUploader = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleButtonClick = async () => {
    const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID?.trim();
    const sheetTitle = import.meta.env.VITE_GOOGLE_SHEET_TITLE?.trim() || undefined;

    if (!sheetId) {
      toast({
        title: "ID da planilha ausente",
        description: "Defina VITE_GOOGLE_SHEET_ID no .env antes de sincronizar.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke("google-sheet-sync", {
        body: { sheetId, sheetTitle },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Não foi possível sincronizar a planilha.");

      toast({
        title: "Preços sincronizados com sucesso",
        description: `Foram importados ${data.insertedRows ?? 0} produtos da planilha.`,
      });
    } catch (error) {
      console.error("Erro ao sincronizar preços:", error);
      toast({
        title: "Falha ao sincronizar preços",
        description: error instanceof Error
          ? error.message
          : "Ocorreu um erro ao ler a planilha ou atualizar o Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleButtonClick}
        disabled={isSyncing}
        variant="default"
        className="gap-2"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sincronizando planilha...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Atualizar Preço
          </>
        )}
      </Button>
    </div>
  );
};

export default PriceUploader;



