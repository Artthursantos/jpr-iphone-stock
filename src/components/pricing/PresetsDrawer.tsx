import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bookmark, Trash2, Download } from 'lucide-react';
import { Preset, DeductionConfig, usePricingPresets } from '@/hooks/usePricingPresets';

interface PresetsDrawerProps {
  currentConfig: DeductionConfig;
  onLoadPreset: (config: DeductionConfig) => void;
}

export const PresetsDrawer = ({ currentConfig, onLoadPreset }: PresetsDrawerProps) => {
  const { presets, isLoading, isSavingPreset, savePreset, deletePreset, loadPreset } = usePricingPresets();
  const [presetName, setPresetName] = useState('');
  const [savingMode, setSavingMode] = useState(false);

  const handleSaveNewPreset = () => {
    if (!presetName.trim() || isSavingPreset) return;
    savePreset(presetName, currentConfig);
    setPresetName('');
    setSavingMode(false);
  };

  const handleLoadPreset = (preset: Preset) => {
    const config = loadPreset(preset.id);
    onLoadPreset(config);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Presets
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Presets de Deduções</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* List existing presets */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Seus Presets</h3>
            {presets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum preset salvo ainda.</p>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{preset.name}</div>
                    {preset.isDefault && (
                      <Badge variant="secondary" className="mt-1">
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLoadPreset(preset)}
                      className="gap-1 h-8"
                    >
                      <Download className="h-3 w-3" />
                      Carregar
                    </Button>
                    {!preset.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePreset(preset.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator />

          {/* Save new preset */}
          <div className="space-y-2">
            {!savingMode ? (
              <Button
                onClick={() => setSavingMode(true)}
                variant="outline"
                className="w-full"
              >
                + Salvar configuração atual como preset
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do novo preset..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNewPreset();
                      if (e.key === 'Escape') setSavingMode(false);
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveNewPreset}
                    disabled={!presetName.trim() || isSavingPreset}
                    className="flex-1"
                    size="sm"
                  >
                    {isSavingPreset ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
                  </Button>
                  <Button
                    onClick={() => setSavingMode(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
