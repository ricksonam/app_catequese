import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NOMES_TURMA, DIAS_SEMANA, type Turma } from "@/lib/store";
import { useTurmas, useTurmaMutation, useComunidades, useCatequistas } from "@/hooks/useSupabaseData";
import { EtapaMap } from "@/components/EtapaMap";
import { ArrowLeft, Check, ChevronRight, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Paleta de cores únicas por índice — nunca repete as mesmas para todos
const CAT_PALETTE = [
  { card: "bg-blue-50 border-blue-400",    avatar: "bg-blue-500",    check: "bg-blue-500 border-blue-500",    text: "text-blue-700",    ring: "ring-blue-400/30"   },
  { card: "bg-emerald-50 border-emerald-400", avatar: "bg-emerald-500", check: "bg-emerald-500 border-emerald-500", text: "text-emerald-700", ring: "ring-emerald-400/30" },
  { card: "bg-violet-50 border-violet-400",   avatar: "bg-violet-500",  check: "bg-violet-500 border-violet-500",  text: "text-violet-700",  ring: "ring-violet-400/30"  },
  { card: "bg-amber-50 border-amber-400",     avatar: "bg-amber-500",   check: "bg-amber-500 border-amber-500",   text: "text-amber-700",   ring: "ring-amber-400/30"   },
  { card: "bg-rose-50 border-rose-400",       avatar: "bg-rose-500",    check: "bg-rose-500 border-rose-500",    text: "text-rose-700",    ring: "ring-rose-400/30"    },
  { card: "bg-cyan-50 border-cyan-400",       avatar: "bg-cyan-500",    check: "bg-cyan-500 border-cyan-500",    text: "text-cyan-700",    ring: "ring-cyan-400/30"    },
  { card: "bg-orange-50 border-orange-400",   avatar: "bg-orange-500",  check: "bg-orange-500 border-orange-500",  text: "text-orange-700",  ring: "ring-orange-400/30"  },
  { card: "bg-pink-50 border-pink-400",       avatar: "bg-pink-500",    check: "bg-pink-500 border-pink-500",    text: "text-pink-700",    ring: "ring-pink-400/30"    },
];

export default function TurmaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: turmas = [], isLoading: isLoadingTurmas } = useTurmas();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();
  const mutation = useTurmaMutation();

  const isEditing = Boolean(id);
  const existingTurma = turmas.find(t => t.id === id);

  const [form, setForm] = useState({
    nome: "",
    ano: "1° Ano",
    diaCatequese: "",
    horario: "",
    local: "",
    etapa: "",
    outrosDados: "",
    comunidadeId: "",
    catequistasIds: [] as string[],
    codigoAcesso: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing && existingTurma) {
      setForm({
        nome: existingTurma.nome,
        ano: existingTurma.ano,
        diaCatequese: existingTurma.diaCatequese,
        horario: existingTurma.horario,
        local: existingTurma.local,
        etapa: existingTurma.etapa,
        outrosDados: existingTurma.outrosDados || "",
        comunidadeId: existingTurma.comunidadeId || "",
        catequistasIds: existingTurma.catequistasIds || [],
        codigoAcesso: existingTurma.codigoAcesso || "",
      });
    }
  }, [isEditing, existingTurma]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCatequista = (catId: string) => {
    const ids = form.catequistasIds.includes(catId)
      ? form.catequistasIds.filter(x => x !== catId)
      : [...form.catequistasIds, catId];
    update("catequistasIds", ids);
  };

  const handleSave = async () => {
    if (!form.nome || !form.diaCatequese || !form.horario || !form.comunidadeId || form.catequistasIds.length === 0) {
      toast.error("Preencha todos os campos obrigatórios, incluindo comunidade e catequistas"); return;
    }
    if (isSaving) return;
    setIsSaving(true);
    const turma: Turma = {
      id: isEditing ? id! : crypto.randomUUID(),
      ...form,
      criadoEm: isEditing ? existingTurma?.criadoEm || new Date().toISOString() : new Date().toISOString()
    };
    try {
      await mutation.mutateAsync(turma);
      toast.success(isEditing ? "Alterações salvas!" : "Turma criada com sucesso!");
      navigate(`/turmas/${turma.id}`);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
      setIsSaving(false);
    }
  };

  const filteredCatequistas = catequistas.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputCls = "form-input h-12 text-base font-bold";
  const labelCls = "text-xs font-black text-zinc-900 uppercase tracking-widest";
  const labelWithRedAsterisk = (label: string) => label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div className="space-y-6 pb-10">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <h1 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
          {isEditing ? <><Pencil className="h-5 w-5" /> Editar Turma</> : "Nova Turma"}
        </h1>
      </div>

      <div className="space-y-5">

        {/* ── CARD: IDENTIFICAÇÃO DA TURMA ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up">
          {/* Header dentro do card */}
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-primary/5 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-base">🏛️</div>
            <span className="text-sm font-black uppercase tracking-wider text-primary">Identificação</span>
          </div>
          {/* Campos */}
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Nome da Turma *")}</label>
              <select value={form.nome} onChange={(e) => update("nome", e.target.value)} className={inputCls}>
                <option value="">Selecione...</option>
                {NOMES_TURMA.map((n) => <option key={n} value={n}>{n}</option>)}
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
                  {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
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

        {/* ── CARD: COMUNIDADE ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-blue-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-base">⛪</div>
            <span className="text-sm font-black uppercase tracking-wider text-blue-600">Comunidade</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Comunidade *")}</label>
              <select value={form.comunidadeId} onChange={(e) => update("comunidadeId", e.target.value)} className="form-input h-11">
                <option value="">Selecione...</option>
                {comunidades.map((c) => <option key={c.id} value={c.id}>{c.name || c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── CARD: CATEQUISTA ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-base">👥</div>
            <span className="text-sm font-black uppercase tracking-wider text-emerald-600">Catequista</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className={labelCls}>{labelWithRedAsterisk("Catequista Responsável *")}</label>
              <select value={form.catequistasIds[0] || ""} onChange={(e) => update("catequistasIds", e.target.value ? [e.target.value] : [])} className="form-input h-11">
                <option value="">Selecione...</option>
                {catequistas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── CARD: TEMPO DA CATEQUESE ── */}
        <div className="bg-white rounded-3xl border-2 border-zinc-800 shadow-sm overflow-hidden animate-float-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-orange-50 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-base">⏳</div>
            <span className="text-sm font-black uppercase tracking-wider text-orange-600">Tempo da Catequese</span>
          </div>
          <div className="p-5 space-y-5">
            <div className="space-y-3">
              <label className={labelCls}>Selecione o tempo:</label>
              <EtapaMap etapaAtual={form.etapa} onSelect={(etapaId) => update("etapa", etapaId)} />
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
      </div>

      <button
        onClick={handleSave}
        disabled={mutation.isPending || !form.nome || !form.diaCatequese || !form.comunidadeId || form.catequistasIds.length === 0}
        className="w-full action-btn h-14 text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] animate-float-up"
        style={{ animationDelay: '300ms' }}
      >
        {mutation.isPending ? "Salvando..." : (isEditing ? "SALVAR ALTERAÇÕES" : "CRIAR ESTA TURMA")}
      </button>
    </div>
  );
}
