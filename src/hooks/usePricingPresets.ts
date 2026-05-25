import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DeductionMode = 'reais' | 'pct';

export interface DeductionField {
  val: string;
  mode: DeductionMode;
}

export interface DeductionConfig {
  txCartao: DeductionField;
  comissaoVendedor: DeductionField;
  impostos: DeductionField;
  outrasDeducoes: DeductionField;
  embalagem: DeductionField;
  comissaoPorVenda: DeductionField;
  outrosCustos: DeductionField;
}

export interface Preset {
  id: string;
  name: string;
  config: DeductionConfig;
  isDefault?: boolean;
}

export const DEFAULT_CONFIG: DeductionConfig = {
  txCartao: { val: '0', mode: 'pct' },
  comissaoVendedor: { val: '0', mode: 'pct' },
  impostos: { val: '0', mode: 'pct' },
  outrasDeducoes: { val: '0', mode: 'reais' },
  embalagem: { val: '0', mode: 'reais' },
  comissaoPorVenda: { val: '0', mode: 'reais' },
  outrosCustos: { val: '0', mode: 'reais' },
};

const DEFAULT_PRESET: Preset = {
  id: 'default',
  name: 'Padrão',
  config: DEFAULT_CONFIG,
  isDefault: true,
};

export const usePricingPresets = () => {
  const queryClient = useQueryClient();

  const { data: dbPresets = [], isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        config: p.config as DeductionConfig,
      })) as Preset[];
    },
  });

  const presets: Preset[] = [DEFAULT_PRESET, ...dbPresets];

  const saveMutation = useMutation({
    mutationFn: async ({ name, config }: { name: string; config: DeductionConfig }) => {
      const { error } = await supabase.from('presets').insert({ name, config });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('presets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
    },
  });

  const savePreset = (name: string, config: DeductionConfig) => {
    saveMutation.mutate({ name, config });
  };

  const deletePreset = (id: string) => {
    if (id === 'default') return;
    deleteMutation.mutate(id);
  };

  const loadPreset = (id: string): DeductionConfig => {
    const preset = presets.find((p) => p.id === id);
    return preset?.config || DEFAULT_CONFIG;
  };

  return {
    presets,
    isLoading,
    isSavingPreset: saveMutation.isPending,
    savePreset,
    deletePreset,
    loadPreset,
  };
};
