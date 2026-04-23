import { useMemo, useState, useEffect } from "react";
import { BookOpen, Users, CalendarDays, ChevronRight, Cake, Star, X, BellRing, Trophy, Book, AlertTriangle, Heart, Link2, Loader2, RefreshCw, Flame, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAtividades, useParoquias, useComunidades, useCatequistas, useTurmas, useEncontros, useCatequizandos, useMissoesFamilia, useJoinTurma } from "@/hooks/useSupabaseData";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ObjectiveModal } from "@/components/ObjectiveModal";
import { ParoquiaStep } from "@/components/Onboarding/ParoquiaStep";
import { CatequistaStep } from "@/components/Onboarding/CatequistaStep";
import { TurmaStep } from "@/components/Onboarding/TurmaStep";
import { WelcomeStep } from "@/components/Onboarding/WelcomeStep";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTurmaId, setSelectedTurmaIdRaw] = useState<string | "all">(
    () => localStorage.getItem("ivc_selected_turma") || "all"
  );

  // Persiste a turma selecionada no localStorage
  const setSelectedTurmaId = (id: string | "all") => {
    setSelectedTurmaIdRaw(id);
    if (id === "all") localStorage.removeItem("ivc_selected_turma");
    else localStorage.setItem("ivc_selected_turma", id);
  };
  const { data: turmas = [], isLoading: tLoading, error: tError, refetch: tRefetch } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();
  const { data: catequistas = [], isLoading: catLoading } = useCatequistas();
  const { data: paroquias = [] } = useParoquias();
  const { data: comunidades = [] } = useComunidades();
  const { data: atividades = [], isLoading: aLoading } = useAtividades(selectedTurmaId === "all" ? undefined : selectedTurmaId);
  const { data: missoes = [], isLoading: mLoading } = useMissoesFamilia(selectedTurmaId === "all" ? undefined : selectedTurmaId);
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<"none" | "presentation" | "paroquia" | "catequista" | "turma" | "welcome">("none");
  const { permission, subscribe, loading: pushLoading } = usePushNotifications();
  const joinMutation = useJoinTurma();

  const [alertConfig] = useState(() => {
    const saved = localStorage.getItem('ivc_alertas_config');
    const defaultState = {
      moduloEncontros: { ativo: true, presenca: true, avaliacao: true, status: true },
      moduloCatequizandos: { ativo: true, faltas: 3 }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.ativos !== undefined) return defaultState;
        return {
          moduloEncontros: { ...defaultState.moduloEncontros, ...(parsed.moduloEncontros || {}) },
          moduloCatequizandos: { ...defaultState.moduloCatequizandos, ...(parsed.moduloCatequizandos || {}) }
        };
      } catch (e) {
        return defaultState;
      }
    }
    return defaultState;
  });

  const loading = tLoading || eLoading || cLoading || catLoading || aLoading || mLoading;

  useEffect(() => {
    if (!loading && !tError) {
      const presentationSeen = localStorage.getItem("ivc_presentation_seen");
      const onboardingCompleted = localStorage.getItem("ivc_onboarding_completed");
      
      if (!presentationSeen) {
        setOnboardingStep("presentation");
      } else if (!onboardingCompleted && turmas.length === 0) {
        if (paroquias.length === 0 && comunidades.length === 0) {
          setOnboardingStep("paroquia");
        } else if (catequistas.length === 0) {
          setOnboardingStep("catequista");
        } else {
          setOnboardingStep("turma");
        }
      } else {
        setOnboardingStep("none");
      }
    }
  }, [loading, tError, turmas.length, paroquias.length, comunidades.length, catequistas.length]);

  useEffect(() => {
    if (!loading && turmas.length > 0) {
      const saved = localStorage.getItem("ivc_selected_turma");
      // Se a turma salva ainda existe, usa ela; senão pega a primeira
      if (saved && turmas.find(t => t.id === saved)) {
        setSelectedTurmaIdRaw(saved);
      } else if (selectedTurmaId === "all") {
        setSelectedTurmaId(turmas[0].id);
      }
    }
  }, [loading, turmas.length]);

  const LiturgicalIcon = ({ type, className }: { type?: string, className?: string }) => {
    const t = type?.toLowerCase() || "";
    
    // Bíblia / Pré-Catequese
    if (t.includes("pre-catecumenato") || t.includes("biblia") || t.includes("pré")) {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M12 7v6" />
          <path d="M10 9h4" />
        </svg>
      );
    }
    
    // Eucaristia / Cálice
    if (t.includes("eucaristia")) {
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3h10v5c0 3-2 5-5 5s-5-2-5-5V3z" />
          <path d="M12 13v6" />
          <path d="M9 21h6" />
          <circle cx="12" cy="7" r="1.5" fill="currentColor" className="opacity-40" />
        </svg>
      );
    }
    
    // Crisma / Fogo
    if (t.includes("crisma") || t.includes("adulto") || t.includes("espírito")) {
      return <Flame className={className} strokeWidth={2.5} />;
    }
    
    return <Sparkles className={className} strokeWidth={2.5} />;
  };

  const getEtapaColor = (etapa?: string) => {
    const e = etapa?.toLowerCase() || "";
    // Pré-Catequese: Azul claro
    if (e.includes("pre") || e.includes("biblia")) return "text-blue-600 bg-blue-50 border-blue-100";
    // Eucaristia: Amarelo claro
    if (e.includes("eucaristia")) return "text-yellow-600 bg-yellow-50 border-yellow-100";
    // Crisma / Pré-Crisma: Vermelho claro
    if (e.includes("crisma")) return "text-red-600 bg-red-50 border-red-100";
    // Adultos: Verde claro
    if (e.includes("adulto")) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    
    return "text-primary bg-primary/10 border-primary/20";
  };

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const parseDataLocal = (dataStr: string) => {
    if (!dataStr) return new Date();
    const parts = dataStr.split('T')[0].split('-');
    if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Date(dataStr);
  };

  const filteredCatequizandos = useMemo(() => {
    if (selectedTurmaId === "all") return catequizandos;
    return catequizandos.filter(c => c.turmaId === selectedTurmaId);
  }, [catequizandos, selectedTurmaId]);

  const filteredEncontros = useMemo(() => {
    if (selectedTurmaId === "all") return encontros;
    return encontros.filter(e => e.turmaId === selectedTurmaId);
  }, [encontros, selectedTurmaId]);

  const selectedTurma = useMemo(() => {
    if (selectedTurmaId === "all") return null;
    return turmas.find(t => t.id === selectedTurmaId);
  }, [turmas, selectedTurmaId]);

  const heroColors = getEtapaColor(selectedTurma?.etapa);

  const proximoEncontro = useMemo(() => {
    const pendentes = filteredEncontros
      .filter((e) => parseDataLocal(e.data) >= hoje && e.status === 'pendente')
      .sort((a, b) => parseDataLocal(a.data).getTime() - parseDataLocal(b.data).getTime());
    return pendentes[0] || null;
  }, [filteredEncontros, hoje]);

  const mesAtual = hoje.getMonth();
  const aniversariantesMes = useMemo(() => {
    const people = new Map<string, any>();

    // Processar Nascimento (Catequizandos e Catequistas)
    [...filteredCatequizandos.map(c => ({...c, isCatequista: false})), ...catequistas.map(c => ({...c, isCatequista: true}))].forEach(p => {
      const dataStr = p.dataNascimento;
      if (!dataStr) return;
      
      const bday = new Date(dataStr + (dataStr.includes('T') ? '' : 'T12:00:00'));
      if (bday.getMonth() === mesAtual) {
        if (!people.has(p.id)) {
          people.set(p.id, { ...p, events: [] });
        }
        people.get(p.id).events.push({ tipo: 'nascimento', day: bday.getDate(), month: bday.getMonth() });
      }
    });

    // Processar Batismo (Apenas Catequizandos)
    filteredCatequizandos.filter(c => c.sacramentos?.batismo?.data).forEach(c => {
      const dataStr = c.sacramentos?.batismo?.data;
      if (!dataStr) return;
      
      const bday = new Date(dataStr + (dataStr.includes('T') ? '' : 'T12:00:00'));
      if (bday.getMonth() === mesAtual) {
        if (!people.has(c.id)) {
          people.set(c.id, { ...c, events: [] });
        }
        // Evitar duplicar se por algum motivo for o mesmo ID
        const alreadyHasBatismo = people.get(c.id).events.some((e: any) => e.tipo === 'batismo');
        if (!alreadyHasBatismo) {
          people.get(c.id).events.push({ tipo: 'batismo', day: bday.getDate(), month: bday.getMonth() });
        }
      }
    });

    return Array.from(people.values())
      .map(p => {
        const sortedEvents = p.events.sort((a: any, b: any) => a.day - b.day);
        // Apenas eventos futuros ou hoje
        const futureEvents = sortedEvents.filter((e: any) => e.day >= hoje.getDate());
        if (futureEvents.length === 0) return null;

        const primaryEvent = futureEvents[0];
        return { 
          ...p, 
          day: primaryEvent.day, 
          month: primaryEvent.month, 
          tipo: primaryEvent.tipo,
          hasBoth: sortedEvents.length > 1,
          allEvents: sortedEvents
        };
      })
      .filter(p => p !== null)
      .sort((a, b) => (a as any).day - (b as any).day)
      .slice(0, 4);
  }, [filteredCatequizandos, catequistas, mesAtual, hoje]);

  const proximasAtividades = useMemo(() => {
    if (aniversariantesMes.length > 0) return [];
    
    const combined = [
      ...atividades.map(a => ({ ...a, itemType: 'atividade' as const })),
      ...missoes.map(m => ({ ...m, data: m.criadoEm, itemType: 'missao' as const }))
    ];

    return combined
      .filter(item => {
        const d = parseDataLocal(item.data);
        return d >= hoje;
      })
      .sort((a, b) => parseDataLocal(a.data).getTime() - parseDataLocal(b.data).getTime())
      .slice(0, 2);
  }, [atividades, missoes, aniversariantesMes.length, hoje]);

  const [selectedCatequizando, setSelectedCatequizando] = useState<any>(null);

  function getDiasRestantes(dataStr: string) {
    const d = parseDataLocal(dataStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }

  const catequizandosEmAlerta = useMemo(() => {
    const cfg = alertConfig.moduloCatequizandos;
    if (!cfg?.ativo) return 0;
    const limit = cfg.faltas ?? 3;
    if (limit <= 0) return 0;

    const pastEncontros = filteredEncontros
      .filter(e => e.status === 'realizado')
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    let alertCount = 0;
    filteredCatequizandos.forEach(c => {
      const tEncontros = pastEncontros.filter(e => e.turmaId === c.turmaId).slice(0, limit);
      if (tEncontros.length >= limit) {
        const wasPresentOrJustifiedInAny = tEncontros.some(e => 
          e.presencas.includes(c.id) || (e.justificativas && e.justificativas[c.id])
        );
        if (!wasPresentOrJustifiedInAny) {
          alertCount++;
        }
      }
    });

    return alertCount;
  }, [filteredEncontros, filteredCatequizandos, alertConfig.moduloCatequizandos]);

  const encontrosEmAlerta = useMemo(() => {
    const cfg = alertConfig.moduloEncontros;
    if (!cfg?.ativo) return 0;
    const { presenca, status, avaliacao } = cfg;

    let count = 0;
    const nowTime = new Date().getTime();
    filteredEncontros.forEach(e => {
       const isPendente = e.status === 'pendente';
       const isRealizado = e.status === 'realizado';
       const noPresence = (e.presencas || []).length === 0;
       const d = parseDataLocal(e.data);
       const isPastPendente = isPendente && nowTime > d.getTime() + 86400000;
       
       let encounterHasAlert = false;

       // Presença missing
       if (presenca && noPresence && (isRealizado || isPastPendente)) {
           encounterHasAlert = true;
       }
       
       // Status pendente/atrasado 
       if (status && isPastPendente) {
           encounterHasAlert = true;
       }

       // Avaliacao missing
       const hasEval = !!(e.avaliacao && (e.avaliacao.conclusao || e.avaliacao.pontosPositivos || e.avaliacao.pontosMelhorar));
       if (avaliacao && isRealizado && !hasEval) {
           encounterHasAlert = true;
       }

       if (encounterHasAlert) {
           count++;
       }
    });
    return count;
  }, [filteredEncontros, alertConfig.moduloEncontros]);

  const stats = [
    { 
      label: "Catequizandos", 
      value: filteredCatequizandos.length, 
      icon: Users, 
      color: "bg-amber-500/10 text-amber-600", 
      action: () => {
        if (selectedTurmaId !== "all") {
          navigate(`/turmas/${selectedTurmaId}/catequizandos`);
        } else {
          if (turmas.length === 1) navigate(`/turmas/${turmas[0].id}/catequizandos`);
          else setTurmaPickerOpen(true);
        }
      } 
    },
    { 
      label: "Encontros", 
      value: filteredEncontros.filter((e) => e.status === 'pendente').length, 
      icon: CalendarDays, 
      color: "bg-blue-500/10 text-blue-600", 
      action: () => {
        if (selectedTurmaId !== "all") {
          navigate(`/turmas/${selectedTurmaId}/encontros`);
        } else {
          navigate("/turmas");
        }
      } 
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (tError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-2 shadow-lg shadow-red-500/10">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-foreground">Erro ao carregar dados</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Não conseguimos conectar com o servidor para buscar suas turmas. Verifique sua conexão.
          </p>
        </div>
        <Button 
          onClick={() => tRefetch()} 
          className="rounded-2xl px-8 h-12 font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const dias = proximoEncontro ? getDiasRestantes(proximoEncontro.data) : 0;
  const isUrgent = proximoEncontro ? dias <= 3 : false;
  const turmaEncontro = proximoEncontro ? turmas.find((t) => t.id === proximoEncontro.turmaId) : null;
  const diaLabel = proximoEncontro
    ? (dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : DIAS_SEMANA[parseDataLocal(proximoEncontro.data).getDay()])
    : "";

  const handleJoinByCode = async () => {
    if (joinCode.trim().length < 8) {
      toast.error("O código deve ter 8 caracteres.");
      return;
    }
    try {
      const result = await joinMutation.mutateAsync(joinCode.trim());
      toast.success(`Acesso concedido à turma "${result.nome}"!`);
      setJoinModalOpen(false);
      setJoinCode("");
      setSelectedTurmaId(result.id);
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar na turma.");
    }
  };

  return (
    <div className="space-y-2.5">
      {/* ONBOARDING FLOW */}
      <ObjectiveModal 
        open={onboardingStep === "presentation"} 
        onOpenChange={(open) => {
          if (!open) localStorage.setItem("ivc_presentation_seen", "true");
          setOnboardingStep("none");
        }}
        hideClose={true}
        onStartTour={() => {
          localStorage.setItem("ivc_presentation_seen", "true");
          setOnboardingStep("paroquia");
        }}
      />

      <ParoquiaStep 
        open={onboardingStep === "paroquia"} 
        onSuccess={() => setOnboardingStep("catequista")} 
      />

      <CatequistaStep 
        open={onboardingStep === "catequista"} 
        onSuccess={() => setOnboardingStep("turma")} 
      />

      <TurmaStep 
        open={onboardingStep === "turma"} 
        onSuccess={() => setOnboardingStep("welcome")} 
      />

      <WelcomeStep 
        open={onboardingStep === "welcome"} 
        onFinish={() => {
          localStorage.setItem("ivc_onboarding_completed", "true");
          setOnboardingStep("none");
        }} 
      />



      {/* ── ATIVAR NOTIFICAÇÕES ── */}
      {permission === "default" && (
        <div className="animate-card-activate relative overflow-hidden rounded-[32px] border-none bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 shadow-xl shadow-blue-500/20 p-1">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[30px] p-5 flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-700/50 animate-soft-pulse">
                 <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400" />
               </div>
               <div>
                 <h3 className="text-sm font-black text-foreground leading-tight">Lembretes por Notificação</h3>
                 <p className="text-[10px] text-muted-foreground mt-0.5">Receba avisos de encontros e aniversários</p>
               </div>
             </div>
             <button
               onClick={subscribe}
               disabled={pushLoading}
               className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
             >
               {pushLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Ligar"}
             </button>
          </div>
        </div>
      )}

      <div className="animate-fade-in flex items-start justify-between mb-0.5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Olá, Catequista! 👋</h1>
          <p className="text-muted-foreground text-[10px] mt-0.5">Bem-vindo ao iCatequese</p>
        </div>
      </div>

      {/* ── VARAL DE POLAROIDS (ANIVERSARIANTES) ── */}
      {aniversariantesMes.length > 0 ? (
        <div className="relative pt-0 pb-1 mb-0 animate-fade-in overflow-hidden">
          {/* Título da Seção */}
          <div className="flex flex-col items-center justify-center mb-1">
            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-black/50">Próximos Aniversários</h2>
            <div className="h-0.5 w-5 bg-primary/30 rounded-full"></div>
          </div>

          {/* Container dos Cards */}
          <div className={cn(
            "flex gap-3 relative z-10 px-1 min-h-[110px]",
            aniversariantesMes.length === 1 ? "justify-center" : "justify-center sm:gap-6"
          )}>
            {aniversariantesMes.map((c, i) => {
              const rotations = ['-2deg', '2deg', '-1deg', '3deg'];
              const isHoje = c.day === hoje.getDate();
              const dateStr = `${String(c.day).padStart(2, '0')}/${String(c.month + 1).padStart(2, '0')}`;

              return (
                <div 
                  key={`${c.id}-${i}`}
                  className="flex justify-center"
                  style={{ 
                    animation: `welcome-float 4s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`
                  }}
                >
                  <button
                    onClick={() => setSelectedCatequizando(c)}
                    className="relative group transition-all duration-500 hover:z-50 hover:scale-110 active:scale-95"
                    style={{ transform: `rotate(${rotations[i % 4]})` }}
                  >
                    {/* Pregador */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-5 bg-[#d7b58c] border border-[#b89a71] rounded-sm z-30 shadow-sm opacity-90"></div>

                    {/* Moldura Polaroid */}
                    <div className={cn(
                      "bg-white p-1 pb-2 shadow-md border relative overflow-hidden transition-colors",
                      isHoje ? "border-amber-400 ring-1 ring-amber-400/20" : "border-black/5"
                    )}>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 overflow-hidden bg-muted relative">
                        {c.foto ? (
                          <img src={c.foto} alt={c.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30 text-xl font-black">
                            {c.nome.charAt(0)}
                          </div>
                        )}
                        {c.hasBoth && (
                          <div className="absolute top-0 right-0 bg-amber-400 text-white p-0.5 rounded-bl-lg shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      {/* Info do Aniversariante */}
                      <div className="mt-1.5 text-center px-0.5">
                        <p className="text-[10px] font-black text-black leading-tight uppercase tracking-tighter truncate w-full px-1">
                          {c.nome.split(' ')[0]}
                        </p>
                        
                        <div className="flex flex-col items-center mt-1">
                          <span className="text-[13px] font-black text-foreground/90 tabular-nums leading-none">
                            {dateStr}
                          </span>
                          {isHoje ? (
                            <span className="text-[7px] font-black bg-amber-400 text-white px-1.5 py-0.5 rounded-full animate-heartbeat mt-1 uppercase">
                              HOJE
                            </span>
                          ) : (
                            <p className={cn(
                              "text-[7px] font-black uppercase tracking-tighter mt-0.5",
                              c.tipo === 'nascimento' ? "text-amber-600" : "text-blue-600"
                            )}>
                              {c.hasBoth ? "🎉 Duplo!" : (c.tipo === 'nascimento' ? "Parabéns" : "Batismo")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : proximasAtividades.length > 0 ? (
        <div className="animate-fade-in mb-1">
          <div className="liturgical-frame p-0.5 rounded-[32px] overflow-hidden bg-white/50 backdrop-blur-sm">
             <div className="bg-white/80 dark:bg-zinc-900/80 rounded-[24px] p-3 relative overflow-hidden">
                <div className="absolute inset-0 liturgical-rays-bg opacity-30 animate-sacred-rays pointer-events-none" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Próximos Eventos</h2>
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-1 gap-2 w-full mt-1">
                    {proximasAtividades.map((item, idx) => {
                      const isMissao = item.itemType === 'missao';
                      return (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-primary/5 shadow-sm hover:border-primary/20 transition-all group">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105",
                            isMissao ? "bg-amber-100 border-amber-200 text-amber-600" : "bg-emerald-100 border-emerald-200 text-emerald-600"
                          )}>
                             {isMissao ? <Trophy className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5 leading-none">
                              {isMissao ? "Missão em Família" : (item as any).tipo || "Atividade"}
                            </p>
                            <h4 className="text-xs font-black text-foreground truncate uppercase leading-tight">
                              {isMissao ? (item as any).titulo : (item as any).nome}
                            </h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-black text-primary/80 tabular-nums">
                              {formatarDataVigente(item.data).split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             </div>
          </div>
        </div>
      ) : null}

      {/* ── CARD PRINCIPAL DE TURMA ── */}
      {turmas.length > 0 && (
        <div 
          className="relative p-[1.5px] rounded-[32px] bg-gradient-to-br from-emerald-500/60 via-emerald-500/30 to-white shadow-lg animate-card-activate transition-all duration-300 hover:-translate-y-1 cursor-pointer group overflow-hidden -mt-2"
          onClick={() => selectedTurmaId !== "all" && navigate(`/turmas/${selectedTurmaId}`)}
        >
          <div className="absolute inset-[3px] rounded-[30px] border border-white/50 dark:border-white/10 z-20 pointer-events-none opacity-60 mix-blend-overlay"></div>
          
          <div className="relative flex flex-col p-0 rounded-[30px] bg-white bg-gradient-to-b from-emerald-500/15 to-white w-full h-full overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
               <BookOpen className="w-24 h-24 text-primary" />
            </div>

            <div className="px-5 py-4 flex flex-col items-center relative z-10 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1 mt-[-2px]">
                   <div className={cn("w-3.5 h-3.5 rounded-md flex items-center justify-center shrink-0 border shadow-sm", heroColors)}>
                     <LiturgicalIcon type={selectedTurma?.etapa} className="h-2 w-2" />
                   </div>
                   <p className="text-[6px] font-black uppercase tracking-[0.2em] text-primary/60">Turma Selecionada</p>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-foreground leading-tight tracking-tight">
                    {selectedTurmaId === "all" ? "Todas as Turmas" : selectedTurma?.nome}
                  </h3>
                  {selectedTurmaId !== "all" && selectedTurma && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black uppercase border",
                      heroColors
                    )}>
                      {selectedTurma.ano || selectedTurma.etapa}
                    </span>
                  )}
                </div>

                {selectedTurmaId !== "all" && selectedTurma && (
                  <div className="flex items-center justify-center gap-4 text-muted-foreground/60 text-[9px] font-bold uppercase tracking-wider mb-2">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-primary/40" />
                      <span>{selectedTurma.horario}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary/40" />
                      <span className="truncate max-w-[100px]">{selectedTurma.local}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (selectedTurmaId !== "all") navigate(`/turmas/${selectedTurmaId}`); }}
                    className="flex items-center gap-2 px-8 py-2 rounded-2xl bg-primary text-white text-[9px] font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Abrir Turma
                  </button>
                </div>
            </div>

            {(turmas.length > 1 || selectedTurmaId === "all") && (
              <div 
                onClick={(e) => { e.stopPropagation(); setTurmaPickerOpen(true); }}
                className="bg-primary/5 px-6 py-3 flex items-center justify-between border-t border-primary/10 hover:bg-primary/10 transition-colors mt-auto"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 text-primary animate-spin-slow" />
                  <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Trocar de Turma</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-primary/40" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-2 gap-2 mt-[-8px]">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isCatequizandos = stat.label === "Catequizandos";
          
          return (
            <button 
              key={`${stat.label}-${i}`} 
              onClick={stat.action} 
              className={cn(
                "group relative p-[2px] rounded-[22px] animate-float-up transition-all duration-500 hover:-translate-y-1 active:scale-95 shadow-sm",
                "bg-black/10 shadow-black/5"
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative h-full bg-white dark:bg-zinc-900 rounded-[19px] p-2 overflow-hidden flex flex-col items-center text-center">
                <div className={cn(
                  "icon-box mx-auto mb-0.5 w-7 h-7 shadow-sm border animate-liturgical-float transition-all duration-500",
                  stat.color,
                  isCatequizandos 
                    ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 shadow-amber-200/50" 
                    : "border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 shadow-blue-200/50"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <p className="text-lg font-black text-foreground leading-tight tracking-tight">
                  {stat.value}
                </p>
                {isCatequizandos && catequizandosEmAlerta > 0 && (
                  <div className="absolute top-1 right-1 flex flex-col items-center animate-pulse" title={`${catequizandosEmAlerta} catequizando(s) com 3 ou mais faltas seguidas`}>
                    <div className="w-5 h-5 bg-destructive border-[1.5px] border-white rounded-full flex items-center justify-center shadow-sm">
                      <BellRing className="h-2.5 w-2.5 text-white animate-wiggle" />
                    </div>
                    <span className="text-[6px] font-black uppercase text-destructive mt-[1px] tracking-tighter">Alerta!</span>
                  </div>
                )}
                {!isCatequizandos && encontrosEmAlerta > 0 && (
                  <div className="absolute top-1 right-1 flex flex-col items-center animate-pulse" title={`${encontrosEmAlerta} encontro(s) pendente(s) de chamada`}>
                    <div className="w-5 h-5 bg-blue-500 border-[1.5px] border-white rounded-full flex items-center justify-center shadow-sm">
                      <BellRing className="h-2.5 w-2.5 text-white animate-wiggle" />
                    </div>
                    <span className="text-[6px] font-black uppercase text-blue-500 mt-[1px] tracking-tighter">Alerta!</span>
                  </div>
                )}
                <div className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.1em]">
                  {stat.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── CARD RESUMO PRÓXIMO ENCONTRO ── */}
      {proximoEncontro && (
        <div className="animate-float-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-col items-center justify-center px-1 mb-1.5 text-center">
            <h2 className="text-[10px] font-black text-foreground uppercase tracking-tight">Próximo Encontro</h2>
          </div>

          <div 
            className="float-card p-0 overflow-hidden border border-black/10 shadow-lg shadow-black/5 bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-zinc-900/80 backdrop-blur-md cursor-pointer group"
            onClick={() => navigate(`/turmas/${proximoEncontro.turmaId}/encontros/${proximoEncontro.id}`)}
          >
            <div className="p-3 active:scale-[0.99] transition-all">
              <div className="flex gap-2.5 items-center">
                {/* Chip de Data */}
                <div className="flex flex-col items-center justify-center w-11 h-11 bg-white rounded-xl shadow-sm border border-blue-100 shrink-0 transform group-hover:scale-105 transition-all mt-1">
                  <span className="text-[6px] font-black text-blue-600/60 uppercase leading-none mb-1 animate-sacred-pulse">
                    {DIAS_SEMANA[parseDataLocal(proximoEncontro.data).getDay() === 0 ? 6 : parseDataLocal(proximoEncontro.data).getDay() - 1].slice(0, 3)}
                  </span>
                  <span className="text-lg font-black text-blue-600 leading-none">
                    {String(parseDataLocal(proximoEncontro.data).getDate()).padStart(2, "0")}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                      isUrgent ? "bg-destructive text-white shadow-sm shadow-destructive/20" : "bg-blue-500 text-white shadow-sm shadow-blue-500/20"
                    )}>
                      {diaLabel}
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-foreground truncate leading-tight uppercase tracking-tight">
                    {proximoEncontro.tema}
                  </h3>
                  {proximoEncontro.leituraBiblica && (
                    <p className="text-[9px] text-muted-foreground font-bold truncate mt-0.5 italic flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5 text-primary/40" />
                      {proximoEncontro.leituraBiblica}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Turma picker dialog */}
      <Dialog open={turmaPickerOpen} onOpenChange={setTurmaPickerOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-[32px] p-6 shadow-2xl border-none bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Selecionar Turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <button
               onClick={() => { setSelectedTurmaId("all"); setTurmaPickerOpen(false); }}
               className={cn(
                 "w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] text-left border-2",
                 selectedTurmaId === "all" ? "bg-primary/10 border-primary" : "bg-muted/30 border-transparent hover:bg-muted/50"
               )}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Todas as Turmas</p>
                <p className="text-xs text-muted-foreground">Visão geral completa</p>
              </div>
            </button>

            {turmas.map((t) => {
              const count = catequizandos.filter((c) => c.turmaId === t.id).length;
              const isSelected = selectedTurmaId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTurmaId(t.id); setTurmaPickerOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98] text-left border-2",
                    isSelected ? "bg-primary/10 border-primary shadow-md" : "bg-muted/30 border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/10"
                  )}>
                    <BookOpen className={cn("h-6 w-6", isSelected ? "text-white" : "text-primary")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">{t.etapa} • {count} alunos</p>
                  </div>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL ENTRAR COM CÓDIGO */}
      <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-[32px] p-6 shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-center">Entrar com Código</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <p className="text-xs text-center text-muted-foreground px-4">
              Peça o código de 8 caracteres ao catequista responsável pela turma.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ex: TP847293"
                maxLength={8}
                autoFocus
                className="w-full px-4 py-4 rounded-2xl border-2 border-border bg-background text-foreground text-center text-2xl font-black tracking-[0.3em] uppercase focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              onClick={handleJoinByCode}
              disabled={joinMutation.isPending || joinCode.trim().length < 8}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-wider hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {joinMutation.isPending ? "Verificando..." : "Entrar na Turma"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ── MODAL DE ANIVERSÁRIO LITÚRGICO ── */}
      <Dialog open={!!selectedCatequizando} onOpenChange={() => setSelectedCatequizando(null)}>
        <DialogContent className="max-w-[340px] mx-auto rounded-[32px] p-0 border-none shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="liturgical-frame w-full h-full p-2">
            <div className="bg-white dark:bg-zinc-900 rounded-[24px] overflow-hidden relative">
              {/* Background Litúrgico */}
              <div className="absolute inset-0 liturgical-rays-bg animate-sacred-rays pointer-events-none" />
              
              <DialogHeader className="p-6 pb-2 text-center relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-amber-400 overflow-hidden shadow-xl shadow-amber-500/20">
                      {selectedCatequizando?.foto ? (
                        <img src={selectedCatequizando.foto} alt={selectedCatequizando.nome} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-amber-50 flex items-center justify-center text-amber-500 text-3xl font-black">
                          {selectedCatequizando?.nome?.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Estrela de Aniversário */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce-subtle">
                      <Cake className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-2xl font-black text-black dark:text-white leading-tight uppercase tracking-tight px-2">
                  {selectedCatequizando?.nome}
                </h2>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className={cn(
                    "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    selectedCatequizando?.isCatequista ? "bg-primary text-white" : "bg-emerald-500 text-white"
                  )}>
                    {selectedCatequizando?.isCatequista ? "Catequista" : "Catequizando"}
                  </span>
                </div>
              </DialogHeader>

              <div className="p-6 pt-2 space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/20 text-center">
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Aniversário</p>
                    <p className="text-sm font-black text-black dark:text-white">
                      {selectedCatequizando?.dataNascimento ? formatarDataVigente(selectedCatequizando.dataNascimento) : "--"}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/20 text-center">
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">Batismo</p>
                    <p className="text-sm font-black text-black dark:text-white">
                      {selectedCatequizando?.sacramentos?.batismo?.data ? formatarDataVigente(selectedCatequizando.sacramentos.batismo.data) : "Não inf."}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", heroColors)}>
                    <LiturgicalIcon type={selectedTurma?.etapa} className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Turma</p>
                    <p className="text-sm font-black text-foreground">
                      {selectedTurmaId === "all" ? "Múltiplas Turmas" : selectedTurma?.nome}
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedCatequizando(null)}
                  className="w-full h-12 bg-black text-white hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 border-none"
                >
                  Parabéns!!
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
