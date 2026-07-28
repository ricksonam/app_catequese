import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { useEncontros, useCatequizandos, useAtividades, useReunioes } from "@/hooks/useSupabaseData";
import { ArrowLeft, BookHeart, Save, ChevronDown, BookOpen, Sparkles, TrendingUp, Users } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { cn, formatarDataVigente } from "@/lib/utils";

type TipoRegistro = "encontro" | "evento" | "evolucao" | "reuniao";

const tiposRegistro: { value: TipoRegistro; label: string; icon: React.ElementType; cor: string; iconColor: string; animation: string; descricao: string }[] = [
  { value: "encontro", label: "Encontro", icon: BookOpen, cor: "bg-indigo-600 text-white ring-indigo-600/50 border-indigo-600", iconColor: "text-indigo-500", animation: "animate-[pulse_2s_ease-in-out_infinite]", descricao: "Registro de um encontro catequético" },
  { value: "evento", label: "Evento", icon: Sparkles, cor: "bg-amber-500 text-white ring-amber-500/50 border-amber-500", iconColor: "text-amber-500", animation: "animate-[pulse_2s_ease-in-out_infinite]", descricao: "Registro de um evento ou atividade especial" },
  { value: "reuniao", label: "Reunião", icon: Users, cor: "bg-blue-600 text-white ring-blue-600/50 border-blue-600", iconColor: "text-blue-500", animation: "animate-[pulse_2s_ease-in-out_infinite]", descricao: "Registro de reunião com pais ou catequistas" },
  { value: "evolucao", label: "Evolução", icon: TrendingUp, cor: "bg-emerald-600 text-white ring-emerald-600/50 border-emerald-600", iconColor: "text-emerald-500", animation: "animate-[pulse_2s_ease-in-out_infinite]", descricao: "Registro de evolução espiritual e comportamental" },
];

const agruparPorMes = (items: any[]) => {
  const grupos: Record<string, any[]> = {};
  
  const ordenados = [...items].sort((a, b) => {
    const dateA = new Date(a.data ? (a.data.includes('T') ? a.data : `${a.data}T12:00:00`) : 0).getTime();
    const dateB = new Date(b.data ? (b.data.includes('T') ? b.data : `${b.data}T12:00:00`) : 0).getTime();
    return dateB - dateA;
  });

  ordenados.forEach(item => {
    if (!item.data) {
      if (!grupos["Sem data definida"]) grupos["Sem data definida"] = [];
      grupos["Sem data definida"].push(item);
      return;
    }
    const date = new Date(item.data.includes('T') ? item.data : `${item.data}T12:00:00`);
    const monthYear = date.toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' });
    const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    
    if (!grupos[capitalized]) {
      grupos[capitalized] = [];
    }
    grupos[capitalized].push(item);
  });
  return grupos;
};

export default function DiarioEspiritualForm() {
  const { id, diarioId } = useParams();
  const navigate = useNavigate();
  const { diarios, criarDiario, atualizarDiario } = useDiarioEspiritual(id!);
  const { data: encontros = [] } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const { data: atividades = [] } = useAtividades(id);
  const { data: reunioesData = [] } = useReunioes(id);

  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>("encontro");
  // Ocultamos o input de data no formulário, mas mantemos o estado para salvar automaticamente
  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split("T")[0]);
  const [encontroId, setEncontroId] = useState("");
  const [eventoId, setEventoId] = useState("");
  const [comoFoi, setComoFoi] = useState("");
  const [pontosPositivos, setPontosPositivos] = useState("");
  const [pontosNegativos, setPontosNegativos] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [evolucao, setEvolucao] = useState("");
  const [participantesReuniao, setParticipantesReuniao] = useState("");

  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [evolucoes, setEvolucoes] = useState<any[]>([]);

  const [expandedAv, setExpandedAv] = useState<Record<string, boolean>>({});
  const [expandedEv, setExpandedEv] = useState<Record<string, boolean>>({});
  
  const [openEncontro, setOpenEncontro] = useState(false);
  const [openEvento, setOpenEvento] = useState(false);
  const [openReuniao, setOpenReuniao] = useState(false);

  const [reuniaoId, setReuniaoId] = useState("");

  const toggleAv = (cid: string) => setExpandedAv(prev => ({ ...prev, [cid]: !prev[cid] }));
  const toggleEv = (cid: string) => setExpandedEv(prev => ({ ...prev, [cid]: !prev[cid] }));

  const isEditing = !!diarioId;

  // Eventos filtrados (tipo atividade, não reunião)
  const eventos = atividades.filter((a: any) =>
    !a.tipo?.toLowerCase().includes("reunião") && !a.tipo?.toLowerCase().includes("reuniao")
  );

  // Reuniões do módulo Reuniões (tabela reunioes)
  const reunioes = reunioesData;

  useEffect(() => {
    if (catequizandos.length > 0) {
      if (isEditing && diarios) {
        const diario = diarios.find((d) => d.id === diarioId);
        if (diario) {
          setTipoRegistro((diario as any).tipo_registro || "encontro");
          setDataRegistro(diario.data_registro || new Date().toISOString().split("T")[0]);
          setEncontroId(diario.encontro_id || "");
          if ((diario as any).tipo_registro === "reuniao") {
            setReuniaoId((diario as any).reuniao_id || "");
          } else {
            setEventoId((diario as any).evento_id || "");
          }
          setComoFoi(diario.como_foi || "");
          setPontosPositivos(diario.pontos_positivos || "");
          setPontosNegativos(diario.pontos_negativos || "");
          setObservacoes(diario.observacoes_catequizandos || "");
          setEvolucao(diario.evolucao_espiritual || "");
          setParticipantesReuniao((diario as any).participantes_reuniao || "");

          if (diario.avaliacoes_catequizandos && Array.isArray(diario.avaliacoes_catequizandos) && diario.avaliacoes_catequizandos.length > 0) {
            setAvaliacoes(diario.avaliacoes_catequizandos);
          } else {
            setAvaliacoes(catequizandos.map(c => ({ catequizando_id: c.id, nome: c.nome, pontualidade: 0, participacao_grupo: 0, engajamento: 0 })));
          }

          if (diario.evolucao_catequizandos && Array.isArray(diario.evolucao_catequizandos) && diario.evolucao_catequizandos.length > 0) {
            setEvolucoes(diario.evolucao_catequizandos);
          } else {
            setEvolucoes(catequizandos.map(c => ({ catequizando_id: c.id, nome: c.nome, evolucao_espiritual: 0, evolucao_comportamental: 0 })));
          }
        }
      } else if (!isEditing && avaliacoes.length === 0) {
        setAvaliacoes(catequizandos.map(c => ({ catequizando_id: c.id, nome: c.nome, pontualidade: 0, participacao_grupo: 0, engajamento: 0 })));
        setEvolucoes(catequizandos.map(c => ({ catequizando_id: c.id, nome: c.nome, evolucao_espiritual: 0, evolucao_comportamental: 0 })));
      }
    }
  }, [diarioId, diarios, isEditing, catequizandos]);

  const updateAvaliacao = (cid: string, field: string, value: number) => {
    setAvaliacoes(prev => prev.map(a => a.catequizando_id === cid ? { ...a, [field]: value } : a));
  };

  const updateEvolucao = (cid: string, field: string, value: number) => {
    setEvolucoes(prev => prev.map(a => a.catequizando_id === cid ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      turma_id: id!,
      tipo_registro: tipoRegistro,
      data_registro: dataRegistro,
      encontro_id: tipoRegistro === "encontro" ? (encontroId || null) : null,
      evento_id: tipoRegistro === "evento" ? (eventoId || null) : null,
      reuniao_id: tipoRegistro === "reuniao" ? (reuniaoId || null) : null,
      como_foi: tipoRegistro !== "evolucao" ? comoFoi : "",
      pontos_positivos: tipoRegistro !== "evolucao" ? pontosPositivos : "",
      pontos_negativos: tipoRegistro !== "evolucao" ? pontosNegativos : "",
      observacoes_catequizandos: (tipoRegistro === "encontro" || tipoRegistro === "evento") ? observacoes : "",
      evolucao_espiritual: tipoRegistro === "evolucao" ? evolucao : "",
      avaliacoes_catequizandos: (tipoRegistro === "encontro" || tipoRegistro === "evento") ? avaliacoes : [],
      evolucao_catequizandos: tipoRegistro === "evolucao" ? evolucoes : [],
      participantes_reuniao: tipoRegistro === "reuniao" ? participantesReuniao : "",
    };

    if (isEditing) {
      await atualizarDiario.mutateAsync({ id: diarioId!, updates: payload });
    } else {
      await criarDiario.mutateAsync(payload);
    }
    navigate(`/turmas/${id}/diario`);
  };

  const isPending = criarDiario.isPending || atualizarDiario.isPending;

  const corAtual = tipoRegistro === "encontro"
    ? { ring: "ring-indigo-600/30", border: "border-indigo-400", header: "text-indigo-700", bg: "bg-indigo-50/50" }
    : tipoRegistro === "evento"
    ? { ring: "ring-amber-500/30", border: "border-amber-400", header: "text-amber-700", bg: "bg-amber-50/50" }
    : tipoRegistro === "evolucao"
    ? { ring: "ring-emerald-600/30", border: "border-emerald-400", header: "text-emerald-700", bg: "bg-emerald-50/50" }
    : { ring: "ring-blue-600/30", border: "border-blue-400", header: "text-blue-700", bg: "bg-blue-50/50" };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-center min-h-[44px] relative pt-4">
        <button type="button" onClick={() => navigate(`/turmas/${id}/diario`)} className="back-btn absolute left-0">
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-black text-black tracking-tight uppercase">
            {isEditing ? "Editar Registro" : "Novo Registro"}
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
            Diário do Catequista
          </p>
        </div>
      </div>

      {/* Seletor de tipo */}
      <div className="flex flex-col gap-3 max-w-3xl mx-auto w-full">
        {/* Encontro, Evento e Reunião */}
        <div className="grid grid-cols-3 gap-3">
          {tiposRegistro.filter(t => t.value !== "evolucao").map((tipo) => {
            const Icon = tipo.icon;
            const isActive = tipoRegistro === tipo.value;
            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => setTipoRegistro(tipo.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 font-bold text-center group",
                  isActive
                    ? `${tipo.cor} shadow-lg ring-4 ${tipo.value === "encontro" ? "ring-indigo-600/30" : tipo.value === "evento" ? "ring-amber-500/30" : "ring-blue-600/30"} scale-[1.03]`
                    : "bg-white dark:bg-zinc-900 border-slate-300 text-slate-800 hover:border-slate-400 hover:text-black hover:shadow-md"
                )}
              >
                <Icon className={cn("w-7 h-7 transition-all duration-500", isActive ? `text-white ${tipo.animation}` : `${tipo.iconColor} group-hover:scale-110 group-hover:-rotate-3`)} />
                <span className="text-xs font-black uppercase tracking-widest">{tipo.label}</span>
              </button>
            );
          })}
        </div>
        {/* Evolução centralizado abaixo */}
        <div className="flex justify-center">
          {tiposRegistro.filter(t => t.value === "evolucao").map((tipo) => {
            const Icon = tipo.icon;
            const isActive = tipoRegistro === tipo.value;
            return (
              <button
                key={tipo.value}
                type="button"
                onClick={() => setTipoRegistro(tipo.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 font-bold text-center group w-full max-w-xs",
                  isActive
                    ? `${tipo.cor} shadow-lg ring-4 ring-emerald-600/30 scale-[1.03]`
                    : "bg-white dark:bg-zinc-900 border-slate-300 text-slate-800 hover:border-slate-400 hover:text-black hover:shadow-md"
                )}
              >
                <Icon className={cn("w-7 h-7 transition-all duration-500", isActive ? `text-white ${tipo.animation}` : `${tipo.iconColor} group-hover:scale-110 group-hover:rotate-3`)} />
                <span className="text-xs font-black uppercase tracking-widest">{tipo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto w-full">
        <div className={cn("bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border-2 space-y-6 transition-all", corAtual.border)}>

          {/* Ocultamos a seleção de data do usuário */}

          {/* Referência: Encontro ou Evento */}
          {tipoRegistro === "encontro" && (
            <div className="space-y-2 relative">
              <label className="text-sm font-black text-indigo-700 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Encontro Referente
              </label>
              
              <button
                type="button"
                onClick={() => { setOpenEncontro(!openEncontro); setOpenEvento(false); setOpenReuniao(false); }}
                className="w-full h-14 px-4 rounded-xl border-2 border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 text-sm font-medium focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all flex items-center justify-between text-left"
              >
                <div className="flex flex-col truncate">
                  <span className="truncate font-bold text-indigo-900 dark:text-indigo-100">
                    {encontroId 
                      ? encontros.find((e: any) => e.id === encontroId)?.tema 
                      : "Nenhum (Registro Geral)"}
                  </span>
                  {encontroId && encontros.find((e: any) => e.id === encontroId)?.data && (
                    <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">
                      {formatarDataVigente(encontros.find((e: any) => e.id === encontroId)!.data)}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("w-5 h-5 text-indigo-500 transition-transform duration-300", openEncontro && "rotate-180")} />
              </button>
              
              {openEncontro && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border-2 border-indigo-500/30 rounded-2xl shadow-xl shadow-indigo-500/10 z-50 max-h-72 overflow-y-auto overflow-x-hidden p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <button 
                    type="button"
                    onClick={() => { setEncontroId(""); setOpenEncontro(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-sm font-bold text-indigo-900/70 transition-colors border border-transparent hover:border-indigo-500/20 flex items-center"
                  >
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 transition-colors", !encontroId ? "border-indigo-600" : "border-indigo-300 dark:border-indigo-700")}>
                      {!encontroId && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                    </div>
                    Nenhum (Registro Geral)
                  </button>
                  {Object.entries(agruparPorMes(encontros)).map(([mes, lista]) => (
                    <div key={mes} className="pt-2">
                      <div className="px-3 pb-1 text-[11px] font-black uppercase tracking-widest text-indigo-500/80 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-10">{mes}</div>
                      <div className="space-y-1">
                        {lista.map((enc: any) => (
                          <button
                            key={enc.id}
                            type="button"
                            onClick={() => { setEncontroId(enc.id); setOpenEncontro(false); }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center",
                              encontroId === enc.id 
                                ? "bg-indigo-500 text-white border-indigo-600 shadow-md" 
                                : "bg-white dark:bg-zinc-900 border-black/5 hover:border-indigo-500/30 hover:bg-indigo-50"
                            )}
                          >
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 transition-colors", encontroId === enc.id ? "border-white bg-indigo-600" : "border-indigo-300 dark:border-indigo-700")}>
                              {encontroId === enc.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn("font-bold truncate text-base", encontroId === enc.id ? "text-white" : "text-indigo-900 dark:text-indigo-100")}>{enc.tema}</div>
                              {enc.data && (
                                <div className={cn("text-xs font-bold mt-0.5", encontroId === enc.id ? "text-indigo-100" : "text-indigo-600/70")}>
                                  {formatarDataVigente(enc.data)}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tipoRegistro === "evento" && (
            <div className="space-y-2 relative">
              <label className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Evento Referente
              </label>
              
              <button
                type="button"
                onClick={() => { setOpenEvento(!openEvento); setOpenEncontro(false); setOpenReuniao(false); }}
                className="w-full h-14 px-4 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50 text-sm font-medium focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all flex items-center justify-between text-left"
              >
                <div className="flex flex-col truncate">
                  <span className="truncate font-bold text-amber-900 dark:text-amber-100">
                    {eventoId 
                      ? eventos.find((e: any) => e.id === eventoId)?.nome 
                      : "Nenhum (Registro Geral)"}
                  </span>
                  {eventoId && eventos.find((e: any) => e.id === eventoId)?.data && (
                    <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-0.5">
                      {formatarDataVigente(eventos.find((e: any) => e.id === eventoId)!.data)}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("w-5 h-5 text-amber-500 transition-transform duration-300", openEvento && "rotate-180")} />
              </button>
              
              {openEvento && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border-2 border-amber-500/30 rounded-2xl shadow-xl shadow-amber-500/10 z-50 max-h-72 overflow-y-auto overflow-x-hidden p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <button 
                    type="button"
                    onClick={() => { setEventoId(""); setOpenEvento(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 text-sm font-bold text-amber-900/70 transition-colors border border-transparent hover:border-amber-500/20 flex items-center"
                  >
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 transition-colors", !eventoId ? "border-amber-500" : "border-amber-300 dark:border-amber-700")}>
                      {!eventoId && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                    </div>
                    Nenhum (Registro Geral)
                  </button>
                  {Object.entries(agruparPorMes(eventos)).map(([mes, lista]) => (
                    <div key={mes} className="pt-2">
                      <div className="px-3 pb-1 text-[11px] font-black uppercase tracking-widest text-amber-500/80 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-10">{mes}</div>
                      <div className="space-y-1">
                        {lista.map((ev: any) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => { setEventoId(ev.id); setOpenEvento(false); }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center",
                              eventoId === ev.id 
                                ? "bg-amber-500 text-white border-amber-600 shadow-md" 
                                : "bg-white dark:bg-zinc-900 border-black/5 hover:border-amber-500/30 hover:bg-amber-50"
                            )}
                          >
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 transition-colors", eventoId === ev.id ? "border-white bg-amber-500" : "border-amber-300 dark:border-amber-700")}>
                              {eventoId === ev.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn("font-bold truncate text-base", eventoId === ev.id ? "text-white" : "text-amber-900 dark:text-amber-100")}>{ev.nome}</div>
                              {ev.data && (
                                <div className={cn("text-xs font-bold mt-0.5", eventoId === ev.id ? "text-amber-100" : "text-amber-600/70")}>
                                  {formatarDataVigente(ev.data)}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tipoRegistro === "reuniao" && (
            <div className="space-y-2 relative">
              <label className="text-sm font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5" /> Reunião Referente
              </label>
              
              <button
                type="button"
                onClick={() => { setOpenReuniao(!openReuniao); setOpenEncontro(false); setOpenEvento(false); }}
                className="w-full h-14 px-4 rounded-xl border-2 border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 text-sm font-medium focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all flex items-center justify-between text-left"
              >
                <div className="flex flex-col truncate">
                  <span className="truncate font-bold text-blue-900 dark:text-blue-100">
                    {reuniaoId 
                      ? reunioes.find((r: any) => r.id === reuniaoId)?.nome 
                      : "Nenhuma (Registro Geral)"}
                  </span>
                  {reuniaoId && reunioes.find((r: any) => r.id === reuniaoId)?.data && (
                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">
                      {formatarDataVigente(reunioes.find((r: any) => r.id === reuniaoId)!.data)}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn("w-5 h-5 text-blue-500 transition-transform duration-300", openReuniao && "rotate-180")} />
              </button>
              
              {openReuniao && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border-2 border-blue-500/30 rounded-2xl shadow-xl shadow-blue-500/10 z-50 max-h-72 overflow-y-auto overflow-x-hidden p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <button 
                    type="button"
                    onClick={() => { setReuniaoId(""); setOpenReuniao(false); }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-500/10 text-sm font-bold text-blue-900/70 transition-colors border border-transparent hover:border-blue-500/20 flex items-center"
                  >
                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 transition-colors", !reuniaoId ? "border-blue-600" : "border-blue-300 dark:border-blue-700")}>
                      {!reuniaoId && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                    </div>
                    Nenhuma (Registro Geral)
                  </button>
                  {Object.entries(agruparPorMes(reunioes)).map(([mes, lista]) => (
                    <div key={mes} className="pt-2">
                      <div className="px-3 pb-1 text-[11px] font-black uppercase tracking-widest text-blue-500/80 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-10">{mes}</div>
                      <div className="space-y-1">
                        {lista.map((re: any) => (
                          <button
                            key={re.id}
                            type="button"
                            onClick={() => { setReuniaoId(re.id); setOpenReuniao(false); }}
                            className={cn(
                              "w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center",
                              reuniaoId === re.id 
                                ? "bg-blue-500 text-white border-blue-600 shadow-md" 
                                : "bg-white dark:bg-zinc-900 border-black/5 hover:border-blue-500/30 hover:bg-blue-50"
                            )}
                          >
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 transition-colors", reuniaoId === re.id ? "border-white bg-blue-600" : "border-blue-300 dark:border-blue-700")}>
                              {reuniaoId === re.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={cn("font-bold truncate text-base", reuniaoId === re.id ? "text-white" : "text-blue-900 dark:text-blue-100")}>{re.nome}</div>
                              {re.data && (
                                <div className={cn("text-xs font-bold mt-0.5", reuniaoId === re.id ? "text-blue-100" : "text-blue-600/70")}>
                                  {formatarDataVigente(re.data)}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seção "Como foi" - só para Encontro, Evento e Reunião */}
          {tipoRegistro !== "evolucao" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BookHeart className="w-5 h-5 text-slate-600" />
                  {tipoRegistro === "evento" ? "Como foi o evento?" : tipoRegistro === "reuniao" ? "Pauta e Resumo da Reunião" : "Como foi o encontro?"}
                </label>
                <textarea
                  placeholder={tipoRegistro === "evento" ? "Descreva como foi o evento..." : tipoRegistro === "reuniao" ? "Descreva o que foi conversado na reunião..." : "Descreva como foi o encontro..."}
                  value={comoFoi}
                  onChange={(e) => setComoFoi(e.target.value)}
                  className="w-full min-h-[100px] p-4 rounded-xl border-2 border-slate-300 bg-white text-black font-medium focus:ring-2 focus:ring-slate-400 focus:border-slate-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-wider">Pontos Positivos</label>
                  <textarea
                    placeholder="O que deu certo? O que surpreendeu?"
                    value={pontosPositivos}
                    onChange={(e) => setPontosPositivos(e.target.value)}
                    className="w-full min-h-[100px] p-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-black font-medium focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-red-700 uppercase tracking-wider">Pontos a Melhorar</label>
                  <textarea
                    placeholder="O que não saiu como planejado? Dificuldades?"
                    value={pontosNegativos}
                    onChange={(e) => setPontosNegativos(e.target.value)}
                    className="w-full min-h-[100px] p-4 rounded-xl border-2 border-red-300 bg-red-50 text-black font-medium focus:ring-2 focus:ring-red-400 focus:border-red-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <hr className="border-slate-200 my-6" />

              {tipoRegistro === "reuniao" && (
                <div className="space-y-2">
                  <label className="text-sm font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-5 h-5" /> Participantes (Lista de Presença)
                  </label>
                  <p className="text-xs text-slate-600 font-medium">Escreva quem esteve presente na reunião.</p>
                  <textarea
                    placeholder="Ex: João (Pai do Pedro), Maria (Mãe da Ana), Catequistas: José e Rita..."
                    value={participantesReuniao}
                    onChange={(e) => setParticipantesReuniao(e.target.value)}
                    className="w-full min-h-[200px] p-4 rounded-xl border-2 border-blue-300 bg-white text-black font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                    style={{
                      backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #e2e8f0 31px, #e2e8f0 32px)",
                      lineHeight: "32px",
                      paddingTop: "6px"
                    }}
                  />
                </div>
              )}

              {/* Avaliação de Participação */}
              {(tipoRegistro === "encontro" || tipoRegistro === "evento") && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-black text-black uppercase tracking-wider">Avaliação de Participação</label>
                    <p className="text-xs text-slate-600 font-medium mt-1">Avalie a participação individual de cada catequizando (opcional).</p>
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {avaliacoes.map((av) => {
                    const isExpanded = expandedAv[av.catequizando_id];
                    const hasRated = av.pontualidade > 0 || av.participacao_grupo > 0 || av.engajamento > 0;
                    return (
                      <div key={av.catequizando_id} className={cn("bg-white dark:bg-zinc-950 rounded-2xl border-2 transition-all shadow-sm overflow-hidden", isExpanded ? "border-indigo-400 shadow-md ring-2 ring-indigo-500/20" : "border-slate-300 hover:border-indigo-300")}>
                        <button type="button" onClick={() => toggleAv(av.catequizando_id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 shadow-inner transition-colors", hasRated ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700")}>
                              {av.nome.charAt(0)}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-bold text-base text-black truncate max-w-[180px]">{av.nome}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{hasRated ? "Avaliado" : "Pendente"}</span>
                            </div>
                          </div>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-muted text-muted-foreground")}>
                            <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                          </div>
                        </button>

                        <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                          <div className="overflow-hidden">
                            <div className="p-4 pt-0 border-t border-black/5 mt-2 space-y-5 bg-gradient-to-b from-transparent to-muted/20">
                              <div className="flex flex-col gap-2 pt-3">
                                <span className="text-xs font-black uppercase text-foreground tracking-widest">Pontualidade</span>
                                <div className="bg-white p-3 rounded-xl border border-black/5 shadow-sm inline-block">
                                  <StarRating size="lg" value={av.pontualidade} onChange={(v) => updateAvaliacao(av.catequizando_id, "pontualidade", v)} />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <span className="text-xs font-black uppercase text-foreground tracking-widest">Participação no Grupo</span>
                                <div className="bg-white p-3 rounded-xl border border-black/5 shadow-sm inline-block">
                                  <StarRating size="lg" value={av.participacao_grupo} onChange={(v) => updateAvaliacao(av.catequizando_id, "participacao_grupo", v)} />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 pb-2">
                                <span className="text-xs font-black uppercase text-foreground tracking-widest">Engajamento</span>
                                <div className="bg-white p-3 rounded-xl border border-black/5 shadow-sm inline-block">
                                  <StarRating size="lg" value={av.engajamento} onChange={(v) => updateAvaliacao(av.catequizando_id, "engajamento", v)} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <textarea
                  placeholder="Observações gerais adicionais sobre a turma..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full min-h-[80px] p-4 rounded-xl border-2 border-slate-300 bg-white text-black font-medium focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 outline-none transition-all resize-none mt-2"
                />
              </div>
              )}
            </>
          )}

          {/* Seção de Evolução - só para tipo "evolucao" */}
          {tipoRegistro === "evolucao" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-black text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Evolução Espiritual e Comportamental
                </label>
                <p className="text-xs text-slate-700 font-medium mt-1">Avalie o crescimento espiritual e comportamental de cada catequizando.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {evolucoes.map((ev) => {
                  const isExpanded = expandedEv[ev.catequizando_id];
                  const hasRated = ev.evolucao_espiritual > 0 || ev.evolucao_comportamental > 0;
                  return (
                    <div key={ev.catequizando_id} className={cn("bg-emerald-50 rounded-2xl border-2 transition-all shadow-sm overflow-hidden", isExpanded ? "border-emerald-400 shadow-md ring-2 ring-emerald-500/20" : "border-emerald-200 hover:border-emerald-300")}>
                      <button type="button" onClick={() => toggleEv(ev.catequizando_id)} className="w-full flex items-center justify-between p-4 hover:bg-emerald-100/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 shadow-inner transition-colors", hasRated ? "bg-emerald-600 text-white" : "bg-emerald-200 text-emerald-800")}>
                            {ev.nome.charAt(0)}
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-base text-black truncate max-w-[180px]">{ev.nome}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{hasRated ? "Avaliado" : "Pendente"}</span>
                          </div>
                        </div>
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", isExpanded ? "bg-white text-emerald-600 shadow-sm" : "bg-emerald-600/10 text-emerald-600/70")}>
                          <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                        </div>
                      </button>

                      <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                        <div className="overflow-hidden">
                          <div className="p-4 pt-0 border-t border-emerald-600/10 mt-2 space-y-5">
                            <div className="flex flex-col gap-2 pt-3">
                              <span className="text-xs font-black uppercase text-emerald-700 tracking-widest">Evolução Espiritual</span>
                              <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-emerald-600/10 shadow-sm inline-block">
                                <StarRating color="text-emerald-500" size="lg" value={ev.evolucao_espiritual} onChange={(v) => updateEvolucao(ev.catequizando_id, "evolucao_espiritual", v)} />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 pb-2">
                              <span className="text-xs font-black uppercase text-emerald-700 tracking-widest">Evolução Comportamental</span>
                              <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-emerald-600/10 shadow-sm inline-block">
                                <StarRating color="text-emerald-500" size="lg" value={ev.evolucao_comportamental} onChange={(v) => updateEvolucao(ev.catequizando_id, "evolucao_comportamental", v)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <textarea
                placeholder="Notas gerais sobre a evolução da turma..."
                value={evolucao}
                onChange={(e) => setEvolucao(e.target.value)}
                className="w-full min-h-[80px] p-4 rounded-xl border-2 border-emerald-300 bg-white text-black font-medium focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 outline-none transition-all resize-none mt-2"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "w-full h-14 rounded-2xl text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl transition-all",
              tipoRegistro === "encontro" ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30" :
              tipoRegistro === "evento" ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30" :
              tipoRegistro === "reuniao" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30" :
              "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
            )}
          >
            {isPending ? (
              <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Salvar Registro
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
