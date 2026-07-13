import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, AlertTriangle, Clock, Users, BookOpen,
  TrendingUp, Sparkles, Gift, Calendar, MapPin, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SIMBOLOS_IVC } from "@/lib/store";
import type { Atividade } from "@/lib/store";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type ModeloIVC = 'sementinhas' | 'eucaristia_crisma' | 'adultos';
type RiscoNivel = 'em_dia' | 'atencao' | 'atrasado';
type EtapaStatus = 'concluido' | 'em_andamento' | 'pendente' | 'agendado';

interface EtapaJornada {
  id: string;
  label: string;
  sublabel?: string;
  emoji: string;
  tipo: 'inicio' | 'tempo' | 'passagem' | 'simbolo' | 'sacramento' | 'fim';
  status: EtapaStatus;
  dataEvento?: string;
}

// ─────────────────────────────────────────────────────────────
// HELPERS (duplicated light version for public page)
// ─────────────────────────────────────────────────────────────
function detectarModelo(etapa: string): ModeloIVC {
  const e = etapa?.toLowerCase() ?? '';
  if (e.includes('sement') || e.includes('pré-cat') || e.includes('pre-cat')) return 'sementinhas';
  if (e.includes('adult')) return 'adultos';
  return 'eucaristia_crisma';
}

const ETAPAS_RESUMIDAS: Record<ModeloIVC, Omit<EtapaJornada, 'status' | 'dataEvento'>[]> = {
  sementinhas: [
    { id: 'acolhida',     label: 'Acolhida',            emoji: '🌱', tipo: 'inicio' },
    { id: 'pre_cat',      label: 'Iniciação Lúdica',     emoji: '🎈', tipo: 'tempo' },
    { id: 'pass_catec',   label: 'Celebração de Acolhida', emoji: '🎉', tipo: 'passagem' },
    { id: 'catec_seed',   label: 'Aprofundamento da Fé', emoji: '📖', tipo: 'tempo' },
    { id: 'entrega_bib',  label: 'Bíblia das Crianças',  emoji: '📖', tipo: 'simbolo' },
    { id: 'pass_ilum',    label: 'Celebração da Família', emoji: '🎊', tipo: 'passagem' },
    { id: 'mis',          label: 'Missão',               emoji: '🌿', tipo: 'fim' },
  ],
  eucaristia_crisma: [
    { id: 'preparacao',   label: 'Preparação',          emoji: '📣', tipo: 'inicio' },
    { id: 'pass_ent',     label: 'Celebração de Entrada', emoji: '🎉', tipo: 'passagem' },
    { id: 'pre_cat',      label: 'Pré-Catecumenato',    emoji: '🔥', tipo: 'tempo', sublabel: '1º Tempo' },
    { id: 'pass_cat',     label: 'Entrada no Catecumenato', emoji: '✨', tipo: 'passagem' },
    { id: 'catecumenato', label: 'Catecumenato',        emoji: '📖', tipo: 'tempo', sublabel: '2º Tempo — 6 Fases' },
    { id: 'bib',          label: 'Entrega da Bíblia',   emoji: '📖', tipo: 'simbolo' },
    { id: 'pn',           label: 'Entrega do Pai-Nosso',emoji: '🙏', tipo: 'simbolo' },
    { id: 'creio',        label: 'Entrega do Creio',    emoji: '✝️', tipo: 'simbolo' },
    { id: 'eleicao',      label: 'Eleição',             emoji: '🗳️', tipo: 'passagem' },
    { id: 'purif',        label: 'Purificação',         emoji: '💜', tipo: 'tempo', sublabel: '3º Tempo' },
    { id: 'sacramento',   label: 'Sacramento',          emoji: '👑', tipo: 'sacramento' },
    { id: 'mistagogia',   label: 'Mistagogia',          emoji: '🕊️', tipo: 'fim', sublabel: '4º Tempo' },
  ],
  adultos: [
    { id: 'pre_cat',      label: 'Pré-Catecumenato',    emoji: '🔥', tipo: 'inicio', sublabel: '1º Tempo' },
    { id: 'admissao',     label: 'Admissão',            emoji: '✨', tipo: 'passagem' },
    { id: 'catecumenato', label: 'Catecumenato',        emoji: '📖', tipo: 'tempo', sublabel: '2º Tempo' },
    { id: 'eleicao',      label: 'Eleição',             emoji: '🗳️', tipo: 'passagem' },
    { id: 'escrutinios',  label: 'Escrutínios',         emoji: '💜', tipo: 'tempo', sublabel: '3º Tempo' },
    { id: 'sacramentos',  label: 'Sacramentos',         emoji: '🕊️', tipo: 'sacramento' },
    { id: 'mistagogia',   label: 'Mistagogia',          emoji: '🌿', tipo: 'fim', sublabel: '4º Tempo' },
  ],
};

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────
function ProgressoBar({ percent, color = 'bg-violet-500' }: { percent: number; color?: string }) {
  return (
    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-1000", color)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function EtapaItem({ etapa, isLast }: { etapa: EtapaJornada; isLast: boolean }) {
  const statusColor = {
    concluido:    'border-emerald-400 bg-emerald-50',
    em_andamento: 'border-primary bg-primary/5 ring-2 ring-primary/20',
    agendado:     'border-amber-400 bg-amber-50',
    pendente:     'border-muted-foreground/20 bg-white',
  }[etapa.status];

  const checkColor = {
    concluido:    'text-emerald-500',
    em_andamento: 'text-primary',
    agendado:     'text-amber-500',
    pendente:     'text-muted-foreground/30',
  }[etapa.status];

  return (
    <div className="flex items-stretch gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm",
          statusColor
        )}>
          <span className={cn("text-lg", etapa.status === 'pendente' && "opacity-40")}>
            {etapa.emoji}
          </span>
        </div>
        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 mt-1 min-h-[16px]",
            etapa.status === 'concluido' ? 'bg-emerald-300' : 'bg-muted/40'
          )} />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 pb-4", isLast && "pb-0")}>
        <div className="flex items-start gap-2 justify-between">
          <div className="min-w-0 flex-1">
            <p className={cn(
              "font-bold text-sm leading-tight",
              etapa.status === 'pendente' ? "text-muted-foreground/50" : "text-foreground"
            )}>
              {etapa.label}
            </p>
            {etapa.sublabel && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{etapa.sublabel}</p>
            )}
            {etapa.dataEvento && (
              <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(etapa.dataEvento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          {etapa.status === 'concluido' && (
            <CheckCircle2 className={cn("w-4 h-4 shrink-0 mt-0.5", checkColor)} />
          )}
        </div>
        {etapa.status === 'em_andamento' && (
          <div className="mt-3 flex items-center gap-2 animate-bounce">
            <div className="h-px bg-primary w-4 opacity-50" />
            <div className="bg-primary text-white px-3 py-1.5 rounded-full shadow-md shadow-primary/20 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Sua Turma Aqui</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PUBLIC PAGE
// ─────────────────────────────────────────────────────────────
export default function PublicPainelIVC() {
  const { codigo } = useParams<{ codigo: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turma, setTurma] = useState<any>(null);
  const [encontros, setEncontros] = useState<any[]>([]);
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [catequizandos, setCatequizandos] = useState<any[]>([]);

  useEffect(() => {
    if (!codigo) return;
    const load = async () => {
      try {
        // Find turma by access code
        const { data: turmaData, error: tErr } = await supabase
          .from('turmas')
          .select('*')
          .eq('codigo_acesso', codigo)
          .single();

        if (tErr || !turmaData) {
          setError('Turma não encontrada ou link inválido.');
          setLoading(false);
          return;
        }

        const parsedTurma = {
          ...turmaData,
          etapa: turmaData.etapa || '',
          nome: turmaData.nome || 'Turma',
          ano: turmaData.ano || '',
        };
        setTurma(parsedTurma);

        // Load encounters
        const { data: encontrosData } = await supabase
          .from('encontros')
          .select('*')
          .eq('turma_id', turmaData.id);
        setEncontros(encontrosData ?? []);

        // Load activities (IVC events)
        const { data: atvsData } = await supabase
          .from('atividades')
          .select('*')
          .eq('turma_id', turmaData.id);

        // Parse the activities to match our type
        const parsed = (atvsData ?? []).map((a: any) => ({
          ...a,
          turmaId: a.turma_id,
          criadoEm: a.criado_em,
          tipo: a.tipo || 'Eventos geral',
          presencas: a.presencas || [],
          simboloIVC: a.dados_extras?.simboloIVC,
          etapaIVC: a.dados_extras?.etapaIVC,
          realizado: a.dados_extras?.realizado,
        }));
        setAtividades(parsed);

        // Load catequizandos (only count)
        const { data: catsData } = await supabase
          .from('catequizandos')
          .select('id, status')
          .eq('turma_id', turmaData.id);
        setCatequizandos(catsData ?? []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [codigo]);

  const modelo = detectarModelo(turma?.etapa ?? '');
  const etapasBase = ETAPAS_RESUMIDAS[modelo];

  const encontrosRealizados = encontros.filter(e => e.status === 'realizado');
  const percFreq = encontros.length > 0 ? encontrosRealizados.length / encontros.length : 0;
  const eventosIVC = atividades.filter(a => a.tipo === 'Entrega de Símbolos' || a.tipo === 'Celebração de Passagem');

  const hoje = new Date();

  // Build etapas with status
  const etapas: EtapaJornada[] = etapasBase.map(base => {
    let status: EtapaStatus = 'pendente';
    let dataEvento: string | undefined;

    if (base.tipo === 'simbolo') {
      const simboloMap: Record<string, string> = { 'bib': 'biblia', 'pn': 'pai_nosso', 'creio': 'creio', 'entrega_bib': 'biblia' };
      const mapId = simboloMap[base.id];
      const evSim = eventosIVC.find(a => a.simboloIVC === mapId);
      if (evSim) {
        dataEvento = evSim.data;
        status = new Date(evSim.data + 'T23:59:59') < hoje ? 'concluido' : 'agendado';
      }
    } else if (base.tipo === 'passagem') {
      const ev = eventosIVC.find(a => a.tipo === 'Celebração de Passagem');
      if (ev) {
        dataEvento = ev.data;
        status = new Date(ev.data + 'T23:59:59') < hoje ? 'concluido' : 'agendado';
      }
    } else if (base.tipo === 'tempo') {
      if (percFreq >= 0.75) status = 'concluido';
      else if (percFreq >= 0.2) status = 'em_andamento';
    } else if (base.tipo === 'inicio') {
      status = encontros.length > 0 ? 'concluido' : 'em_andamento';
    }

    return { ...base, status, dataEvento };
  });

  const concluidas = etapas.filter(e => e.status === 'concluido').length;
  const percentual = Math.round((concluidas / etapas.length) * 100);

  const risco: RiscoNivel = percFreq >= 0.6 ? 'em_dia' : percFreq >= 0.3 ? 'atencao' : 'atrasado';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-zinc-950">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-black text-xs uppercase tracking-widest">Carregando painel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-zinc-950 p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <p className="text-foreground font-black text-lg">Link inválido</p>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-16">
      {/* Hero Header */}
      <div className="px-5 pt-10 pb-6 text-foreground">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-widest text-primary mb-4">
            <Sparkles className="w-3 h-3" />
            Iniciação à Vida Cristã
          </div>
          <h1 className="text-3xl font-black leading-tight text-foreground">Jornada da Turma</h1>
          <p className="text-lg font-bold text-foreground/80">{turma?.nome}</p>
          {turma?.ano && (
            <p className="text-sm text-muted-foreground font-semibold">{turma.ano}</p>
          )}
        </div>

        {/* Progress ring */}
        <div className="flex flex-col items-center mt-8 gap-3">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="54" fill="none" className="stroke-muted" strokeWidth="12" />
              <circle
                cx="64" cy="64" r="54"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentual / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-foreground">{percentual}%</span>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">concluído</span>
            </div>
          </div>

          {/* Risk indicator */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold",
            risco === 'em_dia' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
            risco === 'atencao' ? "bg-amber-50 border-amber-200 text-amber-700" :
            "bg-red-50 border-red-200 text-red-700"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              risco === 'em_dia' ? 'bg-emerald-500' :
              risco === 'atencao' ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'
            )} />
            {risco === 'em_dia' ? '✓ Caminhada em dia' :
             risco === 'atencao' ? '⚠ Requer atenção' : '● Caminhada atrasada'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Encontros', value: `${encontrosRealizados.length}/${encontros.length}`, sub: 'realizados', icon: BookOpen, color: 'text-blue-500' },
            { label: 'Catequizandos', value: catequizandos.filter((c: any) => c.status === 'ativo').length, sub: 'ativos', icon: Users, color: 'text-emerald-500' },
            { label: 'Etapas IVC', value: `${concluidas}/${etapas.length}`, sub: 'concluídas', icon: TrendingUp, color: 'text-violet-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-border shadow-sm text-center">
              <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
              <p className="text-lg font-black leading-none text-foreground">{stat.value}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="mx-5 bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Mapa da Jornada
        </h2>
        <div className="space-y-0">
          {etapas.map((etapa, idx) => (
            <EtapaItem key={etapa.id} etapa={etapa} isLast={idx === etapas.length - 1} />
          ))}
        </div>
      </div>

      {/* Symbols */}
      <div className="mx-5 mt-5 bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-2xl">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-500" />
          Símbolos da Fé
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {SIMBOLOS_IVC.filter(s => s.id !== 'outro').map(simbolo => {
            const entregue = atividades.some(a =>
              a.tipo === 'Entrega de Símbolos' && a.simboloIVC === simbolo.id
            );
            return (
              <div key={simbolo.id} className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all",
                entregue
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-muted/20 border-border/20 opacity-40"
              )}>
                <span className="text-xl">{simbolo.emoji}</span>
                <p className="text-[8px] font-bold leading-tight text-center">
                  {simbolo.label.split(' ').slice(0, 2).join(' ')}
                </p>
                {entregue && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info footer */}
      <div className="mx-5 mt-5 flex items-start gap-3 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border shadow-sm">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Este painel é atualizado automaticamente conforme os encontros são realizados e os eventos do IVC são registrados pela equipe de catequistas.
        </p>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 px-5">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          iCatequese · Painel IVC Público
        </p>
        <p className="text-[9px] text-muted-foreground/60 mt-1">
          Atualizado automaticamente
        </p>
      </div>
    </div>
  );
}
