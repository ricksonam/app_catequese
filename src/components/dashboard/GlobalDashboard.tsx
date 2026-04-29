import { useMemo } from "react";
import { useTurmas, useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Users, Calendar, Award, TrendingUp, BookOpen, GraduationCap } from "lucide-react";
import { formatarDataVigente } from "@/lib/utils";

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const GRADIENTS = [
  "from-primary/20 to-primary/5",
  "from-emerald-500/20 to-emerald-500/5",
  "from-amber-500/20 to-amber-500/5",
  "from-blue-500/20 to-blue-500/5"
];

export default function GlobalDashboard() {
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();

  const loading = tLoading || eLoading || cLoading;

  // --- Processamento de Dados ---
  const stats = useMemo(() => {
    const ativos = catequizandos.filter(c => c.status === 'ativo').length;
    const realizados = encontros.filter(e => e.status === 'realizado').length;
    const taxaPresenca = encontros.length > 0 
      ? Math.round((realizados / encontros.length) * 100) 
      : 0;

    return [
      { label: "Total Catequizandos", value: catequizandos.length, icon: Users, color: "text-primary", bg: "bg-primary/10" },
      { label: "Turmas Ativas", value: turmas.length, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
      { label: "Encontros Realizados", value: realizados, icon: Calendar, color: "text-blue-600", bg: "bg-blue-500/10" },
      { label: "Engajamento Geral", value: `${taxaPresenca}%`, icon: Award, color: "text-amber-600", bg: "bg-amber-500/10" },
    ];
  }, [catequizandos, turmas, encontros]);

  const profileData = useMemo(() => {
    const etapas: Record<string, number> = {};
    turmas.forEach(t => {
      const count = catequizandos.filter(c => c.turmaId === t.id).length;
      etapas[t.etapa || 'Outros'] = (etapas[t.etapa || 'Outros'] || 0) + count;
    });
    return Object.entries(etapas).map(([name, value]) => ({ name, value }));
  }, [turmas, catequizandos]);

  const trendData = useMemo(() => {
    // Agrupa encontros por mês (últimos 6 meses)
    const months: Record<string, { presencas: number, total: number }> = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    encontros
      .filter(e => new Date(e.data) >= sixMonthsAgo)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .forEach(e => {
        const m = new Date(e.data + 'T00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
        if (!months[m]) months[m] = { presencas: 0, total: 0 };
        months[m].presencas += (e.presencas?.length || 0);
        
        // Estima total de alunos para essa turma na data
        const turmaAlunos = catequizandos.filter(c => c.turmaId === e.turmaId && c.status === 'ativo').length;
        months[m].total += turmaAlunos || 1;
      });

    return Object.entries(months).map(([name, data]) => ({
      name,
      taxa: Math.round((data.presencas / data.total) * 100)
    }));
  }, [encontros, catequizandos]);

  const sacramentalData = useMemo(() => {
    let batismo = 0, eucaristia = 0, crisma = 0;
    catequizandos.forEach(c => {
      if (c.sacramentos?.batismo?.recebido) batismo++;
      if (c.sacramentos?.eucaristia?.recebido) eucaristia++;
      if (c.sacramentos?.crisma?.recebido) crisma++;
    });
    return [
      { name: "Batismo", value: batismo },
      { name: "Eucaristia", value: eucaristia },
      { name: "Crisma", value: crisma },
    ];
  }, [catequizandos]);

  if (loading) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Visual */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 p-6 text-white shadow-xl shadow-primary/20">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-300" />
              Visão Geral da Catequese
            </h2>
            <p className="text-sm opacity-90 mt-1">Acompanhamento inteligente de todas as turmas</p>
          </div>
          <div className="hidden sm:block">
            <TrendingUp className="h-12 w-12 opacity-20" />
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Grid de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="float-card p-4 sm:p-5 border-none shadow-md hover:shadow-lg transition-all animate-float-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`w-10 h-10 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-3 shadow-inner`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Engajamento Mensal */}
        <div className="float-card p-6 flex flex-col h-[380px] border-none shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tendência de Presença
              </h3>
              <p className="text-xs text-muted-foreground">Média percentual de todos os encontros</p>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTaxa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '12px' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="taxa" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTaxa)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Calendar className="h-8 w-8 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">Sem dados históricos</span>
                </div>
            )}
          </div>
        </div>

        {/* Card 2: Distribuição por Etapa */}
        <div className="float-card p-6 flex flex-col h-[380px] border-none shadow-md">
          <div className="mb-6">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              Alunos por Etapa
            </h3>
            <p className="text-xs text-muted-foreground">Distribuição total na paróquia</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            {profileData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={profileData} innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                    {profileData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <BookOpen className="h-8 w-8 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">Sem turmas cadastradas</span>
                </div>
            )}
          </div>
        </div>

        {/* Card 3: Perfil Sacramental */}
        <div className="float-card p-6 lg:col-span-2 border-none shadow-md">
          <div className="mb-6">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Sacramentos Recebidos
            </h3>
            <p className="text-xs text-muted-foreground">Quantitativo global de sacramentos confirmados</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sacramentalData} layout="vertical" margin={{ left: 20, right: 30 }} barSize={24}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={11} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '10px' }} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                  {sacramentalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes do Recharts para evitar erros de importação
import { AreaChart, Area, Legend } from "recharts";
