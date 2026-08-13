import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useAtividades, useCatequizandos, useAtividadeMutation, useEncontroMutation, useReunioes, useTurmaMutation } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, ListChecks, MapPin, Users, CheckCircle2, Clock, Calendar, Pencil, Share2, Target, Check, X, Plus, BarChart3, GitBranch, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente, getAppUrl, cn } from "@/lib/utils";
import { toast } from "sonner";
import { QRShareModal } from "@/components/QRShareModal";

// ─────────────────────────────────────────────────────────────
// TYPES — Painel Estratégico
// ─────────────────────────────────────────────────────────────
interface MetaItem {
  id: string;
  texto: string;
  dataInicio?: string;
  dataFim?: string;
  concluida?: boolean;
}

interface PainelTempo {
  tempoId: 'tempo1' | 'tempo2' | 'tempo3' | 'tempo4';
  proposito: string;
  objetivos: string;
  metas: MetaItem[];
}

interface PainelEstrategico {
  version: 2;
  paineis: PainelTempo[];
}

// ─────────────────────────────────────────────────────────────
// TEMPOS CONFIG
// ─────────────────────────────────────────────────────────────
const TEMPOS_PAINEL = [
  {
    id: 'tempo1' as const,
    label: 'Pré-Catecumenato',
    sublabel: '1º Tempo — Querigma',
    emoji: '🔥',
    border: 'border-amber-300',
    headerBg: 'bg-amber-500',
    textColor: 'text-amber-700',
    badgeBg: 'bg-amber-100',
    inputBorder: 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/20',
    propositoColor: 'text-amber-700',
    objetivoColor: 'text-orange-600',
    metaColor: 'text-red-600',
  },
  {
    id: 'tempo2' as const,
    label: 'Catecumenato',
    sublabel: '2º Tempo — Aprofundamento',
    emoji: '📖',
    border: 'border-sky-300',
    headerBg: 'bg-sky-500',
    textColor: 'text-sky-700',
    badgeBg: 'bg-sky-100',
    inputBorder: 'border-sky-300 focus:border-sky-500 focus:ring-sky-500/20',
    propositoColor: 'text-sky-700',
    objetivoColor: 'text-blue-600',
    metaColor: 'text-indigo-600',
  },
  {
    id: 'tempo3' as const,
    label: 'Purificação e Iluminação',
    sublabel: '3º Tempo — Preparação',
    emoji: '💜',
    border: 'border-violet-300',
    headerBg: 'bg-violet-500',
    textColor: 'text-violet-700',
    badgeBg: 'bg-violet-100',
    inputBorder: 'border-violet-300 focus:border-violet-500 focus:ring-violet-500/20',
    propositoColor: 'text-violet-700',
    objetivoColor: 'text-purple-600',
    metaColor: 'text-fuchsia-600',
  },
  {
    id: 'tempo4' as const,
    label: 'Mistagogia',
    sublabel: '4º Tempo — Envio Missionário',
    emoji: '🕊️',
    border: 'border-emerald-300',
    headerBg: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100',
    inputBorder: 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20',
    propositoColor: 'text-emerald-700',
    objetivoColor: 'text-teal-600',
    metaColor: 'text-green-700',
  },
] as const;

type TempoCfg = typeof TEMPOS_PAINEL[number];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function parsePainelEstrategico(raw?: string): PainelEstrategico {
  if (!raw) return criarPainelVazio();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version === 2 && Array.isArray(parsed.paineis)) {
      return parsed as PainelEstrategico;
    }
    // Legacy plain text → preserve in tempo1
    return {
      version: 2,
      paineis: TEMPOS_PAINEL.map((t, i) => ({
        tempoId: t.id,
        proposito: i === 0 ? raw : '',
        objetivos: '',
        metas: [],
      })),
    };
  } catch {
    return criarPainelVazio();
  }
}

function criarPainelVazio(): PainelEstrategico {
  return {
    version: 2,
    paineis: TEMPOS_PAINEL.map(t => ({
      tempoId: t.id,
      proposito: '',
      objetivos: '',
      metas: [],
    })),
  };
}

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getMetaStatus(meta: MetaItem): 'sem_data' | 'em_dia' | 'vencendo' | 'atrasada' | 'concluida' {
  if (meta.concluida) return 'concluida';
  if (!meta.dataFim) return 'sem_data';
  const hoje = new Date();
  const fim = new Date(meta.dataFim + 'T23:59:59');
  const dias = Math.ceil((fim.getTime() - hoje.getTime()) / 86400000);
  if (dias < 0) return 'atrasada';
  if (dias <= 7) return 'vencendo';
  return 'em_dia';
}

function fmtDate(d?: string) {
  if (!d) return '---';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ─────────────────────────────────────────────────────────────
// META STATUS BADGE
// ─────────────────────────────────────────────────────────────
function MetaStatusBadge({ status }: { status: ReturnType<typeof getMetaStatus> }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    sem_data:  { label: 'Sem prazo',    cls: 'bg-muted text-muted-foreground' },
    em_dia:    { label: 'Em dia',       cls: 'bg-emerald-100 text-emerald-700' },
    vencendo:  { label: 'Vencendo',     cls: 'bg-amber-100 text-amber-700' },
    atrasada:  { label: 'Atrasada',     cls: 'bg-red-100 text-red-700' },
    concluida: { label: 'Concluída ✓',  cls: 'bg-emerald-500 text-white' },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0', cls)}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// GANTT CHART
// ─────────────────────────────────────────────────────────────
function GanttChart({ painel }: { painel: PainelEstrategico }) {
  const allMetas = painel.paineis.flatMap(p => {
    const tc = TEMPOS_PAINEL.find(t => t.id === p.tempoId)!;
    return p.metas
      .filter(m => m.dataInicio && m.dataFim)
      .map(m => ({ ...m, emoji: tc.emoji, headerBg: tc.headerBg }));
  });

  if (allMetas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">Defina datas início e fim nas metas para ver o cronograma</p>
      </div>
    );
  }

  const datas = allMetas.flatMap(m => [new Date(m.dataInicio! + 'T00:00:00'), new Date(m.dataFim! + 'T00:00:00')]);
  const minDate = new Date(Math.min(...datas.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...datas.map(d => d.getTime())));
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86400000);
  const hoje = new Date();
  const hojeOff = Math.min(100, Math.max(0, (hoje.getTime() - minDate.getTime()) / 86400000 / totalDays * 100));

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-1">
        <span>{fmtDate(minDate.toISOString().slice(0, 10))}</span>
        <span>{fmtDate(maxDate.toISOString().slice(0, 10))}</span>
      </div>
      <div className="space-y-2 relative mt-5">
        <div className="absolute top-0 bottom-0 w-px bg-red-500/70 z-10 pointer-events-none" style={{ left: `${hojeOff}%` }}>
          <span className="absolute -top-4 left-1 text-[8px] font-black text-red-500 uppercase whitespace-nowrap">Hoje</span>
        </div>
        {allMetas.map(meta => {
          const s = new Date(meta.dataInicio! + 'T00:00:00');
          const e = new Date(meta.dataFim! + 'T00:00:00');
          const left = (s.getTime() - minDate.getTime()) / 86400000 / totalDays * 100;
          const width = Math.max(3, (e.getTime() - s.getTime()) / 86400000 / totalDays * 100);
          const st = getMetaStatus(meta);
          const barCls = meta.concluida ? 'bg-emerald-500' : st === 'atrasada' ? 'bg-red-400' : st === 'vencendo' ? 'bg-amber-400' : 'bg-primary/70';
          return (
            <div key={meta.id} className="relative h-7">
              <div className="absolute inset-0 bg-muted/40 rounded-full" />
              <div className={cn('absolute top-1 bottom-1 rounded-full flex items-center px-2 overflow-hidden', barCls)} style={{ left: `${left}%`, width: `${width}%` }}>
                <span className="text-[8px] font-black text-white truncate whitespace-nowrap">{meta.emoji} {meta.texto}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-muted-foreground text-center pt-1">Linha vermelha = hoje</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ORGANOGRAM
// ─────────────────────────────────────────────────────────────
function Organograma({ painel }: { painel: PainelEstrategico }) {
  const preenchidos = painel.paineis.filter(p => p.proposito || p.objetivos || p.metas.length > 0);
  if (preenchidos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <GitBranch className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">Preencha o painel para ver o organograma</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/30">
          🎯 Plano Estratégico
        </div>
      </div>
      <div className="flex justify-center"><div className="w-px h-4 bg-primary/40" /></div>
      <div className="space-y-4">
        {preenchidos.map(p => {
          const tc = TEMPOS_PAINEL.find(t => t.id === p.tempoId)!;
          return (
            <div key={p.tempoId} className={cn('rounded-2xl border-2 p-3', tc.border)}>
              <div className={cn('flex items-center gap-2 mb-3 px-2 py-1.5 rounded-xl', tc.badgeBg)}>
                <span className="text-base">{tc.emoji}</span>
                <div>
                  <p className={cn('text-[10px] font-black uppercase tracking-widest', tc.textColor)}>{tc.label}</p>
                  <p className={cn('text-[9px] font-semibold opacity-70', tc.textColor)}>{tc.sublabel}</p>
                </div>
              </div>
              <div className="space-y-2 pl-2">
                {p.proposito && (
                  <div className="flex gap-2 items-start">
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', tc.headerBg)} />
                    <div>
                      <p className={cn('text-[9px] font-black uppercase tracking-widest', tc.propositoColor)}>Propósito</p>
                      <p className="text-xs text-foreground/80 leading-snug">{p.proposito}</p>
                    </div>
                  </div>
                )}
                {p.objetivos && (
                  <div className="flex gap-2 items-start">
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-70', tc.headerBg)} />
                    <div>
                      <p className={cn('text-[9px] font-black uppercase tracking-widest', tc.objetivoColor)}>Objetivos</p>
                      <p className="text-xs text-foreground/80 leading-snug">{p.objetivos}</p>
                    </div>
                  </div>
                )}
                {p.metas.length > 0 && (
                  <div className="flex gap-2 items-start">
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-50', tc.headerBg)} />
                    <div className="w-full">
                      <p className={cn('text-[9px] font-black uppercase tracking-widest mb-1', tc.metaColor)}>Metas ({p.metas.length})</p>
                      <div className="space-y-1">
                        {p.metas.map(m => (
                          <div key={m.id} className="flex items-center justify-between gap-2 bg-background/60 rounded-lg px-2 py-1">
                            <span className="text-[10px] text-foreground/80 leading-tight">{m.texto}</span>
                            <MetaStatusBadge status={getMetaStatus(m)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TEMPO EDITOR (form mode)
// ─────────────────────────────────────────────────────────────
function PainelTempoEditor({ painelData, tempo, onChange }: {
  painelData: PainelTempo;
  tempo: TempoCfg;
  onChange: (u: PainelTempo) => void;
}) {
  const addMeta = () => onChange({
    ...painelData,
    metas: [...painelData.metas, { id: gerarId(), texto: '', dataInicio: '', dataFim: '', concluida: false }],
  });

  const updateMeta = (id: string, field: keyof MetaItem, value: string | boolean) =>
    onChange({ ...painelData, metas: painelData.metas.map(m => m.id === id ? { ...m, [field]: value } : m) });

  const removeMeta = (id: string) =>
    onChange({ ...painelData, metas: painelData.metas.filter(m => m.id !== id) });

  return (
    <div className="space-y-5">
      {/* Propósito */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', tempo.headerBg)} />
          <label className={cn('text-[10px] font-black uppercase tracking-widest', tempo.propositoColor)}>Propósito do Tempo</label>
        </div>
        <textarea
          value={painelData.proposito}
          onChange={e => onChange({ ...painelData, proposito: e.target.value })}
          placeholder={`Ex: Despertar o kerigma e o encontro pessoal com Cristo no ${tempo.label}...`}
          className={cn('w-full form-input min-h-[72px] resize-none text-sm leading-relaxed bg-background/80', tempo.inputBorder)}
        />
      </div>

      {/* Objetivos */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full opacity-70', tempo.headerBg)} />
          <label className={cn('text-[10px] font-black uppercase tracking-widest', tempo.objetivoColor)}>Objetivos do Ciclo</label>
        </div>
        <textarea
          value={painelData.objetivos}
          onChange={e => onChange({ ...painelData, objetivos: e.target.value })}
          placeholder="Ex: Conduzir os catequizandos a uma experiência de fé viva e comprometida..."
          className={cn('w-full form-input min-h-[72px] resize-none text-sm leading-relaxed bg-background/80', tempo.inputBorder)}
        />
      </div>

      {/* Metas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full opacity-50', tempo.headerBg)} />
            <label className={cn('text-[10px] font-black uppercase tracking-widest', tempo.metaColor)}>Metas Práticas</label>
          </div>
          <button type="button" onClick={addMeta}
            className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95', tempo.badgeBg, tempo.textColor)}>
            <Plus className="h-3 w-3" /> Adicionar Meta
          </button>
        </div>

        {painelData.metas.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Nenhuma meta definida. Clique em <strong>Adicionar Meta</strong> para começar.</p>
          </div>
        )}

        <div className="space-y-3">
          {painelData.metas.map((meta, idx) => (
            <div key={meta.id} className={cn('rounded-2xl border-2 p-4 space-y-3 animate-fade-in bg-background/60', tempo.border)}>
              <div className="flex items-center justify-between">
                <span className={cn('text-[9px] font-black uppercase tracking-widest', tempo.metaColor)}>Meta #{idx + 1}</span>
                <button type="button" onClick={() => removeMeta(meta.id)} className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <input type="text" value={meta.texto} onChange={e => updateMeta(meta.id, 'texto', e.target.value)}
                placeholder="Ex: 80% de presença nos encontros do tempo..." className={cn('w-full form-input text-sm bg-background/80', tempo.inputBorder)} />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" /> Início
                  </label>
                  <input type="date" value={meta.dataInicio || ''} onChange={e => updateMeta(meta.id, 'dataInicio', e.target.value)}
                    className={cn('w-full form-input text-xs bg-background/80', tempo.inputBorder)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" /> Prazo Final
                  </label>
                  <input type="date" value={meta.dataFim || ''} onChange={e => updateMeta(meta.id, 'dataFim', e.target.value)}
                    className={cn('w-full form-input text-xs bg-background/80', tempo.inputBorder)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Meta Concluída</span>
                <button type="button" onClick={() => updateMeta(meta.id, 'concluida', !meta.concluida)}
                  className={cn('relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0', meta.concluida ? 'bg-emerald-500' : 'bg-muted')}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200" style={{ left: meta.concluida ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TEMPO VIEWER (read mode)
// ─────────────────────────────────────────────────────────────
function PainelTempoViewer({ painelData, tempo }: { painelData: PainelTempo; tempo: TempoCfg }) {
  const empty = !painelData.proposito && !painelData.objetivos && painelData.metas.length === 0;
  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <span className="text-3xl">{tempo.emoji}</span>
        <p className="text-xs text-muted-foreground font-medium">Nenhum planejamento definido para o {tempo.label}.</p>
        <p className="text-[10px] text-muted-foreground/60">Clique no ícone de lápis para adicionar.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {painelData.proposito && (
        <div className={cn('rounded-2xl border-2 p-4 relative overflow-hidden', tempo.border)}>
          <p className={cn('text-[9px] font-black uppercase tracking-widest mb-2', tempo.propositoColor)}>✦ Propósito</p>
          <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap font-medium">{painelData.proposito}</p>
        </div>
      )}
      {painelData.objetivos && (
        <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
          <p className={cn('text-[9px] font-black uppercase tracking-widest mb-2', tempo.objetivoColor)}>◆ Objetivos do Ciclo</p>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{painelData.objetivos}</p>
        </div>
      )}
      {painelData.metas.length > 0 && (
        <div className="space-y-2">
          <p className={cn('text-[9px] font-black uppercase tracking-widest', tempo.metaColor)}>▸ Metas Práticas</p>
          {painelData.metas.map(meta => {
            const st = getMetaStatus(meta);
            return (
              <div key={meta.id} className={cn('rounded-xl border p-3 flex flex-col gap-2',
                meta.concluida ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10'
                : st === 'atrasada' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10'
                : st === 'vencendo' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10'
                : 'border-border/50 bg-background/60')}>
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm font-semibold leading-snug flex-1', meta.concluida && 'line-through text-muted-foreground')}>{meta.texto}</p>
                  <MetaStatusBadge status={st} />
                </div>
                {(meta.dataInicio || meta.dataFim) && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {meta.dataInicio && <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold"><Calendar className="h-2.5 w-2.5" />Início: {fmtDate(meta.dataInicio)}</span>}
                    {meta.dataFim && <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold"><Clock className="h-2.5 w-2.5" />Prazo: {fmtDate(meta.dataFim)}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAINEL ESTRATÉGICO — Main component
// ─────────────────────────────────────────────────────────────
function PainelEstrategicoComponent({ turma, onSave, isSaving }: {
  turma: any; onSave: (json: string) => void; isSaving: boolean;
}) {
  const painel = useMemo(() => parsePainelEstrategico(turma?.proposito), [turma?.proposito]);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PainelEstrategico>(painel);
  const [activeTempoId, setActiveTempoId] = useState<string>('tempo1');
  const [viewMode, setViewMode] = useState<'painel' | 'organograma' | 'cronograma'>('painel');

  const handleOpenEdit = () => { setEditData(parsePainelEstrategico(turma?.proposito)); setIsEditing(true); };
  const handleSave = () => { onSave(JSON.stringify({ ...editData, version: 2 })); setIsEditing(false); };
  const handleUpdateTempo = (updated: PainelTempo) =>
    setEditData(prev => ({ ...prev, paineis: prev.paineis.map(p => p.tempoId === updated.tempoId ? updated : p) }));

  const totalMetas = painel.paineis.reduce((a, p) => a + p.metas.length, 0);
  const metasConcluidas = painel.paineis.reduce((a, p) => a + p.metas.filter(m => m.concluida).length, 0);
  const temposPreenchidos = painel.paineis.filter(p => p.proposito || p.objetivos || p.metas.length > 0).length;
  const hasData = temposPreenchidos > 0;

  const activeTempoCfg = TEMPOS_PAINEL.find(t => t.id === activeTempoId)!;
  const activeViewData = painel.paineis.find(p => p.tempoId === activeTempoId);
  const activeEditData = editData.paineis.find(p => p.tempoId === activeTempoId)!;

  return (
    <div className="rounded-3xl border-2 border-primary/20 bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden animate-float-up stagger-2">
      {/* Decorative bg */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.03] pointer-events-none">
        <Target className="w-full h-full text-primary" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-5 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Painel Estratégico</h3>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Propósitos · Objetivos · Metas por Tempo IVC</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasData && !isEditing && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded-xl">
                <span className="text-[9px] font-black text-primary">{metasConcluidas}/{totalMetas}</span>
                <span className="text-[9px] text-muted-foreground font-semibold">metas</span>
              </div>
            )}
            {!isEditing && (
              <button onClick={handleOpenEdit} className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all hover:scale-110 active:scale-95">
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {hasData && !isEditing && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
              <span>{temposPreenchidos} de 4 tempos planejados</span>
              {totalMetas > 0 && <span>{Math.round((metasConcluidas / totalMetas) * 100)}% metas concluídas</span>}
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000" style={{ width: `${(temposPreenchidos / 4) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative z-10 p-5">
        {isEditing ? (
          /* ─── EDIT MODE ─── */
          <div className="space-y-5">
            {/* Tempo selector */}
            <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-muted/50 rounded-2xl">
              {TEMPOS_PAINEL.map(tc => (
                <button key={tc.id} type="button" onClick={() => setActiveTempoId(tc.id)}
                  className={cn('flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all',
                    activeTempoId === tc.id ? cn('shadow-sm text-white font-black', tc.headerBg) : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10')}>
                  <span className="text-lg">{tc.emoji}</span>
                  <span className="text-[8px] font-black uppercase tracking-tight leading-tight">{tc.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active tempo label */}
            <div className={cn('px-3 py-2 rounded-xl border-l-4 flex items-center gap-2', activeTempoCfg.border)}>
              <span className="text-xl">{activeTempoCfg.emoji}</span>
              <div>
                <p className={cn('text-xs font-black uppercase tracking-widest', activeTempoCfg.textColor)}>{activeTempoCfg.label}</p>
                <p className="text-[10px] text-muted-foreground">{activeTempoCfg.sublabel}</p>
              </div>
            </div>

            <PainelTempoEditor painelData={activeEditData} tempo={activeTempoCfg} onChange={handleUpdateTempo} />

            <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">Cancelar</button>
              <button type="button" onClick={handleSave} disabled={isSaving}
                className="px-5 py-2 text-xs font-black bg-primary text-primary-foreground rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {isSaving ? 'Salvando...' : 'Salvar Painel'}
              </button>
            </div>
          </div>
        ) : (
          /* ─── VIEW MODE ─── */
          <div className="space-y-4">
            {/* View mode switcher */}
            {hasData && (
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-xl">
                {[
                  { key: 'painel',       Icon: Target,    label: 'Painel' },
                  { key: 'organograma',  Icon: GitBranch, label: 'Organograma' },
                  { key: 'cronograma',   Icon: BarChart3,  label: 'Cronograma' },
                ].map(({ key, Icon, label }) => (
                  <button key={key} type="button" onClick={() => setViewMode(key as any)}
                    className={cn('flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all',
                      viewMode === key ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                    <Icon className="h-3 w-3" />{label}
                  </button>
                ))}
              </div>
            )}

            {/* Painel view */}
            {viewMode === 'painel' && (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {TEMPOS_PAINEL.map(tc => {
                    const tData = painel.paineis.find(p => p.tempoId === tc.id);
                    const filled = tData && (tData.proposito || tData.objetivos || tData.metas.length > 0);
                    return (
                      <button key={tc.id} type="button" onClick={() => setActiveTempoId(tc.id)}
                        className={cn('flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center transition-all border-2 relative',
                          activeTempoId === tc.id ? cn('border-current shadow-md text-white font-black', tc.headerBg) : 'border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/60')}>
                        <span className="text-lg">{tc.emoji}</span>
                        <span className="text-[8px] font-black uppercase tracking-tight leading-tight">{tc.label.split(' ')[0]}</span>
                        {filled && <div className={cn('absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900', tc.headerBg)} />}
                      </button>
                    );
                  })}
                </div>

                <div className={cn('rounded-2xl border-2 p-4', activeTempoCfg.border)}>
                  <div className={cn('flex items-center gap-2 mb-4 px-2 py-1.5 rounded-xl', activeTempoCfg.badgeBg)}>
                    <span className="text-base">{activeTempoCfg.emoji}</span>
                    <div>
                      <p className={cn('text-[10px] font-black uppercase tracking-widest', activeTempoCfg.textColor)}>{activeTempoCfg.label}</p>
                      <p className={cn('text-[9px] font-semibold opacity-70', activeTempoCfg.textColor)}>{activeTempoCfg.sublabel}</p>
                    </div>
                  </div>
                  {activeViewData
                    ? <PainelTempoViewer painelData={activeViewData} tempo={activeTempoCfg} />
                    : <p className="text-xs text-muted-foreground text-center py-4">Sem dados para este tempo.</p>}
                </div>
              </div>
            )}

            {viewMode === 'organograma' && (
              <div className="rounded-2xl border border-border/50 p-4 bg-muted/10">
                <div className="flex items-center gap-2 mb-4">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Organograma Estratégico</h4>
                </div>
                <Organograma painel={painel} />
              </div>
            )}

            {viewMode === 'cronograma' && (
              <div className="rounded-2xl border border-border/50 p-4 bg-muted/10">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-widest">Cronograma de Prazos</h4>
                </div>
                <GanttChart painel={painel} />
              </div>
            )}

            {!hasData && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary/40" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground/70">Painel Estratégico vazio</p>
                  <p className="text-xs text-muted-foreground mt-1">Clique no lápis para definir propósitos, objetivos e metas por Tempo do IVC.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TIMELINE TYPES
// ─────────────────────────────────────────────────────────────
type TimelineItem = {
  id: string; tipo: 'encontro' | 'atividade' | 'reuniao';
  titulo: string; subtitulo: string; data: string;
  color: string; status?: string; presencas: string[]; itemOriginal: any;
};
const statusColors: Record<string, string> = {
  pendente: 'bg-primary', realizado: 'bg-success', transferido: 'bg-caution', cancelado: 'bg-destructive'
};

// ─────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function PlanoTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros(id);
  const { data: atividades = [], isLoading: aLoading } = useAtividades(id);
  const { data: reunioes = [], isLoading: rLoading } = useReunioes(id);
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos(id);
  const turma = turmas.find(t => t.id === id);

  const [activeFilter, setActiveFilter] = useState<'all' | 'encontro' | 'atividade' | 'reuniao'>('all');
  const [viewItem, setViewItem] = useState<TimelineItem | null>(null);
  const [presencaOpen, setPresencaOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const atividadeMut = useAtividadeMutation();
  const encontroMut = useEncontroMutation();
  const turmaMut = useTurmaMutation();

  const handleSavePainel = async (jsonStr: string) => {
    if (!turma) return;
    try {
      await turmaMut.mutateAsync({ ...turma, proposito: jsonStr });
      toast.success("Painel estratégico atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar o painel.");
    }
  };

  const totalAlunos = catequizandos.length || 1;

  const groupedItems = useMemo(() => {
    const rawItems: TimelineItem[] = [
      ...encontros.map((e): TimelineItem => ({
        id: e.id, tipo: 'encontro', titulo: e.tema, subtitulo: `Encontro • ${e.status}`,
        data: e.data, color: statusColors[e.status] || 'bg-muted-foreground',
        status: e.status, presencas: e.presencas || [], itemOriginal: e,
      })),
      ...atividades.map((a): TimelineItem => ({
        id: a.id, tipo: 'atividade', titulo: a.nome, subtitulo: `${a.tipo}${a.local ? ` • ${a.local}` : ''}`,
        data: a.data, color: 'bg-primary', presencas: a.presencas || [], itemOriginal: a,
      })),
      ...reunioes.map((r): TimelineItem => ({
        id: r.id, tipo: 'reuniao', titulo: r.nome || r.tipo, subtitulo: r.tipo,
        data: r.data, color: 'bg-liturgical', presencas: [], itemOriginal: r,
      })),
    ]
      .filter(item => activeFilter === 'all' || item.tipo === activeFilter)
      .sort((a, b) => {
        if (!a.data && !b.data) return 0;
        if (!a.data) return 1;
        if (!b.data) return -1;
        return new Date(a.data).getTime() - new Date(b.data).getTime();
      });

    const groups: Record<string, TimelineItem[]> = {};
    rawItems.forEach(item => {
      if (!item.data) {
        if (!groups["Datas a Definir"]) groups["Datas a Definir"] = [];
        groups["Datas a Definir"].push(item);
        return;
      }
      const date = new Date(item.data + 'T12:00:00');
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  }, [encontros, atividades, reunioes, activeFilter]);

  const handleTogglePresenca = (catId: string) => {
    if (!viewItem) return;
    const updated = viewItem.presencas.includes(catId)
      ? viewItem.presencas.filter(x => x !== catId)
      : [...viewItem.presencas, catId];
    if (viewItem.tipo === 'encontro') {
      encontroMut.mutate({ ...viewItem.itemOriginal, presencas: updated });
    } else {
      atividadeMut.mutate({ ...viewItem.itemOriginal, presencas: updated });
    }
    setViewItem({ ...viewItem, presencas: updated, itemOriginal: { ...viewItem.itemOriginal, presencas: updated } });
  };

  const shareUrl = turma?.codigoAcesso ? `${getAppUrl()}/plano-da-turma/${turma.codigoAcesso}` : "";

  if (tLoading || eLoading || aLoading || rLoading || cLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
          <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando plano...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn absolute left-0">
            <ArrowLeft className="h-5 w-5 text-black" />
          </button>
          <div className="flex flex-col items-center gap-1 text-center">
            {turma?.nome && <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-[-2px]">{turma.nome}</p>}
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Plano da Turma</h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{totalAlunos} catequizandos</p>
          </div>
        </div>
      </div>

      {/* Share button */}
      {turma?.codigoAcesso && (
        <div className="animate-fade-in stagger-1">
          <button onClick={() => setShareModalOpen(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-primary/20 hover:border-primary/40 text-primary shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all group active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 leading-none mb-1">Público</p>
              <p className="text-sm font-black tracking-tight leading-none">Compartilhar com Pais</p>
            </div>
            <div className="ml-auto w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </div>
          </button>
        </div>
      )}

      <QRShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} url={shareUrl}
        title="Compartilhar Plano" description="Pais e responsáveis podem acessar o cronograma da turma pelo link ou QR Code abaixo — sem precisar de conta."
        accentColor="bg-primary" shareTitle="Plano da Turma" shareText="Confira o cronograma da catequese:" />

      {/* ═══ PAINEL ESTRATÉGICO INTELIGENTE ═══ */}
      <PainelEstrategicoComponent turma={turma} onSave={handleSavePainel} isSaving={turmaMut.isPending} />

      {/* Timeline filter */}
      <Tabs defaultValue="all" value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full animate-fade-in">
        <TabsList className="grid w-full grid-cols-4 mb-8 mt-4 bg-muted/80 p-2 rounded-2xl shadow-sm border border-border/50 h-auto">
          {[
            { v: 'all',      label: 'Tudo' },
            { v: 'encontro', label: 'Encontros' },
            { v: 'atividade',label: 'Eventos' },
            { v: 'reuniao',  label: 'Reuniões' },
          ].map(({ v, label }) => (
            <TabsTrigger key={v} value={v} className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Timeline */}
      {groupedItems.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum item encontrado</p>
        </div>
      ) : (
        <div className="relative pb-10">
          <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/10 via-primary/40 to-primary/10" />
          <div className="space-y-10">
            {groupedItems.map(([month, items]) => (
              <div key={month} className="space-y-6 relative">
                <div className="flex items-center gap-4 py-2 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0 z-10 shadow-sm ml-[1px]">
                    <span className="text-[10px] font-black text-primary">✝</span>
                  </div>
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">{month}</h3>
                </div>
                <div className="space-y-5 ml-[20px]">
                  {items.map((item, i) => {
                    const Icon = item.tipo === 'encontro' ? CalendarDays : item.tipo === 'reuniao' ? Users : ListChecks;
                    const dateStr = item.data ? new Date(item.data + 'T12:00:00').toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }) : '---';
                    const presPct = Math.round((item.presencas.length / totalAlunos) * 100);
                    return (
                      <div key={`${item.tipo}-${item.id}`} className="relative pl-8 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={`absolute left-[-5px] top-5 w-2.5 h-2.5 rounded-full ${item.color} ring-4 ring-background z-10`} />
                        <button onClick={() => setViewItem(item)} className="w-full float-card flex items-center gap-3 p-4 text-left group">
                          <div className={`icon-box w-10 h-10 rounded-xl shrink-0 ${item.tipo === 'encontro' ? 'bg-primary/10 text-primary' : item.tipo === 'reuniao' ? 'bg-liturgical/10 text-liturgical' : 'bg-accent/15 text-accent-foreground'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight truncate group-active:text-primary transition-colors">{item.titulo}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase">{item.tipo === 'atividade' ? 'Evento' : item.tipo === 'reuniao' ? 'Reunião' : item.tipo}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {presPct}% {item.tipo === 'encontro' ? 'Alunos' : item.tipo === 'reuniao' ? 'Pessoas' : 'Pais'}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-primary uppercase">Dia</p>
                            <p className="text-lg font-black text-foreground leading-none">
                              {dateStr.split(' ')[0]} <span className="text-[10px] font-bold text-muted-foreground uppercase">{dateStr.split(' ')[2]?.replace('.', '')}</span>
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={o => { if (!o) setViewItem(null); }}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto border-border/30 p-0 overflow-hidden">
          {viewItem && (
            <>
              <div className={`p-6 ${viewItem.tipo === 'encontro' ? 'bg-primary/5' : 'bg-accent/5'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`pill-btn text-[10px] font-bold uppercase tracking-widest ${viewItem.color} text-white border-0`}>{viewItem.status || viewItem.tipo}</span>
                  {viewItem.itemOriginal.modalidade === 'externa' && <span className="pill-btn text-[10px] font-bold bg-primary/10 text-primary border-primary/20">EXTERNA</span>}
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">{viewItem.titulo}</h2>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Calendar className="h-3.5 w-3.5 text-primary" /> {viewItem.data ? formatarDataVigente(viewItem.data) : 'A definir'}</div>
                  {viewItem.itemOriginal.horario && <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock className="h-3.5 w-3.5 text-primary" /> {viewItem.itemOriginal.horario}</div>}
                  {viewItem.itemOriginal.local && <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /> {viewItem.itemOriginal.local}</div>}
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">Presença</span>
                    <span className="text-2xl font-black text-primary">{Math.round((viewItem.presencas.length / totalAlunos) * 100)}%</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{viewItem.presencas.length} de {totalAlunos} {viewItem.tipo === 'encontro' ? 'Alunos' : 'Pais'}</span>
                  </div>
                  <button onClick={() => setPresencaOpen(true)} className="bg-primary text-primary-foreground p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:opacity-90 transition-opacity">
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs font-black uppercase">Gerenciar Presença</span>
                  </button>
                </div>
                {viewItem.itemOriginal.descricao && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Descrição</h4>
                    <p className="text-sm text-foreground leading-relaxed">{viewItem.itemOriginal.descricao}</p>
                  </div>
                )}
                <button onClick={() => { if (viewItem.tipo === 'encontro') navigate(`/turmas/${id}/encontros`); else navigate(`/turmas/${id}/eventos`); }}
                  className="w-full py-3 rounded-xl bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">Ver no Módulo</button>
              </div>

              {/* Presence manager */}
              <Dialog open={presencaOpen} onOpenChange={setPresencaOpen}>
                <DialogContent className="rounded-2xl border-border/30">
                  <DialogHeader><DialogTitle>Chamada: {viewItem.titulo}</DialogTitle></DialogHeader>
                  <div className="space-y-1 mt-2 max-h-[50vh] overflow-y-auto">
                    {catequizandos.map(c => {
                      const present = viewItem.presencas.includes(c.id);
                      return (
                        <button key={c.id} onClick={() => handleTogglePresenca(c.id)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${present ? 'bg-success/10' : 'hover:bg-muted/50'}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${present ? 'bg-success border-success' : 'border-border'}`}>
                            {present && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </div>
                          <div className="flex-1 text-left">
                            <span className={`font-bold block ${present ? 'text-foreground' : 'text-muted-foreground'}`}>{viewItem.tipo === 'encontro' ? c.nome : (c.responsavel || c.nome)}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{viewItem.tipo === 'encontro' ? `RM: ${c.id.slice(0, 5)}` : `CATEQUIZANDO: ${c.nome}`}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
