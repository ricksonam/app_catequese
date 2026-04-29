import { useState } from "react";
import { Users, MapPin, ArrowRight, Sparkles, Check, Search, ChevronRight } from "lucide-react";
import { useTurmaMutation, useComunidades, useCatequistas, useTurmas } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NOMES_TURMA, DIAS_SEMANA } from "@/lib/store";
import { EtapaMap } from "@/components/EtapaMap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TurmaStepProps {
  open?: boolean;
  onSuccess: () => void;
  onClose?: () => void;
  embedded?: boolean;
}

// Paleta de cores suaves para os cards de catequistas (por índice)
const CAT_COLORS = [
  { bg: "bg-blue-50",    border: "border-blue-300",   ring: "ring-blue-400/30",   avatar: "bg-blue-500",   check: "bg-blue-500 border-blue-500",   text: "text-blue-700"   },
  { bg: "bg-emerald-50", border: "border-emerald-300", ring: "ring-emerald-400/30",avatar: "bg-emerald-500",check: "bg-emerald-500 border-emerald-500",text: "text-emerald-700"},
  { bg: "bg-violet-50",  border: "border-violet-300",  ring: "ring-violet-400/30", avatar: "bg-violet-500", check: "bg-violet-500 border-violet-500", text: "text-violet-700" },
  { bg: "bg-amber-50",   border: "border-amber-300",   ring: "ring-amber-400/30",  avatar: "bg-amber-500",  check: "bg-amber-500 border-amber-500",  text: "text-amber-700"  },
  { bg: "bg-rose-50",    border: "border-rose-300",    ring: "ring-rose-400/30",   avatar: "bg-rose-500",   check: "bg-rose-500 border-rose-500",    text: "text-rose-700"   },
  { bg: "bg-cyan-50",    border: "border-cyan-300",    ring: "ring-cyan-400/30",   avatar: "bg-cyan-500",   check: "bg-cyan-500 border-cyan-500",    text: "text-cyan-700"   },
  { bg: "bg-orange-50",  border: "border-orange-300",  ring: "ring-orange-400/30", avatar: "bg-orange-500", check: "bg-orange-500 border-orange-500", text: "text-orange-700" },
  { bg: "bg-pink-50",    border: "border-pink-300",    ring: "ring-pink-400/30",   avatar: "bg-pink-500",   check: "bg-pink-500 border-pink-500",    text: "text-pink-700"   },
];

export function TurmaStep({ open, onSuccess, onClose, embedded }: TurmaStepProps) {
  const mutation = useTurmaMutation();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();
  const { data: turmas = [] } = useTurmas();

  const [form, setForm] = useState({
    nome: "",
    ano: "1° Ano",
    diaCatequese: "",
    horario: "",
    local: "",
    etapa: "",
    outrosDados: "",
    comunidadeId: comunidades[0]?.id || "",
    catequistasIds: [] as string[],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCatequista = (id: string) => {
    const ids = form.catequistasIds.includes(id)
      ? form.catequistasIds.filter(x => x !== id)
      : [...form.catequistasIds, id];
    update("catequistasIds", ids);
  };

  const handleSave = async () => {
    if (!form.nome || !form.diaCatequese || !form.horario) {
      toast.error("Preencha os campos obrigatórios da turma");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const id = crypto.randomUUID();
      await mutation.mutateAsync({
        id,
        nome: form.nome,
        ano: form.ano,
        diaCatequese: form.diaCatequese,
        horario: form.horario,
        local: form.local,
        etapa: form.etapa,
        outrosDados: form.outrosDados,
        comunidadeId: form.comunidadeId || comunidades[0]?.id || "",
        catequistasIds: form.catequistasIds.length > 0 ? form.catequistasIds : [catequistas[0]?.id].filter(Boolean) as string[],
        criadoEm: new Date().toISOString(),
        codigoAcesso: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
      toast.success("Primeira turma criada!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
      setIsSaving(false);
    }
  };

  const filteredCatequistas = catequistas.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canSave = form.nome && form.diaCatequese && form.horario && !isSaving;

  // Input style reutilizável
  const inputCls = "form-input h-12 text-base font-bold";
  const labelCls = "text-xs font-black text-zinc-900 uppercase tracking-widest";
  const labelWithRedAsterisk = (label: string) => label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  const formContent = (
    <div className={cn("flex flex-col", embedded ? "flex-1 min-h-0" : "max-h-[92vh]")}>
      {!embedded && (
        <>
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shrink-0" />
          <div className="flex flex-col items-center text-center pt-6 pb-3 px-8 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2 shadow-inner">
              <Users className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {onClose ? "Cadastro de Turma" : "Passo 3 de 3"}
              </p>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Nova Turma</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 max-w-sm">
              {onClose 
                ? "Preencha as informações abaixo para criar sua nova turma de catequese." 
                : "Para finalizar, crie a sua primeira turma de catequese com todas as informações necessárias."}
            </p>
          </div>
        </>
      )}

      {/* Scrollable Form */}
      <div className={cn("overflow-y-auto flex-1 px-4 pb-6 space-y-4 pt-4")}>

        {/* ── CARD: Identificação ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-primary/5 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-base">🏛️</div>
            <span className="text-sm font-black uppercase tracking-wider text-primary">Identificação</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Nome da Turma *")}</label>
              <select value={form.nome} onChange={(e) => update("nome", e.target.value)} className={inputCls}>
                <option value="">Selecione...</option>
                {NOMES_TURMA.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelCls}>{labelWithRedAsterisk("Ano/Ciclo *")}</label>
                <select value={form.ano} onChange={(e) => update("ano", e.target.value)} className="form-input h-11">
                  <option value="1° Ano">1° Ano</option>
                  <option value="2° Ano">2° Ano</option>
                  <option value="3° Ano">3° Ano</option>
                  <option value="Ciclo 1">Ciclo 1</option>
                  <option value="Ciclo 2">Ciclo 2</option>
                  <option value="Ciclo 3">Ciclo 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>{labelWithRedAsterisk("Dia do Encontro *")}</label>
                <select value={form.diaCatequese} onChange={(e) => update("diaCatequese", e.target.value)} className="form-input h-11">
                  <option value="">Selecione...</option>
                  {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/5">
              <div className="space-y-2">
                <label className={labelCls}>{labelWithRedAsterisk("Horário *")}</label>
                <input type="time" value={form.horario} onChange={(e) => update("horario", e.target.value)} className="form-input h-11" />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Local</label>
                <input type="text" value={form.local} onChange={(e) => update("local", e.target.value)} className="form-input h-11" placeholder="Ex: Salão Paroquial" />
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD: Comunidade ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-blue-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base">⛪</div>
            <span className="text-sm font-black uppercase tracking-wider text-blue-600">Comunidade</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Comunidade *")}</label>
              <select value={form.comunidadeId} onChange={(e) => update("comunidadeId", e.target.value)} className="form-input h-11">
                <option value="">Selecione...</option>
                {comunidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── CARD: Catequista ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-base">👥</div>
            <span className="text-sm font-black uppercase tracking-wider text-emerald-600">Catequista</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Catequista Responsável *")}</label>
              <select value={form.catequistasIds[0] || ""} onChange={(e) => update("catequistasIds", e.target.value ? [e.target.value] : [])} className="form-input h-11">
                <option value="">Selecione...</option>
                {catequistas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── CARD: Tempo da Catequese ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up">
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-orange-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-base">⏳</div>
            <span className="text-sm font-black uppercase tracking-wider text-orange-600">Tempo da Catequese</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-3">
              <label className={labelCls}>Selecione o tempo:</label>
              <EtapaMap etapaAtual={form.etapa} onSelect={(id) => update("etapa", id)} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Observações Adicionais</label>
              <textarea
                value={form.outrosDados}
                onChange={(e) => update("outrosDados", e.target.value)}
                className="form-input min-h-[100px] resize-none border-2 border-zinc-800"
                placeholder="Observações, recomendações..."
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending || !canSave}
          className="w-full action-btn h-14 mt-4"
        >
          {mutation.isPending ? "Salvando..." : "Finalizar Cadastro"}
        </button>
      </div>
    </div>
  );

  if (embedded) return formContent;

  return (
    <Dialog open={open || false} onOpenChange={(val) => !val && onClose && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 max-h-[92vh] flex flex-col">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
