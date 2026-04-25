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

export function TurmaStep({ open, onSuccess, embedded }: TurmaStepProps) {
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
    etapa: "pre-catecumenato",
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
  const inputCls = "w-full h-12 px-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-800 dark:border-zinc-800 focus:border-primary focus:bg-white transition-all outline-none text-sm font-bold appearance-none shadow-sm focus:shadow-md";
  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-zinc-900 ml-1 block mb-1.5";

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
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passo 3 de 3</p>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Sua Turma</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 max-w-sm">
              Para finalizar, crie a sua primeira turma de catequese com todas as informações necessárias.
            </p>
          </div>
        </>
      )}

      {/* Scrollable Form */}
      <div className={cn("overflow-y-auto flex-1 px-4 pb-6 space-y-4", embedded ? "pt-2" : "pt-0")}>

        {/* ── CARD: Identificação ── */}
        <div className="bg-white rounded-2xl border-2 border-zinc-800 shadow-sm overflow-hidden">
          {/* Header do card */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-primary/5">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-sm">🏛️</div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Identificação da Turma</p>
          </div>
          {/* Campos */}
          <div className="p-4 space-y-4">
            <div>
              <label className={labelCls}>Nome da Turma *</label>
              <select
                value={form.nome}
                onChange={(e) => update("nome", e.target.value)}
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {NOMES_TURMA.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Ano/Ciclo *</label>
                <select
                  value={form.ano}
                  onChange={(e) => update("ano", e.target.value)}
                  className={inputCls}
                >
                  <option value="1° Ano">1° Ano</option>
                  <option value="2° Ano">2° Ano</option>
                  <option value="3° Ano">3° Ano</option>
                  <option value="Ciclo 1">Ciclo 1</option>
                  <option value="Ciclo 2">Ciclo 2</option>
                  <option value="Ciclo 3">Ciclo 3</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Dia do Encontro *</label>
                <select
                  value={form.diaCatequese}
                  onChange={(e) => update("diaCatequese", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecione...</option>
                  {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Horário *</label>
                <input
                  type="time"
                  value={form.horario}
                  onChange={(e) => update("horario", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Local</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={form.local}
                    onChange={(e) => update("local", e.target.value)}
                    placeholder="Salão Paroquial"
                    className="w-full h-12 pl-9 pr-4 rounded-2xl bg-white border-2 border-zinc-800 focus:border-primary focus:bg-white transition-all outline-none text-sm font-bold shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD: Comunidade ── */}
        <div className="bg-white rounded-2xl border-2 border-zinc-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-blue-50">
            <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-sm">⛪</div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Comunidade</p>
          </div>
          <div className="p-4 space-y-4">
            {comunidades.length > 0 && (
              <div>
                <label className={labelCls}>Comunidade *</label>
                <select
                  value={form.comunidadeId}
                  onChange={(e) => update("comunidadeId", e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecione a comunidade...</option>
                  {comunidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD: Catequista ── */}
        <div className="bg-white rounded-2xl border-2 border-zinc-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-emerald-50">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-sm">👥</div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Catequista</p>
          </div>
          <div className="p-4 space-y-4">
            {catequistas.length > 0 && (
              <div>
                <label className={labelCls}>Catequista Responsável *</label>
                <select
                  value={form.catequistasIds[0] || ""}
                  onChange={(e) => update("catequistasIds", e.target.value ? [e.target.value] : [])}
                  className={inputCls}
                >
                  <option value="">Selecione...</option>
                  {catequistas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD: Tempo da Catequese ── */}
        <div className="bg-white rounded-2xl border-2 border-zinc-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-100 bg-orange-50">
            <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-sm">⏳</div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Tempo da Catequese</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className={labelCls}>Etapa</label>
              <EtapaMap etapaAtual={form.etapa} onSelect={(id) => update("etapa", id)} />
            </div>
            <div>
              <label className={labelCls}>Observações Adicionais</label>
              <textarea
                value={form.outrosDados}
                onChange={(e) => update("outrosDados", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-zinc-800 focus:border-orange-400 focus:bg-white transition-all outline-none text-sm font-bold resize-none min-h-[80px] shadow-sm"
                placeholder="Observações, recomendações..."
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending || !canSave}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
        >
          {mutation.isPending ? "Salvando..." : "Finalizar Cadastro"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (embedded) return formContent;

  return (
    <Dialog open={open || false} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 max-h-[92vh] flex flex-col">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
