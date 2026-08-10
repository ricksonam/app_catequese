import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPlanoByCode } from "@/lib/supabaseStore";
import { CalendarDays, MapPin, Sparkles, Star, Calendar, ArrowRight, UserCircle2, Clock, CheckCircle2, Cross, Heart, BookOpen, Music, Trophy } from "lucide-react";
import Spinner from "@/components/ui/spinner";

type SacramentoType = "batismo" | "eucaristia" | "crisma";

const DEFAULT_RITOS: Record<SacramentoType, any[]> = {
  eucaristia: [
    { id: "reuniao_pais",           label: "Reunião com os Pais",       icon: Heart },
    { id: "celebracao_penitencial", label: "Celebração Penitencial",    icon: Cross },
    { id: "ensaio",                 label: "Ensaio do Rito",            icon: Music },
  ],
  crisma: [
    { id: "reuniao_pais",  label: "Reunião com os Pais",      icon: Heart },
    { id: "retiro",        label: "Retiro Espiritual",         icon: Cross },
    { id: "confissao",     label: "Confissão / Penitencial",  icon: BookOpen },
    { id: "ensaio",        label: "Ensaio do Rito",           icon: Music },
  ],
  batismo: [
    { id: "reuniao_pais", label: "Reunião com Pais/Padrinhos", icon: Heart },
    { id: "preparacao",   label: "Preparação Espiritual",      icon: Cross },
  ],
};

const SACRAMENTO_LABELS: Record<string, { label: string; gradient: string; textAccent: string; borderAccent: string; hoverBorder: string; bgAccent: string; lightBg: string; textAccentLight: string }> = {
  batismo: { 
    label: "Batismo", 
    gradient: "from-sky-500 to-blue-600", 
    textAccent: "text-sky-700 dark:text-sky-400", 
    borderAccent: "border-sky-500/30", 
    hoverBorder: "hover:border-sky-500", 
    bgAccent: "bg-sky-600", 
    lightBg: "bg-sky-100/50 dark:bg-sky-900/20", 
    textAccentLight: "text-sky-500"
  },
  eucaristia: { 
    label: "Primeira Eucaristia", 
    gradient: "from-amber-500 to-orange-600", 
    textAccent: "text-amber-700 dark:text-amber-400", 
    borderAccent: "border-amber-500/30", 
    hoverBorder: "hover:border-amber-500", 
    bgAccent: "bg-amber-500", 
    lightBg: "bg-amber-100/50 dark:bg-amber-900/20", 
    textAccentLight: "text-amber-500"
  },
  crisma: { 
    label: "Crisma", 
    gradient: "from-violet-500 to-purple-600", 
    textAccent: "text-violet-700 dark:text-violet-400", 
    borderAccent: "border-violet-500/30", 
    hoverBorder: "hover:border-violet-500", 
    bgAccent: "bg-violet-600", 
    lightBg: "bg-violet-100/50 dark:bg-violet-900/20", 
    textAccentLight: "text-violet-500"
  },
};

function formatData(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' });
}

function isPast(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr + "T23:59:59") < new Date();
}

function isToday(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

export default function PublicRitoSacramental() {
  const { codigo, sacramento } = useParams<{ codigo: string; sacramento: string }>();
  const sacramentoKey = (sacramento || "eucaristia") as SacramentoType;

  const { data, isLoading, error } = useQuery({
    queryKey: ["public_plano", codigo],
    queryFn: () => fetchPublicPlanoByCode(codigo || ""),
    enabled: !!codigo,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Spinner size="lg" text="Buscando informações..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <CalendarDays className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Link Inválido ou Expirado</h1>
        <p className="text-muted-foreground mt-2 max-w-xs">Não conseguimos encontrar as informações. Verifique com o catequista.</p>
      </div>
    );
  }

  const { turma, catequistas } = data;
  const sacInfo = SACRAMENTO_LABELS[sacramentoKey] || SACRAMENTO_LABELS.eucaristia;

  const trilhasConfig = turma.trilhas_config || {};
  const sacConfig = trilhasConfig[sacramentoKey] || {};

  const ritoConfig: Record<string, string> =
    sacConfig.etapas_rito ||
    sacConfig.etapasRito ||
    (sacramentoKey === "eucaristia" ? (turma.etapas_rito || {}) : {});

  const defaultNodes = DEFAULT_RITOS[sacramentoKey] || DEFAULT_RITOS.eucaristia;
  const etapasCustom = sacConfig.etapasCustom || [];
  const etapasRemovidas = sacConfig.etapasRemovidas || [];

  const items = [];
  
  for (const node of defaultNodes) {
    if (etapasRemovidas.includes(node.id)) continue;
    
    items.push({
      id: node.id,
      label: node.label,
      tipo: 'rito',
      data: ritoConfig[node.id] || null,
      icon: node.icon,
      isCelebracao: false
    });
  }
  
  for (const custom of etapasCustom) {
    items.push({
      id: custom.id,
      label: custom.label,
      tipo: custom.incluirCatequizandos ? 'atividade' : 'rito',
      data: custom.incluirData ? (custom.dataAgendada || null) : null,
      icon: Star,
      isCelebracao: false
    });
  }
  
  const dataCelebracao = sacConfig.data_celebracao || sacConfig.dataCelebracao || (sacramentoKey === "eucaristia" ? turma.data_celebracao_sacramento : null);
  
  items.push({
    id: "celebracao_principal",
    label: `Celebração — ${sacInfo.label}`,
    tipo: 'celebração',
    data: dataCelebracao || null,
    icon: Trophy,
    isCelebracao: true
  });
  
  const rawItems = items.sort((a, b) => {
    if (a.data && b.data) return new Date(a.data).getTime() - new Date(b.data).getTime();
    if (a.data && !b.data) return -1;
    if (!a.data && b.data) return 1;
    return 0;
  });

  const groupKeys: string[] = [];
  const groups: Record<string, typeof rawItems> = {};
  
  rawItems.forEach(item => {
    let key = "A Definir";
    if (item.data) {
      const date = new Date(item.data + 'T12:00:00');
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    }
    if (!groups[key]) {
      groups[key] = [];
      groupKeys.push(key);
    }
    groups[key].push(item);
  });

  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-zinc-950 pb-20 overflow-x-hidden">
      {/* Header Premium - Estilo do Plano */}
      <div className="bg-white dark:bg-zinc-900 border-b border-border/50 px-6 py-4 shadow-sm w-full">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner mb-2 ${sacInfo.lightBg} ${sacInfo.textAccentLight}`}>
               <Star className="h-6 w-6" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${sacInfo.textAccentLight}`}>Preparação Sacramental</p>
              <h1 className={`text-2xl font-black text-foreground tracking-tight leading-tight bg-gradient-to-r ${sacInfo.gradient} bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-sm pb-1`}>
                {sacInfo.label}
              </h1>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">
                Turma {turma.nome} · {turma.ano}
              </p>
              {turma.comunidade_nome && (
                <div className="flex items-center justify-center gap-x-3 gap-y-1 mt-3">
                   <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] font-black uppercase border border-primary/10">
                     {turma.comunidade_nome}
                   </span>
                </div>
              )}
            </div>
          </div>
          
          {catequistas && catequistas.length > 0 && (
            <div className="pt-3 border-t border-border/30 flex flex-col items-center">
               <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Equipe de Catequese</p>
               <div className="flex flex-wrap justify-center gap-2">
                 {catequistas.map((nome: string, i: number) => (
                   <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase border border-primary/10">
                     <UserCircle2 className="h-3 w-3" />
                     {nome}
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 mt-8">
        {groupKeys.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border-2 border-dashed border-border/50">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">A trilha ainda está sendo preparada.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Elegant Line */}
            <div className="absolute left-[20px] top-4 bottom-0 w-[2.5px] bg-gradient-to-b from-primary/10 via-primary/30 to-primary/5" />

            <div className="space-y-12">
              {groupKeys.map((month) => (
                <div key={month} className="space-y-6 relative">
                  <div className="flex items-center gap-4 sticky top-4 z-10 py-1">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] drop-shadow-sm">{month}</h3>
                  </div>

                  <div className="space-y-5 ml-4">
                    {groups[month].map((item, i) => {
                      const dateStr = item.data ? formatData(item.data) : '---';
                      const Icon = item.icon;
                      
                      const isPastDate = item.data ? isPast(item.data) : false;
                      const isTodayDate = item.data ? isToday(item.data) : false;
                      
                      return (
                        <div key={`${item.tipo}-${item.id}`} className="flex gap-4 items-center group animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
                          {/* Calendar Block (Shrinked) */}
                          <div className={`shrink-0 w-14 h-14 shadow-lg shadow-black/5 bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border-2 transition-all duration-500 flex flex-col items-stretch ${sacInfo.borderAccent}`}>
                            <div className={`h-5 flex items-center justify-center ${sacInfo.bgAccent} relative`}>
                              <div className="absolute inset-0 bg-white/20 animate-shimmer bg-[length:200%_auto]" />
                              <span className="text-[7px] font-black text-white uppercase tracking-wider">
                                {dateStr === '---' ? '---' : dateStr?.split(' ')[2]?.replace('.', '').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center leading-none bg-white dark:bg-zinc-900">
                              <span className="text-lg font-black text-foreground">
                                {dateStr === '---' ? '?' : dateStr?.split(' ')[0]}
                              </span>
                            </div>
                          </div>

                          {/* Details Card */}
                          <div className={`flex-1 p-3.5 rounded-2xl border-2 shadow-sm hover:shadow-md transition-all duration-500 active:scale-[0.98] relative overflow-hidden bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm min-w-0 ${sacInfo.borderAccent} ${sacInfo.hoverBorder}`}>
                            <div className="flex flex-col gap-1 min-w-0">
                               <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 ${sacInfo.lightBg} ${sacInfo.textAccent}`}>
                                    <Icon className="h-3 w-3" />
                                    {item.tipo}
                                  </span>
                                  {isTodayDate && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[7px] font-black uppercase">Hoje</span>
                                  )}
                                  {isPastDate && !isTodayDate && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[7px] font-black uppercase">Concluído</span>
                                  )}
                               </div>
                               
                               <h4 className="text-sm font-black text-foreground leading-tight px-0.5">
                                 {item.label}
                               </h4>
                               
                               {item.isCelebracao && (
                                  <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                     <Sparkles className="h-3 w-3" /> Grande Dia!
                                  </div>
                               )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-muted/40 dark:bg-muted/20 rounded-2xl p-4 text-center mt-12 mb-8 max-w-sm mx-auto">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Em caso de dúvidas sobre as datas ou a preparação, entre em contato com a equipe de catequese.
          </p>
        </div>
      </div>

      {/* Floating Footer Branding */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-primary/10 shadow-2xl z-50 flex items-center gap-2 scale-90 sm:scale-100">
         <img src="/app-logo.png" className="w-6 h-6 object-contain" alt="iCatequese" />
         <span className="text-xs font-black text-primary tracking-tighter uppercase italic">iCatequese Digital</span>
      </div>
    </div>
  );
}
