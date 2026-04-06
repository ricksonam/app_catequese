import { ArrowLeft, ChevronLeft, ChevronRight, Star, Sun, Cross, Heart, Flame, Church } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

type EventType = 'solenidade' | 'festa' | 'memoria' | 'tempo' | 'comemorativa';

interface LiturgicalEvent {
  day: number;
  month: number;
  name: string;
  type: EventType;
  movable?: boolean;
}

const TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string; text: string; dot: string; icon: typeof Star }> = {
  solenidade: { label: "Solenidade", color: "hsl(var(--primary))", bg: "bg-primary/12", text: "text-primary", dot: "bg-primary", icon: Star },
  festa: { label: "Festa", color: "hsl(38, 92%, 50%)", bg: "bg-[hsl(38,92%,50%)]/12", text: "text-[hsl(38,92%,50%)]", dot: "bg-[hsl(38,92%,50%)]", icon: Sun },
  memoria: { label: "Memória", color: "hsl(152, 60%, 42%)", bg: "bg-[hsl(152,60%,42%)]/12", text: "text-[hsl(152,60%,42%)]", dot: "bg-[hsl(152,60%,42%)]", icon: Heart },
  tempo: { label: "Tempo Litúrgico", color: "hsl(270, 50%, 55%)", bg: "bg-[hsl(270,50%,55%)]/12", text: "text-[hsl(270,50%,55%)]", dot: "bg-[hsl(270,50%,55%)]", icon: Flame },
  comemorativa: { label: "Comemorativa", color: "hsl(200, 70%, 50%)", bg: "bg-[hsl(200,70%,50%)]/12", text: "text-[hsl(200,70%,50%)]", dot: "bg-[hsl(200,70%,50%)]", icon: Cross },
};

// Datas litúrgicas 2026 — datas móveis calculadas com Páscoa em 05/04/2026
const EVENTS: LiturgicalEvent[] = [
  // Janeiro
  { day: 1, month: 1, name: "Santa Maria, Mãe de Deus", type: "solenidade" },
  { day: 6, month: 1, name: "Epifania do Senhor", type: "solenidade" },
  { day: 20, month: 1, name: "São Sebastião", type: "memoria" },
  { day: 25, month: 1, name: "Conversão de São Paulo", type: "festa" },
  { day: 28, month: 1, name: "São Tomás de Aquino", type: "memoria" },
  { day: 31, month: 1, name: "São João Bosco", type: "memoria" },

  // Fevereiro
  { day: 2, month: 2, name: "Apresentação do Senhor", type: "festa" },
  { day: 11, month: 2, name: "Nossa Senhora de Lourdes", type: "memoria" },
  { day: 14, month: 2, name: "São Valentim / Santos Cirilo e Metódio", type: "memoria" },
  { day: 18, month: 2, name: "Quarta-feira de Cinzas (Início da Quaresma)", type: "tempo", movable: true },
  { day: 22, month: 2, name: "Cátedra de São Pedro", type: "festa" },

  // Março
  { day: 19, month: 3, name: "São José, Esposo da Virgem Maria", type: "solenidade" },
  { day: 25, month: 3, name: "Anunciação do Senhor", type: "solenidade" },
  { day: 29, month: 3, name: "Domingo de Ramos", type: "solenidade", movable: true },

  // Abril
  { day: 2, month: 4, name: "Quinta-feira Santa", type: "solenidade", movable: true },
  { day: 3, month: 4, name: "Sexta-feira Santa (Paixão do Senhor)", type: "solenidade", movable: true },
  { day: 5, month: 4, name: "Páscoa da Ressurreição", type: "solenidade", movable: true },
  { day: 23, month: 4, name: "São Jorge", type: "memoria" },
  { day: 25, month: 4, name: "São Marcos Evangelista", type: "festa" },
  { day: 29, month: 4, name: "Santa Catarina de Sena", type: "memoria" },

  // Maio
  { day: 1, month: 5, name: "São José Operário", type: "memoria" },
  { day: 3, month: 5, name: "Santos Filipe e Tiago Apóstolos", type: "festa" },
  { day: 13, month: 5, name: "Nossa Senhora de Fátima", type: "memoria" },
  { day: 14, month: 5, name: "Ascensão do Senhor", type: "solenidade", movable: true },
  { day: 24, month: 5, name: "Pentecostes", type: "solenidade", movable: true },
  { day: 25, month: 5, name: "Nossa Senhora Auxiliadora", type: "memoria" },
  { day: 31, month: 5, name: "Santíssima Trindade / Visitação de Nossa Senhora", type: "solenidade", movable: true },

  // Junho
  { day: 4, month: 6, name: "Corpus Christi", type: "solenidade", movable: true },
  { day: 12, month: 6, name: "Sagrado Coração de Jesus", type: "solenidade", movable: true },
  { day: 13, month: 6, name: "Santo Antônio de Pádua", type: "memoria" },
  { day: 24, month: 6, name: "Nascimento de São João Batista", type: "solenidade" },
  { day: 29, month: 6, name: "Santos Pedro e Paulo", type: "solenidade" },

  // Julho
  { day: 3, month: 7, name: "São Tomé Apóstolo", type: "festa" },
  { day: 11, month: 7, name: "São Bento", type: "memoria" },
  { day: 16, month: 7, name: "Nossa Senhora do Carmo", type: "memoria" },
  { day: 22, month: 7, name: "Santa Maria Madalena", type: "festa" },
  { day: 25, month: 7, name: "São Tiago Apóstolo", type: "festa" },
  { day: 26, month: 7, name: "Santos Joaquim e Ana", type: "memoria" },

  // Agosto
  { day: 6, month: 8, name: "Transfiguração do Senhor", type: "festa" },
  { day: 10, month: 8, name: "São Lourenço", type: "festa" },
  { day: 11, month: 8, name: "Santa Clara de Assis", type: "memoria" },
  { day: 15, month: 8, name: "Assunção de Nossa Senhora", type: "solenidade" },
  { day: 22, month: 8, name: "Nossa Senhora Rainha", type: "memoria" },
  { day: 24, month: 8, name: "São Bartolomeu Apóstolo", type: "festa" },
  { day: 28, month: 8, name: "Santo Agostinho", type: "memoria" },

  // Setembro
  { day: 8, month: 9, name: "Natividade de Nossa Senhora", type: "festa" },
  { day: 14, month: 9, name: "Exaltação da Santa Cruz", type: "festa" },
  { day: 15, month: 9, name: "Nossa Senhora das Dores", type: "memoria" },
  { day: 21, month: 9, name: "São Mateus Apóstolo e Evangelista", type: "festa" },
  { day: 29, month: 9, name: "Santos Arcanjos Miguel, Gabriel e Rafael", type: "festa" },
  { day: 30, month: 9, name: "São Jerônimo", type: "memoria" },

  // Outubro
  { day: 1, month: 10, name: "Santa Teresinha do Menino Jesus", type: "memoria" },
  { day: 2, month: 10, name: "Santos Anjos da Guarda", type: "memoria" },
  { day: 4, month: 10, name: "São Francisco de Assis", type: "memoria" },
  { day: 7, month: 10, name: "Nossa Senhora do Rosário", type: "memoria" },
  { day: 12, month: 10, name: "Nossa Senhora Aparecida", type: "solenidade" },
  { day: 15, month: 10, name: "Santa Teresa de Ávila", type: "memoria" },
  { day: 18, month: 10, name: "São Lucas Evangelista", type: "festa" },
  { day: 28, month: 10, name: "Santos Simão e Judas Apóstolos", type: "festa" },

  // Novembro
  { day: 1, month: 11, name: "Todos os Santos", type: "solenidade" },
  { day: 2, month: 11, name: "Finados (Comemoração dos Fiéis Defuntos)", type: "comemorativa" },
  { day: 3, month: 11, name: "São Martinho de Lima", type: "memoria" },
  { day: 15, month: 11, name: "Proclamação da República", type: "comemorativa" },
  { day: 20, month: 11, name: "Consciência Negra", type: "comemorativa" },
  { day: 21, month: 11, name: "Apresentação de Nossa Senhora", type: "memoria" },
  { day: 22, month: 11, name: "Cristo Rei do Universo", type: "solenidade", movable: true },
  { day: 30, month: 11, name: "Santo André Apóstolo / 1º Domingo do Advento", type: "tempo", movable: true },

  // Dezembro
  { day: 3, month: 12, name: "São Francisco Xavier", type: "memoria" },
  { day: 8, month: 12, name: "Imaculada Conceição de Nossa Senhora", type: "solenidade" },
  { day: 12, month: 12, name: "Nossa Senhora de Guadalupe", type: "festa" },
  { day: 13, month: 12, name: "Santa Luzia", type: "memoria" },
  { day: 25, month: 12, name: "Natal do Senhor", type: "solenidade" },
  { day: 26, month: 12, name: "Santo Estêvão", type: "festa" },
  { day: 27, month: 12, name: "São João Evangelista", type: "festa" },
  { day: 28, month: 12, name: "Santos Inocentes", type: "festa" },
  { day: 31, month: 12, name: "São Silvestre", type: "memoria" },
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function CalendarioLiturgico() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const monthEvents = useMemo(() => EVENTS.filter(e => e.month === currentMonth + 1), [currentMonth]);

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return monthEvents.filter(e => e.day === selectedDay);
  }, [selectedDay, monthEvents]);

  const filteredMonthEvents = useMemo(() => {
    if (filterType === 'all') return monthEvents;
    return monthEvents.filter(e => e.type === filterType);
  }, [monthEvents, filterType]);

  const getEventsForDay = (day: number) => EVENTS.filter(e => e.month === currentMonth + 1 && e.day === day);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const isToday = (day: number) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
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

      {/* Month Navigation */}
      <div className="float-card overflow-hidden animate-float-up">
        {/* Month header with liturgical gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-background/80 hover:bg-background flex items-center justify-center transition-all active:scale-90 shadow-sm">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <h2 className="text-lg font-black text-foreground tracking-tight">
              {MONTH_NAMES[currentMonth]}
            </h2>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-background/80 hover:bg-background flex items-center justify-center transition-all active:scale-90 shadow-sm">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        <div className="p-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className={`text-center text-[10px] font-black uppercase py-1 ${i === 0 ? 'text-destructive/70' : 'text-muted-foreground'}`}>
                {w}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const evts = getEventsForDay(day);
              const selected = selectedDay === day;
              const todayMark = isToday(day);
              const hasSolenidade = evts.some(e => e.type === 'solenidade');
              const hasFesta = evts.some(e => e.type === 'festa');
              const hasTempo = evts.some(e => e.type === 'tempo');
              const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(selected ? null : day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-semibold relative active:scale-90
                    ${selected ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 z-10' : ''}
                    ${todayMark && !selected ? 'bg-primary/15 text-primary font-black ring-2 ring-primary/40' : ''}
                    ${!selected && !todayMark && hasSolenidade ? 'bg-primary/8 text-primary font-bold' : ''}
                    ${!selected && !todayMark && !hasSolenidade && hasTempo ? 'bg-[hsl(270,50%,55%)]/8 text-[hsl(270,50%,55%)]' : ''}
                    ${!selected && !todayMark && !hasSolenidade && !hasTempo && hasFesta ? 'bg-[hsl(38,92%,50%)]/8' : ''}
                    ${!selected && !todayMark && !hasSolenidade && !hasTempo && !hasFesta ? (dayOfWeek === 0 ? 'text-destructive/60' : 'text-foreground') : ''}
                    ${!selected ? 'hover:bg-muted/60' : ''}
                  `}
                >
                  <span>{day}</span>
                  {evts.length > 0 && !selected && (
                    <div className="flex gap-px absolute bottom-0.5">
                      {evts.slice(0, 3).map((e, idx) => (
                        <span key={idx} className={`w-1 h-1 rounded-full ${TYPE_CONFIG[e.type].dot}`} />
                      ))}
                    </div>
                  )}
                  {selected && evts.length > 0 && (
                    <div className="flex gap-px absolute bottom-0.5">
                      {evts.slice(0, 3).map((_, idx) => (
                        <span key={idx} className="w-1 h-1 rounded-full bg-primary-foreground/70" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          {(Object.keys(TYPE_CONFIG) as EventType[]).map(t => {
            const cfg = TYPE_CONFIG[t];
            return (
              <div key={t} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-[9px] text-muted-foreground font-medium">{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && dayEvents.length > 0 && (
        <div className="space-y-2 animate-float-up">
          <p className="section-title">{selectedDay} de {MONTH_NAMES[currentMonth]}</p>
          {dayEvents.map((evt, i) => {
            const cfg = TYPE_CONFIG[evt.type];
            const Icon = cfg.icon;
            return (
              <div key={i} className="float-card px-4 py-3.5 flex items-center gap-3 animate-float-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${cfg.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{evt.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
                    {evt.movable && <span className="text-[9px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">data móvel</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && dayEvents.length === 0 && (
        <div className="float-card p-6 text-center animate-float-up">
          <p className="text-sm text-muted-foreground">Nenhum evento litúrgico neste dia</p>
        </div>
      )}

      {/* Filter */}
      <div className="animate-float-up" style={{ animationDelay: '100ms' }}>
        <p className="section-title">Eventos do Mês</p>
        <div className="flex gap-1.5 flex-wrap mb-3">
          <button onClick={() => setFilterType('all')} className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${filterType === 'all' ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted/60 text-muted-foreground'}`}>
            Todos ({monthEvents.length})
          </button>
          {(Object.keys(TYPE_CONFIG) as EventType[]).map(t => {
            const count = monthEvents.filter(e => e.type === t).length;
            if (count === 0) return null;
            const cfg = TYPE_CONFIG[t];
            return (
              <button key={t} onClick={() => setFilterType(t)} className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${filterType === t ? `${cfg.bg} ${cfg.text} shadow-md` : 'bg-muted/60 text-muted-foreground'}`}>
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Month events list */}
      <div className="space-y-2 pb-4">
        {filteredMonthEvents.map((evt, i) => {
          const cfg = TYPE_CONFIG[evt.type];
          const Icon = cfg.icon;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(evt.day)}
              className="float-card w-full px-4 py-3 flex items-center gap-3 text-left animate-float-up active:scale-[0.98] transition-transform"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                <span className={`text-sm font-black ${cfg.text}`}>{evt.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{evt.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Icon className={`h-3 w-3 ${cfg.text}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
                  {evt.movable && <span className="text-[9px] text-muted-foreground">• móvel</span>}
                </div>
              </div>
            </button>
          );
        })}
        {filteredMonthEvents.length === 0 && (
          <div className="float-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhum evento neste mês</p>
          </div>
        )}
      </div>
    </div>
  );
}
