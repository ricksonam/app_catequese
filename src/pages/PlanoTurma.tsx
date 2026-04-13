import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useEncontros, useAtividades, useCatequizandos, useAtividadeMutation, useEncontroMutation } from "@/hooks/useSupabaseData";
import { ArrowLeft, CalendarDays, ListChecks, MapPin, Users, CheckCircle2, Info, Clock, Calendar, Pencil, Trash2, Printer, Car } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatarDataVigente } from "@/lib/utils";
import { toast } from "sonner";
import ReportModule from "@/components/reports/ReportModule";

type TimelineItem = { id: string; tipo: 'encontro' | 'atividade'; titulo: string; subtitulo: string; data: string; color: string; status?: string; presencas: string[]; itemOriginal: any; };
const statusColors: Record<string, string> = { pendente: 'bg-muted-foreground', realizado: 'bg-success', transferido: 'bg-caution', cancelado: 'bg-destructive' };

export default function PlanoTurma() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: atividades = [] } = useAtividades(id);
  const { data: catequizandos = [] } = useCatequizandos(id);
  const turma = turmas.find(t => t.id === id);

  const [activeFilter, setActiveFilter] = useState<'all' | 'encontro' | 'atividade'>('all');
  const [viewItem, setViewItem] = useState<TimelineItem | null>(null);
  const [presencaOpen, setPresencaOpen] = useState(false);
  
  const atividadeMut = useAtividadeMutation();
  const encontroMut = useEncontroMutation();

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
  }, [encontros, atividades, activeFilter]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Plano da Turma</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {totalAlunos} catequizandos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {id && <ReportModule context="plano" turmaId={id} />}
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl animate-fade-in">
        {(['all', 'encontro', 'atividade'] as const).map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}>
            {f === 'all' ? 'Tudo' : f === 'encontro' ? 'Encontros' : 'Atividades'}
          </button>
        ))}
      </div>

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
                    const Icon = item.tipo === 'encontro' ? CalendarDays : ListChecks;
                    const dateStr = item.data ? new Date(item.data + 'T12:00:00').toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }) : '---';
                    const presPct = Math.round((item.presencas.length / totalAlunos) * 100);
                    
                    return (
                      <div key={`${item.tipo}-${item.id}`} className="relative pl-8 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className={`absolute left-[-5px] top-5 w-2.5 h-2.5 rounded-full ${item.color} ring-4 ring-background z-10`} />
                        <button onClick={() => setViewItem(item)} className="w-full float-card flex items-center gap-3 p-4 text-left group">
                          <div className={`icon-box w-10 h-10 rounded-xl shrink-0 ${item.tipo === 'encontro' ? 'bg-primary/10 text-primary' : 'bg-accent/15 text-accent-foreground'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight truncate group-active:text-primary transition-colors">{item.titulo}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] font-bold text-muted-foreground uppercase">{item.tipo}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> {presPct}% {item.tipo === 'encontro' ? 'Alunos' : 'Pais'}</span>
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
                  <button onClick={() => { if(viewItem.tipo === 'encontro') navigate(`/turmas/${id}/encontros`); else navigate(`/turmas/${id}/atividades`); }} className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">Ver no Módulo</button>
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
    </div>
  );
}
