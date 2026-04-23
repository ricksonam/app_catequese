import { useState } from "react";
import { Church, MapPin, Phone, Mail, User, ArrowRight, Sparkles } from "lucide-react";
import { useParoquiaMutation, useComunidadeMutation } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { mascaraTelefone } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ParoquiaStepProps {
  open: boolean;
  onSuccess: () => void;
}

export function ParoquiaStep({ open, onSuccess }: ParoquiaStepProps) {
  const pMutation = useParoquiaMutation();
  const cMutation = useComunidadeMutation();

  const [form, setForm] = useState({
    pNome: "",
    pTipo: "Paróquia",
    pEndereco: "",
    pTelefone: "",
    pEmail: "",
    pResponsavel: "",
    cNome: "",
  });

  const handleSave = async () => {
    if (!form.pNome || !form.cNome) {
      toast.error("Preencha o nome da Paróquia e da Comunidade");
      return;
    }

    try {
      const pId = crypto.randomUUID();
      const cId = crypto.randomUUID();

      await pMutation.mutateAsync({
        id: pId,
        nome: form.pNome,
        tipo: form.pTipo as any,
        endereco: form.pEndereco,
        telefone: form.pTelefone,
        email: form.pEmail,
        responsavel: form.pResponsavel,
        observacao: "Cadastro via Onboarding",
      });

      await cMutation.mutateAsync({
        id: cId,
        nome: form.cNome,
        tipo: "Comunidade",
        paroquiaId: pId,
        endereco: form.pEndereco,
        responsavel: form.pResponsavel,
        telefone: form.pTelefone,
        observacao: "Comunidade inicial",
      });

      toast.success("Paróquia e Comunidade cadastradas!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
        <div className="h-2 w-full bg-gradient-to-r from-violet-600 via-amber-400 to-violet-600" />
        
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2 shadow-inner">
              <Church className="h-8 w-8 text-violet-600" />
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passo 1 de 3</p>
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Sua Paróquia</h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-4">
              Comece definindo onde a sua catequese acontece. Isso ajudará a organizar suas turmas e comunidades.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Paróquia *</label>
              <div className="relative">
                <Church className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input 
                  value={form.pNome}
                  onChange={e => setForm(f => ({ ...f, pNome: e.target.value }))}
                  placeholder="Ex: Paróquia São José"
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-violet-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Sua Comunidade *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input 
                  value={form.cNome}
                  onChange={e => setForm(f => ({ ...f, cNome: e.target.value }))}
                  placeholder="Ex: Comunidade Nossa Senhora"
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-violet-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefone</label>
                <input 
                  value={form.pTelefone}
                  onChange={e => setForm(f => ({ ...f, pTelefone: mascaraTelefone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  className="w-full h-12 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-violet-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo</label>
                <select 
                  value={form.pTipo}
                  onChange={e => setForm(f => ({ ...f, pTipo: e.target.value }))}
                  className="w-full h-12 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-violet-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
                >
                  <option>Paróquia</option>
                  <option>Área Missionária</option>
                  <option>Escola</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={pMutation.isPending || cMutation.isPending || !form.pNome || !form.cNome}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-violet-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
          >
            {pMutation.isPending ? "Salvando..." : "Próximo Passo"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
