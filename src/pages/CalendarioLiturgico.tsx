import { ArrowLeft, ChevronLeft, ChevronRight, Star, Sun, Cross, Heart, Flame, Church, Maximize2, Minimize2, Cake, StickyNote, Plus, Trash2, Save, X, BookOpen, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useCatequizandos, useCatequistas, useCalendarioNotas, useCalendarioNotaMutation, useDeleteCalendarioNota, useEncontros, useAtividades, useTurmas } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatarDataVigente } from "@/lib/utils";

type EventType = 'solenidade' | 'festa' | 'memoria' | 'tempo' | 'comemorativa';

interface LiturgicalEvent {
  day: number;
  month: number;
  name: string;
  type: EventType;
  color?: 'verde' | 'branco' | 'vermelho' | 'roxo' | 'rosa';
  movable?: boolean;
}

const TYPE_CONFIG: Record<EventType, { label: string; dot: string; icon: typeof Star }> = {
  solenidade: { label: "Solenidade", dot: "bg-primary", icon: Star },
  festa: { label: "Festa", dot: "bg-orange-500", icon: Sun },
  memoria: { label: "Memória", dot: "bg-emerald-500", icon: Heart },
  tempo: { label: "Tempo Litúrgico", dot: "bg-purple-500", icon: Flame },
  comemorativa: { label: "Comemorativa", dot: "bg-blue-500", icon: Cross },
};

const COLOR_MAP: Record<string, string> = {
  verde: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50",
  branco: "bg-amber-50/50 text-amber-700 dark:text-amber-200 border-amber-200/50",
  vermelho: "bg-red-600/10 text-red-700 dark:text-red-400 border-red-200/50",
  roxo: "bg-purple-600/10 text-purple-700 dark:text-purple-400 border-purple-200/50",
  rosa: "bg-pink-600/10 text-pink-700 dark:text-pink-400 border-pink-200/50",
};

const EVENTS: LiturgicalEvent[] = [
  // Janeiro
  { day: 1, month: 1, name: "Santa Maria, Mãe de Deus", type: "solenidade", color: 'branco' },
  { day: 6, month: 1, name: "Epifania do Senhor", type: "solenidade", color: 'branco' },
  { day: 20, month: 1, name: "São Sebastião", type: "memoria", color: 'vermelho' },
  { day: 25, month: 1, name: "Conversão de São Paulo", type: "festa", color: 'branco' },
  { day: 28, month: 1, name: "São Tomás de Aquino", type: "memoria", color: 'branco' },
  { day: 31, month: 1, name: "São João Bosco", type: "memoria", color: 'branco' },
  // Fevereiro
  { day: 2, month: 2, name: "Apresentação do Senhor", type: "festa", color: 'branco' },
  { day: 11, month: 2, name: "Nossa Senhora de Lourdes", type: "memoria", color: 'branco' },
  { day: 14, month: 2, name: "Santos Cirilo e Metódio", type: "memoria", color: 'branco' },
  { day: 18, month: 2, name: "Quarta-feira de Cinzas", type: "tempo", color: 'roxo', movable: true },
  { day: 22, month: 2, name: "Cátedra de São Pedro", type: "festa", color: 'branco' },
  // Março
  { day: 19, month: 3, name: "São José", type: "solenidade", color: 'branco' },
  { day: 25, month: 3, name: "Anunciação do Senhor", type: "solenidade", color: 'branco' },
  { day: 29, month: 3, name: "Domingo de Ramos", type: "solenidade", color: 'vermelho', movable: true },
  // Abril
  { day: 2, month: 4, name: "Quinta-feira Santa", type: "solenidade", color: 'branco', movable: true },
  { day: 3, month: 4, name: "Sexta-feira Santa", type: "solenidade", color: 'vermelho', movable: true },
  { day: 5, month: 4, name: "Páscoa da Ressurreição", type: "solenidade", color: 'branco', movable: true },
  { day: 23, month: 4, name: "São Jorge", type: "memoria", color: 'vermelho' },
  { day: 25, month: 4, name: "São Marcos Evangelista", type: "festa", color: 'vermelho' },
  // Outubro
  { day: 12, month: 10, name: "Nossa Senhora Aparecida", type: "solenidade", color: 'branco' },
  { day: 25, month: 12, name: "Natal do Senhor", type: "solenidade", color: 'branco' },
];

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export default function CalendarioLiturgico() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);

  // Data fetching
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: catequistas = [] } = useCatequistas();
  const { data: notas = [] } = useCalendarioNotas();
  const { data: encontros = [] } = useEncontros();
  const { data: atividades = [] } = useAtividades();
  const { data: turmas = [] } = useTurmas();
  
  const notaMutation = useCalendarioNotaMutation();
  const notaDelete = useDeleteCalendarioNota();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Helper to check birthdays
  const birthdays = useMemo(() => {
    const list: { day: number; name: string; type: 'catequizando' | 'catequista' }[] = [];
    
    [...catequizandos, ...catequistas].forEach(person => {
      if (person.dataNascimento) {
        const [y, m, d] = person.dataNascimento.split('-');
        if (parseInt(m) === currentMonth + 1) {
          list.push({ 
            day: parseInt(d), 
            name: person.nome, 
            type: (person as any).turmaId ? 'catequizando' : 'catequista' 
          });
        }
      }
    });
    return list;
  }, [catequizandos, catequistas, currentMonth]);

  const monthNotes = useMemo(() => {
    return notas.filter(n => n.data.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`));
  }, [notas, currentMonth, currentYear]);

  // Map Encontros and Atividades to the current month days
  const currentMonthEvents = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return {
      encontros: encontros.filter(e => e.data.startsWith(prefix)),
      atividades: atividades.filter(a => a.data.startsWith(prefix))
    };
  }, [encontros, atividades, currentMonth, currentYear]);

  const getDayColor = (day: number) => {
    const evt = EVENTS.find(e => e.month === currentMonth + 1 && e.day === day);
    if (evt?.color) return COLOR_MAP[evt.color];
    
    // Default Liturgical Colors based on Month (Very simplified)
    if (currentMonth === 11 || currentMonth === 0) return COLOR_MAP['branco']; // Natal/Epifania (approx)
    if (currentMonth === 2 || currentMonth === 3) return COLOR_MAP['roxo']; // Quaresma (approx)
    return COLOR_MAP['verde']; // Tempo Comum
  };

  const isToday = (day: number) => 
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDay(null);
  };

  const handleSaveNote = async () => {
    if (!selectedDay) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    try {
      await notaMutation.mutateAsync({
        id: noteId || crypto.randomUUID(),
        data: dateStr,
        nota: noteContent
      });
      toast.success("Anotação salva!");
      setSelectedDay(null);
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await notaDelete.mutateAsync(id);
      toast.success("Anotação excluída");
      setSelectedDay(null);
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  useEffect(() => {
    if (selectedDay) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      const existing = notas.find(n => n.data === dateStr);
      setNoteContent(existing?.nota || "");
      setNoteId(existing?.id || null);
    }
  }, [selectedDay, notas, currentMonth, currentYear]);

  return (
    <div className={`flex flex-col gap-4 transition-all duration-500 ${isFullscreen ? 'fixed inset-0 z-[100] bg-background p-6 overflow-y-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <button onClick={() => navigate(-1)} className="back-btn">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
              <Church className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Calendário Litúrgico</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Ano {currentYear}</p>
            </div>
          </div>
        </div>
        <button onClick={toggleFullscreen} className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95">
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Calendar Card */}
      <div className={`float-card overflow-hidden animate-float-up flex flex-col ${isFullscreen ? 'flex-1 shadow-2xl border-2 border-primary/10' : ''}`}>
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <button onClick={prevMonth} className="w-10 h-10 rounded-xl bg-background/80 hover:bg-background flex items-center justify-center transition-all active:scale-90 shadow-sm border border-border/20">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-2xl font-black text-foreground tracking-tight px-4">
            {MONTH_NAMES[currentMonth]}
          </h2>
          <button onClick={nextMonth} className="w-10 h-10 rounded-xl bg-background/80 hover:bg-background flex items-center justify-center transition-all active:scale-90 shadow-sm border border-border/20">
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className={`p-4 ${isFullscreen ? 'flex-1' : ''}`}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className={`text-center text-xs font-black uppercase py-2 ${i === 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {w}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className={`grid grid-cols-7 gap-1.5 ${isFullscreen ? 'flex-1 h-full' : ''}`}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-20 border border-transparent" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const liturgicalEvts = EVENTS.filter(e => e.month === currentMonth + 1 && e.day === day);
              const dayBirthdays = birthdays.filter(b => b.day === day);
              const dayNote = monthNotes.find(n => n.data === dateStr);
              const colorClasses = getDayColor(day);
              const todayMark = isToday(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`relative aspect-square rounded-2xl flex flex-col p-2 transition-all border-2 overflow-hidden active:scale-95 group
                    ${todayMark ? 'ring-2 ring-primary ring-offset-2 z-10' : ''}
                    ${colorClasses} hover:brightness-95 hover:shadow-md
                    ${isFullscreen ? 'items-start text-left p-3' : 'justify-center items-center'}
                  `}
                >
                  <span className={`text-sm font-black ${todayMark ? 'text-primary' : ''}`}>{day}</span>
                  
                  {/* Indicators (Simplified for small view) */}
                  {!isFullscreen && (
                    <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                      {liturgicalEvts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
                      {dayBirthdays.length > 0 && <Cake className="h-3 w-3 text-pink-500 animate-bounce" />}
                      {currentMonthEvents.encontros.some(e => e.data.endsWith(`-${String(day).padStart(2, '0')}`)) && <BookOpen className="h-3 w-3 text-blue-500" />}
                      {currentMonthEvents.atividades.some(a => a.data.endsWith(`-${String(day).padStart(2, '0')}`)) && <Lightbulb className="h-3 w-3 text-emerald-500" />}
                      {dayNote && <StickyNote className="h-3 w-3 text-amber-500" />}
                    </div>
                  )}

                  {/* Detailed Layout for Fullscreen */}
                  {isFullscreen && (
                    <div className="flex-1 w-full mt-1.5 space-y-1.5 overflow-hidden">
                      {liturgicalEvts.map((e, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-background/40 backdrop-blur-sm rounded-lg px-2 py-1 border border-border/10">
                          <Star className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none uppercase">{e.name}</span>
                        </div>
                      ))}
                      {dayBirthdays.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-pink-500/10 rounded-lg px-2 py-1 border border-pink-200/20 text-pink-700 dark:text-pink-400">
                          <Cake className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none">{b.name}</span>
                        </div>
                      ))}
                      {currentMonthEvents.encontros.filter(e => e.data.endsWith(`-${String(day).padStart(2, '0')}`)).map((e, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-blue-500/10 rounded-lg px-2 py-1 border border-blue-200/20 text-blue-700 dark:text-blue-400">
                          <BookOpen className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none">{e.tema}</span>
                        </div>
                      ))}
                      {currentMonthEvents.atividades.filter(a => a.data.endsWith(`-${String(day).padStart(2, '0')}`)).map((a, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-success/10 rounded-lg px-2 py-1 border border-success/20 text-success">
                          <Lightbulb className="h-2.5 w-2.5 shrink-0" />
                          <span className="text-[9px] font-bold truncate leading-none">{a.nome}</span>
                        </div>
                      ))}
                      {dayNote && (
                        <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-lg px-2 py-1 border border-amber-200/20 text-amber-700 dark:text-amber-400">
                          <StickyNote className="h-2.5 w-2.5 shrink-0" />
                          <p className="text-[9px] font-medium truncate leading-none italic">{dayNote.nota.substring(0, 20)}...</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Bottom line for liturgical event types (Small view) */}
                  {!isFullscreen && liturgicalEvts.length > 0 && (
                    <div className="absolute top-1 right-1">
                      <Star className="h-2 w-2 opacity-40" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Note Editor Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-border/30 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <StickyNote className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-foreground">{selectedDay} de {MONTH_NAMES[currentMonth]}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Anotações e Eventos</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Liturgical Info inside Modal */}
            {selectedDay !== null && EVENTS.filter(e => e.month === currentMonth + 1 && e.day === selectedDay).map((e, idx) => (
              <div key={idx} className={`p-3 rounded-2xl border ${COLOR_MAP[e.color || 'verde']} flex items-center gap-3`}>
                <div className="w-8 h-8 rounded-lg bg-background/40 flex items-center justify-center shrink-0">
                  <Star className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight truncate">{e.name}</p>
                  <p className="text-[10px] uppercase font-bold opacity-70 tracking-tighter">{TYPE_CONFIG[e.type].label}</p>
                </div>
              </div>
            ))}

            {/* Birthday Info inside Modal */}
            {selectedDay !== null && birthdays.filter(b => b.day === selectedDay).map((b, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-pink-500/10 border border-pink-200/30 text-pink-700 dark:text-pink-400 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                  <Cake className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Aniversário de {b.name}</p>
                  <p className="text-[10px] uppercase font-bold opacity-70">{b.type === 'catequista' ? 'Catequista' : 'Catequizando'}</p>
                </div>
              </div>
            ))}
            
            {/* Catechism Encounters inside Modal */}
            {selectedDay !== null && currentMonthEvents.encontros.filter(e => e.data.endsWith(`-${String(selectedDay).padStart(2, '0')}`)).map((e, idx) => {
              const turma = turmas.find(t => t.id === e.turmaId);
              return (
                <div key={idx} className="p-3 rounded-2xl bg-blue-500/10 border border-blue-200/30 text-blue-700 dark:text-blue-400 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{e.tema}</p>
                    <p className="text-[10px] uppercase font-bold opacity-70">Encontro: {turma?.nome || 'Turma'}</p>
                  </div>
                </div>
              );
            })}

            {/* Activities/Events inside Modal */}
            {selectedDay !== null && currentMonthEvents.atividades.filter(a => a.data.endsWith(`-${String(selectedDay).padStart(2, '0')}`)).map((a, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-200/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">{a.nome}</p>
                  <p className="text-[10px] uppercase font-bold opacity-70">Atividade: {a.tipo}</p>
                </div>
              </div>
            ))}

            {/* Note Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase px-1">Minhas Anotações</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ex: Reunião de pais às 19h..."
                className="w-full min-h-[120px] p-4 rounded-2xl bg-muted/30 border border-border/10 focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm resize-none"
              />
            </div>

            <div className="flex gap-2">
              {noteId && (
                <button 
                  onClick={() => handleDeleteNote(noteId)}
                  disabled={notaDelete.isPending}
                  className="p-3 rounded-2xl text-destructive hover:bg-destructive/10 transition-colors border border-destructive/10"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button 
                onClick={handleSaveNote}
                disabled={notaMutation.isPending}
                className="flex-1 action-btn py-3 justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {notaMutation.isPending ? "Salvando..." : "Salvar Anotação"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
