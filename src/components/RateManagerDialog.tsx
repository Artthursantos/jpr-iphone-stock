import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRateConfig } from "@/hooks/useRateConfig";
import { RateConfig } from "@/lib/rateConfig";

const genId = () => Math.random().toString(36).slice(2, 9);

const uniqueName = (base: string, existing: string[]) => {
  const lower = existing.map((n) => n.toLowerCase());
  let name = base;
  let i = 2;
  while (lower.includes(name.toLowerCase())) name = `${base} ${i++}`;
  return name;
};

const rateKeys = (max: number) => ["debito", ...Array.from({ length: max }, (_, i) => String(i + 1))];
const rateLabel = (key: string) => (key === "debito" ? "Débito" : `${key}x`);

const RateManagerDialog = () => {
  const { config, saveConfig, isSaving } = useRateConfig();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RateConfig>(config);
  const [selType, setSelType] = useState("");
  const [selGw, setSelGw] = useState("");
  const [selBrand, setSelBrand] = useState("");
  const [rateErrors, setRateErrors] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);

  // Ao abrir: copia a config atual para um rascunho editável e seleciona o 1º de cada nível.
  useEffect(() => {
    if (!open) return;
    setDraft(config);
    const t = config.types[0];
    setSelType(t?.id ?? "");
    setSelGw(t?.gateways[0]?.id ?? "");
    setSelBrand(t?.gateways[0]?.brands[0]?.id ?? "");
    setRateErrors(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const type = draft.types.find((t) => t.id === selType);
  const gateway = type?.gateways.find((g) => g.id === selGw);
  const brand = gateway?.brands.find((b) => b.id === selBrand);

  const edit = (fn: (d: RateConfig) => void) =>
    setDraft((d) => {
      const next: RateConfig = structuredClone(d);
      fn(next);
      return next;
    });

  // ── Tipos ──
  const addType = () => {
    const id = genId();
    edit((d) => {
      d.types.push({ id, name: uniqueName("Novo tipo", d.types.map((t) => t.name)), gateways: [] });
    });
    setSelType(id);
    setSelGw("");
    setSelBrand("");
  };
  const deleteType = (id: string) =>
    setConfirm({
      label: "Excluir este Tipo de Taxa e tudo dentro dele (gateways, bandeiras e valores)?",
      onConfirm: () => {
        edit((d) => {
          d.types = d.types.filter((t) => t.id !== id);
        });
        const first = draft.types.find((t) => t.id !== id);
        setSelType(first?.id ?? "");
        setSelGw(first?.gateways[0]?.id ?? "");
        setSelBrand(first?.gateways[0]?.brands[0]?.id ?? "");
      },
    });

  // ── Gateways ──
  const addGateway = () => {
    if (!type) return;
    const id = genId();
    edit((d) => {
      const t = d.types.find((x) => x.id === selType)!;
      t.gateways.push({
        id,
        name: uniqueName("Novo gateway", t.gateways.map((g) => g.name)),
        maxInstallments: 12,
        brands: [],
      });
    });
    setSelGw(id);
    setSelBrand("");
  };
  const deleteGateway = (id: string) =>
    setConfirm({
      label: "Excluir este Gateway e suas bandeiras/valores?",
      onConfirm: () => {
        edit((d) => {
          const t = d.types.find((x) => x.id === selType)!;
          t.gateways = t.gateways.filter((g) => g.id !== id);
        });
        const first = type?.gateways.find((g) => g.id !== id);
        setSelGw(first?.id ?? "");
        setSelBrand(first?.brands[0]?.id ?? "");
      },
    });

  // ── Bandeiras ──
  const addBrand = () => {
    if (!gateway) return;
    const id = genId();
    edit((d) => {
      const g = d.types.find((x) => x.id === selType)!.gateways.find((x) => x.id === selGw)!;
      g.brands.push({ id, name: uniqueName("Nova bandeira", g.brands.map((b) => b.name)), rates: {} });
    });
    setSelBrand(id);
  };
  const deleteBrand = (id: string) =>
    setConfirm({
      label: "Excluir esta bandeira e seus valores?",
      onConfirm: () => {
        edit((d) => {
          const g = d.types.find((x) => x.id === selType)!.gateways.find((x) => x.id === selGw)!;
          g.brands = g.brands.filter((b) => b.id !== id);
        });
        setSelBrand(gateway?.brands.find((b) => b.id !== id)?.id ?? "");
      },
    });

  // ── Edições de campo ──
  const renameType = (name: string) =>
    edit((d) => {
      d.types.find((t) => t.id === selType)!.name = name;
    });
  const renameGateway = (name: string) =>
    edit((d) => {
      d.types.find((t) => t.id === selType)!.gateways.find((g) => g.id === selGw)!.name = name;
    });
  const setMaxInstallments = (value: number) =>
    edit((d) => {
      d.types.find((t) => t.id === selType)!.gateways.find((g) => g.id === selGw)!.maxInstallments = value;
    });
  const renameBrand = (name: string) =>
    edit((d) => {
      d.types
        .find((t) => t.id === selType)!
        .gateways.find((g) => g.id === selGw)!
        .brands.find((b) => b.id === selBrand)!.name = name;
    });

  const commitRate = (key: string, raw: string) => {
    const errKey = `${selBrand}:${key}`;
    const v = parseFloat(raw.replace(",", "."));
    if (raw.trim() === "" || isNaN(v) || v < 0 || v >= 100) {
      setRateErrors((s) => new Set(s).add(errKey));
      return;
    }
    setRateErrors((s) => {
      const n = new Set(s);
      n.delete(errKey);
      return n;
    });
    edit((d) => {
      d.types
        .find((t) => t.id === selType)!
        .gateways.find((g) => g.id === selGw)!
        .brands.find((b) => b.id === selBrand)!.rates[key] = v;
    });
  };

  // ── Validação geral (nomes) antes de salvar ──
  const validate = (d: RateConfig): string[] => {
    const errs: string[] = [];
    const dup = (names: string[]) => {
      const seen = new Set<string>();
      for (const raw of names) {
        const n = raw.trim().toLowerCase();
        if (!raw.trim()) return "empty";
        if (seen.has(n)) return "dup";
        seen.add(n);
      }
      return null;
    };
    const t = dup(d.types.map((x) => x.name));
    if (t === "empty") errs.push("Há Tipo de Taxa sem nome.");
    if (t === "dup") errs.push("Há Tipos de Taxa com nomes duplicados.");
    for (const ty of d.types) {
      const g = dup(ty.gateways.map((x) => x.name));
      if (g === "empty") errs.push(`Gateway sem nome em "${ty.name}".`);
      if (g === "dup") errs.push(`Gateways duplicados em "${ty.name}".`);
      for (const gw of ty.gateways) {
        if (gw.maxInstallments < 1) errs.push(`Parcelas inválidas em "${gw.name}".`);
        const b = dup(gw.brands.map((x) => x.name));
        if (b === "empty") errs.push(`Bandeira sem nome em "${gw.name}".`);
        if (b === "dup") errs.push(`Bandeiras duplicadas em "${gw.name}".`);
      }
    }
    return errs;
  };

  const handleSave = () => {
    const errs = validate(draft);
    if (errs.length) {
      toast({ title: "Corrija antes de salvar", description: errs[0], variant: "destructive" });
      return;
    }
    saveConfig(draft, {
      onSuccess: () => {
        toast({ title: "Taxas salvas!", description: "As alterações já valem na calculadora." });
        setOpen(false);
      },
      onError: () => {
        toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
      },
    });
  };

  const Chips = ({
    items,
    selected,
    onSelect,
    onAdd,
    addLabel,
  }: {
    items: { id: string; name: string }[];
    selected: string;
    onSelect: (id: string) => void;
    onAdd: () => void;
    addLabel: string;
  }) => (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onSelect(it.id)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm border transition-colors",
            it.id === selected
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground"
          )}
        >
          {it.name || "—"}
        </button>
      ))}
      <button
        onClick={onAdd}
        className="px-3 py-1.5 rounded-md text-sm border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors flex items-center gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Gerenciar Taxas
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">⚙️ Gerenciar Taxas</DialogTitle>
            <DialogDescription>
              Crie, edite ou exclua tipos, gateways, bandeiras, parcelas e valores. As mudanças só valem após salvar.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-1 px-1">
            <div className="space-y-6 py-2">
              {/* Nível 1 — Tipo de Taxa */}
              <section className="space-y-2">
                <Label className="text-foreground text-sm font-semibold">Tipo de Taxa</Label>
                <Chips items={draft.types} selected={selType} onSelect={setSelType} onAdd={addType} addLabel="Novo tipo" />
                {type && (
                  <div className="flex items-end gap-2 pt-1">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Nome do tipo</Label>
                      <Input value={type.name} onChange={(e) => renameType(e.target.value)} className="bg-card border-border" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteType(type.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {type?.isPix && (
                  <p className="text-xs text-muted-foreground">PIX não tem gateways/bandeiras (taxa sempre 0%).</p>
                )}
              </section>

              {/* Nível 2 — Gateway */}
              {type && !type.isPix && (
                <section className="space-y-2 border-t border-border pt-4">
                  <Label className="text-foreground text-sm font-semibold">Gateway de Pagamento</Label>
                  <Chips items={type.gateways} selected={selGw} onSelect={(id) => { setSelGw(id); setSelBrand(type.gateways.find((g) => g.id === id)?.brands[0]?.id ?? ""); }} onAdd={addGateway} addLabel="Novo gateway" />
                  {gateway && (
                    <div className="flex items-end gap-2 pt-1">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome do gateway</Label>
                        <Input value={gateway.name} onChange={(e) => renameGateway(e.target.value)} className="bg-card border-border" />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs text-muted-foreground">Máx. parcelas</Label>
                        <Input
                          type="number"
                          min={1}
                          max={24}
                          value={gateway.maxInstallments}
                          onChange={(e) => setMaxInstallments(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                          className="bg-card border-border"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteGateway(gateway.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </section>
              )}

              {/* Nível 3 — Bandeira */}
              {gateway && (
                <section className="space-y-2 border-t border-border pt-4">
                  <Label className="text-foreground text-sm font-semibold">Bandeira do Cartão</Label>
                  <Chips items={gateway.brands} selected={selBrand} onSelect={setSelBrand} onAdd={addBrand} addLabel="Nova bandeira" />
                  {brand && (
                    <div className="flex items-end gap-2 pt-1">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Nome da bandeira</Label>
                        <Input value={brand.name} onChange={(e) => renameBrand(e.target.value)} className="bg-card border-border" />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBrand(brand.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </section>
              )}

              {/* Nível 4 — Valores */}
              {gateway && brand && (
                <section className="space-y-2 border-t border-border pt-4">
                  <Label className="text-foreground text-sm font-semibold">
                    Valores (%) — {brand.name}
                  </Label>
                  <div key={selBrand} className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {rateKeys(gateway.maxInstallments).map((key) => (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{rateLabel(key)}</Label>
                        <Input
                          inputMode="decimal"
                          defaultValue={brand.rates[key] ?? ""}
                          onBlur={(e) => commitRate(key, e.target.value)}
                          className={cn(
                            "bg-card border-border",
                            rateErrors.has(`${selBrand}:${key}`) && "border-destructive"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Valor entre 0 e 100. Use ponto ou vírgula.</p>
                </section>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                confirm?.onConfirm();
                setConfirm(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RateManagerDialog;
