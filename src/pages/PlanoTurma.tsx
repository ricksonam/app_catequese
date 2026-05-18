import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useAtividades, useCatequizandos, useAtividadeMutation, useEncontroMutation, useReunioes, useTurmaMutation } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, ListChecks, MapPin, Users, CheckCircle2, Info, Clock, Calendar, Pencil, Trash2, Printer, Car, Share2, Target, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatarDataVigente, copyToClipboardOrShare, getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import { usePremium } from "@/hooks/usePremium";
import { Sparkles } from "lucide-react";

type TimelineItem = { id: string; tipo: 'encontro' | 'atividade' | 'reuniao'; titulo: string; subtitulo: string; data: string; color: string; status?: string; presencas: string[]; itemOriginal: any; };
const statusColors: Record<string, string> = { pendente: 'bg-primary', realizado: 'bg-success', transferido: 'bg-caution', cancelado: 'bg-destructive' };

export default function PlanoTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [], isLoading: tLoading } = useTurmas();
  const { data: encontros = [], isLoading: eLoading } = useEncontros(id);
  const { data: atividades = [], isLoading: aLoading } = useAtividades(id);
  const { data: reunioes = [], isLoading: rLoading } = useReunioes(id);
  const { data: catequizandos = [], isLoading: cLoading } = useCatequizandos(id);
  const turma = turmas.find(t => t.id === id);

  const [activeFilter, setActiveFilter] = useState<'all' | 'encontro' | 'atividade' | 'reuniao'>('all');
  const [viewItem, setViewItem] = useState<TimelineItem | null>(null);
  const [presencaOpen, setPresencaOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { isPremium, redirectToPayment } = usePremium();
  
  const atividadeMut = useAtividadeMutation();
  const encontroMut = useEncontroMutation();
  const turmaMut = useTurmaMutation();

  const [isEditingProposito, setIsEditingProposito] = useState(false);
  const [propositoText, setPropositoText] = useState("");
  const [objetivoText, setObjetivoText] = useState("");
  const [metasText, setMetasText] = useState("");
  const [activePanelTab, setActivePanelTab] = useState<'proposito' | 'objetivo' | 'metas'>('proposito');

  const handleEditProposito = () => {
    setPropositoText(turma?.proposito || "");
    setObjetivoText(turma?.objetivo || "");
    setMetasText(turma?.metas || "");
    setIsEditingProposito(true);
  };

  const handleSaveProposito = async () => {
    if (!turma) return;
    try {
      await turmaMut.mutateAsync({ ...turma, proposito: propositoText, objetivo: objetivoText, metas: metasText });
      setIsEditingProposito(false);
      toast.success("Painel da turma atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar o painel.");
    }
  };

  const totalAlunos = catequizandos.length || 1;

  const groupedItems = useMemo(() => {
    const rawItems: TimelineItem[] = [
      ...encontros.map((e): TimelineItem => ({ 
        id: e.id, tipo: 'encontro', titulo: e.tema, subtitulo: `Encontro • ${e.status}`, 
        data: e.data, color: statusColors[e.status] || 'bg-muted-foreground', 
        status: e.status, presencas: e.presencas || [], itemOriginal: e 
      })),
      ...atividades.map((a): TimelineItem => ({ 
        id: a.id, tipo: 'atividade', titulo: a.nome, subtitulo: `${a.tipo}${a.local ? ` • ${a.local}` : ''}`, 
        data: a.data, color: 'bg-primary', presencas: a.presencas || [], itemOriginal: a 
      })),
      ...reunioes.map((r): TimelineItem => ({
        id: r.id, tipo: 'reuniao', titulo: r.nome || r.tipo, subtitulo: r.tipo,
        data: r.data, color: 'bg-liturgical', presencas: [], itemOriginal: r
      })),
    ]
    .filter(item => activeFilter === 'all' || item.tipo === activeFilter)
    .sort((a, b) => {
      if (!a.data && !b.data) return 0;
      if (!a.data) return 1;
      if (!b.data) return -1;
      return new Date(a.data).getTime() - new Date(b.data).getTime();
    });

    const groups: Record<string, TimelineItem[]> = {};
    rawItems.forEach(item => {
      if (!item.data) {
        const key = "Datas a Definir";
        if (!groups[key]) groups[key] = [];
        groups[groupKey(key)].push(item);
        return;
      }
      const date = new Date(item.data + 'T12:00:00');
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups);
  }, [encontros, atividades, reunioes, activeFilter]);

  function groupKey(k: string) { return k; }

  const handleTogglePresenca = (catId: string) => {
    if (!viewItem) return;
    const p = viewItem.presencas;
    const updated = p.includes(catId) ? p.filter(x => x !== catId) : [...p, catId];
    
    if (viewItem.tipo === 'encontro') {
      encontroMut.mutate({ ...viewItem.itemOriginal, presencas: updated });
    } else {
      atividadeMut.mutate({ ...viewItem.itemOriginal, presencas: updated });
    }
    
    setViewItem({ ...viewItem, presencas: updated, itemOriginal: { ...viewItem.itemOriginal, presencas: updated } });
  };

  const shareWithParents = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    if (!turma?.codigoAcesso) {
      toast.error("Turma sem código de acesso.");
      return;
    }
    const url = `${getAppUrl()}/plano-da-turma/${turma.codigoAcesso}`;
    
    const success = await copyToClipboardOrShare(url, {
      title: 'Plano da Turma',
      text: 'Confira o cronograma da catequese:'
    });

    if (success) {
      toast.success("Link pronto para enviar aos pais!", {
        description: "Eles verão apenas o cronograma, sem acesso a ferramentas.",
        duration: 5000,
      });
    } else {
      toast.error("Não foi possível gerar o link de compartilhamento.");
    }
  };

  if (tLoading || eLoading || aLoading || rLoading || cLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando plano...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-4 animate-fade-in flex flex-col pt-4">
        {/* Row 1: Back Button + Título (Centralizado) */}
        <div className="flex items-center justify-center min-h-[44px] relative">
          <button onClick={() => navigate(`/turmas/${id}`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
              Plano da Turma
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{totalAlunos} catequizandos</p>
          </div>
        </div>
      </div>


      {turma?.codigoAcesso && (
        <div className="animate-fade-in stagger-1">
          <button 
            onClick={shareWithParents}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-primary/20 hover:border-primary/40 text-primary shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 leading-none mb-1">Público</p>
              <p className="text-sm font-black tracking-tight leading-none">Compartilhar com Pais</p>
            </div>
            <div className="ml-auto w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </div>
          </button>
        </div>
      )}

      {/* Painel Inteligente da Turma */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-2 border-primary/20 shadow-sm p-5 relative overflow-hidden animate-float-up stagger-2">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target className="w-24 h-24 text-primary" />
        </div>
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest">Painel Estratégico</h3>
            </div>
            {!isEditingProposito && (
              <button onClick={handleEditProposito} className="p-2 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {isEditingProposito ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary">Propósito da Turma</label>
                <textarea
                  value={propositoText}
                  onChange={(e) => setPropositoText(e.target.value)}
                  placeholder="Ex: Levar as crianças a um encontro pessoal com Cristo."
                  className="w-full form-input min-h-[80px] resize-none text-sm leading-relaxed border-primary/30 focus:border-primary focus:ring-primary/20 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Objetivos do Ciclo</label>
                <textarea
                  value={objetivoText}
                  onChange={(e) => setObjetivoText(e.target.value)}
                  placeholder="Ex: Compreender a importância da Eucaristia..."
                  className="w-full form-input min-h-[80px] resize-none text-sm leading-relaxed border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-orange-600">Metas Práticas</label>
                <textarea
                  value={metasText}
                  onChange={(e) => setMetasText(e.target.value)}
                  placeholder="Ex: 80% de presença nas missas dominicais..."
                  className="w-full form-input min-h-[80px] resize-none text-sm leading-relaxed border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20 bg-background"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-black/5">
                <button onClick={() => setIsEditingProposito(false)} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSaveProposito} disabled={turmaMut.isPending} className="px-4 py-2 text-xs font-black bg-primary text-primary-foreground rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {turmaMut.isPending ? "Salvando..." : "Salvar Painel"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs value={activePanelTab} onValueChange={(v) => setActivePanelTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50 p-1.5 rounded-xl">
                  <TabsTrigger value="proposito" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">Propósito</TabsTrigger>
                  <TabsTrigger value="objetivo" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm">Objetivos</TabsTrigger>
                  <TabsTrigger value="metas" className="rounded-lg text-[10px] font-black uppercase tracking-wider py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm">Metas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="proposito" className="mt-0">
                  <div className="text-sm text-foreground/80 leading-relaxed font-medium bg-primary/5 p-4 rounded-xl border border-primary/10">
                    {turma?.proposito ? (
                      <span className="whitespace-pre-wrap">{turma.proposito}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Nenhum propósito definido ainda. Clique no ícone de lápis para adicionar.</span>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="objetivo" className="mt-0">
                  <div className="text-sm text-foreground/80 leading-relaxed font-medium bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                    {turma?.objetivo ? (
                      <span className="whitespace-pre-wrap">{turma.objetivo}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Nenhum objetivo definido ainda. Clique no ícone de lápis para adicionar.</span>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="metas" className="mt-0">
                  <div className="text-sm text-foreground/80 leading-relaxed font-medium bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                    {turma?.metas ? (
                      <span className="whitespace-pre-wrap">{turma.metas}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Nenhuma meta definida ainda. Clique no ícone de lápis para adicionar.</span>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full animate-fade-in">
        <TabsList className="grid w-full grid-cols-4 mb-8 mt-4 bg-muted/80 p-2 rounded-2xl shadow-sm border border-border/50 h-auto">
          <TabsTrigger value="all" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">Tudo</TabsTrigger>
          <TabsTrigger value="encontro" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">Encontros</TabsTrigger>
          <TabsTrigger value="atividade" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">Eventos</TabsTrigger>
          <TabsTrigger value="reuniao" className="rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">Reuniões</TabsTrigger>
        </TabsList>
      </Tabs>

      {groupedItems.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><CalendarDays className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhum item encontrado</p></div>
      ) : (
        <div className="relative pb-10">
          {/* Liturgical Timeline Line */}
          <div className="absolute left-[20px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/10 via-primary/40 to-primary/10" />

          <div className="space-y-10">
            {groupedItems.map(([month, items]) => (
              <div key={month} className="space-y-6 relative">
                <div className="flex items-center gap-4 py-2 sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center shrink-0 z-10 shadow-sm ml-[1px]">
                    <span className="text-[10px] font-black text-primary">✝</span>
                  </div>
                  <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">{month}</h3>
                </div>
                
                <div className="space-y-5 ml-[20px]">
                  {items.map((item, i) => {
                    const Icon = item.tipo === 'encontro' ? CalendarDays : item.tipo === 'reuniao' ? Users : ListChecks;
                    const dateStr = item.data ? new Date(item.data + 'T12:00:00').toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }) : '---';
                    const presPct = Math.round((item.presencas.length / totalAlunos) * 100);
                    
                    return (
                      <div key={`${item.tipo}-${item.id}`} className="relative pl-8 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={`absolute left-[-5px] top-5 w-2.5 h-2.5 rounded-full ${item.color} ring-4 ring-background z-10`} />
                        <button onClick={() => setViewItem(item)} className="w-full float-card flex items-center gap-3 p-4 text-left group">
                          <div className={`icon-box w-10 h-10 rounded-xl shrink-0 ${item.tipo === 'encontro' ? 'bg-primary/10 text-primary' : item.tipo === 'reuniao' ? 'bg-liturgical/10 text-liturgical' : 'bg-accent/15 text-accent-foreground'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight truncate group-active:text-primary transition-colors">{item.titulo}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase">{item.tipo === 'atividade' ? 'Evento' : item.tipo === 'reuniao' ? 'Reunião' : item.tipo}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {presPct}% {item.tipo === 'encontro' ? 'Alunos' : item.tipo === 'reuniao' ? 'Pessoas' : 'Pais'}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-black text-primary uppercase">Dia</p>
                            <p className="text-lg font-black text-foreground leading-none">
                              {dateStr.split(' ')[0]} <span className="text-[10px] font-bold text-muted-foreground uppercase">{dateStr.split(' ')[2]?.replace('.', '')}</span>
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unified Detail View */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if(!o) setViewItem(null); }}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto border-border/30 p-0 overflow-hidden">
          {viewItem && (
            <>
              <div className={`p-6 ${viewItem.tipo === 'encontro' ? 'bg-primary/5' : 'bg-accent/5'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`pill-btn text-[10px] font-bold uppercase tracking-widest ${viewItem.color} text-white border-0`}>{viewItem.status || viewItem.tipo}</span>
                  {viewItem.itemOriginal.modalidade === 'externa' && <span className="pill-btn text-[10px] font-bold bg-primary/10 text-primary border-primary/20">EXTERNA</span>}
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">{viewItem.titulo}</h2>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Calendar className="h-3.5 w-3.5 text-primary" /> {viewItem.data ? formatarDataVigente(viewItem.data) : 'A definir'}</div>
                  {viewItem.itemOriginal.horario && <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Clock className="h-3.5 w-3.5 text-primary" /> {viewItem.itemOriginal.horario}</div>}
                  {viewItem.itemOriginal.local && <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /> {viewItem.itemOriginal.local}</div>}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase mb-1">Presença</span>
                    <span className="text-2xl font-black text-primary">{Math.round((viewItem.presencas.length / totalAlunos) * 100)}%</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{viewItem.presencas.length} de {totalAlunos} {viewItem.tipo === 'encontro' ? 'Alunos' : 'Pais'}</span>
                  </div>
                  <button onClick={() => setPresencaOpen(true)} className="bg-primary text-primary-foreground p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:opacity-90 transition-opacity">
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs font-black uppercase">Gerenciar Presença</span>
                  </button>
                </div>

                {viewItem.itemOriginal.descricao && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Descrição</h4>
                    <p className="text-sm text-foreground leading-relaxed">{viewItem.itemOriginal.descricao}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { if(viewItem.tipo === 'encontro') navigate(`/turmas/${id}/encontros`); else navigate(`/turmas/${id}/eventos`); }} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">Ver no Módulo</button>
                </div>
              </div>

              {/* Internal Presence Manager */}
              <Dialog open={presencaOpen} onOpenChange={setPresencaOpen}>
                <DialogContent className="rounded-2xl border-border/30">
                  <DialogHeader><DialogTitle>Chamada: {viewItem.titulo}</DialogTitle></DialogHeader>
                  <div className="space-y-1 mt-2 max-h-[50vh] overflow-y-auto">
                    {catequizandos.map(c => {
                      const isPresent = viewItem.presencas.includes(c.id);
                      return (
                        <button key={c.id} onClick={() => handleTogglePresenca(c.id)} className={`w-full flex flex-col items-start gap-1 px-3 py-3 rounded-xl text-sm transition-all ${isPresent ? 'bg-success/10' : 'hover:bg-muted/50'}`}>
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isPresent ? 'bg-success border-success' : 'border-border'}`}>{isPresent && <CheckCircle2 className="h-3 w-3 text-white" />}</div>
                            <div className="flex-1 text-left">
                              <span className={`font-bold block ${isPresent ? 'text-foreground' : 'text-muted-foreground'}`}>{viewItem.tipo === 'encontro' ? c.nome : (c.responsavel || c.nome)}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{viewItem.tipo === 'encontro' ? `RM: ${c.id.slice(0, 5)}` : `CATEQUIZANDO: ${c.nome}`}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Premium Modal */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="max-w-sm w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center mx-auto mb-5 border-2 border-amber-200 shadow-inner">
              <Sparkles className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">Recurso Premium</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              O compartilhamento do Plano da Turma é um recurso exclusivo do plano Premium. Faça o upgrade para utilizar!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setShowPremiumModal(false); redirectToPayment(); }}
                className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              >
                <Sparkles className="h-4 w-4" />
                Assinar Premium – Plano Anual
              </button>
              <button onClick={() => setShowPremiumModal(false)} className="text-xs text-muted-foreground font-bold hover:text-foreground transition-colors py-2 w-full">
                Cancelar
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
