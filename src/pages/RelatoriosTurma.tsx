import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PieChart as PieChartIcon, FileText, Printer, CheckCircle2, XCircle, User, CalendarDays, BarChartIcon, BookOpen, X, Users, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn, formatarDataVigente } from "@/lib/utils";
import * as Templates from "@/components/reports/ReportTemplates";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import { PremiumModal } from "@/components/PremiumModal";


const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];
const S_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

export default function RelatoriosTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"inteligente" | "documentos">("inteligente");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { data: turmas = [], isLoading: loadingT } = useTurmas();
  const { data: encontros = [], isLoading: loadingE } = useEncontros(id);
  const { data: catequizandos = [], isLoading: loadingC } = useCatequizandos(id);
  const { data: atividades = [], isLoading: loadingA } = useAtividades(id);
  const { data: paroquias = [], isLoading: loadingP } = useParoquias();
  const { data: comunidades = [], isLoading: loadingCom } = useComunidades();
  const { diarios = [], isLoading: loadingD } = useDiarioEspiritual(id!);
  const { isPremium, isLoading: loadingPremium } = usePremiumStatus();

  const turma = turmas.find(t => t.id === id);

  // Fallback: se não encontrar a turma, redireciona para a primeira disponível ou lista de turmas
  if (!loadingT && turmas.length > 0 && !turma) {
    navigate(`/turmas/${turmas[0].id}/relatorios`, { replace: true });
    return null;
  }

  if (loadingT || loadingE || loadingC || loadingA || loadingP || loadingCom || loadingD || loadingPremium) {
    return <div className="flex justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;
  }

  if (!turma) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <XCircle className="w-12 h-12 text-destructive/50" />
        <div className="text-center">
          <p className="font-black uppercase tracking-tight">Turma não selecionada</p>
          <p className="text-xs text-muted-foreground mt-1">Por favor, selecione uma turma para visualizar os relatórios.</p>
        </div>
        <button onClick={() => navigate("/turmas")} className="px-6 py-2 bg-primary text-white rounded-xl font-black uppercase text-xs">
          Ver Turmas
        </button>
      </div>
    );
  }

  const comunidade = comunidades.find(c => c.id === turma.comunidadeId);
  const paroquia = paroquias.find(p => p.id === comunidade?.paroquiaId);
  const orgNomes = { 
    paroquia: paroquia?.nome || "Paróquia não informada", 
    comunidade: comunidade?.nome || "Comunidade não informada" 
  };

  return (

      <div className="space-y-6 print:m-0 print:p-0 print:space-y-0 pb-10">
      <div className="space-y-4 animate-fade-in flex flex-col pt-4 print:hidden">
        {/* Row 1: Back Button + Título (Centralizado) */}
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate("/")} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <X className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Relatórios da Turma
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{turma.nome} • {turma.etapa}</p>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-2 gap-3 print:hidden">
        <button 
          onClick={() => setTab("inteligente")}
          className={cn("flex flex-col items-center justify-center gap-3 p-4 rounded-[24px] transition-all border-2", tab === "inteligente" ? "bg-primary/10 border-primary text-primary shadow-md scale-[1.02]" : "bg-white border-black/5 text-muted-foreground hover:bg-muted/50 hover:scale-[1.02]")}
        >
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", tab === "inteligente" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/10 text-primary")}>
            <PieChartIcon className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-center leading-tight">Visão<br/>Inteligente</span>
        </button>
        <button 
          onClick={() => setTab("documentos")}
          className={cn("flex flex-col items-center justify-center gap-3 p-4 rounded-[24px] transition-all border-2", tab === "documentos" ? "bg-primary/10 border-primary text-primary shadow-md scale-[1.02]" : "bg-white border-black/5 text-muted-foreground hover:bg-muted/50 hover:scale-[1.02]")}
        >
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", tab === "documentos" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/10 text-primary")}>
            <FileText className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-center leading-tight">Documentos<br/>e Fichas</span>
        </button>
      </div>

      {tab === "inteligente" ? (
        <DashboardInteligente encontros={encontros} catequizandos={catequizandos} atividades={atividades} turma={turma} diarios={diarios} />
      ) : (
        <GeradorDocumentos encontros={encontros} catequizandos={catequizandos} atividades={atividades} turma={turma} org={orgNomes} isPremium={isPremium} onPremiumClick={() => setShowPremiumModal(true)} />
      )}

      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        title="Relatórios Bloqueados" 
        description="Acesse o painel completo de desempenho, engajamento e imprima as fichas da sua turma assinando o Premium."
        icon={<PieChartIcon className="h-10 w-10 text-primary" />}
      />
      </div>

  );
}

// ==========================================
// TAB 1: VISÃO INTELIGENTE (RECHARTS)
// ==========================================
function DashboardInteligente({ encontros, catequizandos, atividades, turma, diarios }: any) {
  // --- Cálculos ---
  const statusData = useMemo(() => {
    let ativos = 0, desistentes = 0, afastados = 0;
    catequizandos.forEach((c: any) => {
      if (c.status === 'ativo') ativos++;
      else if (c.status === 'desistente') desistentes++;
      else afastados++;
    });
    return [
      { name: 'Ativos', value: ativos },
      { name: 'Desistentes', value: desistentes },
      { name: 'Afastados', value: afastados }
    ];
  }, [catequizandos]);

  const sacramentosData = useMemo(() => {
    let batismo = 0, eucaristia = 0, crisma = 0;
    catequizandos.forEach((c: any) => {
      if (c.sacramentos?.batismo?.recebido) batismo++;
      if (c.sacramentos?.eucaristia?.recebido) eucaristia++;
      if (c.sacramentos?.crisma?.recebido) crisma++;
    });
    return [
      { name: 'Batismo', value: batismo },
      { name: '1ª Eucaristia', value: eucaristia },
      { name: 'Crisma', value: crisma }
    ];
  }, [catequizandos]);

  const frequenciaData = useMemo(() => {
    const totalAlunos = catequizandos.filter((c: any) => c.status === 'ativo').length || 1; // prevent div/0
    return encontros
      .filter((e: any) => e.status === 'realizado')
      .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .map((e: any, i: number) => {
        const pres = (e.presencas?.length || 0);
        const taxa = Math.round((pres / totalAlunos) * 100);
        return { name: `E${i+1}`, taxa, data: formatarDataVigente(e.data) };
      }).slice(-10); // Ultimos 10 encontros
  }, [encontros, catequizandos]);

  const avaliacoesEncontro = useMemo(() => {
    let sucesso = 0, parcial = 0, ruim = 0;
    encontros.filter((e:any) => e.status === 'realizado' && e.avaliacao).forEach((e: any) => {
      if (e.avaliacao?.atividadesRealizadas === 'sim') sucesso++;
      else if (e.avaliacao?.atividadesRealizadas === 'nulo') parcial++;
      else ruim++;
    });
    return [
      { name: 'Alcançou Objetivos', value: sucesso, fill: 'hsl(var(--success))' },
      { name: 'Parcial', value: parcial, fill: 'hsl(var(--warning))' },
      { name: 'Não Alcançou', value: ruim, fill: 'hsl(var(--destructive))' }
    ];
  }, [encontros]);

  const encontrosRealizados = encontros.filter((e:any) => e.status === 'realizado').length;
  const planoCompleto = encontros.length > 0 ? Math.round((encontrosRealizados / encontros.length) * 100) : 0;

  // --- Cálculos Caminhada Pastoral (Estrelas) ---
  const pastoralStats = useMemo(() => {
    if (!diarios || diarios.length === 0) return null;
    
    let totais = {
      pontualidade: 0, part_grupo: 0, engajamento: 0,
      ev_espiritual: 0, ev_comportamental: 0,
      count_av: 0, count_ev: 0
    };

    let alunosMap: Record<string, { soma: number; count: number; nome: string }> = {};

    diarios.forEach((d: any) => {
      if (d.avaliacoes_catequizandos && Array.isArray(d.avaliacoes_catequizandos)) {
        d.avaliacoes_catequizandos.forEach((av: any) => {
          if (av.pontualidade > 0 || av.participacao_grupo > 0 || av.engajamento > 0) {
            totais.pontualidade += av.pontualidade || 0;
            totais.part_grupo += av.participacao_grupo || 0;
            totais.engajamento += av.engajamento || 0;
            totais.count_av++;

            if (!alunosMap[av.catequizando_id]) alunosMap[av.catequizando_id] = { soma: 0, count: 0, nome: av.nome };
            const m = ((av.pontualidade||0) + (av.participacao_grupo||0) + (av.engajamento||0)) / 3;
            if (m > 0) {
              alunosMap[av.catequizando_id].soma += m;
              alunosMap[av.catequizando_id].count++;
            }
          }
        });
      }
      if (d.evolucao_catequizandos && Array.isArray(d.evolucao_catequizandos)) {
        d.evolucao_catequizandos.forEach((ev: any) => {
          if (ev.evolucao_espiritual > 0 || ev.evolucao_comportamental > 0) {
            totais.ev_espiritual += ev.evolucao_espiritual || 0;
            totais.ev_comportamental += ev.evolucao_comportamental || 0;
            totais.count_ev++;
          }
        });
      }
    });

    const ranking = Object.values(alunosMap)
      .filter(a => a.count > 0)
      .map(a => ({ nome: a.nome, media: a.soma / a.count }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 5); // Top 5

    return {
      medias: [
        { name: 'Pontualidade', value: totais.count_av > 0 ? (totais.pontualidade / totais.count_av).toFixed(1) : 0 },
        { name: 'Participação', value: totais.count_av > 0 ? (totais.part_grupo / totais.count_av).toFixed(1) : 0 },
        { name: 'Engajamento', value: totais.count_av > 0 ? (totais.engajamento / totais.count_av).toFixed(1) : 0 },
        { name: 'Espiritual', value: totais.count_ev > 0 ? (totais.ev_espiritual / totais.count_ev).toFixed(1) : 0 },
        { name: 'Comportamental', value: totais.count_ev > 0 ? (totais.ev_comportamental / totais.count_ev).toFixed(1) : 0 }
      ],
      ranking
    };
  }, [diarios]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="float-card p-4 space-y-1 border-b-4 border-b-primary/50">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Matriculados</p>
          <div className="text-2xl font-black">{catequizandos.length}</div>
          <p className="text-xs text-muted-foreground">{statusData[0].value} Ativos</p>
        </div>
        <div className="float-card p-4 space-y-1 border-b-4 border-b-success/50">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Encontros Feitos</p>
          <div className="text-2xl font-black">{encontrosRealizados}</div>
          <p className="text-xs text-muted-foreground">de {encontros.length} planejados</p>
        </div>
        <div className="float-card p-4 space-y-1 border-b-4 border-b-blue-500/50">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Média de Presença</p>
          <div className="text-2xl font-black">
            {frequenciaData.length > 0 ? Math.round(frequenciaData.reduce((acc: number, curr: any) => acc + curr.taxa, 0) / frequenciaData.length) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">Histórico recente</p>
        </div>
        <div className="float-card p-4 space-y-1 border-b-4 border-b-accent/50">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Progresso do Ano</p>
          <div className="text-2xl font-black">{planoCompleto}%</div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${planoCompleto}%` }} />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução da Chamada */}
        <div className="float-card p-5 h-[350px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-sm">Frequência em Encontros</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Evolução de presenças (Últimos 10)</p>
          </div>
          <div className="flex-1 min-h-0">
            {frequenciaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={frequenciaData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value) => [`${value}% de presença`, 'Taxa']}
                    labelFormatter={(l, p: any) => `Encontro: ${p[0]?.payload?.data || l}`}
                  />
                  <Line type="monotone" dataKey="taxa" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>
        </div>

        {/* Gráfico 2: Status dos Catequizandos */}
        <div className="float-card p-5 h-[350px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-sm">Retenção de Catequizandos</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Ativos vs Desistência</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center">
            {catequizandos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>
        </div>

        {/* Gráfico 3: Análise de Encontros */}
        <div className="float-card p-5 h-[350px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-sm">Desempenho dos Encontros</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Baseado nas avaliações salvas</p>
          </div>
          <div className="flex-1 min-h-0">
            {avaliacoesEncontro.some(a => a.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={avaliacoesEncontro} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {avaliacoesEncontro.map((entry, index) => <Cell key={`bar-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <NoData txt="Nenhum encontro avaliado ainda." />}
          </div>
        </div>

        {/* Gráfico 4: Sacramento Readiness */}
        <div className="float-card p-5 h-[350px] flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-sm">Perfil Sacramental</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sacramentos já recebidos pela turma</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center">
            {catequizandos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sacramentosData} cx="50%" cy="50%" outerRadius={100} label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} dataKey="value">
                    {sacramentosData.map((entry, index) => <Cell key={`cell-${index}`} fill={S_COLORS[index % S_COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <NoData />}
          </div>
        </div>
      </div>

      {/* Seção: Caminhada Pastoral */}
      {pastoralStats && pastoralStats.medias.some(m => Number(m.value) > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div className="float-card p-5 flex flex-col h-[350px]">
            <div className="mb-4">
              <h3 className="font-bold text-sm text-indigo-600">Caminhada Pastoral — Médias da Turma</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Desempenho com base no Diário (0 a 5)</p>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pastoralStats.medias} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} />
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10, fill: 'hsl(var(--foreground))'}} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} formatter={(val) => [`${val} ⭐`, 'Média']} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20}>
                    {pastoralStats.medias.map((_, index) => <Cell key={`bar-${index}`} fill={S_COLORS[index % S_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="float-card p-5 h-[350px] flex flex-col bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10">
            <div className="mb-4">
              <h3 className="font-bold text-sm text-indigo-700">Destaques da Turma</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Top 5 Maior Engajamento Médio</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {pastoralStats.ranking.map((aluno, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-500/10 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs shrink-0">
                    {i+1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{aluno.nome}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{width: `${(aluno.media/5)*100}%`}} />
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 w-6 text-right">{aluno.media.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const NoData = ({ txt = "Dados Insuficientes" }: { txt?: string }) => (
  <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
    <BarChartIcon className="w-8 h-8 mb-2" />
    <span className="text-xs font-bold uppercase tracking-widest">{txt}</span>
  </div>
);

// ==========================================
// TAB 2: GERADOR DE DOCUMENTOS (PRINT)
// ==========================================

const DOC_TYPES = [
  { id: "ficha_cat", label: "Fichas Individuais", icon: User, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-600" },
  { id: "ficha_enc", label: "Fichas de Encontros", icon: CalendarDays, color: "from-sky-500 to-blue-600", bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-600" },
  { id: "lista_chamada", label: "Grade de Frequência", icon: CheckCircle2, color: "from-emerald-500 to-teal-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-600" },
  { id: "freq_encontros", label: "Frequência por Encontro", icon: Users, color: "from-rose-500 to-pink-600", bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-600" },
  { id: "boletim_turma", label: "Relatório da Turma", icon: FileText, color: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600" },
  { id: "materiais_apoio", label: "Materiais de Apoio", icon: BookOpen, color: "from-indigo-500 to-blue-600", bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-600" },
];

function GeradorDocumentos({ encontros, catequizandos, atividades, turma, org, isPremium, onPremiumClick }: any) {
  const [docTipo, setDocTipo] = useState<string>("ficha_cat");
  const [printTarget, setPrintTarget] = useState<any>(null);

  const hiddenCaptureRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [readyToShareParams, setReadyToShareParams] = useState<any>(null);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Filtros para Relatório de Materiais de Apoio
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "mes" | "periodo">("todos");
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth());
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [freqEncontroId, setFreqEncontroId] = useState<string>("todos");

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const encontrosComMaterial = useMemo(() => {
    return encontros.filter((e: any) => e.materialApoio && e.materialApoio.trim() !== "");
  }, [encontros]);

  const filteredEncontros = useMemo(() => {
    let list = [...encontrosComMaterial];
    list.sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());

    if (filtroTipo === "mes") {
      list = list.filter((e: any) => {
        const d = new Date(e.data + 'T12:00:00');
        return d.getMonth() === mesSelecionado;
      });
    } else if (filtroTipo === "periodo") {
      if (dataInicio) {
        list = list.filter((e: any) => e.data >= dataInicio);
      }
      if (dataFim) {
        list = list.filter((e: any) => e.data <= dataFim);
      }
    }
    return list;
  }, [encontrosComMaterial, filtroTipo, mesSelecionado, dataInicio, dataFim]);

  const getFiltroInfo = () => {
    if (filtroTipo === "todos") return "Todos os Encontros";
    if (filtroTipo === "mes") return `Mês de ${meses[mesSelecionado]}`;
    return `Período de ${dataInicio ? formatarDataVigente(dataInicio) : "Início"} até ${dataFim ? formatarDataVigente(dataFim) : "Fim"}`;
  };

  const selectedType = DOC_TYPES.find(d => d.id === docTipo)!;

  const handlePrint = (target: any) => {
    if (!isPremium) {
      onPremiumClick();
      return;
    }
    setPrintTarget(target);
    setTimeout(() => window.print(), 100);
  };

  const handleCompartilhar = async (target: any) => {
    if (!isPremium) {
      onPremiumClick();
      return;
    }
    setPrintTarget(target);
    setIsGenerating(true);
    setReadyToShareParams(null);
    const toastId = toast.loading("Gerando relatório...");

    setTimeout(async () => {
      try {
        if (!hiddenCaptureRef.current) throw new Error("Elemento não encontrado");
        const element = hiddenCaptureRef.current;

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const ratio = canvasWidth / pageWidth;
        const scaledHeight = canvasHeight / ratio;

        let heightLeft = scaledHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, pageWidth, scaledHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - scaledHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pageWidth, scaledHeight);
          heightLeft -= pageHeight;
        }

        const pdfBlob = pdf.output("blob");
        const reportName = DOC_TYPES.find(d => d.id === docTipo)?.label || "Relatório";
        const fileName = `${reportName}_${target.nome || target.id || 'Turma'}.pdf`;
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });

        toast.dismiss(toastId);

        if (isMobile && navigator.share) {
          setReadyToShareParams({ file, reportName, id: target.id || "unico" });
          toast.success("Pronto! Toque em 'Enviar!'", { duration: 2000 });
        } else {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("PDF baixado com sucesso!");
        }
      } catch (err) {
        console.error("Erro ao gerar PDF", err);
        toast.error("Falha ao gerar o PDF", { id: toastId });
      } finally {
        setIsGenerating(false);
      }
    }, 500); // 500ms para o React renderizar o printTarget no ref
  };

  const handleEnviarAgora = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readyToShareParams) return;
    try {
      await navigator.share({
        title: readyToShareParams.reportName,
        text: `Confira o ${readyToShareParams.reportName}`,
        files: [readyToShareParams.file]
      });
      setReadyToShareParams(null);
    } catch (err) {
      console.error("Erro ao compartilhar", err);
    }
  };

  const printContent = printTarget ? (
    <>
      {docTipo === "ficha_cat" && <Templates.CatequizandoIndividualSheet doc={printTarget} org={org} turma={turma} />}
      {docTipo === "ficha_enc" && <Templates.EncontroFullSheet doc={printTarget} org={org} turma={turma} />}
      {docTipo === "lista_chamada" && <Templates.SemesterAttendanceSheet org={org} turma={turma} catequizandos={catequizandos} encontros={encontros} />}
      {docTipo === "freq_encontros" && <Templates.FrequenciaEncontrosSheet org={org} turma={turma} catequizandos={catequizandos} encontros={encontros} encontroId={printTarget?.freqEncontroId || "todos"} />}
      {docTipo === "boletim_turma" && <Templates.BoletimTurmaSheet org={org} turma={turma} catequizandos={catequizandos} encontros={encontros} />}
      {docTipo === "materiais_apoio" && <Templates.MateriaisApoioSheet org={org} turma={turma} encontros={printTarget?.encontros || []} filtroInfo={printTarget?.filtroInfo || ""} />}
    </>
  ) : null;

  // ---- Renderiza área de impressão via portal no body ----
  const PrintPortal = () => {
    if (!printTarget) return null;
    return createPortal(
      <div className="print-wrapper" style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: '100%', backgroundColor: 'white', zIndex: 999999 }}>
        <div className="bg-white text-black">
          {printContent}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-5 print:m-0 print:p-0 print:space-y-0 animate-fade-in relative">
      
      {/* Hidden container for html2canvas generation */}
      <div className="absolute left-[-9999px] top-0 w-[210mm] pointer-events-none print:hidden">
        <div ref={hiddenCaptureRef} className="bg-white text-black p-0 m-0">
          {printContent}
        </div>
      </div>
      
      {/* Cabeçalho */}
      <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-primary/40 via-primary/20 to-primary/10 print:hidden">
        <div className="flex items-center gap-4 p-5 rounded-[14px] bg-card">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
            <Printer className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground">Documentos & Fichas</h2>
            <p className="text-xs text-muted-foreground">Selecione o tipo de documento e clique para imprimir diretamente.</p>
          </div>
        </div>
      </div>

      {/* Chips de tipo de documento */}
      <div className="print:hidden">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Tipo de Documento</p>
        <div className="grid grid-cols-2 gap-2.5">
          {DOC_TYPES.map(dt => {
            const Icon = dt.icon;
            const isActive = docTipo === dt.id;
            return (
              <button
                key={dt.id}
                onClick={() => setDocTipo(dt.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left font-bold text-sm active:scale-[0.97]",
                  isActive
                    ? `${dt.bg} ${dt.border} ${dt.text} shadow-sm scale-[1.02]`
                    : "border-black/10 bg-card text-muted-foreground hover:border-black/25"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all", isActive ? `bg-gradient-to-br ${dt.color}` : "bg-muted/50")}>
                  <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-muted-foreground")} />
                </div>
                <span className="leading-tight text-xs">{dt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de itens a imprimir */}
      <div className="print:hidden">
        <div className={cn("p-[2px] rounded-2xl bg-gradient-to-br", selectedType.color)}>
          <div className="rounded-[14px] bg-card overflow-hidden">
            {/* Header da lista */}
            <div className={cn("px-5 py-3.5 flex items-center gap-2.5", selectedType.bg)}>
              <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", selectedType.color)}>
                {(() => { const Icon = selectedType.icon; return <Icon className="h-4 w-4 text-white" />; })()}
              </div>
              <div>
                <p className={cn("text-xs font-black uppercase tracking-widest", selectedType.text)}>{selectedType.label}</p>
                <p className="text-[10px] text-muted-foreground">Clique em um item para imprimir</p>
              </div>
            </div>

            {/* Listagem dinâmica */}
            <div className="divide-y divide-black/5">
              {docTipo === "ficha_cat" && (
                catequizandos.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Nenhum catequizando cadastrado</div>
                ) : (
                  catequizandos.map((cat: any) => (
                    <div
                      key={cat.id}
                      className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 hover:bg-violet-500/5 transition-colors gap-3 border-b border-black/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-500/10 flex items-center justify-center text-sm font-black text-violet-600 shrink-0">
                          {cat.nome?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{cat.nome}</p>
                          <p className="text-[11px] text-muted-foreground">{cat.status || 'ativo'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => handlePrint(cat)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-violet-600 bg-violet-500/10 px-3 py-2 rounded-xl border border-violet-500/20 hover:bg-violet-500/20 transition-colors active:scale-95">
                          <Printer className="h-3 w-3 shrink-0" /> Imprimir
                        </button>
                        {readyToShareParams?.id === cat.id ? (
                          <button onClick={handleEnviarAgora} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-white bg-[#25D366] px-3 py-2 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse">
                            <Share2 className="h-3 w-3 shrink-0" /> Enviar!
                          </button>
                        ) : (
                          <button disabled={isGenerating} onClick={() => handleCompartilhar(cat)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors active:scale-95 disabled:opacity-50">
                            <Share2 className={cn("h-3 w-3 shrink-0", isGenerating && printTarget?.id === cat.id && "animate-spin")} /> 
                            {isGenerating && printTarget?.id === cat.id ? "Aguarde" : "Compartilhar"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}

              {docTipo === "ficha_enc" && (
                encontros.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Nenhum encontro cadastrado</div>
                ) : (
                  [...encontros].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((enc: any) => (
                    <div
                      key={enc.id}
                      className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-4 hover:bg-sky-500/5 transition-colors gap-3 border-b border-black/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                          <CalendarDays className="h-4 w-4 text-sky-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground truncate max-w-[180px]">{enc.tema}</p>
                          <p className="text-[11px] text-muted-foreground">{formatarDataVigente(enc.data)} • {enc.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => handlePrint(enc)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-sky-600 bg-sky-500/10 px-3 py-2 rounded-xl border border-sky-500/20 hover:bg-sky-500/20 transition-colors active:scale-95">
                          <Printer className="h-3 w-3 shrink-0" /> Imprimir
                        </button>
                        {readyToShareParams?.id === enc.id ? (
                          <button onClick={handleEnviarAgora} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-white bg-[#25D366] px-3 py-2 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse">
                            <Share2 className="h-3 w-3 shrink-0" /> Enviar!
                          </button>
                        ) : (
                          <button disabled={isGenerating} onClick={() => handleCompartilhar(enc)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-500/10 px-3 py-2 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors active:scale-95 disabled:opacity-50">
                            <Share2 className={cn("h-3 w-3 shrink-0", isGenerating && printTarget?.id === enc.id && "animate-spin")} /> 
                            {isGenerating && printTarget?.id === enc.id ? "Aguarde" : "Compartilhar"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}

              {docTipo === "lista_chamada" && (
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-5 hover:bg-emerald-500/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Grade de Frequência — {turma.nome}</p>
                      <p className="text-[11px] text-muted-foreground">{catequizandos.filter((c: any) => c.status === 'ativo').length} catequizandos ativos • 15 colunas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                    <button onClick={() => handlePrint(turma)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-3 py-2.5 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors active:scale-95">
                      <Printer className="h-3 w-3 shrink-0" /> Imprimir
                    </button>
                    {readyToShareParams?.id === turma.id ? (
                      <button onClick={handleEnviarAgora} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-white bg-[#25D366] px-3 py-2.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse">
                        <Share2 className="h-3 w-3 shrink-0" /> Enviar!
                      </button>
                    ) : (
                      <button disabled={isGenerating} onClick={() => handleCompartilhar(turma)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-500/10 px-3 py-2.5 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors active:scale-95 disabled:opacity-50">
                        <Share2 className={cn("h-3 w-3 shrink-0", isGenerating && printTarget?.id === turma.id && "animate-spin")} /> 
                        {isGenerating && printTarget?.id === turma.id ? "Aguarde" : "Compartilhar"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {docTipo === "freq_encontros" && (
                <div className="p-5 space-y-5 bg-card">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Selecionar Encontro</p>
                    <select
                      className="w-full h-11 px-3 text-sm font-semibold rounded-xl border-2 border-black/10 bg-white focus:outline-none focus:border-rose-500"
                      value={freqEncontroId}
                      onChange={(e) => setFreqEncontroId(e.target.value)}
                    >
                      <option value="todos">Todos os Encontros</option>
                      {encontros.filter((e: any) => e.status === 'realizado').sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((e: any) => (
                        <option key={e.id} value={e.id}>{new Date(e.data + 'T12:00:00').toLocaleDateString('pt-BR')} - {e.tema}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handlePrint({ freqEncontroId, id: `freq-${freqEncontroId}` })}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl transition-colors font-bold shadow-sm shadow-rose-600/20"
                    >
                      <Printer className="h-4 w-4" /> Imprimir Relatório
                    </button>
                    {readyToShareParams?.id === `freq-${freqEncontroId}` ? (
                      <button onClick={handleEnviarAgora} className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-[#25D366] hover:bg-[#1EBE5A] active:bg-[#19A64D] text-white rounded-xl transition-colors font-bold shadow-sm shadow-[#25D366]/20 animate-pulse">
                        <Share2 className="h-4 w-4 shrink-0" /> Enviar Agora!
                      </button>
                    ) : (
                      <button disabled={isGenerating} onClick={() => handleCompartilhar({ freqEncontroId, id: `freq-${freqEncontroId}` })} className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl transition-colors font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50">
                        <Share2 className={cn("h-4 w-4 shrink-0", isGenerating && printTarget?.id === `freq-${freqEncontroId}` && "animate-spin")} /> 
                        {isGenerating && printTarget?.id === `freq-${freqEncontroId}` ? "Aguarde..." : "Compartilhar"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {docTipo === "boletim_turma" && (
                <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between px-5 py-5 hover:bg-amber-500/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Relatório Resumo — {turma.nome}</p>
                      <p className="text-[11px] text-muted-foreground">Visão geral da turma formatada para A4</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                    <button onClick={() => handlePrint(turma)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-3 py-2.5 rounded-xl border border-amber-500/20 hover:bg-amber-500/20 transition-colors active:scale-95">
                      <Printer className="h-3 w-3 shrink-0" /> Imprimir
                    </button>
                    {readyToShareParams?.id === turma.id ? (
                      <button onClick={handleEnviarAgora} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-white bg-[#25D366] px-3 py-2.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse">
                        <Share2 className="h-3 w-3 shrink-0" /> Enviar!
                      </button>
                    ) : (
                      <button disabled={isGenerating} onClick={() => handleCompartilhar(turma)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-500/10 px-3 py-2.5 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-colors active:scale-95 disabled:opacity-50">
                        <Share2 className={cn("h-3 w-3 shrink-0", isGenerating && printTarget?.id === turma.id && "animate-spin")} /> 
                        {isGenerating && printTarget?.id === turma.id ? "Aguarde" : "Compartilhar"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {docTipo === "materiais_apoio" && (
                <div className="p-5 space-y-5 bg-card">
                  {/* Controles de Filtro */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Filtrar por</p>
                    <div className="flex gap-2">
                      {["todos", "mes", "periodo"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFiltroTipo(t as any)}
                          className={cn(
                            "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                            filtroTipo === t
                              ? "bg-indigo-600 text-white shadow-sm scale-105"
                              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                          )}
                        >
                          {t === "todos" ? "Todos" : t === "mes" ? "Por Mês" : "Por Período"}
                        </button>
                      ))}
                    </div>

                    {filtroTipo === "mes" && (
                      <div className="flex flex-col gap-1.5 pt-2 animate-fade-in">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Selecione o Mês</label>
                        <select
                          value={mesSelecionado}
                          onChange={(e) => setMesSelecionado(Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 text-sm bg-background border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          {meses.map((m, idx) => (
                            <option key={idx} value={idx}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {filtroTipo === "periodo" && (
                      <div className="grid grid-cols-2 gap-3 pt-2 animate-fade-in">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data Inicial</label>
                          <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-background border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data Final</label>
                          <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-background border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão de Imprimir e Compartilhar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handlePrint({ encontros: filteredEncontros, filtroInfo: getFiltroInfo() })}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-md shadow-indigo-600/10"
                    >
                      <Printer className="h-4 w-4 shrink-0" /> Imprimir Relatório ({filteredEncontros.length})
                    </button>
                    {readyToShareParams?.id === "materiais_apoio" ? (
                      <button onClick={handleEnviarAgora} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-[#25D366] hover:bg-[#1EBE5A] active:bg-[#19A64D] text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-md shadow-[#25D366]/20 animate-pulse">
                        <Share2 className="h-4 w-4 shrink-0" /> Enviar Agora!
                      </button>
                    ) : (
                      <button disabled={isGenerating} onClick={() => handleCompartilhar({ encontros: filteredEncontros, filtroInfo: getFiltroInfo(), id: "materiais_apoio" })} className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-md shadow-green-600/10 disabled:opacity-50">
                        <Share2 className={cn("h-4 w-4 shrink-0", isGenerating && printTarget?.id === "materiais_apoio" && "animate-spin")} /> 
                        {isGenerating && printTarget?.id === "materiais_apoio" ? "Aguarde..." : "Compartilhar"}
                      </button>
                    )}
                  </div>

                  {/* Pré-visualização dos itens */}
                  <div className="pt-4 border-t border-black/5 space-y-3">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lista de Materiais de Apoio ({filteredEncontros.length})</p>
                    
                    {filteredEncontros.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground italic bg-muted/20 rounded-2xl border border-dashed border-black/5">
                        Nenhum material de apoio encontrado para os filtros selecionados.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {filteredEncontros.map((enc: any) => (
                          <div key={enc.id} className="p-4 bg-muted/30 rounded-2xl border border-black/5 hover:bg-muted/50 transition-all">
                            <div className="flex justify-between items-center gap-4 mb-2">
                              <span className="text-[10px] font-bold text-foreground truncate max-w-[200px]">
                                {enc.tema}
                              </span>
                              <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/30 shrink-0">
                                {formatarDataVigente(enc.data)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-serif whitespace-pre-wrap leading-relaxed">
                              {enc.materialApoio}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Área de impressão (portal no body, invisível na tela, visível só no print) */}
      <PrintPortal />
    </div>
  );
}
