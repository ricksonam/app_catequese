import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PieChart as PieChartIcon, FileText, Printer, CheckCircle2, XCircle, User, CalendarDays, BarChartIcon } from "lucide-react";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn, formatarDataVigente } from "@/lib/utils";
import * as Templates from "@/components/reports/ReportTemplates";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];
const S_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

export default function RelatoriosTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"inteligente" | "documentos">("inteligente");

  const { data: turmas = [], isLoading: loadingT } = useTurmas();
  const { data: encontros = [], isLoading: loadingE } = useEncontros(id);
  const { data: catequizandos = [], isLoading: loadingC } = useCatequizandos(id);
  const { data: atividades = [], isLoading: loadingA } = useAtividades(id);
  const { data: paroquias = [], isLoading: loadingP } = useParoquias();
  const { data: comunidades = [], isLoading: loadingCom } = useComunidades();

  const turma = turmas.find(t => t.id === id);

  // Fallback: se não encontrar a turma, redireciona para a primeira disponível ou lista de turmas
  if (!loadingT && turmas.length > 0 && !turma) {
    navigate(`/turmas/${turmas[0].id}/relatorios`, { replace: true });
    return null;
  }

  if (loadingT || loadingE || loadingC || loadingA || loadingP || loadingCom) {
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
          <button onClick={() => navigate(`/turmas/${id}`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Relatórios da Turma
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{turma.nome} • {turma.etapa}</p>
          </div>
        </div>
      </div>


      <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl print:hidden">
        <button 
          onClick={() => setTab("inteligente")}
          className={cn("flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all", tab === "inteligente" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:bg-white/50")}
        >
          <PieChartIcon className="h-4 w-4" /> Visão Inteligente
        </button>
        <button 
          onClick={() => setTab("documentos")}
          className={cn("flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all", tab === "documentos" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:bg-white/50")}
        >
          <FileText className="h-4 w-4" /> Documentos e Fichas
        </button>
      </div>

      {tab === "inteligente" ? (
        <DashboardInteligente encontros={encontros} catequizandos={catequizandos} atividades={atividades} turma={turma} />
      ) : (
        <GeradorDocumentos encontros={encontros} catequizandos={catequizandos} atividades={atividades} turma={turma} org={orgNomes} />
      )}
    </div>
  );
}

// ==========================================
// TAB 1: VISÃO INTELIGENTE (RECHARTS)
// ==========================================
function DashboardInteligente({ encontros, catequizandos, atividades, turma }: any) {
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
  { id: "boletim_turma", label: "Relatório da Turma", icon: FileText, color: "from-amber-500 to-orange-600", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-600" },
];

function GeradorDocumentos({ encontros, catequizandos, atividades, turma, org }: any) {
  const [docTipo, setDocTipo] = useState<string>("ficha_cat");
  const [printTarget, setPrintTarget] = useState<any>(null);

  const selectedType = DOC_TYPES.find(d => d.id === docTipo)!;

  const handlePrint = (target: any) => {
    setPrintTarget(target);
    setTimeout(() => window.print(), 100);
  };

  // ---- Renderiza área de impressão via portal no body ----
  const PrintPortal = () => {
    if (!printTarget) return null;

    const content = (
      <>
        {docTipo === "ficha_cat" && <Templates.CatequizandoIndividualSheet doc={printTarget} org={org} turma={turma} />}
        {docTipo === "ficha_enc" && <Templates.EncontroFullSheet doc={printTarget} org={org} turma={turma} />}
        {docTipo === "lista_chamada" && <Templates.SemesterAttendanceSheet org={org} turma={turma} catequizandos={catequizandos} encontros={encontros} />}
        {docTipo === "boletim_turma" && <Templates.BoletimTurmaSheet org={org} turma={turma} catequizandos={catequizandos} encontros={encontros} />}
      </>
    );

    return createPortal(
      <div className="print-wrapper" style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: '100%', backgroundColor: 'white', zIndex: 999999 }}>
        <div className="bg-white text-black">
          {content}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="space-y-5 print:m-0 print:p-0 print:space-y-0 animate-fade-in">
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
                    <button
                      key={cat.id}
                      onClick={() => handlePrint(cat)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-violet-500/5 active:bg-violet-500/10 transition-colors text-left group"
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
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 bg-violet-500/10 px-2.5 py-1.5 rounded-xl border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                        <Printer className="h-3 w-3" /> Imprimir
                      </div>
                    </button>
                  ))
                )
              )}

              {docTipo === "ficha_enc" && (
                encontros.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Nenhum encontro cadastrado</div>
                ) : (
                  [...encontros].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()).map((enc: any) => (
                    <button
                      key={enc.id}
                      onClick={() => handlePrint(enc)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-sky-500/5 active:bg-sky-500/10 transition-colors text-left group"
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
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-600 bg-sky-500/10 px-2.5 py-1.5 rounded-xl border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors shrink-0">
                        <Printer className="h-3 w-3" /> Imprimir
                      </div>
                    </button>
                  ))
                )
              )}

              {docTipo === "lista_chamada" && (
                <button
                  onClick={() => handlePrint(turma)}
                  className="w-full flex items-center justify-between px-5 py-5 hover:bg-emerald-500/5 active:bg-emerald-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Grade de Frequência — {turma.nome}</p>
                      <p className="text-[11px] text-muted-foreground">{catequizandos.filter((c: any) => c.status === 'ativo').length} alunos ativos • 15 colunas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors shrink-0">
                    <Printer className="h-3 w-3" /> Imprimir
                  </div>
                </button>
              )}

              {docTipo === "boletim_turma" && (
                <button
                  onClick={() => handlePrint(turma)}
                  className="w-full flex items-center justify-between px-5 py-5 hover:bg-amber-500/5 active:bg-amber-500/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">Relatório Resumo — {turma.nome}</p>
                      <p className="text-[11px] text-muted-foreground">Visão geral da turma formatada para A4</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors shrink-0">
                    <Printer className="h-3 w-3" /> Imprimir
                  </div>
                </button>
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
