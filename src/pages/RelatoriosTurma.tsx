import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PieChart as PieChartIcon, FileText, Printer, CheckCircle2, XCircle, User, CalendarDays, BarChartIcon } from "lucide-react";
import { useTurmas, useEncontros, useCatequizandos, useAtividades, useParoquias, useComunidades } from "@/hooks/useSupabaseData";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"/></div>;
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
function GeradorDocumentos({ encontros, catequizandos, atividades, turma, org }: any) {
  const [docTipo, setDocTipo] = useState<"ficha_cat" | "ficha_enc" | "lista_chamada" | "boletim_turma">("ficha_cat");
  const [targetId, setTargetId] = useState<string>("");

  const handlePrint = () => {
    if (docTipo === "ficha_cat" || docTipo === "ficha_enc") {
      if (!targetId) return;
    }
    window.print();
  };

  const RenderPrintableArea = () => {
    switch (docTipo) {
      case "ficha_cat":
        const cat = catequizandos.find((c:any) => c.id === targetId);
        if (!cat) return null;
        return (
          <div className="hidden print:block w-full text-black font-sans leading-relaxed print:break-inside-avoid">
            <div className="border-b-4 border-black pb-4 mb-8 text-center space-y-2">
              <h1 className="text-3xl font-black uppercase">Ficha Cadastral do Catequizando</h1>
              <p className="text-lg">Paróquia: {org.paroquia} • Comunidade: {org.comunidade}</p>
              <p className="font-bold">Turma: {turma.nome}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8 border border-neutral-300 p-6 rounded-lg">
              <div>
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Nome Completo</p>
                <p className="text-xl font-bold">{cat.nome}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Data de Nascimento</p>
                <p className="text-lg font-bold">{new Date(cat.dataNascimento).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Responsável</p>
                <p className="text-lg font-bold">{cat.responsavel}</p>
                <p className="text-sm mt-1">{cat.telefone} • {cat.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Endereço Completo</p>
                <p className="text-sm">{cat.endereco}, {cat.numero} - {cat.bairro} ({cat.complemento})</p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-black text-lg border-b border-black pb-2 mb-4">Informações Sacramentais</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className={cn("p-4 border rounded", cat.sacramentos?.batismo?.recebido ? "bg-gray-100" : "")}>
                  <p className="font-bold uppercase text-xs">Batismo</p>
                  <p>{cat.sacramentos?.batismo?.recebido ? "Sim" : "Não"}</p>
                  {cat.sacramentos?.batismo?.data && <p className="text-xs">Data: {new Date(cat.sacramentos.batismo.data).toLocaleDateString()}</p>}
                </div>
                <div className={cn("p-4 border rounded", cat.sacramentos?.eucaristia?.recebido ? "bg-gray-100" : "")}>
                  <p className="font-bold uppercase text-xs">1ª Eucaristia</p>
                  <p>{cat.sacramentos?.eucaristia?.recebido ? "Sim" : "Não"}</p>
                </div>
                <div className={cn("p-4 border rounded", cat.sacramentos?.crisma?.recebido ? "bg-gray-100" : "")}>
                  <p className="font-bold uppercase text-xs">Crisma</p>
                  <p>{cat.sacramentos?.crisma?.recebido ? "Sim" : "Não"}</p>
                </div>
              </div>
            </div>

            {cat.necessidadeEspecial && (
              <div className="mb-8 p-4 border-2 border-dashed border-neutral-400 rounded-lg bg-neutral-50">
                <p className="font-black text-sm uppercase text-neutral-600 mb-1">Necessidades Especiais (Atenção)</p>
                <p className="font-bold">{cat.necessidadeEspecial}</p>
              </div>
            )}

            <div className="mt-20 flex gap-12 font-bold justify-center items-center">
               <div className="text-center flex-1">
                 <div className="border-t border-black pt-2">Assinatura do Catequista</div>
               </div>
               <div className="text-center flex-1">
                 <div className="border-t border-black pt-2">Assinatura do Responsável</div>
               </div>
            </div>
          </div>
        );

      case "lista_chamada":
        return (
          <div className="hidden print:block w-full text-black font-sans text-xs print:break-inside-avoid">
            <h1 className="text-2xl font-black uppercase text-center mb-1">Diário de Classe - Frequência</h1>
            <p className="text-center text-sm font-bold mb-1">Paróquia: {org.paroquia} • Comunidade: {org.comunidade}</p>
            <p className="text-center text-sm font-bold mb-4">Turma: {turma.nome} • Ano CATEQUÉTICO: {turma.ano}</p>
            
            <table className="w-full border-collapse border border-black mb-8">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2 w-8">#</th>
                  <th className="border border-black p-2 text-left">NOME DO CATEQUIZANDO</th>
                  {Array.from({length: 15}).map((_, i) => (
                    <th key={i} className="border border-black p-1 w-8 text-[8px] uppercase font-normal">{`Enc ${i+1}`}</th>
                  ))}
                  <th className="border border-black p-2 w-12 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {catequizandos.filter((c:any) => c.status === 'ativo').map((c:any, i:number) => (
                  <tr key={c.id}>
                    <td className="border border-black p-2 text-center">{i + 1}</td>
                    <td className="border border-black p-2 font-bold">{c.nome}</td>
                    {Array.from({length: 15}).map((_, i) => (
                      <td key={i} className="border border-black p-1 text-center"></td>
                    ))}
                    <td className="border border-black p-2 text-center bg-gray-50"></td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <p className="text-xs italic text-gray-600">Legenda: P (Presente) • F (Falta) • J (Falta Justificada)</p>
          </div>
        );

      case "boletim_turma":
        const ativos = catequizandos.filter((c:any) => c.status === 'ativo').length;
        const faltasEncontros = encontros.filter((e:any) => e.status === 'pendente').length;
        return (
           <div className="hidden print:block w-full text-black font-sans leading-relaxed print:break-inside-avoid">
              <div className="text-center mb-10 border-b-2 border-black pb-6">
                <h1 className="text-3xl font-black uppercase">Relatório Resumo da Turma</h1>
                <p className="text-lg italic mt-2">Paróquia: {org.paroquia} • {formatarDataVigente(new Date().toISOString())}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="p-6 border rounded-xl bg-gray-50">
                  <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-2">Dados da Turma</h3>
                  <p className="text-xl font-black mb-1">{turma.nome}</p>
                  <p>Etapa: {turma.etapa} • Ano: {turma.ano}</p>
                  <p>Horário: {turma.diaCatequese} às {turma.horario}</p>
                </div>
                <div className="p-6 border rounded-xl bg-gray-50">
                  <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-2">Métricas Básicas</h3>
                  <p className="text-lg font-bold">Total Matriculados: {catequizandos.length}</p>
                  <p className="text-lg font-bold text-green-700">Ativos: {ativos}</p>
                  <p className="text-lg font-bold text-red-700">Desistentes/Afastados: {catequizandos.length - ativos}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black uppercase border-b border-black pb-2 mb-4">Progresso de Encontros</h3>
                <p className="mb-2 font-bold">Encontros Planejados Totais: {encontros.length}</p>
                <p className="mb-2 font-bold text-green-700">Encontros Realizados: {encontros.filter((e:any) => e.status === 'realizado').length}</p>
                <p className="mb-10 font-bold text-yellow-600">Encontros Pendentes: {faltasEncontros}</p>
              </div>

              <div>
                <h3 className="text-lg font-black uppercase border-b border-black pb-2 mb-4">Atividades Realizadas</h3>
                {atividades.length === 0 ? <p>Nenhuma atividade registrada.</p> : (
                  <ul className="list-disc pl-6 space-y-2">
                    {atividades.map((a:any) => (
                      <li key={a.id}><strong>{a.nome}</strong> - {new Date(a.data).toLocaleDateString()} ({a.tipo})</li>
                    ))}
                  </ul>
                )}
              </div>
           </div>
        );

      case "ficha_enc":
        const enc = encontros.find((e:any) => e.id === targetId);
        if (!enc) return null;
        return (
          <div className="hidden print:block w-full text-black font-sans leading-relaxed print:break-inside-avoid">
            <div className="border-y-4 border-black py-4 mb-8 text-center bg-gray-100">
              <h1 className="text-2xl font-black uppercase">Ficha Técnica de Encontro</h1>
              <p className="text-sm font-bold tracking-widest">{org.comunidade}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="p-4 border rounded-lg"><span className="text-xs font-black uppercase text-gray-500">Turma</span><p className="font-bold">{turma.nome}</p></div>
               <div className="p-4 border rounded-lg"><span className="text-xs font-black uppercase text-gray-500">Data e Status</span><p className="font-bold">{formatarDataVigente(enc.data)} • {enc.status.toUpperCase()}</p></div>
            </div>

            <div className="p-6 border-2 border-black rounded-lg mb-8">
              <span className="text-xs font-black uppercase text-gray-500 tracking-widest block mb-2">Tema Principal</span>
              <h2 className="text-3xl font-black">{enc.tema}</h2>
              {enc.leituraBiblica && <p className="mt-4 font-serif italic text-lg border-l-4 border-gray-400 pl-4">Biblia: {enc.leituraBiblica}</p>}
            </div>

            <div className="mb-8">
              <h3 className="font-black text-lg border-b border-black pb-2 mb-4 uppercase">Roteiro Planejado</h3>
              {enc.roteiro?.length === 0 ? <p className="italic text-gray-500">Sem roteiro definido.</p> : (
                <div className="space-y-4">
                  {enc.roteiro.map((r:any, i:number) => (
                    <div key={i} className="flex gap-4 border-b pb-2">
                       <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">{i+1}</span>
                       <div>
                         <p className="font-black uppercase text-sm">{r.label} <span className="text-gray-500 text-xs font-normal">({r.tempo} min)</span></p>
                         <p className="text-sm mt-1">{r.conteudo}</p>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {enc.avaliacao && (
              <div className="p-6 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50">
                <h3 className="font-black text-sm uppercase text-gray-600 mb-4">Avaliação do Encontro</h3>
                <p><strong>Atividades Realizadas com Sucesso?</strong> {enc.avaliacao.atividadesRealizadas.toUpperCase()}</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Pontos Positivos:</strong> {enc.avaliacao.pontosPositivos}</div>
                  <div><strong>Melhorias:</strong> {enc.avaliacao.pontosMelhorar}</div>
                  <div className="col-span-2"><strong>Conclusão:</strong> {enc.avaliacao.conclusao}</div>
                </div>
              </div>
            )}
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0 print:space-y-0">
      <div className="float-card p-6 border-l-4 border-l-primary print:hidden">
        <div className="flex items-start gap-4 mb-6">
           <div className="p-3 bg-primary/10 rounded-xl"><Printer className="h-6 w-6 text-primary" /></div>
           <div>
             <h2 className="text-lg font-bold">Central de Emissão de Documentos</h2>
             <p className="text-sm text-muted-foreground">Gere PDFs e relatórios formatados estritamente para impressão A4. Selecione o tipo de documento abaixo.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Tipo de Documento</label>
            <Select value={docTipo} onValueChange={(v:any) => { setDocTipo(v); setTargetId(""); }}>
              <SelectTrigger className="h-12 bg-white rounded-xl font-semibold border-primary/20">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ficha_cat">Ficha do Catequizando (Individual)</SelectItem>
                <SelectItem value="ficha_enc">Roteiro/Ficha de Encontro (Individual)</SelectItem>
                <SelectItem value="lista_chamada">Grade de Frequência (Diário de Classe)</SelectItem>
                <SelectItem value="boletim_turma">Relatório Resumo da Turma (Geral)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {docTipo === "ficha_cat" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Selecione o Catequizando</label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="h-12 bg-white rounded-xl border-accent/20">
                  <SelectValue placeholder="Escolha..." />
                </SelectTrigger>
                <SelectContent>
                  {catequizandos.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {docTipo === "ficha_enc" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Selecione o Encontro</label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="h-12 bg-white rounded-xl border-accent/20">
                  <SelectValue placeholder="Escolha..." />
                </SelectTrigger>
                <SelectContent>
                  {encontros.map((e:any) => <SelectItem key={e.id} value={e.id}>{formatarDataVigente(e.data)} - {e.tema}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
           <Button 
             onClick={handlePrint} 
             disabled={(docTipo === "ficha_cat" || docTipo === "ficha_enc") && !targetId}
             className="h-14 px-8 rounded-2xl font-black tracking-widest shadow-lg gap-2 bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-1 transition-all"
           >
             <Printer className="h-5 w-5" /> GERAR E IMPRIMIR (A4)
           </Button>
        </div>
      </div>

      {RenderPrintableArea()}
    </div>
  );
}
