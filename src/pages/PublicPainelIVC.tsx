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

import { 
  ETAPAS_POR_MODELO, 
  calcularProgressoJornada, 
  calcularRisco, 
  detectarModelo,
  JornadaMap,
  type ModeloIVC,
  type RiscoNivel,
  type EtapaStatus,
  type EtapaJornada
} from "./PainelIVC";

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
        const parsed = (atvsData ?? []).map((a: any) => {
          const isDispensado = (a.observacao || '').includes('[DISPENSADO_IVC]');
          const cleanObservacao = (a.observacao || '').replace('[DISPENSADO_IVC]', '').trim();
          return {
            ...a,
            turmaId: a.turma_id,
            criadoEm: a.criado_em,
            tipo: a.tipo || 'Eventos geral',
            presencas: a.presencas || [],
            simboloIVC: a.simbolo_ivc || a.dados_extras?.simboloIVC,
            etapaIVC: a.etapa_ivc || a.dados_extras?.etapaIVC,
            realizado: a.realizado ?? a.dados_extras?.realizado,
            dispensado: isDispensado,
            observacao: cleanObservacao,
          };
        });
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
  const etapasBase = ETAPAS_POR_MODELO[modelo];

  const encontrosRealizados = encontros.filter(e => e.status === 'realizado');
  const percFreq = encontros.length > 0 ? encontrosRealizados.length / encontros.length : 0;
  
  const { etapas, posicaoAtual, percentualGeral: percentual } = calcularProgressoJornada(
    etapasBase,
    encontros,
    atividades,
    false,
    undefined
  );

  const concluidas = etapas.filter(e => e.status === 'concluido').length;
  const { nivel: risco } = calcularRisco(encontros, atividades, percentual);

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
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/80 mb-1">{stat.label}</p>
              <p className="text-lg font-black leading-none text-foreground">{stat.value}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="mx-0 sm:mx-5 bg-white dark:bg-zinc-900 rounded-none sm:rounded-3xl shadow-2xl relative z-10">
        <div className="p-5 pb-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Mapa da Jornada
          </h2>
        </div>
        <JornadaMap 
          etapas={etapas}
          posicaoAtual={posicaoAtual}
          modelo={modelo}
          readonly={true}
          turmaNome={turma?.nome}
          turmaAno={turma?.ano}
        />
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
