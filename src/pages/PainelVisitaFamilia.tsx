import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Clock, Plus, Trash2, Link, Save, CheckCircle2, Copy,
  Heart, Users, Share2, XCircle, CalendarClock,
  ChevronDown, ChevronRight, Ban, CalendarDays, Timer,
  BarChart3, BookOpen, PlusCircle, ArrowRight, Star,
  CheckSquare, FileText, Sparkles, TrendingUp, Activity,
  Info, ChevronLeft
} from "lucide-react";
import {
  fetchTurmas, fetchVisitaConfigByTurma, upsertVisitaConfig,
  fetchAgendamentosByConfig, removeVisitaAgendamento, updateVisitaAgendamento
} from "@/lib/supabaseStore";
import { type Turma, type VisitaFamiliasConfig, type VisitaAgendamento, type VisitaDiaHorarios } from "@/lib/store";
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
          <div className="flex justify-center">
            <CalendarUI
              mode="single"
              selected={selectedDate}
              locale={ptBR}
              onSelect={(d) => { setSelectedDate(d); setNovaData(d ? toDateStr(d) : null); setNovoHorario(null); }}
              disabled={(day) => { const str = toDateStr(day); return !diasStr.includes(str) || str === agendamento.data_visita; }}
              className="rounded-2xl border-2 border-black/5 bg-white shadow-sm"
              classNames={{ day_selected: "bg-amber-500 text-white hover:bg-amber-500 hover:text-white focus:bg-amber-500 focus:text-white" }}
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
        {/* Header */}
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

          {/* Aconteceu? */}
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

          {/* Notas do diário */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Anotações do Catequista (Diário)
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full min-h-[130px] p-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-sm resize-none outline-none placeholder:text-slate-400"
              placeholder="Ex: A família foi muito receptiva. Conversamos sobre a preparação dos sacramentos, o filho está participando bem. Próximos passos: ..."
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
      isCanceled ? "bg-red-50/50 border-red-100" :
      isRealizada ? "bg-indigo-50/50 border-indigo-100" :
      isAdiada ? "bg-amber-50/50 border-amber-100" : "bg-white border-black/5 shadow-sm"
    )}>
      <div className="p-4 flex items-start gap-3">
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

          <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {agendamento.horario_visita}</span>
            {agendamento.telefone && <span>📞 {agendamento.telefone}</span>}
          </div>

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

          {/* Notas diário */}
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

      {/* Ações */}
      <div className={cn("border-t px-4 py-2 flex gap-1.5 flex-wrap justify-end",
        isCanceled ? "border-red-100" : isRealizada ? "border-indigo-100" : "border-black/5"
      )}>
        {!isCanceled && (
          <button onClick={() => onDiario(agendamento)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all">
            <BookOpen className="w-3 h-3" /> {isRealizada ? "Ver Diário" : "Registrar Visita"}
          </button>
        )}
        {!isCanceled && !isAdiada && !isRealizada && (
          <button onClick={() => onAdiar(agendamento)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all">
            <CalendarClock className="w-3 h-3" /> Adiar
          </button>
        )}
        {!isCanceled && !isRealizada && (
          <button onClick={() => onCancel(agendamento)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all">
            <Ban className="w-3 h-3" /> Cancelar
          </button>
        )}
        <button onClick={() => onDelete(agendamento.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-black/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all">
          <Trash2 className="w-3 h-3" /> Excluir
        </button>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function PainelVisitaFamilia() {
  const queryClient = useQueryClient();
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Tela ativa: "home" | "nova" | "visitas" | "relatorio"
  const [activeView, setActiveView] = useState<"home" | "nova" | "visitas" | "relatorio">("home");
  const [filtroVisitas, setFiltroVisitas] = useState<"todas" | "abertas" | "canceladas" | "realizadas">("abertas");

  // Modais
  const [cancelModal, setCancelModal] = useState<VisitaAgendamento | null>(null);
  const [adiamentoModal, setAdiamentoModal] = useState<VisitaAgendamento | null>(null);
  const [diarioModal, setDiarioModal] = useState<VisitaAgendamento | null>(null);

  // Form
  const [form, setForm] = useState<Partial<VisitaFamiliasConfig>>({
    ativo: true, titulo: "Visita às Famílias", tema: "", dias_horarios: [], data_validade: "",
  });

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

  // ── Calendário helpers ────────────────────────────────────────────────────
  const visitasPorData = (agendamentos || []).reduce<Record<string, number>>((acc, a) => {
    if (a.status !== "cancelada") { acc[a.data_visita] = (acc[a.data_visita] || 0) + 1; }
    return acc;
  }, {});

  const handleSelectDates = (dates: Date[] | undefined) => {
    if (!dates) { setForm(prev => ({ ...prev, dias_horarios: [] })); return; }
    setForm(prev => {
      const current = prev.dias_horarios || [];
      const newStr = dates.map(toDateStr);
      const nextDias = current.filter(d => newStr.includes(d.data));
      newStr.forEach(str => { if (!nextDias.find(d => d.data === str)) nextDias.push({ data: str, horarios: [] }); });
      return { ...prev, dias_horarios: nextDias.sort((a, b) => a.data.localeCompare(b.data)) };
    });
  };

  const removeDia = (dataStr: string) => {
    const count = visitasPorData[dataStr] || 0;
    if (count > 0 && !window.confirm(`Há ${count} visita(s) marcada(s) neste dia. Remover mesmo assim?`)) return;
    setForm(prev => ({ ...prev, dias_horarios: (prev.dias_horarios || []).filter(d => d.data !== dataStr) }));
  };

  const addHorario = (dataStr: string, horario: string) => {
    if (!horario.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) { toast.error("Horário inválido. Use HH:MM"); return; }
    setForm(prev => {
      const dias = [...(prev.dias_horarios || [])];
      const idx = dias.findIndex(d => d.data === dataStr);
      if (idx >= 0 && !dias[idx].horarios.includes(horario)) dias[idx].horarios = [...dias[idx].horarios, horario].sort();
      return { ...prev, dias_horarios: dias };
    });
  };

  const removeHorario = (dataStr: string, horario: string) => {
    setForm(prev => {
      const dias = [...(prev.dias_horarios || [])];
      const idx = dias.findIndex(d => d.data === dataStr);
      if (idx >= 0) dias[idx].horarios = dias[idx].horarios.filter(h => h !== horario);
      return { ...prev, dias_horarios: dias };
    });
  };

  const copyLink = () => {
    if (!config?.token) return;
    navigator.clipboard.writeText(`${window.location.origin}/visita-familia/${config.token}`);
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

  // Análise por família (para relatório)
  const familiasMaisAtivas = [...(agendamentos || [])]
    .filter(a => a.status !== "cancelada")
    .sort((a, b) => a.nome_crianca?.localeCompare(b.nome_crianca || "") || 0);

  const diasComMaisVisitas = Object.entries(visitasPorData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loadingTurmas) return <div className="flex justify-center p-8"><Spinner size="md" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modais */}
      {cancelModal && <CancelModal agendamento={cancelModal} onClose={() => setCancelModal(null)} onConfirm={(motivo) => mutationCancel.mutate({ id: cancelModal.id, motivo })} />}
      {adiamentoModal && <AdiamentoModal agendamento={adiamentoModal} diasDisponiveis={form.dias_horarios || []} onClose={() => setAdiamentoModal(null)} onConfirm={(data, horario) => mutationAdiar.mutate({ id: adiamentoModal.id, data, horario })} />}
      {diarioModal && <DiarioModal agendamento={diarioModal} onClose={() => setDiarioModal(null)} onConfirm={(realizada, notas) => mutationDiario.mutate({ id: diarioModal.id, realizada, notas })} />}

      {/* SELETOR DE TURMA */}
      <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm">
        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Selecionar Turma</label>
        <Select value={selectedTurma} onValueChange={(v) => { setSelectedTurma(v); setActiveView("home"); }}>
          <SelectTrigger className="h-[48px] border-2 border-black/10 rounded-2xl bg-muted/20">
            <SelectValue placeholder="Escolha a turma para configurar visitas" />
          </SelectTrigger>
          <SelectContent>
            {turmas?.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome} {t.ano ? `(${t.ano})` : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedTurma && loadingConfig && <div className="flex justify-center p-8"><Spinner size="md" text="Carregando..." /></div>}

      {selectedTurma && !loadingConfig && (
        <>
          {/* ── HOME: 3 CARDS ─────────────────────────────────────────────── */}
          {activeView === "home" && (
            <div className="space-y-4">
              {/* Link rápido se existir */}
              {config && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-5 flex items-center gap-4 shadow-xl shadow-purple-600/20">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Link className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-indigo-200 text-[9px] font-black uppercase tracking-[0.2em]">Link das famílias</p>
                    <p className="text-white font-black text-sm truncate">{config.titulo}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={cn("w-1.5 h-1.5 rounded-full", config.ativo ? "bg-green-400 animate-pulse" : "bg-red-400")} />
                      <span className="text-indigo-200 text-[10px] font-bold">{config.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={copyLink} className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all" title="Copiar link">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4 text-white" />}
                    </button>
                    <button onClick={() => { const url = `${window.location.origin}/visita-familia/${config.token}`; if (navigator.share) navigator.share({ title: config.titulo || "", url }); else copyLink(); }}
                      className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all" title="Compartilhar">
                      <Share2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Cards principais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card: Abrir novas visitas */}
                <button onClick={() => setActiveView("nova")}
                  className="group bg-white rounded-3xl p-6 border-2 border-black/5 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 text-left space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-base leading-tight">Abrir Novas Visitas</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">Configure datas, horários e gere o link para as famílias agendarem</p>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 font-black text-xs uppercase tracking-widest">
                    Configurar <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Card: Visitas criadas */}
                <button onClick={() => setActiveView("visitas")}
                  className="group bg-white rounded-3xl p-6 border-2 border-black/5 shadow-sm hover:shadow-xl hover:border-green-200 hover:-translate-y-1 transition-all duration-300 text-left space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform relative">
                    <Users className="w-7 h-7 text-white" />
                    {totalAll > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] rounded-full bg-white border-2 border-green-500 text-green-700 text-[10px] font-black flex items-center justify-center px-1">
                        {totalAll}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-base leading-tight">Visitas Criadas</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">Gerencie, registre e acompanhe todas as visitas agendadas pelas famílias</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black bg-green-100 text-green-700 rounded-full px-2 py-0.5">{totalConfirmadas} abertas</span>
                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{totalRealizadas} realizadas</span>
                  </div>
                </button>

                {/* Card: Relatório */}
                <button onClick={() => setActiveView("relatorio")}
                  className="group bg-white rounded-3xl p-6 border-2 border-black/5 shadow-sm hover:shadow-xl hover:border-amber-200 hover:-translate-y-1 transition-all duration-300 text-left space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-base leading-tight">Relatório de Visitas</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">Análise completa: adesão das famílias, dias mais agendados e progresso</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600 font-black text-xs uppercase tracking-widest">
                    Ver análise <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── NOVA VISITA ───────────────────────────────────────────────── */}
          {activeView === "nova" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Back + header */}
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveView("home")} className="w-10 h-10 rounded-2xl bg-white border-2 border-black/5 flex items-center justify-center hover:bg-muted/20 transition-all shadow-sm">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-tight">Configurar Visitas</h2>
                  <p className="text-xs text-muted-foreground font-medium">Defina datas e gere o link para as famílias</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                {/* Header card */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-widest">{config ? "Editar Painel" : "Criar Painel"}</p>
                      <p className="text-indigo-200 text-[10px] font-medium">Configure o agendamento das visitas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-2xl border border-white/20">
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Ativo</span>
                    <Switch checked={form.ativo} onCheckedChange={(v) => setForm(prev => ({ ...prev, ativo: v }))} />
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Título */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-800 block">Título do Painel</label>
                    <input type="text" value={form.titulo} onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                      className="w-full h-[52px] px-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold text-sm outline-none"
                      placeholder="Ex: Visitas de Agosto" />
                  </div>

                  {/* Tema */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-800 block">Pauta ou Tema (Opcional)</label>
                    <textarea value={form.tema} onChange={e => setForm(prev => ({ ...prev, tema: e.target.value }))}
                      className="w-full min-h-[80px] p-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-sm outline-none resize-none placeholder:text-slate-400"
                      placeholder="Qual será o assunto ou a intenção desta visita?" />
                  </div>

                  {/* Validade */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-800 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-indigo-500" /> Validade do Link (Opcional)
                    </label>
                    <input type="date" value={form.data_validade || ""} onChange={e => setForm(prev => ({ ...prev, data_validade: e.target.value || "" }))}
                      className="w-full h-[52px] px-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold text-sm outline-none"
                      min={new Date().toISOString().split("T")[0]} />
                    {form.data_validade && (
                      <p className="text-[10px] font-bold text-amber-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
                        ⚠️ O link será bloqueado automaticamente após {fmtDate(form.data_validade)}.
                      </p>
                    )}
                  </div>

                  {/* CALENDÁRIO */}
                  <div className="border-t border-black/5 pt-5 space-y-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Dias Disponíveis</h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">Clique para selecionar/desmarcar dias</p>
                    </div>

                    {agendamentos && agendamentos.length > 0 && (
                      <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-muted-foreground"><span className="w-3 h-3 rounded-full bg-primary/70 inline-block" /> Selecionado</span>
                        <span className="flex items-center gap-1 text-green-700"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Com visitas</span>
                        <span className="flex items-center gap-1 text-red-600"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Lotado</span>
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-3xl p-4 border border-black/5 flex justify-center">
                      <CalendarUI
                        mode="multiple"
                        selected={form.dias_horarios?.map(d => new Date(d.data + "T12:00:00")) || []}
                        onSelect={handleSelectDates}
                        locale={ptBR}
                        className="bg-white rounded-2xl border-2 border-black/5 shadow-sm p-3"
                        classNames={{ day_selected: "bg-indigo-600 text-white hover:bg-indigo-600 hover:text-white focus:bg-indigo-600 focus:text-white" }}
                        components={{
                          DayContent: ({ date }) => {
                            const str = toDateStr(date);
                            const count = visitasPorData[str] || 0;
                            const diaConfig = form.dias_horarios?.find(d => d.data === str);
                            const totalVagas = diaConfig?.horarios.length || 0;
                            const isLotado = totalVagas > 0 && count >= totalVagas;
                            return (
                              <div className="relative flex items-center justify-center w-full h-full">
                                <span>{date.getDate()}</span>
                                {count > 0 && (
                                  <span className={cn("absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-black flex items-center justify-center px-0.5",
                                    isLotado ? "bg-red-500 text-white" : "bg-green-500 text-white"
                                  )}>{count}</span>
                                )}
                              </div>
                            );
                          },
                        }}
                      />
                    </div>

                    {(!form.dias_horarios || form.dias_horarios.length === 0) && (
                      <div className="text-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-black/10">
                        <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum dia configurado</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Clique nos dias no calendário acima</p>
                      </div>
                    )}

                    {/* Lista de dias com horários */}
                    <div className="space-y-3">
                      {form.dias_horarios?.map(dia => {
                        const countVisitas = visitasPorData[dia.data] || 0;
                        const isLotado = dia.horarios.length > 0 && countVisitas >= dia.horarios.length;
                        return (
                          <div key={dia.data} className="p-4 rounded-2xl border-2 border-black/5 bg-white space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isLotado ? "bg-red-100" : countVisitas > 0 ? "bg-green-100" : "bg-indigo-100")}>
                                  <CalendarDays className={cn("w-4 h-4", isLotado ? "text-red-500" : countVisitas > 0 ? "text-green-600" : "text-indigo-600")} />
                                </div>
                                <div>
                                  <p className="text-sm font-black">{fmtDate(dia.data)}</p>
                                  {countVisitas > 0 && (
                                    <p className={cn("text-[10px] font-bold", isLotado ? "text-red-500" : "text-green-600")}>
                                      {countVisitas} marcada{countVisitas > 1 ? "s" : ""}
                                      {isLotado ? " • Lotado!" : ` • ${dia.horarios.length - countVisitas} livre${dia.horarios.length - countVisitas > 1 ? "s" : ""}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button onClick={() => removeDia(dia.data)} className="w-7 h-7 rounded-lg bg-muted/30 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-muted-foreground transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {dia.horarios.map(h => {
                                const temVisita = (agendamentos || []).some(a => a.data_visita === dia.data && a.horario_visita === h && a.status !== "cancelada");
                                return (
                                  <div key={h} className={cn("px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border", temVisita ? "bg-green-50 border-green-200 text-green-800" : "bg-muted border-black/5 text-muted-foreground")}>
                                    <Clock className="w-3 h-3" /> {h}
                                    {temVisita && <span className="text-[8px] bg-green-200 text-green-800 rounded px-1 font-black">OCUP.</span>}
                                    <button onClick={() => removeHorario(dia.data, h)} className="text-muted-foreground hover:text-destructive ml-0.5">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              })}
                              <div className="flex items-center gap-1">
                                <input type="time" id={`time-${dia.data}`}
                                  className="bg-transparent border-2 border-black/10 rounded-xl px-2 py-1 text-xs font-bold h-8 focus:border-indigo-400 outline-none" />
                                <button onClick={() => { const input = document.getElementById(`time-${dia.data}`) as HTMLInputElement; if (input.value) { addHorario(dia.data, input.value); input.value = ""; } }}
                                  className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SALVAR */}
                  <button onClick={() => { if (!selectedTurma) { toast.error("Selecione uma turma"); return; } mutationSave.mutate(form); }}
                    disabled={mutationSave.isPending}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                    {mutationSave.isPending ? <Spinner size="sm" color="white" /> : <Save className="w-4 h-4" />}
                    {config ? "Salvar Alterações" : "Criar Agenda de Visitas"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── VISITAS CRIADAS ───────────────────────────────────────────── */}
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
              <div className="flex gap-2 flex-wrap">
                {(["abertas", "realizadas", "canceladas", "todas"] as const).map(f => (
                  <button key={f} onClick={() => setFiltroVisitas(f)}
                    className={cn("px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2",
                      filtroVisitas === f ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-muted-foreground border-black/10 hover:border-indigo-200"
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

          {/* ── RELATÓRIO ────────────────────────────────────────────────── */}
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
