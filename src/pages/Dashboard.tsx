import { useMemo, useState, useEffect, useRef } from "react";
import { BookOpen, Users, CalendarDays, ChevronRight, Cake, X, BellRing, Trophy, Book, AlertTriangle, Heart, Link2, Loader2, RefreshCw, Flame, Sparkles, Mail, Code, Plus, ListChecks, Church, Compass, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAtividades, useParoquias, useComunidades, useCatequistas, useTurmas, useEncontros, useCatequizandos, useMissoesFamilia, useComunicacaoForms, useAllRespostas } from "@/hooks/useSupabaseData";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ObjectiveModal } from "@/components/ObjectiveModal";
import { TurmaChoiceStep } from "@/components/Onboarding/TurmaChoiceStep";
import { OnboardingIntroStep } from "@/components/Onboarding/OnboardingIntroStep";
import { ConversationalOnboarding } from "@/components/Onboarding/ConversationalOnboarding";
import WelcomeModal from "@/components/WelcomeModal";
import { ParoquiaStep } from "@/components/Onboarding/ParoquiaStep";
import { CatequistaStep } from "@/components/Onboarding/CatequistaStep";
import { TurmaStep } from "@/components/Onboarding/TurmaStep";
import { WelcomeStep } from "@/components/Onboarding/WelcomeStep";
import { ConsentModal } from "@/components/Onboarding/ConsentModal";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedTurmaId, setSelectedTurmaIdRaw] = useState<string | "all">(
    () => localStorage.getItem("ivc_selected_turma") || "all"
  );
  const [isAgendaExpanded, setIsAgendaExpanded] = useState(false);
  const agendaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAgendaExpanded && agendaRef.current) {
      setTimeout(() => {
        agendaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isAgendaExpanded]);

  // Persiste a turma selecionada no localStorage
  const setSelectedTurmaId = (id: string | "all") => {
    setSelectedTurmaIdRaw(id);
    if (id === "all") localStorage.removeItem("ivc_selected_turma");
    else localStorage.setItem("ivc_selected_turma", id);
  };
  const { data: turmas = [], isLoading: tLoading, error: tError, refetch: tRefetch, isFetching: tFetching } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros();
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos();
  const { data: catequistas = [], isLoading: catLoading } = useCatequistas();
  const { data: paroquias = [] } = useParoquias();
  const { data: comunidades = [] } = useComunidades();
  const { data: atividades = [], isLoading: aLoading } = useAtividades(selectedTurmaId === "all" ? undefined : selectedTurmaId);
  const { data: missoes = [], isLoading: mLoading } = useMissoesFamilia(selectedTurmaId === "all" ? undefined : selectedTurmaId);
  const [turmaPickerOpen, setTurmaPickerOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<"none" | "terms" | "turma-choice" | "intro" | "paroquia" | "catequista" | "turma" | "welcome" | "join-code">("none");
  const { user, isReady, signOut } = useAuth();
  const [showCreateTurma, setShowCreateTurma] = useState(false);
  const { permission, subscribe, loading: pushLoading } = usePushNotifications();

  const { data: globalMissoes = [] } = useMissoesFamilia();
  const { data: comunicacaoForms = [] } = useComunicacaoForms();
  const formIds = useMemo(() => comunicacaoForms.map(f => f.id), [comunicacaoForms]);
  const { data: todasRespostas = [] } = useAllRespostas(formIds);
  const respostasCount = todasRespostas.length;

  const totalMissoesConcluidas = useMemo(() => globalMissoes.reduce((acc, m) => acc + (m.concluidas || 0), 0), [globalMissoes]);
  const pendentesInscricao = useMemo(() => catequizandos.filter(c => c.status === 'pending'), [catequizandos]);
  const totalMensagens = totalMissoesConcluidas + respostasCount + pendentesInscricao.length;

  const feedMensagens = useMemo(() => {
    const feed: { id: string; tipo: 'iavalia' | 'missao'; titulo: string; remetente: string; data: Date; rawDate: string; }[] = [];
    
    todasRespostas.forEach(r => {
      const form = comunicacaoForms.find(f => f.id === r.form_id);
      feed.push({
        id: `resp_${r.id}`,
        tipo: 'iavalia',
        titulo: form?.titulo || 'Questionário',
        remetente: r.nome_respondente || 'Anônimo',
        data: new Date(r.criado_em || Date.now()),
        rawDate: r.criado_em || ''
      });
    });

    globalMissoes.forEach(m => {
      if (m.concluidas > 0) {
        feed.push({
          id: `missao_${m.id}`,
          tipo: 'missao',
          titulo: m.titulo,
          remetente: `${m.concluidas} família(s) concluíram`,
          data: new Date(m.criadoEm || Date.now()),
          rawDate: m.criadoEm || ''
        });
      }
    });

    pendentesInscricao.forEach(c => {
      feed.push({
        id: `inscricao_${c.id}`,
        tipo: 'inscricao' as any,
        titulo: 'Nova Inscrição Online',
        remetente: c.nome,
        data: new Date(c.criado_em || Date.now()),
        rawDate: c.criado_em || ''
      });
    });

    return feed.sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [todasRespostas, comunicacaoForms, globalMissoes]);

  const [lastSeenMensagens, setLastSeenMensagens] = useState(() => {
    return parseInt(localStorage.getItem('ivc_last_seen_mensagens') || '0', 10);
  });
  const [showNovaMensagem, setShowNovaMensagem] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);

  useEffect(() => {
    if (totalMensagens > lastSeenMensagens) {
      setShowNovaMensagem(true);
      const timer = setTimeout(() => {
        setShowNovaMensagem(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [totalMensagens, lastSeenMensagens]);

  const handleMessagesClick = () => {
    setLastSeenMensagens(totalMensagens);
    localStorage.setItem('ivc_last_seen_mensagens', totalMensagens.toString());
    setMessagesModalOpen(true);
  };



  const loading = tLoading || eLoading || cLoading || catLoading || aLoading || mLoading;

  useEffect(() => {
    if (!loading && !tError && isReady && user) {
      // 1. Verificar se aceitou os termos (prioridade máxima)
      const termsAcceptedMeta = user?.user_metadata?.terms_accepted;
      const termsAcceptedLocal = localStorage.getItem("ivc_terms_accepted");
      
      if (!termsAcceptedMeta && !termsAcceptedLocal) {
        setOnboardingStep("terms");
        return;
      }

      // Se tiver Paróquia, Catequista e Turma, encerra o onboarding
      if (paroquias.length > 0 && catequistas.length > 0 && turmas.length > 0) {
        if (onboardingStep !== "none" && onboardingStep !== "welcome") {
           setOnboardingStep("none");
        }
        return;
      }

      if (onboardingStep === "none") {
        if (paroquias.length === 0 && comunidades.length === 0) {
          setOnboardingStep("turma-choice");
        } else if (catequistas.length === 0) {
          setOnboardingStep("catequista");
        } else {
          // Se chegou aqui, tem paróquia e catequista, então não deveria bloquear.
          // Mas por segurança, se o fluxo explicitamente pedir "turma", deixamos.
          // Porém a regra acima já deve ter capturado os casos de dashboard.
          setOnboardingStep("none");
        }
      }
    }
  }, [loading, tError, turmas.length, paroquias.length, comunidades.length, catequistas.length, user, isReady, onboardingStep]);

  // Realtime subscriptions for notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comunicacao_respostas' },
        () => {
          tRefetch();
          toast.info("Nova resposta do Conecta Família recebida!");
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'catequizandos' },
        () => {
          tRefetch();
          toast.info("Nova inscrição online recebida!");
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'missoes_familia' },
        () => {
          tRefetch();
          toast.info("Uma família concluiu uma missão!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, tRefetch]);

  useEffect(() => {
    if (!loading) {
      if (turmas.length === 0) {
        if (selectedTurmaId !== "all") {
          setSelectedTurmaId("all");
        }
      } else {
        const currentIdExists = turmas.find(t => t.id === selectedTurmaId);
        if (!currentIdExists) {
          // Se não há turma selecionada ou a selecionada sumiu, escolhe a primeira
          setSelectedTurmaId(turmas[0].id);
        }
      }
    }
  }, [loading, turmas.length, selectedTurmaId]);

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

  const nomeMesCompleto = useMemo(() => {
    return hoje.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
  }, [hoje]);

  const parseDataLocal = (dataStr: string) => {
    if (!dataStr) return new Date();
    const parts = dataStr.split('T')[0].split('-');
    if (parts.length === 3) return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return new Date(dataStr);
  };

  const filteredCatequizandos = useMemo(() => {
    const validTurmaIds = new Set(turmas.map(t => t.id));
    const base = catequizandos.filter(c => validTurmaIds.has(c.turmaId));
    if (selectedTurmaId === "all") return base;
    return base.filter(c => c.turmaId === selectedTurmaId);
  }, [catequizandos, selectedTurmaId, turmas]);

  const filteredEncontros = useMemo(() => {
    const validTurmaIds = new Set(turmas.map(t => t.id));
    const base = encontros.filter(e => validTurmaIds.has(e.turmaId));
    if (selectedTurmaId === "all") return base;
    return base.filter(e => e.turmaId === selectedTurmaId);
  }, [encontros, selectedTurmaId, turmas]);

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
    const peopleData = new Map<string, any>();

    const allPeople = [
      ...filteredCatequizandos.map(c => ({...c, isCatequista: false})),
      ...catequistas.map(c => ({...c, isCatequista: true}))
    ];

    allPeople.forEach(p => {
      const events: any[] = [];
      const dataStr = p.dataNascimento;
      if (dataStr) {
        const bday = new Date(dataStr + (dataStr.includes('T') ? '' : 'T12:00:00'));
        events.push({ tipo: 'nascimento', day: bday.getDate(), month: bday.getMonth() });
      }
      
      const batismoStr = p.sacramentos?.batismo?.data;
      if (!p.isCatequista && batismoStr) {
        const bday = new Date(batismoStr + (batismoStr.includes('T') ? '' : 'T12:00:00'));
        events.push({ tipo: 'batismo', day: bday.getDate(), month: bday.getMonth() });
      }

      if (events.length > 0) {
        peopleData.set(p.id, { ...p, events });
      }
    });

    if (peopleData.size === 0) return [];

    const todayMonth = hoje.getMonth();
    const todayDay = hoje.getDate();

    const instances: any[] = [];
    peopleData.forEach(p => {
      p.events.forEach((e: any) => {
        instances.push({ ...p, ...e, allEvents: p.events });
      });
    });

    const sortedInstances = instances.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

    let upcoming = sortedInstances.filter(inst => 
      inst.month > todayMonth || (inst.month === todayMonth && inst.day >= todayDay)
    );

    if (upcoming.length === 0) {
      upcoming = sortedInstances;
    }

    const result: any[] = [];
    const seenPeople = new Set();
    
    for (const inst of upcoming) {
      if (!seenPeople.has(inst.id)) {
        seenPeople.add(inst.id);
        const hasBoth = inst.allEvents.length > 1;
        result.push({
          ...inst,
          hasBoth
        });
      }
      if (result.length >= 4) break;
    }

    if (result.length < 4 && result.length < peopleData.size) {
      for (const inst of sortedInstances) {
        if (!seenPeople.has(inst.id)) {
          seenPeople.add(inst.id);
          result.push({ ...inst, hasBoth: inst.allEvents.length > 1 });
        }
        if (result.length >= 4) break;
      }
    }

    return result;
  }, [filteredCatequizandos, catequistas, hoje]);

  const proximasAtividades = useMemo(() => {
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
      .slice(0, 1);
  }, [atividades, missoes, hoje]);

  const [selectedCatequizando, setSelectedCatequizando] = useState<any>(null);

  function getDiasRestantes(dataStr: string) {
    const d = parseDataLocal(dataStr);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - hoje.getTime()) / 86400000);
  }



  if (loading && onboardingStep === "none") {
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



  return (
    <div className="space-y-2.5">
      {/* ONBOARDING FLOW */}

      {/* 0. Termos de Uso (Gate Inicial) */}
      <ConsentModal
        open={onboardingStep === "terms"}
        onAccept={async () => {
          try {
            // Salva no Supabase para persistir entre dispositivos
            await supabase.auth.updateUser({
              data: { terms_accepted: true }
            });
            localStorage.setItem("ivc_terms_accepted", "true");
            
            // Verifica se deve ir para o onboarding ou direto pro dash
            const hasData = turmas.length > 0 || paroquias.length > 0 || catequistas.length > 0;
            if (hasData) {
              setOnboardingStep("none");
            } else {
              // Direciona para o passo correto
              if (paroquias.length === 0 && comunidades.length === 0) {
                setOnboardingStep("turma-choice");
              } else if (catequistas.length === 0) {
                setOnboardingStep("catequista");
              } else {
                setOnboardingStep("turma");
              }
            }
          } catch (err) {
            console.error("Erro ao aceitar termos:", err);
            localStorage.setItem("ivc_terms_accepted", "true"); // Fallback
            setOnboardingStep("none");
          }
        }}
        onCancel={() => signOut()}
      />

      <TurmaChoiceStep
        open={onboardingStep === "turma-choice"}
        onSelectCreate={() => setOnboardingStep("paroquia")}
        onSelectJoin={() => {
          setOnboardingStep("join-code");
        }}
        onExit={() => signOut()}
      />

      <OnboardingIntroStep
        open={onboardingStep === "intro"}
        onStart={() => setOnboardingStep("paroquia")}
      />

      <ConversationalOnboarding 
        open={["paroquia", "catequista", "turma"].includes(onboardingStep)}
        onComplete={async () => {
          localStorage.setItem("ivc_onboarding_completed", "true");
          setOnboardingStep("welcome"); // Show welcome modal with progress
          tRefetch();
        }}
      />

      <TurmaStep 
        open={showCreateTurma}
        onSuccess={() => setShowCreateTurma(false)}
        onClose={() => setShowCreateTurma(false)}
      />

      <WelcomeModal
        open={onboardingStep === "welcome"}
        onClose={() => setOnboardingStep("none")}
        hasParoquia={paroquias.length > 0 || comunidades.length > 0}
        hasCatequista={catequistas.length > 0}
        hasTurma={turmas.length > 0}
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

      <div className="animate-fade-in flex items-start justify-between mb-1 mt-0 px-1">
        <div>
          <h1 className="text-base font-black text-foreground uppercase tracking-tight mt-1">Olá, Catequista! 
            <span className="inline-block animate-waving-hand ml-2">👋</span>
          </h1>
        </div>
        
        {/* Ícone de mensagens */}
        <button 
          onClick={handleMessagesClick}
          className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-blue-50 transition-all shadow-sm border border-black/5"
        >
          <Mail className={cn("h-4 w-4 text-blue-600", totalMensagens > lastSeenMensagens && "animate-bounce-subtle")} />
          {totalMensagens > lastSeenMensagens && (
            <>
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              {showNovaMensagem && (
                <div className="absolute right-12 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-right-2">
                  Nova Mensagem
                </div>
              )}
            </>
          )}
        </button>
      </div>

      {/* CARD DE CRIAR TURMA (QUANDO NÃO HÁ TURMAS) */}
      {turmas.length === 0 && onboardingStep === "none" && (
        <div className="animate-card-activate mb-4">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-[1px] shadow-xl shadow-emerald-500/20">
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[31px] p-6 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <Users className="w-32 h-32 text-emerald-600" />
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center border border-emerald-200 dark:border-emerald-700/50 shadow-inner">
                  <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-foreground tracking-tight">Sua jornada começa aqui!</h3>
                  <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                    Agora para usar o aplicativo com todas as suas funcionalidades <strong>crie sua turma de catequese</strong> ou você pode <strong>entrar em uma turma de catequese já existente</strong>, é só pedir para o catequista responsável lhe fornecer o código da turma e aguardar que ele autorize a sua entrada.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 w-full mt-2">
                  <button
                    onClick={() => setShowCreateTurma(true)}
                    className="w-full bg-emerald-600 text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-3"
                  >
                    <Plus className="h-5 w-5" />
                    Criar Minha Primeira Turma
                  </button>
                  
                  <button
                    onClick={() => setJoinModalOpen(true)}
                    className="w-full bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-2 border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-zinc-700/50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-3"
                  >
                    <Link2 className="h-5 w-5" />
                    Entrar com Código
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VARAL DE POLAROIDS (ANIVERSARIANTES) ── sempre visível */}
      <div className="relative pt-0 pb-6 mb-0 animate-fade-in -mt-1">
        {/* Título da Seção */}
        <div className="flex flex-col items-center justify-center mb-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Próximos Aniversários</h2>
          <div className="h-0.5 w-5 bg-blue-600/30 rounded-full"></div>
        </div>

        {aniversariantesMes.length > 0 ? (
          /* Container dos Cards */
          <div className={cn(
            "flex gap-2 relative z-10 px-1 min-h-[90px]",
            aniversariantesMes.length === 1 ? "justify-center" : "justify-center sm:gap-4"
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
                      "bg-white p-1 pb-1.5 shadow-md border relative overflow-hidden transition-colors",
                      isHoje ? "border-amber-400 ring-1 ring-amber-400/20" : "border-black/5"
                    )}>
                      <div className="w-10 h-10 overflow-hidden bg-muted relative">
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
        ) : (
          /* Estado vazio — sem pessoas cadastradas */
          <div className="flex flex-col items-center justify-center py-3 px-4 min-h-[80px]">
            <div className="flex items-center gap-2 text-muted-foreground/40">
              <Cake className="w-5 h-5" />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum aniversariante cadastrado</p>
            </div>
          </div>
        )}
      </div>

      {/* Tarja de Aprovação Pendente */}
      {selectedTurmaId !== "all" && selectedTurma?.status === 'pending' && (
        <div className="mb-4 mx-4 animate-in slide-in-from-top duration-500">
          <div className="bg-amber-100 border-2 border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-amber-800 font-black text-[10px] uppercase tracking-widest mb-0.5">Acesso Pendente</p>
              <p className="text-amber-700/80 text-[11px] font-bold leading-tight">
                Espere o catequista autorizar sua entrada na turma <span className="text-amber-900 font-black">{selectedTurma.nome}</span>.
              </p>
            </div>
          </div>
        </div>
      )}
      


      {/* ── MÓDULOS DE ACESSO RÁPIDO (CATEQUIZANDOS E ENCONTROS) ── */}
      {turmas.length > 0 && (
        <div className="space-y-0 px-2 mt-20 animate-fade-in flex flex-col items-center">
          
          {/* Card Turma (Nó central) */}
          <div className="bg-white border border-black/5 shadow-sm rounded-2xl p-2 flex items-center justify-between w-full z-10 relative">
            <div className="flex items-center gap-2.5 overflow-hidden pl-0.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50/80 flex items-center justify-center shrink-0 border border-blue-100/50">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Turma Selecionada</p>
                <h3 className="text-xs font-black text-foreground truncate uppercase tracking-tight leading-none mt-0.5">
                  {selectedTurmaId === "all" ? "Todas as Turmas" : selectedTurma?.nome}
                </h3>
              </div>
            </div>
            {(turmas.length > 1 || selectedTurmaId === "all") && (
              <button 
                onClick={() => setTurmaPickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 transition-all active:scale-95 shrink-0 mr-0.5"
              >
                <RefreshCw className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Trocar</span>
              </button>
            )}
          </div>

          {/* Linhas de conexão (Árvore) */}
          <div className="relative w-full h-8 flex justify-center z-0">
            {/* Linha vertical central descendo do card da turma */}
            <div className="absolute top-0 w-[2px] h-1/2 bg-blue-600" />
            {/* Linha horizontal dividindo para as duas colunas */}
            <div className="absolute top-1/2 w-[calc(50%-24px)] h-[2px] bg-blue-600" />
            {/* Linhas verticais descendo para os cards */}
            <div className="absolute top-1/2 left-[calc(25%+12px)] w-[2px] h-1/2 bg-blue-600" />
            <div className="absolute top-1/2 right-[calc(25%+12px)] w-[2px] h-1/2 bg-blue-600" />
          </div>

          {/* Grid de Módulos — cards flutuantes com degradê */}
          <div className="grid grid-cols-2 gap-4 w-full relative z-10 px-8">
            {/* Card Catequizandos */}
            <div className="relative group">
              {/* Sombra degradê flutuante */}
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-br from-blue-200 via-indigo-200 to-violet-200 opacity-25 blur-xl group-hover:opacity-40 transition-opacity duration-500 animate-pulse" style={{ animationDuration: '3s' }} />
              <button
                onClick={() => {
                  if (selectedTurmaId !== "all" && selectedTurma?.status !== 'pending') {
                    navigate(`/turmas/${selectedTurmaId}/catequizandos`);
                  } else if (selectedTurmaId === "all") {
                    toast.info("Selecione uma turma para acessar este módulo.");
                    setTurmaPickerOpen(true);
                  } else {
                    toast.info("Aguarde a aprovação do acesso.");
                  }
                }}
                className="relative aspect-square w-full rounded-[36px] overflow-hidden hover:scale-[1.04] active:scale-95 transition-all duration-300"
                style={{ boxShadow: '0 12px 30px -6px rgba(99,102,241,0.18), 0 4px 12px -4px rgba(59,130,246,0.12)' }}
              >
                <img src="/card_catequizandos.jpg" alt="Catequizandos" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 group-hover:from-black/5 transition-all duration-300" />
              </button>
            </div>

            {/* Card Encontros */}
            <div className="relative group">
              {/* Sombra degradê flutuante */}
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-br from-rose-200 via-pink-200 to-orange-200 opacity-25 blur-xl group-hover:opacity-40 transition-opacity duration-500 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
              <button
                onClick={() => {
                  if (selectedTurmaId !== "all" && selectedTurma?.status !== 'pending') {
                    navigate(`/turmas/${selectedTurmaId}/encontros`);
                  } else if (selectedTurmaId === "all") {
                    toast.info("Selecione uma turma para acessar este módulo.");
                    setTurmaPickerOpen(true);
                  } else {
                    toast.info("Aguarde a aprovação do acesso.");
                  }
                }}
                className="relative aspect-square w-full rounded-[36px] overflow-hidden hover:scale-[1.04] active:scale-95 transition-all duration-300"
                style={{ boxShadow: '0 12px 30px -6px rgba(244,63,94,0.18), 0 4px 12px -4px rgba(251,113,133,0.12)' }}
              >
                <img src="/card_encontros.jpg" alt="Encontros" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 group-hover:from-black/5 transition-all duration-300" />
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ── CARD AGENDA LITÚRGICA ── */}
      {(proximoEncontro || proximasAtividades.length > 0) && (
        <div className="pt-10 mb-2">
          <div className="animate-float-up relative" style={{ animationDelay: '200ms' }}>

          
          {/* Card Nome da Agenda (Clicável) */}
          <button 
            onClick={() => setIsAgendaExpanded(!isAgendaExpanded)}
            className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-4 py-2.5 flex items-center gap-2.5 transition-all duration-500 active:scale-95 group rounded-2xl border shadow-lg bg-white border-emerald-400 ring-2 ring-emerald-400/20 shadow-emerald-400/10",
              !isAgendaExpanded && "scale-105"
            )}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-emerald-50">
              <img src="/icone_agenda.png" alt="Agenda" className={cn("w-8 h-8 object-contain shrink-0", !isAgendaExpanded && "animate-bounce-subtle drop-shadow-sm")} />
            </div>
            <div className="flex flex-col items-start">
              <h3 className="text-[13px] font-black uppercase tracking-widest whitespace-nowrap leading-none">
                <span className="text-black">AGENDA DA TURMA</span>
                <span className="text-emerald-700"> - {nomeMesCompleto}</span>
              </h3>
              <span className="text-[8px] font-bold uppercase tracking-tight mt-1 text-emerald-600/70">
                {isAgendaExpanded ? "Próximos encontros e atividades" : "Toque para ver a agenda"}
              </span>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform duration-300 text-emerald-600",
              isAgendaExpanded ? "rotate-180" : "rotate-0"
            )} />
          </button>

          <div ref={agendaRef} className={cn(
            "relative rounded-3xl overflow-hidden bg-orange-100/40 shadow-sm border-2 border-orange-200/60 transition-all duration-500 ease-in-out",
            isAgendaExpanded ? "pt-8 pb-2 opacity-100" : "h-0 pt-0 pb-0 opacity-0 border-none"
          )}>

            {/* ── TIMELINE DE EVENTOS ── */}
            <div className="relative pb-4 px-4">
              {/* Mês no topo da linha */}
              <div className="absolute left-[36px] top-0 -translate-x-1/2 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl z-10 shadow-lg shadow-primary/20 border border-primary/20">
                {MESES_ABREV[hoje.getMonth()]}
              </div>

              {/* Fio vertical descendo do mês */}
              <div className="absolute left-[36px] top-5 bottom-4 w-[2px]"
                style={{ background: 'linear-gradient(180deg, #6366f133 0%, #6366f155 40%, #3b82f633 100%)' }} />

              <div className="space-y-4 ml-[16px] pt-4">
                {/* ── EVENTO: PRÓXIMO ENCONTRO ── */}
                {proximoEncontro && (() => {
                  const dataE = parseDataLocal(proximoEncontro.data);
                  return (
                    <div key={`encontro-${proximoEncontro.id}`} className="relative pl-8 animate-float-up">
                      <div className="absolute left-[-5px] top-5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background z-10" />
                      <button 
                        onClick={() => navigate(`/turmas/${proximoEncontro.turmaId}/encontros/${proximoEncontro.id}`)}
                        className="w-full float-card flex items-center gap-3 p-4 text-left group bg-blue-50/40 border-2 border-blue-200/60 shadow-sm rounded-2xl transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1 active:scale-95"
                      >
                        <div className="icon-box w-10 h-10 rounded-xl shrink-0 bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                          <Church className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                            {proximoEncontro.tema}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase">Encontro</span>
                            {diaLabel && (
                              <span className={cn(
                                "text-[7px] font-black px-1.5 py-0.5 rounded text-white leading-none uppercase tracking-widest",
                                isUrgent ? "bg-red-500 animate-pulse" : "bg-emerald-500"
                              )}>{diaLabel}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[45px] h-[45px] bg-primary/5 rounded-2xl border border-primary/10 shrink-0">
                          <p className="text-[9px] font-black text-primary/60 uppercase leading-none mb-0.5">Dia</p>
                          <p className="text-xl font-black text-primary leading-none">
                            {String(dataE.getDate()).padStart(2, '0')}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })()}

                {/* ── EVENTOS: ATIVIDADES ── */}
                {proximasAtividades.map((item, index) => {
                  const isMissao = item.itemType === 'missao';
                  const dataObj = parseDataLocal(item.data);
                  return (
                    <div key={`atividade-${item.id}`} className="relative pl-8 animate-float-up" style={{ animationDelay: `${(index + 1) * 50}ms` }}>
                      <div className="absolute left-[-5px] top-5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-background z-10" />
                      <button 
                        onClick={() => {
                          if (isMissao) navigate(`/turmas/${item.turmaId}/familia`);
                          else navigate(`/turmas/${item.turmaId}/atividades?view=${item.id}`);
                        }}
                        className="w-full float-card flex items-center gap-3 p-4 text-left group bg-emerald-50/40 border-2 border-emerald-200/60 shadow-sm rounded-2xl transition-all duration-300 hover:shadow-md hover:border-emerald-500/40 hover:-translate-y-1 active:scale-95"
                      >
                        <div className="icon-box w-10 h-10 rounded-xl shrink-0 bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                            {isMissao ? (item as any).titulo : (item as any).nome}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase">
                              Atividade
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center min-w-[45px] h-[45px] bg-blue-50 rounded-2xl border border-blue-100 shrink-0">
                          <p className="text-[9px] font-black text-blue-600/60 uppercase leading-none mb-0.5">Dia</p>
                          <p className="text-xl font-black text-blue-600 leading-none">
                            {String(dataObj.getDate()).padStart(2, '0')}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Faixa dourada inferior */}
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #f59e0b44, #f5d06088, #f59e0b44, transparent)' }} />
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
            {turmas.some(t => t.status === 'pending') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium leading-tight">
                  Algumas turmas aguardam aprovação. Você terá acesso total assim que o responsável autorizar.
                </p>
              </div>
            )}


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
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground truncate">{t.nome}</p>
                      {t.status === 'pending' && (
                        <span className="text-[7px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200">
                          Pendente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.etapa} • {count} alunos</p>
                    {t.status === 'pending' && (
                      <p className="text-[7px] text-amber-600 font-bold mt-0.5 animate-pulse">Aguardando autorização do catequista...</p>
                    )}
                  </div>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <JoinTurmaModal 
        open={joinModalOpen || onboardingStep === "join-code"} 
        onClose={() => {
          setJoinModalOpen(false);
          if (onboardingStep === "join-code") setOnboardingStep("turma-choice");
        }}
        onSuccess={(result) => {
          setSelectedTurmaId(result.id);
          if (onboardingStep === "join-code") setOnboardingStep("none");
        }}
      />
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
      {/* Dialogo de Mensagens */}
      <Dialog open={messagesModalOpen} onOpenChange={setMessagesModalOpen}>
        <DialogContent className="max-w-md mx-auto rounded-[32px] p-6 shadow-2xl border-none bg-background/95 backdrop-blur-xl max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0 mb-2">
            <DialogTitle className="text-2xl font-black tracking-tight center text-blue-600">Mensagens Recebidas</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
            {feedMensagens.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-blue-600 opacity-50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhuma mensagem recebida ainda.</p>
              </div>
            ) : (
              feedMensagens.map(msg => (
                <div key={msg.id} className="bg-white dark:bg-zinc-800/80 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50 shadow-sm flex items-start gap-3 transition-all hover:border-blue-500/20">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-[0.5px]", 
                    msg.tipo === 'iavalia' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                    msg.tipo === 'missao' ? "bg-orange-50 text-orange-600 border-orange-200" :
                    "bg-blue-50 text-blue-600 border-blue-200"
                  )}>
                    {msg.tipo === 'iavalia' ? <BookOpen className="h-5 w-5" /> : 
                     msg.tipo === 'missao' ? <Heart className="h-5 w-5" /> :
                     <Users className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[9px] font-black uppercase tracking-wider mb-1", 
                      msg.tipo === 'iavalia' ? "text-emerald-600" : 
                      msg.tipo === 'missao' ? "text-orange-600" :
                      "text-blue-600"
                    )}>
                      {msg.tipo === 'iavalia' ? 'Conecta famílias - Resposta' : 
                       msg.tipo === 'missao' ? 'Catequese em Família' :
                       'Nova Inscrição Online'}
                    </p>
                    <h4 className="text-sm font-bold text-foreground truncate">{msg.titulo}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.tipo === 'iavalia' ? (
                        <>Respondido por: <strong className="text-foreground">{msg.remetente}</strong></>
                      ) : msg.tipo === 'missao' ? (
                        <>{msg.remetente}</>
                      ) : (
                        <>Inscrito: <strong className="text-foreground">{msg.remetente}</strong></>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 shrink-0">
            <Button 
              onClick={() => setMessagesModalOpen(false)}
              className="w-full rounded-2xl h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
