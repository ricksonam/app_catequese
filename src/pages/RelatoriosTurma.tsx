import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PieChart as PieChartIcon, FileText, Printer, CheckCircle2, XCircle, User, CalendarDays, BarChartIcon } from "lucide-react";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn, formatarDataVigente } from "@/lib/utils";

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

  if (loadingT || loadingE || loadingC || loadingA || loadingP || loadingCom) {
    return <div className="flex justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;
  }

  if (!turma) {
    return <div className="text-center py-20">Turma não encontrada.</div>;
  }

  const comunidade = comunidades.find(c => c.id === turma.comunidadeId);
  const paroquia = paroquias.find(p => p.id === comunidade?.paroquiaId);
  const orgNomes = { 
    paroquia: paroquia?.nome || "Paróquia não informada", 
    comunidade: comunidade?.nome || "Comunidade não informada" 
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0 print:space-y-0">
      <div className="flex items-center gap-3 print:hidden">
        <button onClick={() => navigate(`/turmas/${id}`)} className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Central de Relatórios</h1>
          <p className="text-xs text-muted-foreground">{turma.nome} • {turma.etapa}</p>
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

  // ---- Renderiza área de impressão ----
  const PrintArea = () => {
    if (!printTarget) return null;

    if (docTipo === "ficha_cat") {
      const cat = printTarget;
      return (
        <div className="hidden print:block w-full text-black font-sans leading-relaxed">
          <div className="border-b-4 border-black pb-4 mb-8 text-center space-y-2">
            <h1 className="text-3xl font-black uppercase">Ficha Cadastral do Catequizando</h1>
            <p className="text-lg">Paróquia: {org.paroquia} • Comunidade: {org.comunidade}</p>
            <p className="font-bold">Turma: {turma.nome}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-8 border border-neutral-300 p-6 rounded-lg">
            <div><p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Nome Completo</p><p className="text-xl font-bold">{cat.nome}</p></div>
            <div><p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Data de Nascimento</p><p className="text-lg font-bold">{new Date(cat.dataNascimento).toLocaleDateString("pt-BR")}</p></div>
            <div className="col-span-2"><p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Responsável</p><p className="text-lg font-bold">{cat.responsavel}</p><p className="text-sm mt-1">{cat.telefone} • {cat.email}</p></div>
            <div className="col-span-2"><p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Endereço</p><p className="text-sm">{cat.endereco}, {cat.numero} - {cat.bairro}</p></div>
          </div>
          <div className="mb-8">
            <h3 className="font-black text-lg border-b border-black pb-2 mb-4">Informações Sacramentais</h3>
            <div className="grid grid-cols-3 gap-4">
              {[["Batismo", cat.sacramentos?.batismo], ["1ª Eucaristia", cat.sacramentos?.eucaristia], ["Crisma", cat.sacramentos?.crisma]].map(([label, s]: any) => (
                <div key={label} className={cn("p-4 border rounded", s?.recebido ? "bg-gray-100" : "")}>
                  <p className="font-bold uppercase text-xs">{label}</p>
                  <p>{s?.recebido ? "Sim" : "Não"}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex gap-12 font-bold justify-center">
            <div className="text-center flex-1"><div className="border-t border-black pt-2">Assinatura do Catequista</div></div>
            <div className="text-center flex-1"><div className="border-t border-black pt-2">Assinatura do Responsável</div></div>
          </div>
        </div>
      );
    }

    if (docTipo === "ficha_enc") {
      const enc = printTarget;
      return (
        <div className="hidden print:block w-full text-black font-sans leading-relaxed">
          <div className="border-y-4 border-black py-4 mb-8 text-center bg-gray-100">
            <h1 className="text-2xl font-black uppercase">Ficha Técnica de Encontro</h1>
            <p className="text-sm font-bold tracking-widest">{org.comunidade}</p>
          </div>
          <div className="p-6 border-2 border-black rounded-lg mb-8">
            <span className="text-xs font-black uppercase text-gray-500 tracking-widest block mb-2">Tema Principal</span>
            <h2 className="text-3xl font-black">{enc.tema}</h2>
            {enc.leituraBiblica && <p className="mt-4 font-serif italic text-lg border-l-4 border-gray-400 pl-4">Bíblia: {enc.leituraBiblica}</p>}
          </div>
          <div className="mb-8"><h3 className="font-black text-lg border-b border-black pb-2 mb-4 uppercase">Roteiro Planejado</h3>
            {enc.roteiro?.map((r: any, i: number) => (
              <div key={i} className="flex gap-4 border-b pb-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">{i+1}</span>
                <div><p className="font-black uppercase text-sm">{r.label} <span className="text-gray-500 text-xs font-normal">({r.tempo} min)</span></p><p className="text-sm mt-1">{r.conteudo}</p></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (docTipo === "lista_chamada") {
      return (
        <div className="hidden print:block w-full text-black font-sans text-xs">
          <h1 className="text-2xl font-black uppercase text-center mb-1">Diário de Classe - Frequência</h1>
          <p className="text-center text-sm font-bold mb-4">Turma: {turma.nome} • Paróquia: {org.paroquia}</p>
          <table className="w-full border-collapse border border-black mb-8">
            <thead><tr className="bg-gray-200">
              <th className="border border-black p-2 w-8">#</th>
              <th className="border border-black p-2 text-left">NOME DO CATEQUIZANDO</th>
              {Array.from({length: 15}).map((_, i) => (<th key={i} className="border border-black p-1 w-8 text-[8px]">{`E${i+1}`}</th>))}
              <th className="border border-black p-2 w-12">%</th>
            </tr></thead>
            <tbody>
              {catequizandos.filter((c: any) => c.status === 'ativo').map((c: any, i: number) => (
                <tr key={c.id}>
                  <td className="border border-black p-2 text-center">{i+1}</td>
                  <td className="border border-black p-2 font-bold">{c.nome}</td>
                  {Array.from({length: 15}).map((_, j) => (<td key={j} className="border border-black p-1"></td>))}
                  <td className="border border-black p-2 bg-gray-50"></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs italic text-gray-600">Legenda: P (Presente) • F (Falta) • J (Falta Justificada)</p>
        </div>
      );
    }

    if (docTipo === "boletim_turma") {
      const ativos = catequizandos.filter((c: any) => c.status === 'ativo').length;
      return (
        <div className="hidden print:block w-full text-black font-sans leading-relaxed">
          <div className="text-center mb-10 border-b-2 border-black pb-6">
            <h1 className="text-3xl font-black uppercase">Relatório Resumo da Turma</h1>
            <p className="text-lg italic mt-2">Paróquia: {org.paroquia} • {formatarDataVigente(new Date().toISOString())}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-2">Dados da Turma</h3>
              <p className="text-xl font-black mb-1">{turma.nome}</p>
              <p>Etapa: {turma.etapa} • Ano: {turma.ano}</p>
            </div>
            <div className="p-6 border rounded-xl bg-gray-50">
              <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-2">Métricas</h3>
              <p className="font-bold">Total: {catequizandos.length}</p>
              <p className="font-bold text-green-700">Ativos: {ativos}</p>
              <p className="font-bold text-red-700">Desistentes: {catequizandos.length - ativos}</p>
            </div>
          </div>
          <h3 className="text-lg font-black uppercase border-b border-black pb-2 mb-4">Progresso de Encontros</h3>
          <p className="mb-1 font-bold">Planejados: {encontros.length}</p>
          <p className="mb-1 font-bold text-green-700">Realizados: {encontros.filter((e: any) => e.status === 'realizado').length}</p>
          <p className="mb-10 font-bold text-yellow-600">Pendentes: {encontros.filter((e: any) => e.status === 'pendente').length}</p>
        </div>
      );
    }

    return null;
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

      {/* Área de impressão (invisível na tela, visível só no print) */}
      <PrintArea />
    </div>
  );
}
