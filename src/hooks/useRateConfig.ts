import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RateConfig, buildDefaultRateConfig } from '@/lib/rateConfig';

const CONFIG_ID = 'default';

export const useRateConfig = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['rate_config'],
    queryFn: async (): Promise<RateConfig> => {
      const { data, error } = await supabase
        .from('rate_configs')
        .select('config')
        .eq('id', CONFIG_ID)
        .maybeSingle();
      if (error) throw error;

      if (data?.config) {
        return data.config as unknown as RateConfig;
      }

      // Primeira vez: semeia o banco com as taxas atuais.
      const seed = buildDefaultRateConfig();
      await supabase
        .from('rate_configs')
        .upsert({ id: CONFIG_ID, config: seed as unknown as never });
      return seed;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (next: RateConfig) => {
      const { error } = await supabase.from('rate_configs').upsert({
        id: CONFIG_ID,
        config: next as unknown as never,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate_config'] });
    },
  });

  return {
    // Fallback para os defaults enquanto carrega ou se o banco não responder
    // (ex.: migração ainda não rodada) — assim a Calculadora nunca quebra.
    config: data ?? buildDefaultRateConfig(),
    isLoading,
    error,
    saveConfig: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
};
