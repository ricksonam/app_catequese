import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPlanoByCode } from "@/lib/supabaseStore";
import { CalendarDays, MapPin, Users, Clock, Calendar, Sparkles, BookOpen, UserCircle2, ArrowRight } from "lucide-react";
import { formatarDataVigente } from "@/lib/utils";
import Spinner from "@/components/ui/spinner";

export default function PublicPlano() {
  const { codigo } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public_plano", codigo],
    queryFn: () => fetchPublicPlanoByCode(codigo || ""),
    enabled: !!codigo,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Spinner size="lg" text="Buscando Plano da Turma..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Link Inválido ou Expirado</h1>
        <p className="text-muted-foreground mt-2 max-w-xs">Não conseguimos encontrar o plano para este código. Verifique com o catequista.</p>
      </div>
    );
  }

  const { turma, encontros, atividades, catequistas } = data;

  const groupedItems = (() => {
    const rawItems = [
      ...encontros.map((e: any) => ({ ...e, tipo: 'encontro', cor: 'bg-primary', borda: 'border-l-primary' })),
      ...atividades.map((a: any) => ({ ...a, tipo: 'atividade', cor: 'bg-blue-500', borda: 'border-l-blue-500' })),
    ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    const groups: Record<string, any[]> = {};
    rawItems.forEach(item => {
      const date = new Date(item.data + 'T12:00:00');
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  })();

  const checkLocal = (local: string) => {
    if (!local) return "A definir";
    const igrejaKeywords = ["igreja", "paroquia", "paróquia", "capela", "matriz", "comunidade", "salão", "salao", "centro pastoral"];
    const isChurch = igrejaKeywords.some(key => local.toLowerCase().includes(key));
    return isChurch ? local : "Encontro Externo (consulte o catequista)";
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-zinc-950 pb-20">
      {/* Header Premium */}
      <div className="bg-white dark:bg-zinc-900 border-b border-border/50 px-6 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-2">
               <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Calendário de Encontros</p>
              <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-sm pb-1">
                Plano da Turma {turma.nome}
              </h1>
              {turma.comunidade_nome && (
                <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">
                  Comunidade {turma.comunidade_nome}
                </p>
              )}
              <div className="flex items-center justify-center gap-x-3 gap-y-1 mt-3">
                 <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] font-black uppercase border border-primary/10">
                   {turma.ano}
                 </span>
                 <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                   Etapa: <span className="text-foreground uppercase">{turma.etapa?.replace('-', ' ')}</span>
                 </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 py-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-[11px] font-bold text-muted-foreground border border-border/50">
               <Clock className="h-3.5 w-3.5" /> {turma.dia_catequese} às {turma.horario}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-[11px] font-bold text-muted-foreground border border-border/50">
               <MapPin className="h-3.5 w-3.5" /> {turma.local}
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
        {groupedItems.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border-2 border-dashed border-border/50">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">O cronograma ainda está sendo preparado.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Elegant Line */}
            <div className="absolute left-[20px] top-4 bottom-0 w-[2.5px] bg-gradient-to-b from-primary/10 via-primary/30 to-primary/5" />

            <div className="space-y-12">
              {groupedItems.map(([month, items]) => (
                <div key={month} className="space-y-6 relative">
                  <div className="flex items-center gap-4 sticky top-4 z-10 py-1">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] drop-shadow-sm">{month}</h3>
                  </div>

                  <div className="space-y-5 ml-4">
                    {items.map((item, i) => {
                      const dateStr = item.data ? new Date(item.data + 'T12:00:00').toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }) : '---';
                      
                      return (
                        <div className="flex gap-4 items-center group animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
                          {/* Calendar Block (Losango/Calendário style) */}
                          <div className="shrink-0 w-16 h-16 shadow-lg shadow-primary/5 bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border-2 border-primary/20 group-hover:scale-105 transition-all duration-500 flex flex-col items-stretch">
                            <div className={`h-6 flex items-center justify-center ${item.tipo === 'encontro' ? 'bg-primary' : 'bg-blue-600'} relative`}>
                              <div className="absolute inset-0 bg-white/20 animate-shimmer bg-[length:200%_auto]" />
                              <span className="text-[8px] font-black text-white uppercase tracking-wider">{dateStr.split(' ')[2]?.replace('.', '').toUpperCase()}</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center leading-none bg-white dark:bg-zinc-900">
                              <span className="text-xl font-black text-foreground">{dateStr.split(' ')[0]}</span>
                            </div>
                          </div>

                          {/* Details Card - Compact */}
                          <div className={`flex-1 p-3.5 rounded-2xl border-2 border-border/40 ${item.borda} shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-500 active:scale-[0.98] relative overflow-hidden bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm min-w-0`}>
                            <div className="flex flex-col gap-1 min-w-0">
                               <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                    item.tipo === 'encontro' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.tipo}
                                  </span>
                                  {item.modalidade === 'externa' && (
                                    <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-[7px] font-black uppercase">Externo</span>
                                  )}
                               </div>
                               
                               <h4 className="text-sm font-black text-foreground leading-tight truncate px-0.5">
                                 {item.tema || item.nome}
                               </h4>
                               
                               <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                                    <Clock className="h-3 w-3 text-primary/50" />
                                    {item.horario || turma.horario}
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                                    <MapPin className="h-3 w-3 text-primary/50" />
                                    <span className="truncate max-w-[120px]">{checkLocal(item.local || turma.local)}</span>
                                  </div>
                               </div>
                            </div>
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
      </div>

      {/* Floating Footer Branding */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-primary/10 shadow-2xl z-50 flex items-center gap-2 scale-90 sm:scale-100">
         <img src="/app-logo.png" className="w-6 h-6 object-contain" alt="iCatequese" />
         <span className="text-xs font-black text-primary tracking-tighter uppercase italic">iCatequese Digital</span>
      </div>
    </div>
  );
}
