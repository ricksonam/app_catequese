import { useState } from "react";
import { Users, Calendar, Clock, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { useTurmaMutation, useComunidades, useCatequistas } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NOMES_TURMA, DIAS_SEMANA } from "@/lib/store";

interface TurmaStepProps {
  open: boolean;
  onSuccess: () => void;
}

export function TurmaStep({ open, onSuccess }: TurmaStepProps) {
  const mutation = useTurmaMutation();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();

  const [form, setForm] = useState({
    nome: "",
    ano: "1° Ano",
    diaCatequese: "",
    horario: "",
    local: "",
    etapa: "pre-catecumenato",
    comunidadeId: comunidades[0]?.id || "",
    catequistasIds: [catequistas[0]?.id].filter(Boolean) as string[],
  });

  const handleSave = async () => {
    if (!form.nome || !form.diaCatequese || !form.horario || !form.local) {
      toast.error("Preencha todos os campos da turma");
      return;
    }

    try {
      const id = crypto.randomUUID();
      await mutation.mutateAsync({
        id,
        ...form,
        comunidadeId: form.comunidadeId || comunidades[0]?.id || "",
        catequistasIds: form.catequistasIds.length > 0 ? form.catequistasIds : [catequistas[0]?.id].filter(Boolean) as string[],
        criadoEm: new Date().toISOString(),
        codigoAcesso: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });

      toast.success("Primeira turma criada!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950">
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
        
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2 shadow-inner">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passo 3 de 3</p>
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Sua Turma</h2>
            <p className="text-xs text-muted-foreground leading-relaxed px-4">
              Para finalizar, crie a sua primeira turma de catequese!
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome da Turma *</label>
              <select 
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="w-full h-12 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
              >
                <option value="">Selecione...</option>
                {NOMES_TURMA.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dia do Encontro *</label>
                <select 
                  value={form.diaCatequese}
                  onChange={e => setForm(f => ({ ...f, diaCatequese: e.target.value }))}
                  className="w-full h-12 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
                >
                  <option value="">Selecione...</option>
                  {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Horário *</label>
                <input 
                  type="time"
                  value={form.horario}
                  onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
                  className="w-full h-12 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Local do Encontro *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input 
                  value={form.local}
                  onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
                  placeholder="Ex: Sala 1, Salão Paroquial"
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={mutation.isPending || !form.nome || !form.diaCatequese || !form.horario || !form.local}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
          >
            {mutation.isPending ? "Salvando..." : "Finalizar Cadastro"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
