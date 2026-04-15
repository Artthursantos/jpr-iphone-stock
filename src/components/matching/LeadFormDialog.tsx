import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads } from "@/hooks/useLeads";

export const LeadFormDialog = () => {
  const [open, setOpen] = useState(false);
  const { addLead } = useLeads();

  const [formData, setFormData] = useState({
    nome: "",
    modelo_desejado: "",
    armazenamento_desejado: "",
    modelo_entrada: "",
    armazenamento_entrada: "",
    orcamento: "",
    urgencia: "longo_prazo",
    temperatura: "frio",
    tipo: "comprador"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addLead.mutate({
      ...formData,
      orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null
    }, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          nome: "",
          modelo_desejado: "",
          armazenamento_desejado: "",
          modelo_entrada: "",
          armazenamento_entrada: "",
          orcamento: "",
          urgencia: "longo_prazo",
          temperatura: "frio",
          tipo: "comprador"
        });
      }
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Adicionar Lead (Teste)</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Novo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label className="text-foreground">Nome do Lead</Label>
              <Input required value={formData.nome} onChange={e => handleChange("nome", e.target.value)} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-foreground">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => handleChange("tipo", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprador">Comprador Puro</SelectItem>
                  <SelectItem value="trade_in">Trade-in (Tem aparelho)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 col-span-2 pt-2 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">O que o lead quer comprar?</span>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Modelo Desejado</Label>
              <Input required placeholder="Ex: iPhone 15" value={formData.modelo_desejado} onChange={e => handleChange("modelo_desejado", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Armazenamento</Label>
              <Input placeholder="Ex: 128GB" value={formData.armazenamento_desejado} onChange={e => handleChange("armazenamento_desejado", e.target.value)} />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label className="text-foreground">Orçamento (R$)</Label>
              <Input type="number" placeholder="Ex: 4500" value={formData.orcamento} onChange={e => handleChange("orcamento", e.target.value)} />
            </div>

            {formData.tipo === 'trade_in' && (
              <>
                <div className="space-y-2 col-span-2 pt-2 border-t border-border">
                  <span className="text-sm font-medium text-muted-foreground">O que o lead quer dar de entrada?</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Modelo Entrada</Label>
                  <Input required placeholder="Ex: iPhone 12" value={formData.modelo_entrada} onChange={e => handleChange("modelo_entrada", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Armazenamento</Label>
                  <Input placeholder="Ex: 64GB" value={formData.armazenamento_entrada} onChange={e => handleChange("armazenamento_entrada", e.target.value)} />
                </div>
              </>
            )}

            <div className="space-y-2 col-span-2 pt-2 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">Qualificação Kommo</span>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Temperatura</Label>
              <Select value={formData.temperatura} onValueChange={(v) => handleChange("temperatura", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quente">Quente</SelectItem>
                  <SelectItem value="morno">Morno</SelectItem>
                  <SelectItem value="frio">Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Urgência</Label>
              <Select value={formData.urgencia} onValueChange={(v) => handleChange("urgencia", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imediata">Imediata</SelectItem>
                  <SelectItem value="curto_prazo">Curto Prazo</SelectItem>
                  <SelectItem value="longo_prazo">Longo Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={addLead.isPending}>
              {addLead.isPending ? "Salvando..." : "Salvar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
