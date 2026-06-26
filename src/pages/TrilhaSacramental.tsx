import { useParams, useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { useCatequizandos, useEncontros, useTurmas } from "@/hooks/useSupabaseData";
import { upsertCatequizando, upsertTurma } from "@/lib/supabaseStore";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Cross, CheckCircle2, Circle, ChevronDown, ChevronUp,
  AlertTriangle, Calendar, Users, FileText, BookOpen, Music,
  Heart, Baby, Star, Church, Plus, Trash2, Save, Info, Share2, Copy
} from "lucide-react";
import type { Catequizando, TrilhaSacramental as TrilhaSacramentalType, Turma } from "@/lib/store";
import { cn, getAppUrl } from "@/lib/utils";
import { QRShareModal } from "@/components/QRShareModal";

type SacramentoType = 'batismo' | 'eucaristia' | 'crisma';

const ETAPAS_PARTICIPACAO = [
  { key: "participacao_encontros", label: "Participação nos Encontros", icon: Users },
  { key: "participacao_missas", label: "Participação nas Missas", icon: Church },
  { key: "participacao_eventos", label: "Participação nos Eventos", icon: Star },
  { key: "atividades_extras", label: "Atividades Extras", icon: Plus },
] as const;

const ETAPAS_RITO = [
  { key: "reuniao_pais", label: "Reunião com os pais", icon: Heart },
  { key: "confissao", label: "Celebração penitencial - Confissão", icon: BookOpen },
  { key: "retiro", label: "Retiro Espiritual", icon: Cross },
  { key: "ensaio", label: "Ensaio do Rito", icon: Music },
  { key: "confraternizacao", label: "Confraternização", icon: Star },
] as const;

const DOCS_PADRAO = [
  { key: "documentos_rg", label: "RG (Documento de Identidade)" },
  { key: "documentos_batistério", label: "Certidão de Batismo" },
  { key: "documentos_residencia", label: "Comprovante de Residência" },
  { key: "contribuicao", label: "Contribuição / Taxas" },
] as const;

function defaultTrilha(): TrilhaSacramentalType {
  return {
    documentos_entregues: false,
    documentos_rg: false,
    "documentos_batistério": false,
    documentos_residencia: false,
    documentos_custom: [],
    contribuicao: false,
    participacao_missas: false,
    participacao_encontros: false,
    participacao_eventos: false,
    atividades_extras: false,
    observacoes: "",
  };
}

function calcFrequencia(cat: Catequizando, encontros: any[]): { percent: number; presencas: number; total: number } {
  const realizados = encontros.filter(e => e.status === "realizado");
  if (realizados.length === 0) return { percent: 0, presencas: 0, total: 0 };
  const presencas = realizados.filter(e => (e.presencas || []).includes(cat.id)).length;
  return { percent: Math.round((presencas / realizados.length) * 100), presencas, total: realizados.length };
}

function FrequenciaBar({ percent }: { percent: number }) {
  const color = percent >= 75 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${percent}%` }} />
      </div>
      <span className={cn("text-sm font-black w-12 text-right",
        percent >= 75 ? "text-emerald-600" : percent >= 50 ? "text-amber-600" : "text-red-600"
      )}>{percent}%</span>
    </div>
  );
}

function CheckItem({ checked, onToggle, label, disabled }: { checked: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 w-full text-left rounded-xl px-3 py-3 border transition-all active:scale-95 font-semibold",
        checked
          ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700"
          : "bg-white border-border/50 text-foreground/70 dark:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {checked
        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
      <span className="leading-tight text-sm md:text-base">{label}</span>
    </button>
  );
}

function ProgressRing({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const color = pct === 100 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${100.53}`}
          strokeDashoffset={`${100.53 * (1 - pct / 100)}`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
        <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="800" fill={color}>{pct}%</text>
      </svg>
    </div>
  );
}

function getTrilhaState(cat: Catequizando, sacramento: SacramentoType): TrilhaSacramentalType {
  if (cat.trilhasPorSacramento && cat.trilhasPorSacramento[sacramento]) {
    return cat.trilhasPorSacramento[sacramento];
  }
  if (sacramento === 'eucaristia' && cat.trilhaSacramental) {
    return cat.trilhaSacramental;
  }
  return defaultTrilha();
}

function CatequizandoRow({
  cat, encontros, selectedSacramento, isOpen, onToggle, onSave, saving
}: {
  cat: Catequizando;
  encontros: any[];
  selectedSacramento: SacramentoType;
  isOpen: boolean;
  onToggle: () => void;
  onSave: (updated: Catequizando) => void;
  saving: boolean;
}) {
  const [localTrilha, setLocalTrilha] = useState<TrilhaSacramentalType>(getTrilhaState(cat, selectedSacramento));
  const [newDocNome, setNewDocNome] = useState("");
  const freq = calcFrequencia(cat, encontros);

  useEffect(() => {
    setLocalTrilha(getTrilhaState(cat, selectedSacramento));
    setNewDocNome("");
  }, [cat, selectedSacramento]);

  const sacramentos = cat.dadosPastorais?.sacramentos ?? cat.sacramentos;
  const sacInfo = sacramentos?.[selectedSacramento];
  const sacramentoJaRecebido = sacInfo?.recebido === true;

  const totalEtapas = ETAPAS_PARTICIPACAO.length;
  const concluidas = ETAPAS_PARTICIPACAO.filter(e => localTrilha[e.key as keyof TrilhaSacramentalType]).length;
  const docsCustom = localTrilha.documentos_custom || [];
  const totalDocs = DOCS_PADRAO.length + docsCustom.length;
  const docsConcluidos = DOCS_PADRAO.filter(d => localTrilha[d.key as keyof TrilhaSacramentalType]).length
    + docsCustom.filter(d => d.entregue).length;

  const toggle = (key: keyof TrilhaSacramentalType) => {
    setLocalTrilha(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDocCustom = (id: string) => {
    setLocalTrilha(prev => ({
      ...prev,
      documentos_custom: (prev.documentos_custom || []).map(d => d.id === id ? { ...d, entregue: !d.entregue } : d),
    }));
  };

  const addDocCustom = () => {
    if (!newDocNome.trim()) return;
    setLocalTrilha(prev => ({
      ...prev,
      documentos_custom: [...(prev.documentos_custom || []), { id: crypto.randomUUID(), nome: newDocNome.trim(), entregue: false }],
    }));
    setNewDocNome("");
  };

  const removeDocCustom = (id: string) => {
    setLocalTrilha(prev => ({
      ...prev,
      documentos_custom: (prev.documentos_custom || []).filter(d => d.id !== id),
    }));
  };

  const handleSave = () => {
    onSave({
      ...cat,
      trilhasPorSacramento: {
        ...(cat.trilhasPorSacramento || {}),
        [selectedSacramento]: localTrilha
      }
    });
  };

  const freqAlert = freq.total > 0 && freq.percent < 75;

  return (
    <div className={cn("rounded-2xl border transition-all duration-300 overflow-hidden", isOpen ? "shadow-md" : "shadow-sm")}>
      <button
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          isOpen ? "bg-primary/5" : "bg-white dark:bg-card",
          "hover:bg-primary/5"
        )}
        onClick={onToggle}
      >
        {cat.foto
          ? <img src={cat.foto} alt={cat.nome} className="w-9 h-9 rounded-xl object-cover shrink-0 border-2 border-white shadow" />
          : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 text-primary font-black text-sm border border-primary/20">
            {cat.nome.charAt(0).toUpperCase()}
          </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground leading-tight truncate">{cat.nome}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {sacramentoJaRecebido ? (
              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-wide">
                <CheckCircle2 className="h-2.5 w-2.5" /> Sacramento já recebido
              </span>
            ) : (
              <>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {concluidas}/{totalEtapas} etapas · {docsConcluidos}/{totalDocs} docs
                </span>
                {freqAlert && (
                  <span className="flex items-center gap-0.5 text-[9px] font-black text-red-600 uppercase tracking-wide">
                    <AlertTriangle className="h-2.5 w-2.5" /> Freq. baixa
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {sacramentoJaRecebido
          ? <CheckCircle2 className="h-9 w-9 text-emerald-500 shrink-0" />
          : <ProgressRing value={concluidas} max={totalEtapas} />}
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-2 space-y-5 bg-white dark:bg-card border-t border-border/30">
          {/* Banner de Sacramento Já Recebido */}
          {sacramentoJaRecebido ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-center">
              <PartyPopper className="h-10 w-10 text-emerald-500" />
              <div>
                <p className="text-base font-black text-black uppercase tracking-wide">
                  Sacramento já recebido!
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  {selectedSacramento.charAt(0).toUpperCase() + selectedSacramento.slice(1)} registrado
                  {sacInfo?.data ? ` em ${new Date(sacInfo.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}` : " no cadastro"}
                  {sacInfo?.paroquia ? ` · ${sacInfo.paroquia}` : ""}
                </p>
              </div>
              <p className="text-xs text-emerald-600 italic">
                Caso o catequizando não tenha recebido o sacramento, remova o sacramento do cadastro do catequizando.
              </p>
            </div>
          ) : (
            <>
          <section>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <Cross className="h-4 w-4" /> Situação Sacramental (Cadastro)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "batismo", label: "Batismo" },
                { key: "eucaristia", label: "Eucaristia" },
                { key: "crisma", label: "Crisma" },
              ].map(s => {
                const sacInfoGrid = sacramentos?.[s.key as "batismo" | "eucaristia" | "crisma"];
                const recebido = sacInfoGrid?.recebido ?? false;
                return (
                  <div key={s.key} className={cn(
                    "rounded-xl border p-2 text-center",
                    recebido ? "bg-emerald-50 border-emerald-200" : "bg-muted/30 border-border/50"
                  )}>
                    {recebido
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
                      : <Circle className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />}
                    <p className="text-xs font-black uppercase text-foreground">{s.label}</p>
                    {recebido && sacInfoGrid?.data && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(sacInfoGrid.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Controle de Frequência
            </h4>
            {freq.total === 0 ? (
              <p className="text-sm md:text-base text-muted-foreground italic">Nenhum encontro realizado ainda.</p>
            ) : (
              <div className="space-y-2">
                <FrequenciaBar percent={freq.percent} />
                <p className="text-xs md:text-sm text-muted-foreground">
                  {freq.presencas} presenças de {freq.total} encontros realizados
                </p>
                {freqAlert && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-red-700 leading-snug">
                      Frequência abaixo de 75%. Considere contato com o responsável.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-1.5">
              <Star className="h-4 w-4" /> Etapas de Participação ({selectedSacramento})
            </h4>
            <div className="space-y-2">
              {ETAPAS_PARTICIPACAO.map(etapa => (
                <CheckItem
                  key={etapa.key}
                  checked={!!localTrilha[etapa.key as keyof TrilhaSacramentalType]}
                  onToggle={() => toggle(etapa.key as keyof TrilhaSacramentalType)}
                  label={etapa.label}
                />
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-violet-600 mb-3 flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Documentos Necessários ({selectedSacramento})
            </h4>
            <div className="space-y-2">
              {DOCS_PADRAO.map(doc => (
                <CheckItem
                  key={doc.key}
                  checked={!!localTrilha[doc.key as keyof TrilhaSacramentalType]}
                  onToggle={() => toggle(doc.key as keyof TrilhaSacramentalType)}
                  label={doc.label}
                />
              ))}
              {(localTrilha.documentos_custom || []).map(doc => (
                <div key={doc.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <CheckItem
                      checked={doc.entregue}
                      onToggle={() => toggleDocCustom(doc.id)}
                      label={doc.nome}
                    />
                  </div>
                  <button
                    onClick={() => removeDocCustom(doc.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 border border-red-100 shrink-0 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newDocNome}
                    onChange={e => setNewDocNome(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addDocCustom()}
                    placeholder="Adicionar documento..."
                    className="flex-1 h-10 px-3 rounded-xl text-sm border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={addDocCustom}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 shrink-0 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-muted-foreground mb-2">Observações ({selectedSacramento})</h4>
            <textarea
              value={localTrilha.observacoes ?? ""}
              onChange={e => setLocalTrilha(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Anotações adicionais sobre este catequizando nesta trilha..."
              className="w-full h-20 px-3 py-3 rounded-xl text-sm border border-border/60 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
          >
            <Save className="h-5 w-5" />
            {saving ? "Salvando..." : "Salvar Trilha"}
          </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function TrilhaSacramental() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: turmas = [] } = useTurmas();
  const { data: catequizandos = [], isLoading } = useCatequizandos(id);
  const { data: encontros = [] } = useEncontros(id);

  const turma = turmas.find(t => t.id === id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  const [selectedSacramento, setSelectedSacramento] = useState<SacramentoType>('eucaristia');
  const [initializedSelection, setInitializedSelection] = useState(false);
  const [shareRitoOpen, setShareRitoOpen] = useState(false);

  const configAba = turma?.trilhasConfig?.[selectedSacramento] || {
    dataCelebracao: (selectedSacramento === 'eucaristia' && turma?.dataCelebracaoSacramento) ? turma.dataCelebracaoSacramento : undefined,
    etapasRito: (selectedSacramento === 'eucaristia' && turma?.etapasRito) ? turma.etapasRito : undefined
  };

  const [editandoData, setEditandoData] = useState(false);
  const [dataValue, setDataValue] = useState(configAba.dataCelebracao ?? "");
  const [savingData, setSavingData] = useState(false);
  const [busca, setBusca] = useState("");
  const [ritoOpen, setRitoOpen] = useState(false);

  useEffect(() => {
    if (turma && !initializedSelection) {
      let nearest: SacramentoType = 'eucaristia';
      let nearestDiff = Infinity;
      const today = new Date().getTime();

      const options: SacramentoType[] = ['batismo', 'eucaristia', 'crisma'];

      for (const sac of options) {
        let dateStr = turma.trilhasConfig?.[sac]?.dataCelebracao;
        if (sac === 'eucaristia' && !dateStr && turma.dataCelebracaoSacramento) {
            dateStr = turma.dataCelebracaoSacramento;
        }

        if (dateStr) {
          const time = new Date(dateStr + "T00:00:00").getTime();
          const diff = time - today;
          if (diff >= 0 && diff < nearestDiff) {
            nearestDiff = diff;
            nearest = sac;
          } else if (nearestDiff === Infinity) {
             nearest = sac;
          }
        }
      }
      setSelectedSacramento(nearest);
      setInitializedSelection(true);
    }
  }, [turma, initializedSelection]);

  useEffect(() => {
    setDataValue(configAba.dataCelebracao ?? "");
    setEditandoData(false);
  }, [selectedSacramento, configAba.dataCelebracao]);

  const catFiltrados = useMemo(() =>
    catequizandos
      .filter(c => c.status === "ativo" || c.status === "inscrito" || !c.status)
      .filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())),
    [catequizandos, busca]
  );

  const stats = useMemo(() => {
    const total = catFiltrados.length;
    let totalEtapasConcluidas = 0;
    let freqBaixa = 0;
    catFiltrados.forEach(cat => {
      const t = getTrilhaState(cat, selectedSacramento);
      totalEtapasConcluidas += ETAPAS_PARTICIPACAO.filter(e => t[e.key as keyof TrilhaSacramentalType]).length;
      const freq = calcFrequencia(cat, encontros);
      if (freq.total > 0 && freq.percent < 75) freqBaixa++;
    });
    const maxEtapas = total * ETAPAS_PARTICIPACAO.length;
    return { total, etapasPercent: maxEtapas === 0 ? 0 : Math.round((totalEtapasConcluidas / maxEtapas) * 100), freqBaixa };
  }, [catFiltrados, encontros, selectedSacramento]);

  const handleSaveCat = async (updated: Catequizando) => {
    setSavingId(updated.id);
    try {
      await upsertCatequizando(updated);
      queryClient.invalidateQueries({ queryKey: ["catequizandos", id] });
      toast.success("Trilha salva com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveData = async () => {
    if (!turma) return;
    setSavingData(true);
    try {
      const updatedConfig = {
        ...(turma.trilhasConfig || {}),
        [selectedSacramento]: {
          ...(turma.trilhasConfig?.[selectedSacramento] || {}),
          dataCelebracao: dataValue || undefined
        }
      };
      
      const payload: Turma = { ...turma, trilhasConfig: updatedConfig };
      if (selectedSacramento === 'eucaristia') {
          payload.dataCelebracaoSacramento = dataValue || undefined;
      }

      await upsertTurma(payload);
      queryClient.invalidateQueries({ queryKey: ["turmas"] });
      toast.success(`Data da celebração para ${selectedSacramento} salva!`);
      setEditandoData(false);
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSavingData(false);
    }
  };

  const handleSaveEtapaRito = async (etapaKey: string, newVal: string) => {
    if (!turma) return;
    try {
        const sacConfig = turma.trilhasConfig?.[selectedSacramento] || {};
        const legacyEtapas = (selectedSacramento === 'eucaristia' ? turma.etapasRito : undefined) || {};
        
        const mergedEtapasRito = { ...(sacConfig.etapasRito || legacyEtapas), [etapaKey]: newVal };

        const updatedConfig = {
            ...(turma.trilhasConfig || {}),
            [selectedSacramento]: {
            ...sacConfig,
            etapasRito: mergedEtapasRito
            }
        };

        const payload: Turma = { ...turma, trilhasConfig: updatedConfig };
        if (selectedSacramento === 'eucaristia') {
            payload.etapasRito = mergedEtapasRito;
        }

        await upsertTurma(payload);
        queryClient.invalidateQueries({ queryKey: ["turmas"] });
        toast.success(`Etapa atualizada!`);
    } catch (err: any) {
        toast.error("Erro ao salvar: " + err.message);
    }
  };

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      <div className="flex items-center gap-3 pt-4">
        <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn shrink-0">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div className="flex-1 text-center pr-10">
          <h1 className="text-lg font-black text-foreground tracking-tight uppercase leading-tight">
            Trilha Sacramental
          </h1>
          {turma && <p className="text-xs text-muted-foreground font-medium">{turma.nome} · {turma.ano}</p>}
        </div>
      </div>

      <div className="flex bg-muted/50 p-1.5 rounded-2xl gap-1 overflow-x-auto hide-scrollbar">
          {[
            { key: 'batismo', label: 'Batismo' },
            { key: 'eucaristia', label: 'Eucaristia' },
            { key: 'crisma', label: 'Crisma' },
          ].map(s => (
            <button
                key={s.key}
                onClick={() => { setSelectedSacramento(s.key as SacramentoType); setOpenId(null); }}
                className={cn(
                    "flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300",
                    selectedSacramento === s.key 
                        ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
            >
                {s.label}
            </button>
          ))}
      </div>

      <div className="float-card p-4 bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/10 dark:to-background border-violet-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-600 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Data da Celebração ({selectedSacramento})</p>
          </div>
          {!editandoData && (
            <button
              onClick={() => { setEditandoData(true); setDataValue(configAba.dataCelebracao ?? ""); }}
              className="text-[9px] font-black uppercase tracking-wider text-violet-600 hover:text-violet-800 transition-colors"
            >
              {configAba.dataCelebracao ? "Alterar" : "Definir"}
            </button>
          )}
        </div>
        {editandoData ? (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dataValue}
              onChange={e => setDataValue(e.target.value)}
              className="flex-1 h-9 px-3 rounded-xl text-sm border border-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={handleSaveData}
              disabled={savingData}
              className="px-4 h-9 rounded-xl bg-violet-600 text-white text-xs font-black uppercase hover:bg-violet-700 transition-colors disabled:opacity-60"
            >
              {savingData ? "..." : "Salvar"}
            </button>
            <button onClick={() => setEditandoData(false)} className="text-xs text-muted-foreground">Cancelar</button>
          </div>
        ) : (
          <p className={cn("text-sm font-black", configAba.dataCelebracao ? "text-violet-800" : "text-muted-foreground italic")}>
            {configAba.dataCelebracao
              ? new Date(configAba.dataCelebracao + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
              : `Nenhuma data definida para ${selectedSacramento}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="float-card p-3 text-center">
          <p className="text-xl font-black text-primary">{stats.total}</p>
          <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Catequizandos</p>
        </div>
        <div className="float-card p-3 text-center">
          <p className="text-xl font-black text-emerald-600">{stats.etapasPercent}%</p>
          <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Etapas OK ({selectedSacramento})</p>
        </div>
        <div className={cn("float-card p-3 text-center", stats.freqBaixa > 0 && "border-red-200 bg-red-50/50")}>
          <p className={cn("text-xl font-black", stats.freqBaixa > 0 ? "text-red-600" : "text-foreground")}>{stats.freqBaixa}</p>
          <p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Freq. Baixa</p>
        </div>
      </div>

      {turma && (
        <div className="float-card bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 overflow-hidden">
          <button
            onClick={() => setRitoOpen(!ritoOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-amber-700 text-left">
                Etapas de Preparação do Rito ({selectedSacramento})
              </h2>
            </div>
            {ritoOpen ? <ChevronUp className="h-5 w-5 text-amber-700 shrink-0" /> : <ChevronDown className="h-5 w-5 text-amber-700 shrink-0" />}
          </button>
          
          {ritoOpen && (
            <div className="p-4 pt-0 space-y-3">
              {ETAPAS_RITO.map(etapa => {
                const Icon = etapa.icon;
                const dateVal = configAba.etapasRito?.[etapa.key] || "";
                return (
                  <div key={etapa.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-card border border-amber-100">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-5 w-5 text-amber-600 shrink-0" />
                      <span className="text-sm md:text-base font-semibold text-foreground">{etapa.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateVal}
                        onChange={(e) => handleSaveEtapaRito(etapa.key, e.target.value)}
                        className="h-10 px-3 w-full sm:w-auto rounded-lg text-sm border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/30"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Botão de Compartilhamento do Rito */}
              {turma.codigoAcesso && (
                <button
                  onClick={() => setShareRitoOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white text-sm font-black hover:bg-amber-600 active:scale-95 transition-all mt-1"
                >
                  <Share2 className="h-4 w-4" />
                  Compartilhar Etapas com os Pais
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de Compartilhamento do Rito com QR Code */}
      {turma?.codigoAcesso && (() => {
        const ritoUrl = `${getAppUrl()}/rito-sacramental/${turma.codigoAcesso}/${selectedSacramento}`;
        return (
          <QRShareModal
            open={shareRitoOpen}
            onClose={() => setShareRitoOpen(false)}
            url={ritoUrl}
            title="Compartilhar Etapas do Rito"
            description={
              <>
                Pais e responsáveis podem ver as datas de preparação para o rito de <strong className="text-amber-700 capitalize">{selectedSacramento}</strong> pelo link ou QR Code abaixo.
              </>
            }
            accentColor="bg-amber-500"
            shareTitle={`Preparação para ${selectedSacramento}`}
            shareText={`Confira as datas de preparação para o rito de ${selectedSacramento}:`}
          />
        );
      })()}

      <input
        type="text"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="Buscar catequizando..."
        className="w-full h-10 px-4 rounded-2xl text-sm border border-border/60 bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />)}
        </div>
      ) : catFiltrados.length === 0 ? (
        <div className="text-center py-10">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum catequizando encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {catFiltrados.map(cat => (
            <CatequizandoRow
              key={cat.id}
              cat={cat}
              encontros={encontros}
              selectedSacramento={selectedSacramento}
              isOpen={openId === cat.id}
              onToggle={() => setOpenId(openId === cat.id ? null : cat.id)}
              onSave={handleSaveCat}
              saving={savingId === cat.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
