import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicVisitaConfig, publicAgendarVisita } from "@/lib/supabaseStore";
import { Clock, CheckCircle2, AlertCircle, Heart,
  Phone, User, MessageSquare, CalendarCheck
} from "lucide-react";
import { mascaraTelefone, cn } from "@/lib/utils";
import { toast } from "sonner";
import Spinner from "@/components/ui/spinner";

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDateFull(str: string) {
  const d = new Date(str + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}
function fmtDateShort(str: string) {
  return new Date(str + "T12:00:00").toLocaleDateString("pt-BR");
}

// ── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300",
      done ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" :
      active ? "bg-white border-2 border-indigo-600 text-indigo-600 shadow-md" :
               "bg-white/40 border-2 border-white/50 text-white/60"
    )}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : step}
    </div>
  );
}

// ── Field Input ─────────────────────────────────────────────────────────────
function FieldInput({ label, value, onChange, placeholder, type = "text", icon: Icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-black text-zinc-700 uppercase tracking-widest block flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />} {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[52px] px-4 rounded-2xl border-2 border-slate-200 bg-white focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold text-sm text-zinc-800 placeholder:text-zinc-400 outline-none"
      />
    </div>
  );
}

// ── Tela de Sucesso ─────────────────────────────────────────────────────────
function SuccessScreen({ nomeCrianca, selectedData, selectedHorario }: {
  nomeCrianca: string;
  selectedData: string;
  selectedHorario: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 text-center animate-in zoom-in-95 duration-500">

        {/* Ícone animado */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-white/30 animate-pulse" />
          <div className="relative w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle2 className="w-16 h-16 text-indigo-600" strokeWidth={2} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-white/70 text-sm font-bold uppercase tracking-[0.3em]">Visita Agendada!</p>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            Tudo Certo! 🎉
          </h1>
          <p className="text-white/80 font-medium text-sm leading-relaxed">
            A visita do catequista à família de <span className="text-white font-black">{nomeCrianca}</span> está confirmada.
          </p>
        </div>

        {/* Card de data */}
        <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-5 border border-white/20 space-y-1">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Data e Horário</p>
          <p className="text-white font-black text-xl">
            {fmtDateShort(selectedData)}
          </p>
          <p className="text-indigo-200 font-black text-3xl">
            {selectedHorario}
          </p>
        </div>

        <p className="text-white/60 text-xs font-semibold leading-relaxed px-4">
          ✝️ O catequista recebeu a confirmação. Que Deus abençoe sua família!
        </p>
      </div>
    </div>
  );
}

// ── Componente Principal ────────────────────────────────────────────────────
export default function PublicAgendaVisita() {
  const { token } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);

  const [form, setForm] = useState({ nome_responsavel: "", nome_crianca: "", telefone: "", observacao: "" });
  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const { data: config, isLoading, error } = useQuery({
    queryKey: ["public_visita", token],
    queryFn: () => fetchPublicVisitaConfig(token || ""),
    enabled: !!token,
  });

  // Avança step automaticamente
  useEffect(() => {
    if (selectedHorario && currentStep < 2) setCurrentStep(2);
  }, [selectedHorario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedData || !selectedHorario) { toast.error("Por favor, selecione um dia e horário."); return; }
    if (!form.nome_responsavel || !form.nome_crianca || !form.telefone) {
      toast.error("Preencha todos os campos obrigatórios."); return;
    }
    setIsSubmitting(true);
    try {
      await publicAgendarVisita({
        config_id: config.id,
        data_visita: selectedData,
        horario_visita: selectedHorario,
        nome_responsavel: form.nome_responsavel,
        nome_crianca: form.nome_crianca,
        telefone: form.telefone,
        observacao: form.observacao,
      });
      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar visita. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size="lg" color="white" />
        <p className="text-white/80 font-bold text-sm animate-pulse">Carregando agenda...</p>
      </div>
    </div>
  );

  // ── Erro / Inativo ─────────────────────────────────────────────────────
  if (error || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Link Inválido</h1>
        <p className="text-slate-400 mt-3 max-w-xs text-sm font-medium">Este link de agendamento não existe ou foi removido.</p>
      </div>
    );
  }

  if (!config.ativo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6 text-center">
          <div className="w-28 h-28 bg-slate-600/50 rounded-full flex items-center justify-center mx-auto border-2 border-slate-500/30">
            <Clock className="h-14 w-14 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Agendamento Encerrado</h1>
            <p className="text-slate-400 font-medium mt-3 text-sm">As inscrições para estas visitas foram encerradas pelo catequista.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Validade expirada ──────────────────────────────────────────────────
  if (config.data_validade) {
    const hoje = new Date().toISOString().split("T")[0];
    if (config.data_validade < hoje) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-6">
          <div className="max-w-sm w-full space-y-6 text-center">
            <div className="w-28 h-28 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-amber-500/30">
              <Calendar className="h-14 w-14 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">Prazo Encerrado</h1>
              <p className="text-slate-400 font-medium mt-3 text-sm">O prazo para agendamento encerrou em {fmtDateShort(config.data_validade)}. Fale com o catequista.</p>
            </div>
          </div>
        </div>
      );
    }
  }

  // ── Sucesso ────────────────────────────────────────────────────────────
  if (isSuccess) {
    return <SuccessScreen nomeCrianca={form.nome_crianca} selectedData={selectedData!} selectedHorario={selectedHorario!} />;
  }

  // ── Filtrar dias disponíveis ───────────────────────────────────────────
  const ocupadosSet = new Set(config.agendamentos_ocupados.map((a: any) => `${a.data}_${a.horario}`));
  const diasDisponiveis = config.dias_horarios.map((dia: any) => {
    const horariosLivres = dia.horarios.filter((h: string) => !ocupadosSet.has(`${dia.data}_${h}`));
    return { ...dia, horariosLivres };
  }).filter((dia: any) => dia.horariosLivres.length > 0);

  const totalVagasRestantes = diasDisponiveis.reduce((acc: number, d: any) => acc + d.horariosLivres.length, 0);
  const horariosDisponivelDia = diasDisponiveis.find((d: any) => d.data === selectedData)?.horariosLivres || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 pb-20">

      {/* ── HERO (Compacto) ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden mb-6 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700" />
        <div className="relative px-5 py-6 max-w-lg mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-md">
            <Heart className="h-7 w-7 text-white" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-indigo-200 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Agendamento · {config.turma_nome}</p>
            <h1 className="text-xl font-black text-white tracking-tight leading-tight truncate">
              {config.titulo}
            </h1>
            {diasDisponiveis.length > 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white text-[10px] font-bold">
                  {totalVagasRestantes} vagas
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-5">

        {/* TEMA DA VISITA */}
        {config.tema && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-5 flex items-start gap-3 shadow-sm animate-in fade-in duration-500">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em]">Pauta da Visita</h4>
              <p className="text-sm font-semibold text-indigo-900/80 leading-relaxed">{config.tema}</p>
            </div>
          </div>
        )}

        {diasDisponiveis.length === 0 ? (
          /* ── AGENDA LOTADA ── */
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-10 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Agenda Lotada</h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Não há mais horários disponíveis para agendamento.<br />Entre em contato com o catequista.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* ── STEP 1: DATAS DISPONÍVEIS ─────────────────────────── */}
            <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-sm">1</div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-widest">Escolha um Dia</p>
                  <p className="text-indigo-200 text-[10px] font-medium">Toque na data para ver os horários</p>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {/* Botões de datas disponíveis */}
                <div className="grid grid-cols-2 gap-3">
                  {diasDisponiveis.map((dia: any) => {
                    const d = new Date(dia.data + "T12:00:00");
                    const isSelected = selectedData === dia.data;
                    const diaSemana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
                    const vagas = dia.horariosLivres.length;
                    return (
                      <button
                        key={dia.data}
                        type="button"
                        onClick={() => {
                          if (selectedData === dia.data) {
                            setSelectedData(null);
                            setSelectedHorario(null);
                            setCurrentStep(1);
                          } else {
                            setSelectedData(dia.data);
                            setSelectedHorario(null);
                            setCurrentStep(1);
                          }
                        }}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-2xl border-2 font-bold transition-all duration-200 overflow-hidden",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/40 scale-[1.03]"
                            : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 hover:shadow-md"
                        )}
                      >
                        {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />}
                        <span className={cn("relative text-[10px] font-black uppercase tracking-widest", isSelected ? "text-white/70" : "text-indigo-500")}>
                          {diaSemana}
                        </span>
                        <span className={cn("relative text-xl font-black tracking-tight", isSelected ? "text-white" : "text-slate-800")}>
                          {d.getDate()}
                        </span>
                        <span className={cn("relative text-[11px] font-bold", isSelected ? "text-white/80" : "text-slate-500")}>
                          {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()}
                        </span>
                        <span className={cn(
                          "relative mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                          isSelected ? "bg-white/20 text-white" : "bg-green-50 text-green-700 border border-green-200"
                        )}>
                          {vagas} {vagas === 1 ? "vaga" : "vagas"}
                        </span>
                        {isSelected && (
                          <div className="absolute bottom-1.5 right-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white/70" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Horários do dia selecionado — aparece inline */}
                {selectedData && (
                  <div className="animate-in slide-in-from-top-2 duration-300 mt-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-full px-3 py-1">
                        📅 {fmtDateFull(selectedData)}
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    {horariosDisponivelDia.length === 0 ? (
                      <p className="text-center text-xs font-bold text-muted-foreground py-3">Sem horários disponíveis.</p>
                    ) : (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 text-center flex items-center justify-center gap-1.5">
                          <Clock className="w-3 h-3" /> Horários disponíveis — escolha um
                        </p>
                        <div className="grid grid-cols-3 gap-2.5">
                          {horariosDisponivelDia.map((h: string) => {
                            const isSelected = selectedHorario === h;
                            return (
                              <button
                                key={h}
                                type="button"
                                onClick={() => {
                                  setSelectedHorario(h);
                                  setCurrentStep(2);
                                  setTimeout(() => {
                                    document.getElementById("section-dados")?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }, 100);
                                }}
                                className={cn(
                                  "relative py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all duration-200 border-2 overflow-hidden",
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/40 scale-105"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
                                )}
                              >
                                {isSelected && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />
                                )}
                                <span className="relative flex flex-col items-center gap-1">
                                  <Clock className={cn("w-3.5 h-3.5", isSelected ? "text-white/80" : "text-indigo-400")} />
                                  {h}
                                  {isSelected && (
                                    <span className="text-[8px] text-white/70 font-medium tracking-widest">SELECIONADO</span>
                                  )}
                                </span>
                                {!isSelected && (
                                  <div className="absolute top-1.5 right-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resumo selecionado */}
                {selectedData && selectedHorario && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                      <CalendarCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Selecionado</p>
                      <p className="text-sm font-black text-indigo-900">{fmtDateShort(selectedData)} às {selectedHorario}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-indigo-600 ml-auto" />
                  </div>
                )}
              </div>
            </div>

            {/* ── STEP 2: DADOS DA FAMÍLIA ───────────────────────────── */}
            <div
              id="section-dados"
              className={cn(
                "bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden transition-all duration-500",
                !selectedHorario && "opacity-50 pointer-events-none"
              )}
            >
              {/* Header */}
              <div className={cn(
                "px-6 py-4 flex items-center gap-3 transition-all",
                selectedHorario ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-slate-300"
              )}>
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-sm">2</div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-widest">Dados da Família</p>
                  <p className="text-white/70 text-[10px] font-medium">Preencha para confirmar a visita</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <FieldInput
                  label="Seu Nome (Responsável) *"
                  icon={User}
                  value={form.nome_responsavel}
                  onChange={(v: string) => updateField("nome_responsavel", v)}
                  placeholder="Ex: Maria Silva"
                />
                <FieldInput
                  label="Nome do Catequizando *"
                  icon={Heart}
                  value={form.nome_crianca}
                  onChange={(v: string) => updateField("nome_crianca", v)}
                  placeholder="Ex: Joãozinho"
                />
                <FieldInput
                  label="Seu WhatsApp *"
                  icon={Phone}
                  type="tel"
                  value={form.telefone}
                  onChange={(v: string) => updateField("telefone", mascaraTelefone(v))}
                  placeholder="(00) 00000-0000"
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-zinc-700 uppercase tracking-widest block flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Observação (Opcional)
                  </label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => updateField("observacao", e.target.value)}
                    className="w-full min-h-[90px] p-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold text-sm text-zinc-800 placeholder:text-zinc-400 outline-none resize-none"
                    placeholder="Ex: Nosso endereço fica na casa dos fundos..."
                  />
                </div>
              </div>
            </div>

            {/* ── STEP 3: RESUMO E CONFIRMAR ────────────────────────── */}
            {selectedData && selectedHorario && form.nome_responsavel && form.nome_crianca && form.telefone && (
              <div className="bg-white rounded-3xl shadow-sm border border-black/5 overflow-hidden animate-in slide-in-from-bottom-2 duration-400">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-white text-sm">3</div>
                  <div>
                    <p className="text-white font-black text-sm uppercase tracking-widest">Confirmar Visita</p>
                    <p className="text-white/70 text-[10px] font-medium">Revise e confirme seu agendamento</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Data</p>
                      <p className="text-sm font-black text-indigo-900 mt-0.5">{fmtDateShort(selectedData)}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-2xl p-3 border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Horário</p>
                      <p className="text-xl font-black text-indigo-900 mt-0.5">{selectedHorario}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Família</p>
                    <p className="text-sm font-black text-slate-800">{form.nome_crianca}</p>
                    <p className="text-xs font-medium text-slate-500">Resp: {form.nome_responsavel} · {form.telefone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de envio */}
            <button
              type="submit"
              disabled={isSubmitting || !selectedData || !selectedHorario}
              className={cn(
                "w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-sm transition-all duration-300 flex items-center justify-center gap-3",
                selectedData && selectedHorario
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isSubmitting
                ? <><Spinner size="sm" color="white" /> Agendando...</>
                : <><CalendarCheck className="w-5 h-5" /> Confirmar Agendamento</>
              }
            </button>

            <p className="text-center text-[10px] font-medium text-muted-foreground pb-4">
              ✝️ Ao confirmar, o catequista receberá sua solicitação imediatamente.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
