import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type InsertLead = Database["public"]["Tables"]["leads"]["Insert"];

export const useLeads = () => {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar leads: " + error.message);
        throw error;
      }

      return data as Lead[];
    },
  });

  const addLead = useMutation({
    mutationFn: async (newLead: InsertLead) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(newLead)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar lead: " + error.message);
    },
  });

  const syncKommo = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('kommo-import');
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Erro desconhecido');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(data.message || "Leads sincronizados com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar com Kommo: " + error.message);
    },
  });

  return {
    leads,
    isLoading,
    error,
    addLead,
    syncKommo,
  };
};
