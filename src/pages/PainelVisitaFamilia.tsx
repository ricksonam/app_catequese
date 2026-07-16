import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Clock, Plus, Trash2, Link, Save, CheckCircle2, Copy,
  Heart, Users, Share2, AlertTriangle, XCircle, CalendarClock,
  ChevronDown, ChevronRight, Ban, CalendarDays, Info, Timer
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

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(str: string) {
  return new Date(str + "T12:00:00").toLocaleDateString("pt-BR");
}
function fmtDateShort(str: string) {
  return new Date(str + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────
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
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border border-green-200">
      <CheckCircle2 className="w-3 h-3" /> Confirmada
    </span>
  );
}

// ─── Modal de Cancelamento ───────────────────────────────────────────────
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

        <div className="bg-muted/20 rounded-2xl p-3 border border-black/5 text-xs font-bold text-muted-foreground">
          📅 {fmtDate(agendamento.data_visita)} às {agendamento.horario_visita}
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-1.5 block">Motivo do cancelamento *</label>
          <textarea
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full min-h-[100px] p-4 rounded-xl border-2 border-black/10 bg-muted/20 focus:border-destructive focus:ring-0 transition-all font-medium text-sm resize-none"
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

// ─── Modal de Adiamento ──────────────────────────────────────────────────
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
            <h3 className="font-black text-base text-foreground">Adiar Visita</h3>
            <p className="text-xs text-muted-foreground font-medium">Família de <span className="text-foreground font-bold">{agendamento.nome_crianca}</span></p>
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
              onSelect={(d) => {
                setSelectedDate(d);
                setNovaData(d ? toDateStr(d) : null);
                setNovoHorario(null);
              }}
              disabled={(day) => {
                const str = toDateStr(day);
                return !diasStr.includes(str) || str === agendamento.data_visita;
              }}
              className="rounded-2xl border-2 border-black/5 bg-white shadow-sm"
              classNames={{
                day_selected: "bg-amber-500 text-white hover:bg-amber-500 hover:text-white focus:bg-amber-500 focus:text-white",
              }}
            />
          </div>
        </div>

        {novaData && horariosNovaData.length > 0 && (
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-2">Escolha o novo horário</p>
            <div className="grid grid-cols-3 gap-2">
              {horariosNovaData.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setNovoHorario(h)}
                  className={cn(
                    "py-2.5 rounded-xl font-black text-sm border-2 transition-all",
                    novoHorario === h
                      ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-white border-black/10 text-muted-foreground hover:border-amber-300 hover:text-amber-600"
                  )}
                >
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
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border-2 border-black/10 font-black text-xs uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all">
            Voltar
          </button>
          <button
            onClick={() => novaData && novoHorario && onConfirm(novaData, novoHorario)}
            disabled={!novaData || !novoHorario}
            className="flex-[2] py-3 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-40"
          >
            Confirmar Adiamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de Agendamento ─────────────────────────────────────────────────
function AgendamentoCard({
  agendamento, diasConfig,
  onCancel, onAdiar, onDelete
}: {
  agendamento: VisitaAgendamento;
  diasConfig: VisitaDiaHorarios[];
  onCancel: (a: VisitaAgendamento) => void;
  onAdiar: (a: VisitaAgendamento) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isCanceled = agendamento.status === "cancelada";
  const isAdiada = agendamento.status === "adiada";

  return (
    <div className={cn(
      "rounded-2xl border-2 transition-all duration-200",
      isCanceled ? "bg-red-50/50 border-red-100" : isAdiada ? "bg-amber-50/50 border-amber-100" : "bg-white border-black/5"
    )}>
      <div className="p-4 flex items-start gap-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-xs",
          isCanceled ? "bg-red-100 text-red-500" : isAdiada ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
        )}>
          {agendamento.nome_crianca?.charAt(0)?.toUpperCase() || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn("text-sm font-black", isCanceled && "line-through text-muted-foreground")}>{agendamento.nome_crianca}</p>
              <p className="text-xs font-medium text-muted-foreground truncate">Resp: {agendamento.nome_responsavel}</p>
            </div>
            <StatusBadge status={agendamento.status || "confirmada"} />
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

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {agendamento.telefone && (
              <span className="text-[10px] font-bold text-muted-foreground">📞 {agendamento.telefone}</span>
            )}
          </div>

          {agendamento.observacao && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Observação
            </button>
          )}
          {expanded && agendamento.observacao && (
            <p className="mt-1 text-[10px] text-muted-foreground italic bg-muted/20 rounded-lg px-2 py-1.5">"{agendamento.observacao}"</p>
          )}
        </div>
      </div>

      {/* Ações */}
      {!isCanceled && (
        <div className="border-t border-black/5 px-4 py-2 flex gap-2 justify-end">
          {!isAdiada && (
            <button
              onClick={() => onAdiar(agendamento)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
            >
              <CalendarClock className="w-3 h-3" /> Adiar
            </button>
          )}
          <button
            onClick={() => onCancel(agendamento)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
          >
            <Ban className="w-3 h-3" /> Cancelar
          </button>
          <button
            onClick={() => onDelete(agendamento.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-black/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all"
          >
            <Trash2 className="w-3 h-3" /> Excluir
          </button>
        </div>
      )}
      {isCanceled && (
        <div className="border-t border-red-100 px-4 py-2 flex gap-2 justify-end">
          <button
            onClick={() => onDelete(agendamento.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-black/5 hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <Trash2 className="w-3 h-3" /> Remover
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────
export function PainelVisitaFamilia() {
  const queryClient = useQueryClient();
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Modais
  const [cancelModal, setCancelModal] = useState<VisitaAgendamento | null>(null);
  const [adiamentoModal, setAdiamentoModal] = useState<VisitaAgendamento | null>(null);

  // Form
  const [form, setForm] = useState<Partial<VisitaFamiliasConfig>>({
    ativo: true,
    titulo: "Visita às Famílias",
    tema: "",
    dias_horarios: [],
    data_validade: "",
  });

  // Fetch turmas
  const { data: turmas, isLoading: loadingTurmas } = useQuery({
    queryKey: ["turmas"],
    queryFn: () => fetchTurmas(),
  });

  useEffect(() => {
    if (turmas && turmas.length === 1 && !selectedTurma) {
      setSelectedTurma(turmas[0].id);
    }
  }, [turmas, selectedTurma]);

  // Fetch config
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["visita_config", selectedTurma],
    queryFn: () => fetchVisitaConfigByTurma(selectedTurma),
    enabled: !!selectedTurma,
  });

  // Fetch agendamentos
  const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["visita_agendamentos", config?.id],
    queryFn: () => fetchAgendamentosByConfig(config!.id),
    enabled: !!config?.id,
  });

  useEffect(() => {
    if (config) {
      setForm({
        ativo: config.ativo,
        titulo: config.titulo || "Visita às Famílias",
        tema: config.tema || "",
        dias_horarios: config.dias_horarios || [],
        data_validade: config.data_validade || "",
      });
    } else {
      setForm({ ativo: true, titulo: "Visita às Famílias", tema: "", dias_horarios: [], data_validade: "" });
    }
  }, [config, selectedTurma]);

  // Mutation: salvar config
  const mutationSave = useMutation({
    mutationFn: async (payload: Partial<VisitaFamiliasConfig>) =>
      upsertVisitaConfig({ ...payload, turma_id: selectedTurma }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visita_config", selectedTurma] });
      toast.success("Painel de visitas atualizado com sucesso!");
    },
    onError: (error: any) => toast.error(error.message || "Erro ao salvar painel"),
  });

  // Mutation: cancelar
  const mutationCancel = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      updateVisitaAgendamento(id, { status: "cancelada", motivo_cancelamento: motivo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] });
      toast.success("Visita cancelada.");
      setCancelModal(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao cancelar"),
  });

  // Mutation: adiar
  const mutationAdiar = useMutation({
    mutationFn: ({ id, data, horario }: { id: string; data: string; horario: string }) =>
      updateVisitaAgendamento(id, {
        status: "adiada",
        data_reagendada: data,
        horario_reagendado: horario,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] });
      toast.success("Visita adiada com sucesso!");
      setAdiamentoModal(null);
    },
    onError: (e: any) => toast.error(e.message || "Erro ao adiar"),
  });

  // Mutation: excluir
  const mutationDelete = useMutation({
    mutationFn: (id: string) => removeVisitaAgendamento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] });
      toast.success("Agendamento removido.");
    },
  });

  // ── Calendário ───────────────────────────────────────────────────────
  // Calcular visitas por data para mostrar no calendário
  const visitasPorData = (agendamentos || []).reduce<Record<string, number>>((acc, a) => {
    if (a.status !== "cancelada") {
      acc[a.data_visita] = (acc[a.data_visita] || 0) + 1;
    }
    return acc;
  }, {});

  const handleSelectDates = (dates: Date[] | undefined) => {
    if (!dates) { setForm(prev => ({ ...prev, dias_horarios: [] })); return; }
    setForm(prev => {
      const current = prev.dias_horarios || [];
      const newStr = dates.map(toDateStr);
      const nextDias = current.filter(d => newStr.includes(d.data));
      newStr.forEach(str => {
        if (!nextDias.find(d => d.data === str)) {
          nextDias.push({ data: str, horarios: [] });
        }
      });
      return { ...prev, dias_horarios: nextDias.sort((a, b) => a.data.localeCompare(b.data)) };
    });
  };

  const removeDia = (dataStr: string) => {
    const count = visitasPorData[dataStr] || 0;
    if (count > 0) {
      const ok = window.confirm(
        `Atenção: há ${count} visita(s) confirmada(s) neste dia.\nDeseja remover o dia mesmo assim?\n\nOs agendamentos existentes NÃO serão excluídos automaticamente — gerencie-os na lista de visitas.`
      );
      if (!ok) return;
    }
    setForm(prev => ({ ...prev, dias_horarios: (prev.dias_horarios || []).filter(d => d.data !== dataStr) }));
  };

  const addHorario = (dataStr: string, horario: string) => {
    if (!horario || !horario.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      toast.error("Horário inválido. Use HH:MM"); return;
    }
    setForm(prev => {
      const dias = [...(prev.dias_horarios || [])];
      const diaIdx = dias.findIndex(d => d.data === dataStr);
      if (diaIdx >= 0 && !dias[diaIdx].horarios.includes(horario)) {
        dias[diaIdx].horarios = [...dias[diaIdx].horarios, horario].sort();
      }
      return { ...prev, dias_horarios: dias };
    });
  };

  const removeHorario = (dataStr: string, horario: string) => {
    setForm(prev => {
      const dias = [...(prev.dias_horarios || [])];
      const diaIdx = dias.findIndex(d => d.data === dataStr);
      if (diaIdx >= 0) dias[diaIdx].horarios = dias[diaIdx].horarios.filter(h => h !== horario);
      return { ...prev, dias_horarios: dias };
    });
  };

  const copyLink = () => {
    if (!config?.token) return;
    const link = `${window.location.origin}/visita-familia/${config.token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Agrupar agendamentos por data
  const agendamentosAgrupados = (agendamentos || []).reduce<Record<string, VisitaAgendamento[]>>((acc, a) => {
    const chave = a.data_visita;
    if (!acc[chave]) acc[chave] = [];
    acc[chave].push(a);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(agendamentosAgrupados).sort();

  // Contadores
  const totalConfirmadas = (agendamentos || []).filter(a => !a.status || a.status === "confirmada").length;
  const totalAdiadas = (agendamentos || []).filter(a => a.status === "adiada").length;
  const totalCanceladas = (agendamentos || []).filter(a => a.status === "cancelada").length;

  if (loadingTurmas) return <div className="flex justify-center p-8"><Spinner size="md" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Modais */}
      {cancelModal && (
        <CancelModal
          agendamento={cancelModal}
          onClose={() => setCancelModal(null)}
          onConfirm={(motivo) => mutationCancel.mutate({ id: cancelModal.id, motivo })}
        />
      )}
      {adiamentoModal && (
        <AdiamentoModal
          agendamento={adiamentoModal}
          diasDisponiveis={form.dias_horarios || []}
          onClose={() => setAdiamentoModal(null)}
          onConfirm={(data, horario) => mutationAdiar.mutate({ id: adiamentoModal.id, data, horario })}
        />
      )}

      {/* SELETOR DE TURMA */}
      <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm">
        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
          Selecionar Turma
        </label>
        <Select value={selectedTurma} onValueChange={setSelectedTurma}>
          <SelectTrigger className="h-[48px] border-2 border-black/10 rounded-2xl bg-muted/20">
            <SelectValue placeholder="Escolha a turma para configurar visitas" />
          </SelectTrigger>
          <SelectContent>
            {turmas?.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.nome} {t.ano ? `(${t.ano})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTurma && loadingConfig && (
        <div className="flex justify-center p-8"><Spinner size="md" text="Carregando configuração..." /></div>
      )}

      {selectedTurma && !loadingConfig && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── COLUNA ESQUERDA: Configuração ─── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-lg text-foreground">Configurar Painel</h3>
                    <p className="text-xs text-muted-foreground font-medium">Defina como os pais verão as opções de agendamento</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-muted/30 px-4 py-2 rounded-2xl border border-black/5">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Link Ativo</span>
                  <Switch
                    checked={form.ativo}
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, ativo: v }))}
                  />
                </div>
              </div>

              {/* Campos de texto */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-1 block ml-1">Título do Painel</label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                    className="form-input bg-muted/20 border-2"
                    placeholder="Ex: Visitas de Agosto"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-1 block ml-1">Pauta ou Tema (Opcional)</label>
                  <textarea
                    value={form.tema}
                    onChange={(e) => setForm(prev => ({ ...prev, tema: e.target.value }))}
                    className="form-input bg-muted/20 border-2 min-h-[80px] resize-none"
                    placeholder="Qual será o assunto ou a intenção desta visita?"
                  />
                </div>

                {/* Validade */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-1 block ml-1 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Data de Validade do Link (Opcional)
                  </label>
                  <input
                    type="date"
                    value={form.data_validade || ""}
                    onChange={(e) => setForm(prev => ({ ...prev, data_validade: e.target.value || "" }))}
                    className="form-input bg-muted/20 border-2"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {form.data_validade && (
                    <p className="text-[10px] font-bold text-muted-foreground mt-1 ml-1">
                      ⚠️ O link para os pais será bloqueado automaticamente após {fmtDate(form.data_validade)}.
                    </p>
                  )}
                </div>
              </div>

              {/* DIAS E HORÁRIOS */}
              <div className="pt-4 border-t border-black/5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Dias Disponíveis</h4>
                    <p className="text-xs text-muted-foreground font-medium">Clique para selecionar/desmarcar dias no calendário</p>
                  </div>
                </div>

                {/* Legendas do calendário */}
                {agendamentos && agendamentos.length > 0 && (
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-muted-foreground"><span className="w-3 h-3 rounded-full bg-primary/70 inline-block" /> Dia selecionado</span>
                    <span className="flex items-center gap-1 text-green-700"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Com visitas marcadas</span>
                    <span className="flex items-center gap-1 text-red-600"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Lotado</span>
                  </div>
                )}

                {/* Calendário com badges de visitas */}
                <div className="bg-muted/10 rounded-3xl p-4 border border-black/5">
                  <div className="relative flex justify-center">
                    <CalendarUI
                      mode="multiple"
                      selected={form.dias_horarios?.map(d => new Date(d.data + "T12:00:00")) || []}
                      onSelect={handleSelectDates}
                      locale={ptBR}
                      className="bg-white rounded-2xl border-2 border-black/5 shadow-sm p-3"
                      classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      }}
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
                                <span className={cn(
                                  "absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full text-[8px] font-black flex items-center justify-center px-0.5 leading-none",
                                  isLotado ? "bg-red-500 text-white" : "bg-green-500 text-white"
                                )}>
                                  {count}
                                </span>
                              )}
                            </div>
                          );
                        },
                      }}
                    />
                  </div>
                </div>

                {(!form.dias_horarios || form.dias_horarios.length === 0) && (
                  <div className="text-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-black/10">
                    <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum dia configurado</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Clique nos dias no calendário acima para adicionar</p>
                  </div>
                )}

                {/* Lista de dias com horários */}
                <div className="space-y-3">
                  {form.dias_horarios?.map((dia) => {
                    const countVisitas = visitasPorData[dia.data] || 0;
                    const isLotado = dia.horarios.length > 0 && countVisitas >= dia.horarios.length;
                    return (
                      <div key={dia.data} className="p-4 rounded-2xl border-2 border-black/5 bg-white space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              isLotado ? "bg-red-100" : countVisitas > 0 ? "bg-green-100" : "bg-primary/10"
                            )}>
                              <CalendarDays className={cn("w-4 h-4", isLotado ? "text-red-500" : countVisitas > 0 ? "text-green-600" : "text-primary")} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-foreground">{fmtDate(dia.data)}</p>
                              {countVisitas > 0 && (
                                <p className={cn("text-[10px] font-bold", isLotado ? "text-red-500" : "text-green-600")}>
                                  {countVisitas} visita{countVisitas > 1 ? "s" : ""} marcada{countVisitas > 1 ? "s" : ""}
                                  {isLotado ? " • Lotado!" : ` • ${dia.horarios.length - countVisitas} vaga${dia.horarios.length - countVisitas > 1 ? "s" : ""} livre${dia.horarios.length - countVisitas > 1 ? "s" : ""}`}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeDia(dia.data)}
                            className="text-muted-foreground hover:text-destructive transition-colors bg-muted/30 hover:bg-destructive/10 w-7 h-7 rounded-lg flex items-center justify-center"
                            title="Remover dia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {dia.horarios.map(h => {
                            const temVisita = (agendamentos || []).some(
                              a => a.data_visita === dia.data && a.horario_visita === h && a.status !== "cancelada"
                            );
                            return (
                              <div key={h} className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border",
                                temVisita ? "bg-green-50 border-green-200 text-green-800" : "bg-muted border-black/5 text-muted-foreground"
                              )}>
                                <Clock className="w-3 h-3" />
                                {h}
                                {temVisita && <span className="text-[8px] bg-green-200 text-green-800 rounded px-1 font-black">OCUPADO</span>}
                                <button onClick={() => removeHorario(dia.data, h)} className="text-muted-foreground hover:text-destructive ml-1">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}

                          {/* Adicionar horário */}
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              id={`time-${dia.data}`}
                              className="bg-transparent border-2 border-black/10 rounded-xl px-2 py-1 text-xs font-bold h-8"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`time-${dia.data}`) as HTMLInputElement;
                                if (input.value) { addHorario(dia.data, input.value); input.value = ""; }
                              }}
                              className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                            >
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
              <button
                onClick={() => {
                  if (!selectedTurma) { toast.error("Selecione uma turma primeiro"); return; }
                  mutationSave.mutate(form);
                }}
                disabled={mutationSave.isPending}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                {mutationSave.isPending ? <Spinner size="sm" color="white" /> : <Save className="w-4 h-4" />}
                {config ? "Salvar Alterações" : "Criar Agenda de Visitas"}
              </button>
            </div>
          </div>

          {/* ─── COLUNA DIREITA ─── */}
          <div className="space-y-6">

            {/* CARD LINK */}
            {config && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-xl shadow-purple-500/20 text-white space-y-4">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs text-white/80">
                  <Link className="w-4 h-4" /> Link para os Pais
                </div>
                <p className="text-xs text-white/90 font-medium leading-relaxed">
                  Envie no grupo do WhatsApp. Os pais escolhem o horário disponível.
                </p>
                {config.data_validade && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 text-[10px] font-bold text-white/90">
                    <Timer className="w-3 h-3" />
                    Válido até {fmtDate(config.data_validade)}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={copyLink}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/visita-familia/${config.token}`;
                      if (navigator.share) {
                        navigator.share({ title: config.titulo || "Agendamento de Visita", text: "Agende sua visita!", url });
                      } else { copyLink(); }
                    }}
                    className="flex-[2] py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:scale-[1.02]"
                  >
                    <Share2 className="w-4 h-4" /> Compartilhar
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE VISITAS CONFIRMADAS */}
            {config && (
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-black uppercase tracking-tight">
                    <Users className="w-5 h-5 text-primary" /> Visitas
                  </div>
                </div>

                {/* Contadores */}
                {agendamentos && agendamentos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 rounded-2xl p-3 text-center border border-green-100">
                      <p className="text-lg font-black text-green-700">{totalConfirmadas}</p>
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Confirmadas</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-100">
                      <p className="text-lg font-black text-amber-700">{totalAdiadas}</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Adiadas</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-3 text-center border border-red-100">
                      <p className="text-lg font-black text-red-600">{totalCanceladas}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Canceladas</p>
                    </div>
                  </div>
                )}

                {loadingAgendamentos ? (
                  <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                ) : !agendamentos || agendamentos.length === 0 ? (
                  <div className="text-center py-8 bg-muted/20 rounded-2xl border border-black/5 space-y-2">
                    <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum agendamento ainda</p>
                    <p className="text-[10px] text-muted-foreground">As famílias aparecerão aqui após confirmarem</p>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                    {datasOrdenadas.map(data => (
                      <div key={data}>
                        <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white py-1 z-10">
                          <div className="h-px flex-1 bg-black/5" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-1 rounded-full border border-black/5">
                            📅 {fmtDate(data)}
                          </span>
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
                                onDelete={(id) => {
                                  if (window.confirm("Deseja remover permanentemente este agendamento?")) {
                                    mutationDelete.mutate(id);
                                  }
                                }}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
