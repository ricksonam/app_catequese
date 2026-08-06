import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, Plus, Trash2, Link, Save, CheckCircle2, Copy,
  Heart, Users, Share2, XCircle, CalendarClock,
  ChevronDown, ChevronRight, Ban, CalendarDays, Timer,
  BarChart3, BookOpen, PlusCircle, ArrowRight, Star,
  CheckSquare, FileText, Sparkles, TrendingUp, Activity,
  Info, ChevronLeft, ArrowLeft, Bell, MoreVertical, Home, X,
  UserCheck, ClipboardList, Zap, Search
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  fetchTurmas, fetchVisitaConfigByTurma, upsertVisitaConfig,
  fetchAgendamentosByConfig, removeVisitaAgendamento, updateVisitaAgendamento,
  fetchCatequizandos, insertVisitaAgendamentoManual
} from "@/lib/supabaseStore";
import { type Turma, type VisitaFamiliasConfig, type VisitaAgendamento, type VisitaDiaHorarios, type Catequizando } from "@/lib/store";
import { toast } from "sonner";
import Spinner from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(str: string) {
  return new Date(str + "T12:00:00").toLocaleDateString("pt-BR");
}
function fmtDateFull(str: string) {
  return new Date(str + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const HORARIOS_RAPIDOS = ["08:00","09:00","10:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  if (status === "cancelada") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-600 border border-red-200">
      <Ban className="w-3 h-3" /> Cancelada
    </span>
  );
  if (status === "adiada") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">
      <CalendarClock className="w-3 h-3" /> Adiada
    </span>
  );
  if (status === "realizada") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200">
      <CheckSquare className="w-3 h-3" /> Realizada
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3 h-3" /> Confirmada
    </span>
  );
}

// ─── Modal de Cancelamento ────────────────────────────────────────────────────
function CancelModal({ agendamento, onClose, onConfirm }: {
  agendamento: VisitaAgendamento;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Ban className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-base text-foreground">Cancelar Visita</h3>
            <p className="text-xs text-muted-foreground font-medium">Família de <span className="text-foreground font-bold">{agendamento.nome_crianca}</span></p>
          </div>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 border border-red-100 text-xs font-bold text-red-800">
          📅 {fmtDate(agendamento.data_visita)} às {agendamento.horario_visita}
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-1.5 block">Motivo do cancelamento *</label>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full min-h-[100px] p-4 rounded-xl border-2 border-black/10 bg-muted/20 focus:border-red-400 focus:ring-0 transition-all font-medium text-sm resize-none outline-none"
            placeholder="Ex: Catequista indisponível nessa data..."
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-black/10 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all">
            Voltar
          </button>
          <button
            onClick={() => motivo.trim() && onConfirm(motivo)}
            disabled={!motivo.trim()}
            className="flex-[2] py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-40"
          >
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Adiamento ───────────────────────────────────────────────────────
function AdiamentoModal({ agendamento, diasDisponiveis, onClose, onConfirm }: {
  agendamento: VisitaAgendamento;
  diasDisponiveis: VisitaDiaHorarios[];
  onClose: () => void;
  onConfirm: (novaData: string, novoHorario: string) => void;
}) {
  const [novaData, setNovaData] = useState<string | null>(null);
  const [novoHorario, setNovoHorario] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const diasStr = diasDisponiveis.map(d => d.data);
  const horariosNovaData = diasDisponiveis.find(d => d.data === novaData)?.horarios || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-black text-base">Adiar Visita</h3>
            <p className="text-xs text-muted-foreground font-medium">Família de <span className="font-bold text-foreground">{agendamento.nome_crianca}</span></p>
          </div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 text-xs font-bold text-amber-800">
          📅 Data atual: {fmtDate(agendamento.data_visita)} às {agendamento.horario_visita}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-2">Escolha a nova data</p>
          <div className="flex justify-center bg-amber-50/30 rounded-3xl p-3 border border-amber-100">
            <CalendarUI
              mode="single"
              selected={selectedDate}
              locale={ptBR}
              onSelect={(d) => { setSelectedDate(d); setNovaData(d ? toDateStr(d) : null); setNovoHorario(null); }}
              disabled={(day) => { const str = toDateStr(day); return !diasStr.includes(str) || str === agendamento.data_visita; }}
              className={cn(
                "w-full bg-white p-3 rounded-2xl shadow-sm border border-amber-100",
                "[&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_table]:w-full",
                "[&_.rdp-cell]:p-1",
                "[&_.rdp-day_button]:w-full [&_.rdp-day_button]:aspect-square [&_.rdp-day_button]:max-h-12 [&_.rdp-day_button]:text-sm [&_.rdp-day_button]:font-bold",
              )}
              classNames={{
                day_selected: "bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:text-white focus:from-amber-600 focus:to-orange-600 focus:text-white rounded-2xl font-black shadow-lg shadow-amber-500/30 scale-105 transition-transform",
                day_disabled: "text-slate-300 opacity-40 font-medium",
                head_cell: "text-amber-900/60 font-black text-xs uppercase pb-3",
                day: "text-slate-700 rounded-2xl border-2 border-transparent hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 active:scale-95 transition-all flex items-center justify-center",
              }}
            />
          </div>
        </div>
        {novaData && horariosNovaData.length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-2">Escolha o novo horário</p>
            <div className="grid grid-cols-3 gap-2">
              {horariosNovaData.map(h => (
                <button key={h} type="button" onClick={() => setNovoHorario(h)}
                  className={cn("py-2.5 rounded-xl font-black text-sm border-2 transition-all",
                    novoHorario === h ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-black/10 text-muted-foreground hover:border-amber-300"
                  )}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}
        {novaData && horariosNovaData.length === 0 && (
          <p className="text-center text-xs font-bold text-muted-foreground py-2">Nenhum horário disponível para esta data.</p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-black/10 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all">Voltar</button>
          <button onClick={() => novaData && novoHorario && onConfirm(novaData, novoHorario)} disabled={!novaData || !novoHorario}
            className="flex-[2] py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-amber-600 transition-all disabled:opacity-40">
            Confirmar Adiamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Diário de Visita ───────────────────────────────────────────────────
function DiarioModal({ agendamento, onClose, onConfirm }: {
  agendamento: VisitaAgendamento;
  onClose: () => void;
  onConfirm: (realizada: boolean, notas: string) => void;
}) {
  const [realizada, setRealizada] = useState(agendamento.status === "realizada");
  const [notas, setNotas] = useState((agendamento as any).notas_catequista || "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Registro da Visita</h3>
              <p className="text-indigo-200 text-xs font-medium">Família de <span className="text-white font-bold">{agendamento.nome_crianca}</span></p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100 text-xs font-bold text-indigo-800">
            📅 {fmtDate(agendamento.data_visita)} às {agendamento.horario_visita} · Resp: {agendamento.nome_responsavel}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-800">A visita aconteceu?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRealizada(true)}
                className={cn("py-4 rounded-2xl border-2 font-black text-sm flex flex-col items-center gap-2 transition-all",
                  realizada ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-600/30" : "bg-white border-slate-200 text-slate-500 hover:border-green-300"
                )}
              >
                <CheckCircle2 className="w-6 h-6" />
                Sim, aconteceu!
              </button>
              <button
                type="button"
                onClick={() => setRealizada(false)}
                className={cn("py-4 rounded-2xl border-2 font-black text-sm flex flex-col items-center gap-2 transition-all",
                  !realizada ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30" : "bg-white border-slate-200 text-slate-500 hover:border-red-300"
                )}
              >
                <XCircle className="w-6 h-6" />
                Não aconteceu
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Anotações do Catequista (Diário)
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full min-h-[130px] p-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-sm resize-none outline-none placeholder:text-slate-400"
              placeholder="Ex: A família foi muito receptiva. Conversamos sobre a preparação dos sacramentos..."
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground font-medium ml-1">📖 Este registro é privado e ficará guardado no diário da turma.</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-black/10 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all">
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(realizada, notas)}
              className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Salvar Registro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card de visita na lista ──────────────────────────────────────────────────
function AgendamentoCard({ agendamento, diasConfig, onCancel, onAdiar, onDelete, onDiario }: {
  agendamento: VisitaAgendamento;
  diasConfig: VisitaDiaHorarios[];
  onCancel: (a: VisitaAgendamento) => void;
  onAdiar: (a: VisitaAgendamento) => void;
  onDelete: (id: string) => void;
  onDiario: (a: VisitaAgendamento) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isCanceled = agendamento.status === "cancelada";
  const isAdiada = agendamento.status === "adiada";
  const isRealizada = agendamento.status === "realizada";
  const temNotas = !!(agendamento as any).notas_catequista;

  return (
    <div className={cn(
      "rounded-2xl border-2 transition-all duration-200 overflow-hidden",
      isCanceled ? "bg-red-50/50 border-red-200" :
      isRealizada ? "bg-indigo-50/50 border-indigo-200" :
      isAdiada ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-300 shadow-md"
    )}>
      <div className="p-4 flex items-start gap-3 relative">
        <button onClick={() => onDelete(agendamento.id)} className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 shadow-sm transition-colors" title="Excluir">
          <Trash2 className="w-4 h-4" />
        </button>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm",
          isCanceled ? "bg-red-100 text-red-500" :
          isRealizada ? "bg-indigo-100 text-indigo-600" :
          isAdiada ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
        )}>
          {agendamento.nome_crianca?.charAt(0)?.toUpperCase() || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className={cn("text-sm font-black", isCanceled && "line-through text-muted-foreground")}>{agendamento.nome_crianca}</p>
              <p className="text-xs font-medium text-muted-foreground">Resp: {agendamento.nome_responsavel}</p>
            </div>
            <StatusBadge status={agendamento.status || "confirmada"} />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm">
              <CalendarDays className="w-3.5 h-3.5" /> {agendamento.data_visita ? fmtDate(agendamento.data_visita) : ""}
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm">
              <Clock className="w-3.5 h-3.5" /> {agendamento.horario_visita}
            </div>
          </div>

          {agendamento.telefone && (
            <p className="mt-2 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              📞 {agendamento.telefone}
            </p>
          )}

          {isAdiada && agendamento.data_reagendada && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-lg px-2 py-1">
              <CalendarClock className="w-3 h-3" />
              Reagendado: {fmtDate(agendamento.data_reagendada)} às {agendamento.horario_reagendado}
            </div>
          )}

          {isCanceled && agendamento.motivo_cancelamento && (
            <div className="mt-2 flex items-start gap-1.5 text-[10px] font-bold text-red-700 bg-red-100 rounded-lg px-2 py-1">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              {agendamento.motivo_cancelamento}
            </div>
          )}

          {temNotas && (
            <button onClick={() => setExpanded(!expanded)} className="mt-2 text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
              <BookOpen className="w-3 h-3" />
              {expanded ? "Ocultar diário" : "Ver diário"}
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
          {expanded && temNotas && (
            <div className="mt-2 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">📖 Diário do Catequista</p>
              <p className="text-xs text-indigo-900/80 font-medium leading-relaxed italic">"{(agendamento as any).notas_catequista}"</p>
            </div>
          )}

          {agendamento.observacao && (
            <>
              <button onClick={() => setExpanded(!expanded)} className="mt-1 text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline">
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />} Observação da família
              </button>
              {expanded && <p className="mt-1 text-[10px] text-muted-foreground italic bg-muted/20 rounded-lg px-2 py-1.5">"{agendamento.observacao}"</p>}
            </>
          )}
        </div>
      </div>

      {!isCanceled && (
        <div className={cn("border-t px-4 py-3 flex gap-2 sm:gap-3 w-full",
          isCanceled ? "border-red-100 bg-red-50/30" : isRealizada ? "border-indigo-100 bg-indigo-50/30" : "border-black/5 bg-slate-50/50"
        )}>
          {!isCanceled && (
            <button onClick={() => onDiario(agendamento)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
              <BookOpen className="w-4 h-4" /> {isRealizada ? "Ver Diário" : "Registrar"}
            </button>
          )}
          {!isCanceled && !isAdiada && !isRealizada && (
            <button onClick={() => onAdiar(agendamento)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
              <CalendarClock className="w-4 h-4" /> Adiar
            </button>
          )}
          {!isCanceled && !isRealizada && (
            <button onClick={() => onCancel(agendamento)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
              <Ban className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Seletor de Datas Melhorado (para view "nova") ────────────────────────────
function CalendarioMultiplo({ diasHorarios, onChange, visitasPorData }: {
  diasHorarios: VisitaDiaHorarios[];
  onChange: (dias: VisitaDiaHorarios[]) => void;
  visitasPorData: Record<string, number>;
}) {
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [horarioCustom, setHorarioCustom] = useState<Record<string, string>>({});
  const selectedDates = diasHorarios.map(d => new Date(d.data + "T12:00:00"));

  const toggleDate = (day: Date | undefined) => {
    if (!day) return;
    const str = toDateStr(day);
    const exists = diasHorarios.find(d => d.data === str);
    if (exists) {
      const count = visitasPorData[str] || 0;
      if (count > 0 && !window.confirm(`Há ${count} visita(s) marcada(s) neste dia. Remover mesmo assim?`)) return;
      onChange(diasHorarios.filter(d => d.data !== str));
    } else {
      onChange([...diasHorarios, { data: str, horarios: [] }].sort((a, b) => a.data.localeCompare(b.data)));
    }
  };

  const addHorario = (dataStr: string, horario: string) => {
    if (!horario.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) { toast.error("Horário inválido. Use HH:MM"); return; }
    onChange(diasHorarios.map(d =>
      d.data === dataStr && !d.horarios.includes(horario)
        ? { ...d, horarios: [...d.horarios, horario].sort() }
        : d
    ));
  };

  const removeHorario = (dataStr: string, horario: string) => {
    onChange(diasHorarios.map(d =>
      d.data === dataStr ? { ...d, horarios: d.horarios.filter(h => h !== horario) } : d
    ));
  };

  return (
    <div className="space-y-4">
      {/* Calendário visual para seleção */}
      <div className="bg-white rounded-3xl border-2 border-indigo-200 shadow-xl shadow-indigo-600/10 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm uppercase tracking-widest leading-tight">Escolher Datas</p>
            <p className="text-indigo-100 text-[10px] font-medium leading-tight mt-0.5">Clique nos dias disponíveis para as visitas</p>
          </div>
        </div>
        <div className="p-5 flex justify-center bg-indigo-50/30">
          <CalendarUI
            mode="multiple"
            selected={selectedDates}
            locale={ptBR}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            onSelect={(dates) => {
              if (!dates) { onChange([]); return; }
              const newStrs = dates.map(toDateStr);
              // figure out what was added vs removed
              const oldStrs = diasHorarios.map(d => d.data);
              const added = newStrs.filter(s => !oldStrs.includes(s));
              const removed = oldStrs.filter(s => !newStrs.includes(s));
              let next = [...diasHorarios];
              for (const s of removed) {
                const count = visitasPorData[s] || 0;
                if (count > 0 && !window.confirm(`Há ${count} visita(s) marcada(s) em ${fmtDate(s)}. Remover mesmo assim?`)) continue;
                next = next.filter(d => d.data !== s);
              }
              for (const s of added) {
                if (!next.find(d => d.data === s)) next.push({ data: s, horarios: [] });
              }
              onChange(next.sort((a, b) => a.data.localeCompare(b.data)));
            }}
            disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
            className={cn(
              "rounded-2xl w-full bg-white p-3 shadow-sm border border-indigo-100",
              "[&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_table]:w-full",
              "[&_.rdp-cell]:p-1",
              "[&_.rdp-day_button]:w-full [&_.rdp-day_button]:aspect-square [&_.rdp-day_button]:max-h-12 [&_.rdp-day_button]:text-sm [&_.rdp-day_button]:font-bold",
            )}
            classNames={{
              day_selected: "bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:text-white focus:from-indigo-600 focus:to-purple-700 focus:text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30 scale-105 transition-transform",
              day_disabled: "text-slate-300 opacity-40 font-medium",
              head_cell: "text-indigo-900/60 font-black text-xs uppercase pb-3",
              day: "text-slate-700 rounded-2xl border-2 border-transparent hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 transition-all flex items-center justify-center",
            }}
          />
        </div>
        {diasHorarios.length > 0 && (
          <div className="px-5 pb-5 bg-indigo-50/30 border-t border-indigo-100/50 pt-4">
            <p className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" /> {diasHorarios.length} dia(s) selecionado(s)
            </p>
            <div className="flex flex-wrap gap-2">
              {diasHorarios.map(d => (
                <div key={d.data} className="flex items-center bg-white border border-indigo-200 shadow-sm rounded-xl overflow-hidden group">
                  <div className="px-3 py-1.5 bg-indigo-50 text-indigo-800 font-black text-[11px] group-hover:bg-indigo-100 transition-colors">
                    {fmtDate(d.data)}
                  </div>
                  {d.horarios.length > 0 && (
                    <div className="px-2 py-1.5 bg-indigo-600 text-white font-bold text-[10px]">
                      {d.horarios.length}h
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cards de horários por dia */}
      {diasHorarios.length === 0 && (
        <div className="text-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-black/10">
          <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Clique no calendário para adicionar dias</p>
        </div>
      )}

      <div className="space-y-3">
        {diasHorarios.map(dia => {
          const countVisitas = visitasPorData[dia.data] || 0;
          const isLotado = dia.horarios.length > 0 && countVisitas >= dia.horarios.length;
          const custom = horarioCustom[dia.data] || "";
          return (
            <div key={dia.data} className="rounded-2xl border-2 border-black/5 bg-white shadow-sm overflow-hidden">
              {/* Header do dia */}
              <div className={cn("px-4 py-3 flex items-center justify-between",
                isLotado ? "bg-red-50" : countVisitas > 0 ? "bg-green-50" : "bg-indigo-50"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center",
                    isLotado ? "bg-red-100" : countVisitas > 0 ? "bg-green-100" : "bg-indigo-100"
                  )}>
                    <CalendarDays className={cn("w-4 h-4", isLotado ? "text-red-500" : countVisitas > 0 ? "text-green-600" : "text-indigo-600")} />
                  </div>
                  <div>
                    <p className="text-sm font-black capitalize">{fmtDateFull(dia.data)}</p>
                    {countVisitas > 0 && (
                      <p className={cn("text-[10px] font-bold", isLotado ? "text-red-500" : "text-green-600")}>
                        {countVisitas} marcada{countVisitas > 1 ? "s" : ""}
                        {isLotado ? " • Lotado!" : ` • ${dia.horarios.length - countVisitas} livre${dia.horarios.length - countVisitas > 1 ? "s" : ""}`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const count = visitasPorData[dia.data] || 0;
                    if (count > 0 && !window.confirm(`Há ${count} visita(s) marcada(s) neste dia. Remover mesmo assim?`)) return;
                    onChange(diasHorarios.filter(d => d.data !== dia.data));
                  }}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-muted-foreground transition-all shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Horários rápidos */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" /> Horários rápidos
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {HORARIOS_RAPIDOS.map(h => {
                      const active = dia.horarios.includes(h);
                      const occupied = ([] as any[]).some?.((a: any) => a?.data_visita === dia.data && a?.horario_visita === h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => active ? removeHorario(dia.data, h) : addHorario(dia.data, h)}
                          className={cn(
                            "py-2 rounded-xl text-[11px] font-black border-2 transition-all",
                            active
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "bg-white border-black/10 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50"
                          )}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horário customizado */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={custom}
                      onChange={e => setHorarioCustom(prev => ({ ...prev, [dia.data]: e.target.value }))}
                      className="w-full h-10 pl-8 pr-3 rounded-xl border-2 border-black/10 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all text-xs font-bold outline-none"
                      placeholder="Horário personalizado"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (custom) {
                        addHorario(dia.data, custom);
                        setHorarioCustom(prev => ({ ...prev, [dia.data]: "" }));
                      }
                    }}
                    disabled={!custom}
                    className="h-10 px-3 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-40 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Horários selecionados */}
                {dia.horarios.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Horários selecionados ({dia.horarios.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dia.horarios.map(h => (
                        <div key={h} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-indigo-700">
                          <Clock className="w-3 h-3" />
                          {h}
                          <button onClick={() => removeHorario(dia.data, h)} className="text-indigo-400 hover:text-red-500 transition-colors ml-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function PainelVisitaFamilia() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Tela ativa: "home" | "nova" | "manual" | "visitas" | "relatorio"
  const [activeView, setActiveView] = useState<"home" | "nova" | "manual" | "visitas" | "relatorio">("home");
  const [filtroVisitas, setFiltroVisitas] = useState<"todas" | "abertas" | "canceladas" | "realizadas">("abertas");

  // Modais
  const [cancelModal, setCancelModal] = useState<VisitaAgendamento | null>(null);
  const [adiamentoModal, setAdiamentoModal] = useState<VisitaAgendamento | null>(null);
  const [diarioModal, setDiarioModal] = useState<VisitaAgendamento | null>(null);

  // Form de configuração do link
  const [form, setForm] = useState<Partial<VisitaFamiliasConfig>>({
    ativo: true, titulo: "Visita às Famílias", tema: "", dias_horarios: [], data_validade: "",
  });

  // Form de marcação manual
  const [manualStep, setManualStep] = useState<1 | 2 | 3 | 4>(1);
  const [manualCatequizando, setManualCatequizando] = useState<Catequizando | null>(null);
  const [manualBusca, setManualBusca] = useState("");
  const [manualData, setManualData] = useState<Date | undefined>(undefined);
  const [manualDataStr, setManualDataStr] = useState<string>("");
  const [manualHorario, setManualHorario] = useState<string>("");
  const [manualHorarioCustom, setManualHorarioCustom] = useState<string>("");
  const [manualObs, setManualObs] = useState<string>("");

  const { data: turmas, isLoading: loadingTurmas } = useQuery({
    queryKey: ["turmas"],
    queryFn: () => fetchTurmas(),
  });

  useEffect(() => {
    if (turmas && turmas.length === 1 && !selectedTurma) setSelectedTurma(turmas[0].id);
  }, [turmas, selectedTurma]);

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["visita_config", selectedTurma],
    queryFn: () => fetchVisitaConfigByTurma(selectedTurma),
    enabled: !!selectedTurma,
  });

  const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["visita_agendamentos", config?.id],
    queryFn: () => fetchAgendamentosByConfig(config!.id),
    enabled: !!config?.id,
  });

  const { data: catequizandos } = useQuery({
    queryKey: ["catequizandos", selectedTurma],
    queryFn: () => fetchCatequizandos(selectedTurma),
    enabled: !!selectedTurma,
  });

  useEffect(() => {
    if (config) {
      setForm({ ativo: config.ativo, titulo: config.titulo || "Visita às Famílias", tema: config.tema || "", dias_horarios: config.dias_horarios || [], data_validade: config.data_validade || "" });
    } else {
      setForm({ ativo: true, titulo: "Visita às Famílias", tema: "", dias_horarios: [], data_validade: "" });
    }
  }, [config, selectedTurma]);

  // Mutations
  const mutationSave = useMutation({
    mutationFn: async (payload: Partial<VisitaFamiliasConfig>) => upsertVisitaConfig({ ...payload, turma_id: selectedTurma }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visita_config", selectedTurma] }); toast.success("Painel salvo com sucesso!"); },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const mutationCancel = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => updateVisitaAgendamento(id, { status: "cancelada", motivo_cancelamento: motivo }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] }); toast.success("Visita cancelada."); setCancelModal(null); },
    onError: (e: any) => toast.error(e.message || "Erro ao cancelar"),
  });

  const mutationAdiar = useMutation({
    mutationFn: ({ id, data, horario }: { id: string; data: string; horario: string }) =>
      updateVisitaAgendamento(id, { status: "adiada", data_reagendada: data, horario_reagendado: horario }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] }); toast.success("Visita adiada!"); setAdiamentoModal(null); },
    onError: (e: any) => toast.error(e.message || "Erro ao adiar"),
  });

  const mutationDiario = useMutation({
    mutationFn: ({ id, realizada, notas }: { id: string; realizada: boolean; notas: string }) =>
      updateVisitaAgendamento(id, { status: realizada ? "realizada" : "confirmada", notas_catequista: notas } as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] }); toast.success("Registro salvo!"); setDiarioModal(null); },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  const mutationDelete = useMutation({
    mutationFn: (id: string) => removeVisitaAgendamento(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] }); toast.success("Agendamento removido."); },
  });

  const mutationManual = useMutation({
    mutationFn: (payload: Parameters<typeof insertVisitaAgendamentoManual>[0]) => insertVisitaAgendamentoManual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] });
      toast.success("Visita marcada com sucesso!");
      // reset manual
      setManualStep(1);
      setManualCatequizando(null);
      setManualBusca("");
      setManualData(undefined);
      setManualDataStr("");
      setManualHorario("");
      setManualHorarioCustom("");
      setManualObs("");
      setActiveView("visitas");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar visita"),
  });

  // ── Calendário helpers ────────────────────────────────────────────────────
  const visitasPorData = (agendamentos || []).reduce<Record<string, number>>((acc, a) => {
    if (a.status !== "cancelada") { acc[a.data_visita] = (acc[a.data_visita] || 0) + 1; }
    return acc;
  }, {});

  const shareLink = async () => {
    if (!config?.token) return;
    const url = `${window.location.origin}/visita-familia/${config.token}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Agendamento de Visitas às Famílias", text: "Acesse o link para agendar a visita da catequese em sua casa:", url });
        return;
      } catch (e) { /* silent */ }
    }
    navigator.clipboard.writeText(url);
    setCopied(true); toast.success("Link copiado!"); setTimeout(() => setCopied(false), 2000);
  };

  // ── Estatísticas ───────────────────────────────────────────────────────────
  const totalAll = agendamentos?.length || 0;
  const totalConfirmadas = (agendamentos || []).filter(a => !a.status || a.status === "confirmada").length;
  const totalAdiadas = (agendamentos || []).filter(a => a.status === "adiada").length;
  const totalCanceladas = (agendamentos || []).filter(a => a.status === "cancelada").length;
  const totalRealizadas = (agendamentos || []).filter(a => a.status === "realizada").length;
  const taxaRealizacao = totalAll > 0 ? Math.round((totalRealizadas / totalAll) * 100) : 0;
  const totalDias = form.dias_horarios?.length || 0;
  const totalVagas = form.dias_horarios?.reduce((acc, d) => acc + d.horarios.length, 0) || 0;
  const taxaOcupacao = totalVagas > 0 ? Math.round(((totalAll - totalCanceladas) / totalVagas) * 100) : 0;

  // Filtro de visitas
  const agendamentosFiltrados = (agendamentos || []).filter(a => {
    if (filtroVisitas === "abertas") return !a.status || a.status === "confirmada" || a.status === "adiada";
    if (filtroVisitas === "canceladas") return a.status === "cancelada";
    if (filtroVisitas === "realizadas") return a.status === "realizada";
    return true;
  });

  const agendamentosAgrupados = agendamentosFiltrados.reduce<Record<string, VisitaAgendamento[]>>((acc, a) => {
    const chave = a.data_visita;
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(a);
    return acc;
  }, {});
  const datasOrdenadas = Object.keys(agendamentosAgrupados).sort();

  const familiasMaisAtivas = [...(agendamentos || [])]
    .filter(a => a.status !== "cancelada")
    .sort((a, b) => a.nome_crianca?.localeCompare(b.nome_crianca || "") || 0);

  const diasComMaisVisitas = Object.entries(visitasPorData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // catequizandos filtrados pela busca e status ativo
  const catequizandosFiltrados = (catequizandos || []).filter(c => {
    const isAtivo = c.status === "ativo";
    const matchBusca = !manualBusca || c.nome.toLowerCase().includes(manualBusca.toLowerCase()) ||
      (c.responsavel || "").toLowerCase().includes(manualBusca.toLowerCase());
    return isAtivo && matchBusca;
  });

  if (loadingTurmas) return <div className="flex justify-center p-8"><Spinner size="md" /></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-md mx-auto sm:max-w-none bg-slate-50/50 sm:bg-transparent min-h-screen sm:min-h-0 pb-10">
      {/* Modais */}
      {cancelModal && <CancelModal agendamento={cancelModal} onClose={() => setCancelModal(null)} onConfirm={(motivo) => mutationCancel.mutate({ id: cancelModal.id, motivo })} />}
      {adiamentoModal && <AdiamentoModal agendamento={adiamentoModal} diasDisponiveis={form.dias_horarios || []} onClose={() => setAdiamentoModal(null)} onConfirm={(data, horario) => mutationAdiar.mutate({ id: adiamentoModal.id, data, horario })} />}
      {diarioModal && <DiarioModal agendamento={diarioModal} onClose={() => setDiarioModal(null)} onConfirm={(realizada, notas) => mutationDiario.mutate({ id: diarioModal.id, realizada, notas })} />}

      {/* Header do App */}
      <div className="flex items-center justify-between px-2 pt-4 sm:pt-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-indigo-950 text-xl leading-tight">Painel de Visitas</h2>
            <p className="text-xs text-indigo-900/60 font-medium mt-0.5">Acolher • Escutar • Evangelizar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2.5 text-indigo-900/70 hover:bg-indigo-100 rounded-full transition-colors focus:ring-2 focus:ring-indigo-300">
                <Bell className="w-7 h-7" />
                {totalConfirmadas > 0 && (
                  <span className="absolute top-1 right-1.5 min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-slate-50 shadow-sm animate-pulse">
                    {totalConfirmadas}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl overflow-hidden shadow-xl" align="end">
              <div className="bg-indigo-600 p-4 text-white">
                <h3 className="font-bold text-lg">Visitas Agendadas</h3>
                <p className="text-xs text-indigo-100 opacity-90">Famílias aguardando visita</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {(agendamentos || []).filter(a => !a.status || a.status === "confirmada").length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">Nenhuma visita aguardando no momento.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {(agendamentos || []).filter(a => !a.status || a.status === "confirmada").map(ag => (
                      <div key={ag.id} className="p-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setActiveView("visitas"); setFiltroVisitas("abertas"); }}>
                        <p className="text-sm font-bold text-slate-800">Família {ag.nome_crianca}</p>
                        <p className="text-[11px] text-slate-500">{ag.data_visita ? fmtDateFull(ag.data_visita) : ''} às {ag.horario_visita}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <button onClick={() => { setActiveView("visitas"); setFiltroVisitas("abertas"); }} className="w-full text-center text-xs font-bold text-indigo-600 py-2 hover:bg-indigo-50 rounded-lg transition-colors">
                  Ver todas as visitas
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <button onClick={() => navigate('/modulos/calendario')} className="w-8 h-8 flex items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shrink-0 ml-2" title="Fechar Painel">
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* SELETOR DE TURMA */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/5 shadow-sm">
        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Selecionar Turma</label>
        <Select value={selectedTurma} onValueChange={(v) => { setSelectedTurma(v); setActiveView("home"); }}>
          <SelectTrigger className="h-[48px] border-2 border-black/10 rounded-xl bg-slate-50 font-semibold text-sm">
            <SelectValue placeholder="Escolha a turma para configurar visitas" />
          </SelectTrigger>
          <SelectContent>
            {turmas?.map((t) => <SelectItem key={t.id} value={t.id} className="font-semibold">{t.nome} {t.ano ? `(${t.ano})` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedTurma && loadingConfig && <div className="flex justify-center p-8"><Spinner size="md" text="Carregando..." /></div>}

      {selectedTurma && !loadingConfig && (
        <>
          {/* ── HOME ─────────────────────────────────────────────────────────── */}
          {activeView === "home" && (
            <div className="space-y-6">

              {/* Resumo do painel */}
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-4 px-1">Resumo do painel</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-blue-600 rounded-[1rem] sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center text-center shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center mb-1.5 sm:mb-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xl sm:text-3xl font-black text-white leading-none mb-1 sm:mb-1.5">{totalAll}</span>
                    <span className="text-[9px] sm:text-xs font-bold text-blue-100 leading-tight">Recebidas</span>
                  </div>
                  <div className="bg-emerald-600 rounded-[1rem] sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center text-center shadow-lg shadow-emerald-600/20 hover:scale-105 transition-transform">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center mb-1.5 sm:mb-2">
                      <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xl sm:text-3xl font-black text-white leading-none mb-1 sm:mb-1.5">{totalConfirmadas}</span>
                    <span className="text-[9px] sm:text-xs font-bold text-emerald-100 leading-tight">Agendadas</span>
                  </div>
                  <div className="bg-amber-500 rounded-[1rem] sm:rounded-2xl p-3 sm:p-5 flex flex-col items-center justify-center text-center shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center mb-1.5 sm:mb-2">
                      <Home className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-xl sm:text-3xl font-black text-white leading-none mb-1 sm:mb-1.5">{totalRealizadas}</span>
                    <span className="text-[9px] sm:text-xs font-bold text-amber-100 leading-tight">Realizadas</span>
                  </div>
                </div>
              </div>

              {/* ── DOIS CARDS PREMIUM DE MODALIDADE ─────────────────────────── */}
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1">Como deseja marcar?</p>

                {/* Card 1 — Marcação Manual */}
                <button
                  onClick={() => { setManualStep(1); setActiveView("manual"); }}
                  className="w-full group relative overflow-hidden rounded-3xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                >
                  {/* Fundo gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
                  {/* Ornamento */}
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-500" />
                  <div className="absolute -right-4 -bottom-6 w-28 h-28 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-500" />

                  <div className="relative flex items-center gap-5 p-6">
                    {/* Ícone */}
                    <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <UserCheck className="w-8 h-8 text-white" />
                    </div>
                    {/* Texto */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-200">Catequista agenda</span>
                        <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Manual</span>
                      </div>
                      <h3 className="text-xl font-black text-white leading-tight">Marcar na Agenda</h3>
                      <p className="text-purple-200 text-xs font-medium mt-1 leading-relaxed">
                        Você escolhe a família, o dia e o horário diretamente
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                  </div>

                  {/* Rodapé do card */}
                  <div className="relative border-t border-white/10 px-6 py-3 flex items-center gap-4">
                    {[
                      { icon: "👶", label: "Escolhe o catequizando" },
                      { icon: "📅", label: "Marca o dia" },
                      { icon: "⏰", label: "Define o horário" },
                    ].map(({ icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="text-sm">{icon}</span>
                        <span className="text-[9px] font-bold text-purple-200 hidden sm:block">{label}</span>
                      </div>
                    ))}
                  </div>
                </button>

                {/* Card 2 — Link para Famílias */}
                <button
                  onClick={() => setActiveView("nova")}
                  className="w-full group relative overflow-hidden rounded-3xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
                  <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-500" />
                  <div className="absolute -right-4 -bottom-6 w-28 h-28 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-500" />

                  <div className="relative flex items-center gap-5 p-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Share2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-200">Família escolhe</span>
                        <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Link</span>
                      </div>
                      <h3 className="text-xl font-black text-white leading-tight">Enviar Link</h3>
                      <p className="text-emerald-200 text-xs font-medium mt-1 leading-relaxed">
                        Configure datas e envie o link para as famílias agendarem
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                  </div>

                  <div className="relative border-t border-white/10 px-6 py-3 flex items-center gap-4">
                    {[
                      { icon: "📆", label: "Configura os dias" },
                      { icon: "🔗", label: "Gera o link" },
                      { icon: "👨‍👩‍👧", label: "Família agenda" },
                    ].map(({ icon, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className="text-sm">{icon}</span>
                        <span className="text-[9px] font-bold text-emerald-200 hidden sm:block">{label}</span>
                      </div>
                    ))}
                  </div>
                </button>
              </div>

              {/* Botões secundários */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => setActiveView("visitas")} className="bg-slate-100 hover:bg-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all text-center border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm">
                    <CalendarDays className="w-5 h-5 text-slate-600" />
                  </div>
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide">Visitas Agendadas</h4>
                </button>
                <button onClick={() => setActiveView("relatorio")} className="bg-amber-50 hover:bg-amber-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all text-center border border-amber-200 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-1">
                    <BarChart3 className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="text-[11px] sm:text-xs font-black text-amber-950 uppercase tracking-wide">Relatórios</h4>
                </button>
              </div>



              {/* Próximas visitas agendadas */}
              <div className="bg-white rounded-[24px] p-4 sm:p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Próximas visitas agendadas</h3>
                  <button onClick={() => { setActiveView("visitas"); setFiltroVisitas("abertas"); }} className="text-xs font-bold text-blue-600 hover:underline">Ver todas</button>
                </div>
                <div className="space-y-3">
                  {agendamentosFiltrados.filter(a => a.status !== "cancelada" && a.status !== "realizada").slice(0, 3).length === 0 ? (
                    <p className="text-xs text-center text-slate-400 py-4">Nenhuma visita agendada no momento.</p>
                  ) : (
                    agendamentosFiltrados
                      .filter(a => a.status !== "cancelada" && a.status !== "realizada")
                      .sort((a, b) => new Date(a.data_visita).getTime() - new Date(b.data_visita).getTime())
                      .slice(0, 3)
                      .map(ag => {
                        const date = new Date(ag.data_visita + "T12:00:00");
                        const dia = date.getDate().toString().padStart(2, '0');
                        const mes = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                        const diaSemana = date.toLocaleString('pt-BR', { weekday: 'long' });
                        return (
                          <div key={ag.id} onClick={() => { setActiveView("visitas"); setFiltroVisitas("abertas"); }} className="flex items-center gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0 p-2 -mx-2 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors group">
                            <div className="w-12 h-14 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center overflow-hidden shrink-0 group-hover:bg-blue-600 group-hover:border-blue-600 transition-colors">
                              <div className="bg-blue-600 group-hover:bg-blue-800 w-full py-0.5 text-center flex items-center justify-center gap-0.5 transition-colors">
                                <span className="w-1 h-1 bg-white/50 rounded-full" />
                                <span className="w-1 h-1 bg-white/50 rounded-full" />
                              </div>
                              <div className="flex-1 flex flex-col items-center justify-center">
                                <span className="text-lg font-black text-blue-900 group-hover:text-white leading-none transition-colors">{dia}</span>
                                <span className="text-[9px] font-bold text-blue-600 group-hover:text-blue-200 transition-colors">{mes}</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">Família {ag.nome_crianca}</p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">{ag.nome_responsavel}{ag.telefone ? ` • ${ag.telefone}` : ''}</p>
                              <p className="text-[10px] text-slate-700 font-medium mt-0.5 capitalize">{diaSemana} • {ag.horario_visita}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {ag.status === "adiada" ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700">Pendente</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">Confirmada</span>
                              )}
                              <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors mt-1" />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Dica */}
              <div className="bg-emerald-50 rounded-2xl p-4 flex gap-4 border border-emerald-100 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 blur-xl" />
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                  <Heart className="w-6 h-6 text-emerald-500 fill-emerald-100" />
                </div>
                <div className="z-10">
                  <h4 className="text-xs font-bold text-emerald-900 mb-1">Dica para a visita</h4>
                  <p className="text-[10px] text-emerald-800/80 font-medium leading-relaxed mb-2">
                    Escute com atenção, leve esperança e reze com a família. Você é sinal do amor de Deus!
                  </p>
                  <p className="text-[9px] font-bold text-emerald-600 italic">"Ide! Eu estarei com vocês." - Mt 28,20</p>
                </div>
              </div>
            </div>
          )}

          {/* ── MARCAÇÃO MANUAL ────────────────────────────────────────────────── */}
          {activeView === "manual" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Back + header */}
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveView("home")} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-tight">Marcar na Agenda</h2>
                  <p className="text-xs text-muted-foreground font-medium">Agendamento direto pelo catequista</p>
                </div>
              </div>

              {/* Steps indicator */}
              <div className="flex items-center gap-2">
                {([1, 2, 3, 4] as const).map((s, i) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all shrink-0",
                      manualStep > s ? "bg-purple-600 border-purple-600 text-white" :
                      manualStep === s ? "bg-white border-purple-600 text-purple-600 shadow-md" :
                      "bg-white border-slate-200 text-slate-400"
                    )}>
                      {manualStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                    {i < 3 && <div className={cn("flex-1 h-0.5 rounded-full", manualStep > s ? "bg-purple-600" : "bg-slate-200")} />}
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-0">
                {["Família", "Data", "Horário", "Confirmar"].map((label, i) => (
                  <span key={label} className={cn("text-[9px] font-black uppercase tracking-widest", manualStep >= i + 1 ? "text-purple-600" : "text-slate-400")}>
                    {label}
                  </span>
                ))}
              </div>

              {/* STEP 1 — Selecionar catequizando */}
              {manualStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm uppercase tracking-widest">Escolha o Catequizando</p>
                        <p className="text-purple-200 text-[10px] font-medium">Selecione quem vai receber a visita</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Busca */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={manualBusca}
                          onChange={e => setManualBusca(e.target.value)}
                          placeholder="Buscar por nome ou responsável..."
                          className="w-full h-12 pl-10 pr-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all text-sm font-medium outline-none"
                        />
                      </div>

                      {/* Lista */}
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {catequizandosFiltrados.length === 0 ? (
                          <div className="text-center py-8 text-slate-400">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs font-bold">Nenhum catequizando encontrado</p>
                          </div>
                        ) : (
                          catequizandosFiltrados.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setManualCatequizando(c); setManualStep(2); }}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all",
                                manualCatequizando?.id === c.id
                                  ? "bg-purple-50 border-purple-400 shadow-md"
                                  : "bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/50"
                              )}
                            >
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shrink-0">
                                {c.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 truncate">{c.nome}</p>
                                {c.responsavel && (
                                  <p className="text-[11px] text-slate-500 font-medium truncate">Resp: {c.responsavel}</p>
                                )}
                                {c.telefone && (
                                  <p className="text-[11px] text-slate-400 font-medium">📞 {c.telefone}</p>
                                )}
                              </div>
                              {manualCatequizando?.id === c.id && (
                                <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 — Escolher Data */}
              {manualStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Resumo família */}
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-white shrink-0">
                      {manualCatequizando?.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-purple-900">{manualCatequizando?.nome}</p>
                      {manualCatequizando?.responsavel && <p className="text-[11px] text-purple-600 font-medium">Resp: {manualCatequizando.responsavel}</p>}
                    </div>
                    <button onClick={() => setManualStep(1)} className="ml-auto text-[10px] font-bold text-purple-500 hover:underline">Trocar</button>
                  </div>

                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm uppercase tracking-widest">Escolha o Dia</p>
                        <p className="text-purple-200 text-[10px] font-medium">Quando será a visita?</p>
                      </div>
                    </div>

                    <div className="p-5 flex justify-center bg-purple-50/30 border-t border-purple-100/50">
                      <CalendarUI
                        mode="single"
                        selected={manualData}
                        locale={ptBR}
                        onSelect={(d) => {
                          setManualData(d);
                          setManualDataStr(d ? toDateStr(d) : "");
                          setManualHorario("");
                          if (d) setManualStep(3);
                        }}
                        disabled={(day) => day < new Date(new Date().setHours(0, 0, 0, 0))}
                        className={cn(
                          "rounded-2xl w-full bg-white p-3 shadow-sm border border-purple-100",
                          "[&_.rdp]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_table]:w-full",
                          "[&_.rdp-cell]:p-1",
                          "[&_.rdp-day_button]:w-full [&_.rdp-day_button]:aspect-square [&_.rdp-day_button]:max-h-14 [&_.rdp-day_button]:text-base [&_.rdp-day_button]:font-bold",
                        )}
                        classNames={{
                          day_selected: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 hover:text-white focus:from-purple-600 focus:to-indigo-700 focus:text-white rounded-2xl font-black shadow-lg shadow-purple-600/30 scale-105 transition-transform",
                          day_disabled: "text-slate-300 opacity-40 font-medium",
                          head_cell: "text-purple-900/60 font-black text-xs uppercase pb-3",
                          day: "text-slate-700 rounded-2xl border-2 border-transparent hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 active:scale-95 transition-all flex items-center justify-center",
                        }}
                      />
                    </div>
                    {manualDataStr && (
                      <div className="px-5 pb-5">
                        <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100 flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-purple-600 shrink-0" />
                          <p className="text-sm font-black text-purple-900 capitalize">{fmtDateFull(manualDataStr)}</p>
                          <CheckCircle2 className="w-4 h-4 text-purple-600 ml-auto shrink-0" />
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setManualStep(1)} className="w-full py-3 rounded-2xl border-2 border-black/10 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all">
                    ← Voltar
                  </button>
                </div>
              )}

              {/* STEP 3 — Escolher Horário */}
              {manualStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Resumo */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs shrink-0">
                        {manualCatequizando?.nome.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs font-black text-purple-900 truncate">{manualCatequizando?.nome}</p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-3 border border-purple-100 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-purple-600 shrink-0" />
                      <p className="text-xs font-black text-purple-900">{fmtDate(manualDataStr)}</p>
                      <button onClick={() => setManualStep(2)} className="ml-auto text-[9px] font-bold text-purple-400 hover:underline shrink-0">Trocar</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm uppercase tracking-widest">Escolha o Horário</p>
                        <p className="text-purple-200 text-[10px] font-medium">Que horas será a visita?</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Botões de horário rápido — grandes */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" /> Horários rápidos
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                          {HORARIOS_RAPIDOS.map(h => {
                            const isSelected = manualHorario === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => { setManualHorario(h); setManualHorarioCustom(""); }}
                                className={cn(
                                  "relative py-4 rounded-2xl font-black text-sm border-2 transition-all duration-200 overflow-hidden flex flex-col items-center gap-1",
                                  isSelected
                                    ? "bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-600/40 scale-105"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md"
                                )}
                              >
                                {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-700" />}
                                <Clock className={cn("w-3.5 h-3.5 relative", isSelected ? "text-white/80" : "text-purple-400")} />
                                <span className="relative">{h}</span>
                                {isSelected && <span className="text-[7px] text-white/70 font-black tracking-widest relative">OK</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Horário personalizado */}
                      <div className="border-t border-black/5 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Ou horário personalizado</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="time"
                              value={manualHorarioCustom}
                              onChange={e => { setManualHorarioCustom(e.target.value); setManualHorario(e.target.value); }}
                              className="w-full h-12 pl-10 pr-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all font-bold text-sm outline-none"
                            />
                          </div>
                          {manualHorarioCustom && (
                            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview seleção */}
                      {manualHorario && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Horário selecionado</p>
                            <p className="text-xl font-black text-purple-900">{manualHorario}</p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-purple-600 ml-auto" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setManualStep(2)} className="flex-1 py-3 rounded-2xl border-2 border-black/10 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all">
                      ← Voltar
                    </button>
                    <button
                      onClick={() => manualHorario && setManualStep(4)}
                      disabled={!manualHorario}
                      className="flex-[2] py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-600/30 hover:scale-[1.01] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      Próximo <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4 — Confirmar */}
              {manualStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5">
                      <p className="text-white font-black text-sm uppercase tracking-widest">Confirmar Visita</p>
                      <p className="text-purple-200 text-[10px] font-medium mt-0.5">Revise os dados e confirme o agendamento</p>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Resumo */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Catequizando</p>
                          <p className="text-sm font-black text-purple-900">{manualCatequizando?.nome}</p>
                          {manualCatequizando?.responsavel && (
                            <p className="text-[10px] text-purple-600 font-medium mt-0.5">Resp: {manualCatequizando.responsavel}</p>
                          )}
                        </div>
                        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Data</p>
                          <p className="text-sm font-black text-purple-900 capitalize">{fmtDate(manualDataStr)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 col-span-2">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Horário</p>
                          <p className="text-3xl font-black text-indigo-900">{manualHorario}</p>
                        </div>
                      </div>

                      {/* Observação */}
                      <div>
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-700 mb-1.5 block flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-purple-400" /> Observação (Opcional)
                        </label>
                        <textarea
                          value={manualObs}
                          onChange={e => setManualObs(e.target.value)}
                          className="w-full min-h-[80px] p-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all font-medium text-sm resize-none outline-none placeholder:text-slate-400"
                          placeholder="Ex: Trazer material de catequese, endereço especial..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setManualStep(3)} className="flex-1 py-3 rounded-2xl border-2 border-black/10 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all">
                      ← Voltar
                    </button>
                    <button
                      onClick={() => {
                        if (!config?.id || !manualCatequizando) { toast.error("Configure o painel de visitas primeiro"); return; }
                        mutationManual.mutate({
                          config_id: config.id,
                          turma_id: selectedTurma,
                          data_visita: manualDataStr,
                          horario_visita: manualHorario,
                          nome_crianca: manualCatequizando.nome,
                          nome_responsavel: manualCatequizando.responsavel || manualCatequizando.nome,
                          telefone: manualCatequizando.telefone || "",
                          observacao: manualObs,
                        });
                      }}
                      disabled={mutationManual.isPending}
                      className="flex-[2] py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/30 hover:scale-[1.01] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {mutationManual.isPending ? <Spinner size="sm" color="white" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirmar Visita
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CONFIGURAR LINK PARA FAMÍLIAS ─────────────────────────────────── */}
          {activeView === "nova" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Back + header */}
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveView("home")} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-tight">Configurar Link</h2>
                  <p className="text-xs text-muted-foreground font-medium">Defina datas e gere o link para as famílias</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                {/* Header card */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-widest">{config ? "Editar Painel" : "Criar Painel"}</p>
                      <p className="text-emerald-200 text-[10px] font-medium">Configure o agendamento das visitas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-2xl border border-white/20">
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Ativo</span>
                    <Switch checked={form.ativo} onCheckedChange={(v) => setForm(prev => ({ ...prev, ativo: v }))} />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Tema */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-800 block">Pauta ou Tema (Opcional)</label>
                    <textarea value={form.tema} onChange={e => setForm(prev => ({ ...prev, tema: e.target.value }))}
                      className="w-full min-h-[80px] p-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-medium text-sm outline-none resize-none placeholder:text-slate-400"
                      placeholder="Qual será o assunto ou a intenção desta visita?" />
                  </div>

                  {/* Validade */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-800 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-emerald-500" /> Validade do Link (Opcional)
                    </label>
                    <input type="date" value={form.data_validade || ""} onChange={e => setForm(prev => ({ ...prev, data_validade: e.target.value || "" }))}
                      className="w-full h-[52px] px-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-semibold text-sm outline-none"
                      min={new Date().toISOString().split("T")[0]} />
                    {form.data_validade && (
                      <p className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                        ⚠️ O link será bloqueado automaticamente após {fmtDate(form.data_validade)}.
                      </p>
                    )}
                  </div>

                  {/* SELETOR DE DATAS PREMIUM */}
                  <div className="border-t border-black/5 pt-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Dias Disponíveis</h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">Clique no calendário para adicionar dias e configure os horários</p>
                    </div>

                    <CalendarioMultiplo
                      diasHorarios={form.dias_horarios || []}
                      onChange={(dias) => setForm(prev => ({ ...prev, dias_horarios: dias }))}
                      visitasPorData={visitasPorData}
                    />
                  </div>

                  {/* SALVAR */}
                  <button onClick={() => { if (!selectedTurma) { toast.error("Selecione uma turma"); return; } mutationSave.mutate(form); }}
                    disabled={mutationSave.isPending}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                    {mutationSave.isPending ? <Spinner size="sm" color="white" /> : <Save className="w-4 h-4" />}
                    {config ? "Salvar Alterações" : "Criar Agenda de Visitas"}
                  </button>

                  {/* Compartilhar Link */}
                  {config?.token && (
                    <button
                      onClick={shareLink}
                      className="w-full py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-500 text-emerald-700 rounded-2xl font-black uppercase tracking-widest text-xs shadow-sm hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      {copied ? "✅ Link Copiado!" : "Compartilhar Link com as Famílias"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── VISITAS CRIADAS ───────────────────────────────────────────────── */}
          {activeView === "visitas" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveView("home")} className="w-10 h-10 rounded-2xl bg-white border-2 border-black/5 flex items-center justify-center hover:bg-muted/20 transition-all shadow-sm">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-tight">Visitas Criadas</h2>
                  <p className="text-xs text-muted-foreground font-medium">Gerencie e registre o diário das visitas</p>
                </div>
              </div>

              {/* Contadores */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Abertas", count: totalConfirmadas, color: "green" },
                  { label: "Adiadas", count: totalAdiadas, color: "amber" },
                  { label: "Realizadas", count: totalRealizadas, color: "indigo" },
                  { label: "Canceladas", count: totalCanceladas, color: "red" },
                ].map(({ label, count, color }) => (
                  <div key={label} className={cn("rounded-2xl p-3 text-center border",
                    color === "green" ? "bg-green-50 border-green-100" :
                    color === "amber" ? "bg-amber-50 border-amber-100" :
                    color === "indigo" ? "bg-indigo-50 border-indigo-100" : "bg-red-50 border-red-100"
                  )}>
                    <p className={cn("text-xl font-black",
                      color === "green" ? "text-green-700" :
                      color === "amber" ? "text-amber-700" :
                      color === "indigo" ? "text-indigo-700" : "text-red-600"
                    )}>{count}</p>
                    <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                {(["abertas", "realizadas", "canceladas", "todas"] as const).map(f => (
                  <button key={f} onClick={() => setFiltroVisitas(f)}
                    className={cn("w-full sm:w-auto px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 flex items-center justify-center",
                      filtroVisitas === f ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-muted-foreground border-black/10 hover:border-indigo-200 hover:bg-indigo-50/50"
                    )}>
                    {f === "abertas" ? "Em Aberto" : f === "todas" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {loadingAgendamentos ? (
                <div className="py-8 flex justify-center"><Spinner size="md" /></div>
              ) : agendamentosFiltrados.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-black/5 shadow-sm space-y-3">
                  <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Nenhuma visita aqui</p>
                  <p className="text-xs text-muted-foreground">Quando as famílias agendarem, aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {datasOrdenadas.map(data => (
                    <div key={data}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-black/5" />
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-full px-4 py-1.5 flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">{fmtDateFull(data)}</span>
                        </div>
                        <div className="h-px flex-1 bg-black/5" />
                      </div>
                      <div className="space-y-2">
                        {agendamentosAgrupados[data]
                          .sort((a, b) => a.horario_visita.localeCompare(b.horario_visita))
                          .map(ag => (
                            <AgendamentoCard
                              key={ag.id}
                              agendamento={ag}
                              diasConfig={form.dias_horarios || []}
                              onCancel={(a) => setCancelModal(a)}
                              onAdiar={(a) => setAdiamentoModal(a)}
                              onDelete={(id) => { if (window.confirm("Remover permanentemente?")) mutationDelete.mutate(id); }}
                              onDiario={(a) => setDiarioModal(a)}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── RELATÓRIO ────────────────────────────────────────────────────── */}
          {activeView === "relatorio" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveView("home")} className="w-10 h-10 rounded-2xl bg-white border-2 border-black/5 flex items-center justify-center hover:bg-muted/20 transition-all shadow-sm">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-tight">Relatório de Visitas</h2>
                  <p className="text-xs text-muted-foreground font-medium">Análise completa das visitas da turma</p>
                </div>
              </div>

              {/* Métricas principais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-xl shadow-indigo-600/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-indigo-200" />
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Taxa de Adesão</p>
                  </div>
                  <p className="text-4xl font-black text-white">{taxaOcupacao}%</p>
                  <p className="text-indigo-200 text-[10px] font-medium mt-1">{totalAll - totalCanceladas} de {totalVagas} vagas preenchidas</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-5 text-white shadow-xl shadow-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-100" />
                    <p className="text-green-100 text-[10px] font-black uppercase tracking-widest">Taxa de Realização</p>
                  </div>
                  <p className="text-4xl font-black text-white">{taxaRealizacao}%</p>
                  <p className="text-green-100 text-[10px] font-medium mt-1">{totalRealizadas} de {totalAll} visitas realizadas</p>
                </div>
              </div>

              {/* Resumo geral */}
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Resumo Geral</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total de Vagas", value: totalVagas, desc: `em ${totalDias} dia(s)` },
                    { label: "Famílias Inscritas", value: totalAll, desc: "agendamentos totais" },
                    { label: "Confirmadas", value: totalConfirmadas, desc: "aguardando visita" },
                    { label: "Realizadas", value: totalRealizadas, desc: "visitas concluídas" },
                    { label: "Adiadas", value: totalAdiadas, desc: "para reagendamento" },
                    { label: "Canceladas", value: totalCanceladas, desc: "não acontecerão" },
                  ].map(({ label, value, desc }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-3 border border-black/5">
                      <p className="text-2xl font-black text-foreground">{value}</p>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
                      <p className="text-[9px] text-muted-foreground font-medium">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dias mais procurados */}
              {diasComMaisVisitas.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest">Dias Mais Agendados</h3>
                  </div>
                  <div className="space-y-3">
                    {diasComMaisVisitas.map(([data, count], i) => {
                      const maxCount = diasComMaisVisitas[0][1];
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={data} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground">{fmtDate(data)}</span>
                            <span className="font-black text-indigo-600">{count} visita{count > 1 ? "s" : ""}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all",
                              i === 0 ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-indigo-300"
                            )} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista de famílias */}
              {familiasMaisAtivas.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-black text-sm uppercase tracking-widest">Famílias Registradas</h3>
                    <span className="ml-auto text-[10px] font-black bg-green-100 text-green-700 rounded-full px-2 py-0.5">{familiasMaisAtivas.length}</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {familiasMaisAtivas.map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-black/5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">
                          {a.nome_crianca?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-foreground truncate">{a.nome_crianca}</p>
                          <p className="text-[10px] text-muted-foreground font-medium truncate">Resp: {a.nome_responsavel} · {fmtDate(a.data_visita)} {a.horario_visita}</p>
                        </div>
                        <StatusBadge status={a.status || "confirmada"} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalAll === 0 && (
                <div className="text-center py-12 bg-white rounded-3xl border border-black/5 shadow-sm space-y-3">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-amber-400" />
                  </div>
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Sem dados ainda</p>
                  <p className="text-xs text-muted-foreground">O relatório será gerado quando as famílias agendarem visitas.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
