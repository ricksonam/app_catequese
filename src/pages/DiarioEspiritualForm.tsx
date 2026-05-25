import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { useEncontros, useCatequizandos } from "@/hooks/useSupabaseData";
import { ArrowLeft, BookHeart, Save, Star, ChevronDown, ChevronUp } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/utils";

export default function DiarioEspiritualForm() {
  const { id, diarioId } = useParams();
  const navigate = useNavigate();
  const { diarios, criarDiario, atualizarDiario } = useDiarioEspiritual(id!);
  const { data: encontros = [] } = useEncontros(id);
  const { data: catequizandos = [] } = useCatequizandos(id);

  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split("T")[0]);
  const [encontroId, setEncontroId] = useState("");
  const [comoFoi, setComoFoi] = useState("");
  const [pontosPositivos, setPontosPositivos] = useState("");
  const [pontosNegativos, setPontosNegativos] = useState("");
  const [observacoes, setObservacoes] = useState(""); // General fallback
  const [evolucao, setEvolucao] = useState(""); // General fallback

  // State for stars
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [evolucoes, setEvolucoes] = useState<any[]>([]);

  // Accordion state
  const [expandedAv, setExpandedAv] = useState<Record<string, boolean>>({});
  const [expandedEv, setExpandedEv] = useState<Record<string, boolean>>({});

  const toggleAv = (id: string) => setExpandedAv(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleEv = (id: string) => setExpandedEv(prev => ({ ...prev, [id]: !prev[id] }));

  const isEditing = !!diarioId;

  useEffect(() => {
    // Initialize state when catequizandos load or when editing
    if (catequizandos.length > 0) {
      if (isEditing && diarios) {
        const diario = diarios.find((d) => d.id === diarioId);
        if (diario) {
          setDataRegistro(diario.data_registro || "");
          setEncontroId(diario.encontro_id || "");
          setComoFoi(diario.como_foi || "");
          setPontosPositivos(diario.pontos_positivos || "");
          setPontosNegativos(diario.pontos_negativos || "");
          setObservacoes(diario.observacoes_catequizandos || "");
          setEvolucao(diario.evolucao_espiritual || "");
          
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

  const updateAvaliacao = (id: string, field: string, value: number) => {
    setAvaliacoes(prev => prev.map(a => a.catequizando_id === id ? { ...a, [field]: value } : a));
  };

  const updateEvolucao = (id: string, field: string, value: number) => {
    setEvolucoes(prev => prev.map(a => a.catequizando_id === id ? { ...a, [field]: value } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      turma_id: id!,
      data_registro: dataRegistro,
      encontro_id: encontroId || null,
      como_foi: comoFoi,
      pontos_positivos: pontosPositivos,
      pontos_negativos: pontosNegativos,
      observacoes_catequizandos: observacoes,
      evolucao_espiritual: evolucao,
      avaliacoes_catequizandos: avaliacoes,
      evolucao_catequizandos: evolucoes,
    };

    if (isEditing) {
      await atualizarDiario.mutateAsync({ id: diarioId!, updates: payload });
    } else {
      await criarDiario.mutateAsync(payload);
    }
    navigate(`/turmas/${id}/diario`);
  };

  const isPending = criarDiario.isPending || atualizarDiario.isPending;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-center min-h-[44px] relative pt-4">
        <button type="button" onClick={() => navigate(`/turmas/${id}/diario`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
            {isEditing ? "Editar Registro" : "Novo Registro"}
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
            Diário Espiritual
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto w-full">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
          
          {/* Seção Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data do Registro <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={dataRegistro}
                onChange={(e) => setDataRegistro(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Encontro Referente</label>
              <select
                value={encontroId}
                onChange={(e) => setEncontroId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="">Nenhum (Registro Geral)</option>
                {encontros.map(e => (
                  <option key={e.id} value={e.id}>{e.tema}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BookHeart className="w-4 h-4" /> Como foi o encontro/momento?
            </label>
            <textarea
              placeholder="Descreva de forma geral como foi o encontro, o clima da turma..."
              value={comoFoi}
              onChange={(e) => setComoFoi(e.target.value)}
              className="w-full min-h-[80px] p-4 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Pontos Positivos</label>
              <textarea
                placeholder="O que deu certo? O que surpreendeu?"
                value={pontosPositivos}
                onChange={(e) => setPontosPositivos(e.target.value)}
                className="w-full min-h-[80px] p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-destructive uppercase tracking-wider">Pontos a Melhorar</label>
              <textarea
                placeholder="O que não saiu como planejado? Dificuldades?"
                value={pontosNegativos}
                onChange={(e) => setPontosNegativos(e.target.value)}
                className="w-full min-h-[80px] p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm focus:ring-2 focus:ring-destructive/20 focus:border-destructive outline-none transition-all resize-none"
              />
            </div>
          </div>

          <hr className="border-border" />

          {/* Seção de Observações e Avaliações */}
          <div className="space-y-4">
            <label className="text-sm font-black text-foreground uppercase tracking-wider">Avaliação de Participação</label>
            <p className="text-xs text-muted-foreground">Avalie a participação individual de cada catequizando (opcional).</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {avaliacoes.map((av) => {
                const isExpanded = expandedAv[av.catequizando_id];
                const hasRated = av.pontualidade > 0 || av.participacao_grupo > 0 || av.engajamento > 0;
                
                return (
                  <div key={av.catequizando_id} className={cn("bg-white dark:bg-zinc-950 rounded-2xl border transition-all shadow-sm overflow-hidden", isExpanded ? "border-indigo-500/30 shadow-md ring-2 ring-indigo-500/10" : "border-black/5 dark:border-white/5 hover:border-black/15")}>
                    
                    {/* Header Clickable */}
                    <button type="button" onClick={() => toggleAv(av.catequizando_id)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 shadow-inner transition-colors", hasRated ? "bg-indigo-600 text-white" : "bg-indigo-500/10 text-indigo-600")}>
                          {av.nome.charAt(0)}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-base text-foreground truncate max-w-[180px]">{av.nome}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {hasRated ? "Avaliado" : "Pendente"}
                          </span>
                        </div>
                      </div>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-muted text-muted-foreground")}>
                        <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                      </div>
                    </button>

                    {/* Expandable Content */}
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
              className="w-full min-h-[60px] p-4 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none mt-2"
            />
          </div>

          <hr className="border-border" />

          {/* Seção de Evolução */}
          <div className="space-y-4">
            <label className="text-sm font-black text-primary uppercase tracking-wider">Evolução Espiritual e Comportamental</label>
            <p className="text-xs text-muted-foreground">Avalie o crescimento espiritual e comportamental.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {evolucoes.map((ev) => {
                const isExpanded = expandedEv[ev.catequizando_id];
                const hasRated = ev.evolucao_espiritual > 0 || ev.evolucao_comportamental > 0;
                
                return (
                  <div key={ev.catequizando_id} className={cn("bg-primary/5 rounded-2xl border transition-all shadow-sm overflow-hidden", isExpanded ? "border-primary/40 shadow-md ring-2 ring-primary/10 bg-primary/10" : "border-primary/10 hover:border-primary/20")}>
                    
                    {/* Header Clickable */}
                    <button type="button" onClick={() => toggleEv(ev.catequizando_id)} className="w-full flex items-center justify-between p-4 hover:bg-primary/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shrink-0 shadow-inner transition-colors", hasRated ? "bg-primary text-white" : "bg-primary/20 text-primary")}>
                          {ev.nome.charAt(0)}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="font-bold text-base text-primary truncate max-w-[180px]">{ev.nome}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                            {hasRated ? "Avaliado" : "Pendente"}
                          </span>
                        </div>
                      </div>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-all", isExpanded ? "bg-white text-primary shadow-sm" : "bg-primary/10 text-primary/70")}>
                        <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                      </div>
                    </button>

                    {/* Expandable Content */}
                    <div className={cn("grid transition-all duration-300 ease-in-out", isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                      <div className="overflow-hidden">
                        <div className="p-4 pt-0 border-t border-primary/10 mt-2 space-y-5">
                          
                          <div className="flex flex-col gap-2 pt-3">
                            <span className="text-xs font-black uppercase text-primary tracking-widest">Evolução Espiritual</span>
                            <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-primary/10 shadow-sm inline-block">
                               <StarRating color="text-indigo-500" size="lg" value={ev.evolucao_espiritual} onChange={(v) => updateEvolucao(ev.catequizando_id, "evolucao_espiritual", v)} />
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 pb-2">
                            <span className="text-xs font-black uppercase text-primary tracking-widest">Evolução Comportamental</span>
                            <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-primary/10 shadow-sm inline-block">
                               <StarRating color="text-indigo-500" size="lg" value={ev.evolucao_comportamental} onChange={(v) => updateEvolucao(ev.catequizando_id, "evolucao_comportamental", v)} />
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
              className="w-full min-h-[60px] p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none mt-2"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 transition-all"
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

