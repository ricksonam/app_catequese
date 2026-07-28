import { useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle, Users, BookOpen, TrendingUp, Calendar,
  CheckCircle2, X, FileSignature, BarChart3, Info, Sparkles,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
interface Catequizando {
  id: string;
  nome: string;
  status?: string;
  foto?: string;
}

interface Encontro {
  id: string;
  data: string;
  tema: string;
  status: string;
  presencas: string[];
  justificativas?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function getMesAno(dataStr: string): string {
  const d = new Date(dataStr + "T12:00:00");
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatarMesAno(mesAno: string): string {
  const [year, month] = mesAno.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function getPorcentagemColor(perc: number): string {
  if (perc >= 75) return "text-emerald-600";
  if (perc >= 50) return "text-amber-600";
  return "text-red-500";
}

function getPorcentagemBg(perc: number): string {
  if (perc >= 75) return "bg-emerald-50 border-emerald-200";
  if (perc >= 50) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function getBadge(perc: number): { label: string; color: string; dot: string } {
  if (perc >= 75) return { label: "Regular", color: "text-emerald-700 bg-emerald-100", dot: "bg-emerald-500" };
  if (perc >= 50) return { label: "Atenção", color: "text-amber-700 bg-amber-100", dot: "bg-amber-500" };
  return { label: "Crítico", color: "text-red-700 bg-red-100", dot: "bg-red-500" };
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE GRÁFICO DE BARRAS POR MÊS
// ─────────────────────────────────────────────────────────────
function GraficoMensal({
  meses,
  encontros,
  catEquizandos,
}: {
  meses: string[];
  encontros: Encontro[];
  catEquizandos: Catequizando[];
}) {
  const dados = useMemo(() => {
    return meses.map((m) => {
      const enc = encontros.filter(
        (e) => e.status !== "cancelado" && getMesAno(e.data) === m
      );
      if (enc.length === 0) return { mes: m, perc: 0, presencas: 0, total: 0 };
      let totalPresencas = 0;
      let totalPossivel = enc.length * catEquizandos.length;
      enc.forEach((e) => {
        catEquizandos.forEach((c) => {
          if (e.presencas?.includes(c.id)) totalPresencas++;
        });
      });
      const perc = totalPossivel > 0 ? Math.round((totalPresencas / totalPossivel) * 100) : 0;
      return { mes: m, perc, presencas: totalPresencas, total: totalPossivel };
    });
  }, [meses, encontros, catEquizandos]);

  const maxPerc = Math.max(...dados.map((d) => d.perc), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-32 px-1">
        {dados.map((d) => {
          const altura = Math.round((d.perc / maxPerc) * 100);
          const barColor =
            d.perc >= 75
              ? "bg-emerald-500"
              : d.perc >= 50
              ? "bg-amber-500"
              : "bg-red-400";
          return (
            <div
              key={d.mes}
              className="flex-1 flex flex-col items-center justify-end gap-1 group"
              title={`${formatarMesAno(d.mes)}: ${d.perc}%`}
            >
              <span className="text-[9px] font-black text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {d.perc}%
              </span>
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all duration-700",
                  barColor
                )}
                style={{ height: `${Math.max(altura, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {dados.map((d) => (
          <div key={d.mes} className="flex-1 text-center">
            <p className="text-[8px] font-black text-muted-foreground uppercase leading-none">
              {MESES[Number(d.mes.split("-")[1]) - 1]?.slice(0, 3)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE RESUMO MENSAL
// ─────────────────────────────────────────────────────────────
function ResumoMensalTabela({
  mesSelecionado,
  encontros,
  catequizandos,
}: {
  mesSelecionado: string;
  encontros: Encontro[];
  catequizandos: Catequizando[];
}) {
  const encontrosNoMes = useMemo(
    () =>
      encontros.filter(
        (e) =>
          e.status !== "cancelado" && getMesAno(e.data) === mesSelecionado
      ),
    [encontros, mesSelecionado]
  );

  const rows = useMemo(() => {
    return catequizandos
      .map((c) => {
        let presencas = 0, justificadas = 0, faltas = 0;
        encontrosNoMes.forEach((e) => {
          if (e.presencas?.includes(c.id)) presencas++;
          else if (e.justificativas?.[c.id]) justificadas++;
          else faltas++;
        });
        const total = encontrosNoMes.length;
        const perc = total > 0 ? Math.round((presencas / total) * 100) : 0;
        return { cat: c, presencas, justificadas, faltas, total, perc };
      })
      .sort((a, b) => a.cat.nome.localeCompare(b.cat.nome));
  }, [encontrosNoMes, catequizandos]);

  if (encontrosNoMes.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground text-sm font-medium">
        Nenhum encontro neste mês.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground">
        <span>Catequizando</span>
        <span className="text-emerald-600 text-center w-10">Pres</span>
        <span className="text-red-500 text-center w-10">Falta</span>
        <span className="text-amber-600 text-center w-10">Just</span>
        <span className="text-indigo-600 text-center w-12">%</span>
      </div>
      {/* Linhas */}
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.cat.id}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shrink-0 text-xs font-black text-indigo-600">
                {row.cat.nome.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-bold text-foreground truncate">
                {row.cat.nome}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center w-10 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-xs font-black text-emerald-600">{row.presencas}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 py-1 rounded-lg bg-red-50 border border-red-100">
              <span className="text-xs font-black text-red-500">{row.faltas}</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 py-1 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-xs font-black text-amber-600">{row.justificadas}</span>
            </div>
            <div className={cn("flex items-center justify-center w-12 py-1.5 rounded-lg border text-sm font-black", getPorcentagemBg(row.perc), getPorcentagemColor(row.perc))}>
              {row.perc}%
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-bold text-muted-foreground text-center pt-1">
        {encontrosNoMes.length} encontro{encontrosNoMes.length !== 1 ? "s" : ""} no mês · {catequizandos.length} catequizandos
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE QUADRO ANALÍTICO TOTAL
// ─────────────────────────────────────────────────────────────
function QuadroAnaliticoTotal({
  encontros,
  catequizandos,
}: {
  encontros: Encontro[];
  catequizandos: Catequizando[];
}) {
  const rows = useMemo(() => {
    const enc = encontros.filter((e) => e.status !== "cancelado");
    return catequizandos
      .map((c) => {
        let presencas = 0, justificadas = 0, faltas = 0;
        enc.forEach((e) => {
          if (e.presencas?.includes(c.id)) presencas++;
          else if (e.justificativas?.[c.id]) justificadas++;
          else faltas++;
        });
        const total = enc.length;
        const perc = total > 0 ? Math.round((presencas / total) * 100) : 0;
        return { cat: c, presencas, justificadas, faltas, total, perc };
      })
      .sort((a, b) => b.perc - a.perc);
  }, [encontros, catequizandos]);

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground">
        <span>Catequizando</span>
        <span className="text-emerald-600 text-center w-10">Pres</span>
        <span className="text-red-500 text-center w-10">Falta</span>
        <span className="text-amber-600 text-center w-10">Just</span>
        <span className="text-indigo-600 text-center w-12">%</span>
        <span className="text-slate-500 text-center w-16">Status</span>
      </div>
      {/* Linhas */}
      <div className="space-y-1.5">
        {rows.map((row, idx) => {
          const badge = getBadge(row.perc);
          return (
            <div
              key={row.cat.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 items-center px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-border shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[10px] font-black text-muted-foreground w-4 shrink-0">
                  {idx + 1}
                </span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center shrink-0 text-xs font-black text-violet-600">
                  {row.cat.nome.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-foreground truncate">
                  {row.cat.nome}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center w-10 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-black text-emerald-600">{row.presencas}</span>
              </div>
              <div className="flex flex-col items-center justify-center w-10 py-1 rounded-lg bg-red-50 border border-red-100">
                <span className="text-xs font-black text-red-500">{row.faltas}</span>
              </div>
              <div className="flex flex-col items-center justify-center w-10 py-1 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-xs font-black text-amber-600">{row.justificadas}</span>
              </div>
              <div className={cn("flex items-center justify-center w-12 py-1.5 rounded-lg border text-sm font-black", getPorcentagemBg(row.perc), getPorcentagemColor(row.perc))}>
                {row.perc}%
              </div>
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wide w-16 justify-center", badge.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", badge.dot)} />
                {badge.label}
              </div>
            </div>
          );
        })}
      </div>
      {/* Legenda */}
      <div className="flex items-center justify-center gap-4 pt-2">
        {[
          { dot: "bg-emerald-500", label: "Regular ≥75%" },
          { dot: "bg-amber-500", label: "Atenção 50-74%" },
          { dot: "bg-red-400", label: "Crítico <50%" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", l.dot)} />
            <span className="text-[9px] font-bold text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function PublicFrequencia() {
  const { codigo } = useParams<{ codigo: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [turma, setTurma] = useState<any>(null);
  const [encontros, setEncontros] = useState<Encontro[]>([]);
  const [catequizandos, setCatequizandos] = useState<Catequizando[]>([]);
  const [activeTab, setActiveTab] = useState<"mensal" | "analitico">("mensal");
  const [mesSelecionado, setMesSelecionado] = useState<string>("");

  useEffect(() => {
    if (!codigo) return;
    const load = async () => {
      try {
        // Buscar turma pelo codigo de acesso
        const { data: turmaData, error: tErr } = await supabase
          .from("turmas")
          .select("*")
          .eq("codigo_acesso", codigo)
          .single();

        if (tErr || !turmaData) {
          setError("Turma não encontrada ou link inválido.");
          setLoading(false);
          return;
        }

        setTurma(turmaData);

        // Buscar encontros
        const { data: encontrosData } = await supabase
          .from("encontros")
          .select("id, data, tema, status, presencas, justificativas")
          .eq("turma_id", turmaData.id)
          .order("data", { ascending: true });

        const encFormatados: Encontro[] = (encontrosData ?? []).map((e: any) => ({
          id: e.id,
          data: e.data,
          tema: e.tema || "",
          status: e.status || "pendente",
          presencas: Array.isArray(e.presencas) ? e.presencas : [],
          justificativas: e.justificativas || {},
        }));
        setEncontros(encFormatados);

        // Definir mês padrão como o mais recente
        const realizados = encFormatados.filter((e) => e.status !== "cancelado");
        if (realizados.length > 0) {
          const mesesSet = new Set<string>();
          realizados.forEach((e) => mesesSet.add(getMesAno(e.data)));
          const mesesArr = Array.from(mesesSet).sort((a, b) => b.localeCompare(a));
          setMesSelecionado(mesesArr[0]);
        }

        // Buscar catequizandos ativos
        const { data: catsData } = await supabase
          .from("catequizandos")
          .select("id, nome, status, foto")
          .eq("turma_id", turmaData.id)
          .or("status.is.null,status.eq.ativo");

        const catsAtivos: Catequizando[] = (catsData ?? []).filter(
          (c: any) => !c.status || c.status === "ativo"
        );
        setCatequizandos(catsAtivos);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [codigo]);

  // ---- Stats Gerais ----
  const encontrosRealizados = useMemo(
    () => encontros.filter((e) => e.status === "realizado"),
    [encontros]
  );

  const taxaGeralPresenca = useMemo(() => {
    const enc = encontros.filter((e) => e.status !== "cancelado");
    if (enc.length === 0 || catequizandos.length === 0) return 0;
    let total = 0;
    let presentes = 0;
    enc.forEach((e) => {
      catequizandos.forEach((c) => {
        total++;
        if (e.presencas?.includes(c.id)) presentes++;
      });
    });
    return total > 0 ? Math.round((presentes / total) * 100) : 0;
  }, [encontros, catequizandos]);

  const mesesDisponiveis = useMemo(() => {
    const s = new Set<string>();
    encontros
      .filter((e) => e.status !== "cancelado")
      .forEach((e) => s.add(getMesAno(e.data)));
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [encontros]);

  // ---- Loading / Error ----
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center shadow-inner animate-pulse">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
        </div>
        <p className="text-muted-foreground font-black text-xs uppercase tracking-widest animate-pulse">
          Carregando relatório...
        </p>
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 pb-16">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 pb-8 pt-10 px-5 text-white shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        <div className="relative text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-3 h-3" />
            Relatório de Frequência
          </div>
          <h1 className="text-3xl font-black leading-tight">
            {turma?.nome ?? "Turma"}
          </h1>
          {turma?.etapa && (
            <p className="text-sm font-bold text-white/80 capitalize">{turma.etapa}</p>
          )}
          {turma?.ano && (
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">{turma.ano}</p>
          )}
        </div>
      </div>

      {/* ── STATS GERAIS ── */}
      <div className="px-4 -mt-5 mb-6">
        <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
          {[
            {
              label: "Encontros",
              value: `${encontrosRealizados.length}/${encontros.filter(e => e.status !== 'cancelado').length}`,
              sub: "realizados",
              icon: BookOpen,
              color: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "Catequizandos",
              value: catequizandos.length,
              sub: "ativos",
              icon: Users,
              color: "text-emerald-500",
              bg: "bg-emerald-50",
            },
            {
              label: "Presença",
              value: `${taxaGeralPresenca}%`,
              sub: "taxa geral",
              icon: TrendingUp,
              color:
                taxaGeralPresenca >= 75
                  ? "text-emerald-500"
                  : taxaGeralPresenca >= 50
                  ? "text-amber-500"
                  : "text-red-500",
              bg:
                taxaGeralPresenca >= 75
                  ? "bg-emerald-50"
                  : taxaGeralPresenca >= 50
                  ? "bg-amber-50"
                  : "bg-red-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-border shadow-md text-center"
            >
              <div className={cn("w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{stat.label}</p>
              <p className="text-lg font-black leading-none text-foreground">{stat.value}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── GRÁFICO MENSAL ── */}
      {mesesDisponiveis.length > 1 && (
        <div className="px-4 mb-6 max-w-xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-border shadow-md p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visão Geral</p>
                <p className="text-sm font-black text-foreground">Taxa de Presença por Mês</p>
              </div>
            </div>
            <GraficoMensal
              meses={mesesDisponiveis.slice().reverse()}
              encontros={encontros}
              catEquizandos={catequizandos}
            />
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="px-4 mb-4 max-w-xl mx-auto">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("mensal")}
            className={cn(
              "flex-1 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wide",
              activeTab === "mensal"
                ? "bg-white dark:bg-zinc-900 text-indigo-600 shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            📅 Resumo Mensal
          </button>
          <button
            onClick={() => setActiveTab("analitico")}
            className={cn(
              "flex-1 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wide",
              activeTab === "analitico"
                ? "bg-white dark:bg-zinc-900 text-violet-600 shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            📊 Quadro Analítico
          </button>
        </div>
      </div>

      {/* ── CONTEÚDO DAS TABS ── */}
      <div className="px-4 max-w-xl mx-auto">

        {activeTab === "mensal" && (
          <div className="space-y-4">
            {/* Seletor de Mês */}
            {mesesDisponiveis.length > 0 ? (
              <>
                <div className="relative">
                  <select
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                    className="w-full h-12 px-4 pr-10 bg-white dark:bg-zinc-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl text-sm font-bold text-foreground shadow-sm appearance-none focus:outline-none focus:border-indigo-400 capitalize"
                  >
                    {mesesDisponiveis.map((m) => (
                      <option key={m} value={m} className="capitalize">
                        {formatarMesAno(m)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <ResumoMensalTabela
                  mesSelecionado={mesSelecionado}
                  encontros={encontros}
                  catequizandos={catequizandos}
                />
              </>
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                Nenhum encontro registrado ainda.
              </div>
            )}
          </div>
        )}

        {activeTab === "analitico" && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl">
              <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-700 dark:text-violet-300 font-medium leading-relaxed">
                Quadro consolidado de <strong>todos os encontros</strong> realizados até o momento. Catequizandos ordenados por maior frequência.
              </p>
            </div>
            {catequizandos.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                Nenhum catequizando ativo encontrado.
              </div>
            ) : (
              <QuadroAnaliticoTotal
                encontros={encontros}
                catequizandos={catequizandos}
              />
            )}
          </div>
        )}
      </div>

      {/* ── INFO FOOTER ── */}
      <div className="mx-4 mt-8 max-w-xl mx-auto">
        <div className="flex items-start gap-3 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border shadow-sm">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Este relatório é atualizado automaticamente conforme os encontros são registrados pelos catequistas no sistema.
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="text-center mt-8 px-5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-border shadow-sm">
          <Calendar className="w-3 h-3 text-indigo-500" />
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            iCatequese · Relatório de Frequência
          </p>
        </div>
        <p className="text-[9px] text-muted-foreground/50 mt-2">
          Atualizado automaticamente
        </p>
      </div>
    </div>
  );
}
