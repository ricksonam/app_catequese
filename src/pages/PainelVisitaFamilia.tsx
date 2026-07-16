import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Plus, Trash2, Link, Save, CheckCircle2, Copy, Heart, Settings, Users, ArrowLeft } from "lucide-react";
import { fetchTurmas, fetchVisitaConfigByTurma, upsertVisitaConfig, fetchAgendamentosByConfig, removeVisitaAgendamento } from "@/lib/supabaseStore";
import { type Turma, type VisitaFamiliasConfig, type VisitaAgendamento, type VisitaDiaHorarios } from "@/lib/store";
import { toast } from "sonner";
import Spinner from "@/components/ui/spinner";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";

export function PainelVisitaFamilia() {
  const queryClient = useQueryClient();
  const [selectedTurma, setSelectedTurma] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Fetch turmas
  const { data: turmas, isLoading: loadingTurmas } = useQuery({
    queryKey: ["turmas"],
    queryFn: () => fetchTurmas(),
  });

  // Pre-select turma se houver apenas uma
  useEffect(() => {
    if (turmas && turmas.length === 1 && !selectedTurma) {
      setSelectedTurma(turmas[0].id);
    }
  }, [turmas, selectedTurma]);

  // Fetch config da turma selecionada
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

  const [form, setForm] = useState<Partial<VisitaFamiliasConfig>>({
    ativo: true,
    titulo: "Visita às Famílias",
    tema: "",
    dias_horarios: [],
  });

  useEffect(() => {
    if (config) {
      setForm({
        ativo: config.ativo,
        titulo: config.titulo || "Visita às Famílias",
        tema: config.tema || "",
        dias_horarios: config.dias_horarios || [],
      });
    } else {
      setForm({
        ativo: true,
        titulo: "Visita às Famílias",
        tema: "",
        dias_horarios: [],
      });
    }
  }, [config, selectedTurma]);

  const mutationSave = useMutation({
    mutationFn: async (payload: Partial<VisitaFamiliasConfig>) => {
      return upsertVisitaConfig({ ...payload, turma_id: selectedTurma });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visita_config", selectedTurma] });
      toast.success("Painel de visitas atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar painel");
    }
  });

  const handleSave = () => {
    if (!selectedTurma) {
      toast.error("Selecione uma turma primeiro");
      return;
    }
    mutationSave.mutate(form);
  };

  const handleSelectDates = (dates: Date[] | undefined) => {
    if (!dates) {
      setForm(prev => ({ ...prev, dias_horarios: [] }));
      return;
    }
    setForm(prev => {
      const current = prev.dias_horarios || [];
      const newStr = dates.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      const nextDias = current.filter(d => newStr.includes(d.data));
      newStr.forEach(str => {
        if (!nextDias.find(d => d.data === str)) {
          nextDias.push({ data: str, horarios: [] });
        }
      });
      return { ...prev, dias_horarios: nextDias.sort((a,b) => a.data.localeCompare(b.data)) };
    });
  };

  const removeDia = (dataStr: string) => {
    setForm(prev => ({
      ...prev,
      dias_horarios: (prev.dias_horarios || []).filter(d => d.data !== dataStr)
    }));
  };

  const addHorario = (dataStr: string, horario: string) => {
    if (!horario || !horario.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      toast.error("Horário inválido. Use HH:MM");
      return;
    }
    setForm(prev => {
      const dias = [...(prev.dias_horarios || [])];
      const diaIdx = dias.findIndex(d => d.data === dataStr);
      if (diaIdx >= 0) {
        if (!dias[diaIdx].horarios.includes(horario)) {
          dias[diaIdx].horarios = [...dias[diaIdx].horarios, horario].sort();
        }
      }
      return { ...prev, dias_horarios: dias };
    });
  };

  const removeHorario = (dataStr: string, horario: string) => {
    setForm(prev => {
      const dias = [...(prev.dias_horarios || [])];
      const diaIdx = dias.findIndex(d => d.data === dataStr);
      if (diaIdx >= 0) {
        dias[diaIdx].horarios = dias[diaIdx].horarios.filter(h => h !== horario);
      }
      return { ...prev, dias_horarios: dias };
    });
  };

  const copyLink = () => {
    if (!config?.token) return;
    const link = `${window.location.origin}/visita-familia/${config.token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const removeAgendamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      return removeVisitaAgendamento(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visita_agendamentos", config?.id] });
      toast.success("Agendamento cancelado.");
    }
  });

  if (loadingTurmas) return <div className="flex justify-center p-8"><Spinner size="md" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
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
                {t.nome} {t.ano ? `(${t.ano})` : ''}
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
          
          {/* COLUNA ESQUERDA: Configuração */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-6">
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
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status do Link</span>
                  <Switch 
                    checked={form.ativo} 
                    onCheckedChange={(v) => setForm(prev => ({ ...prev, ativo: v }))} 
                  />
                </div>
              </div>

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
              </div>

              {/* DIAS E HORÁRIOS */}
              <div className="pt-4 border-t border-black/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Dias Disponíveis</h4>
                    <p className="text-xs text-muted-foreground font-medium">Selecione os dias no calendário</p>
                  </div>
                </div>

                <div className="bg-muted/10 rounded-3xl p-4 border border-black/5 flex justify-center">
                  <CalendarUI
                    mode="multiple"
                    selected={form.dias_horarios?.map(d => new Date(d.data + "T12:00:00")) || []}
                    onSelect={handleSelectDates}
                    locale={ptBR}
                    className="bg-white rounded-2xl border-2 border-black/5 shadow-sm p-3"
                    classNames={{
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    }}
                  />
                </div>

                {(!form.dias_horarios || form.dias_horarios.length === 0) && (
                  <div className="text-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-black/10">
                    <Calendar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum dia configurado</p>
                  </div>
                )}

                <div className="space-y-3">
                  {form.dias_horarios?.map((dia) => (
                    <div key={dia.data} className="p-4 rounded-2xl border-2 border-black/5 bg-white space-y-4 shadow-sm relative group">
                      <button 
                        onClick={() => removeDia(dia.data)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                        title="Remover dia"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 text-primary font-black">
                        <Calendar className="w-4 h-4" />
                        {new Date(dia.data + "T12:00:00").toLocaleDateString('pt-BR')}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {dia.horarios.map(h => (
                          <div key={h} className="bg-muted px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-black/5">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {h}
                            <button onClick={() => removeHorario(dia.data, h)} className="text-muted-foreground hover:text-destructive ml-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add Time inline */}
                        <div className="flex items-center gap-1">
                          <input 
                            type="time" 
                            id={`time-${dia.data}`}
                            className="bg-transparent border-2 border-black/10 rounded-xl px-2 py-1 text-xs font-bold h-8"
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById(`time-${dia.data}`) as HTMLInputElement;
                              if (input.value) {
                                addHorario(dia.data, input.value);
                                input.value = '';
                              }
                            }}
                            className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SALVAR */}
              <button 
                onClick={handleSave}
                disabled={mutationSave.isPending}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                {mutationSave.isPending ? <Spinner size="sm" color="white" /> : <Save className="w-4 h-4" />}
                {config ? "Salvar Alterações" : "Criar Agenda de Visitas"}
              </button>
            </div>
          </div>

          {/* COLUNA DIREITA: Link & Agendamentos */}
          <div className="space-y-6">
            
            {/* CARD LINK */}
            {config && (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-xl shadow-purple-500/20 text-white space-y-4">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs text-white/80">
                  <Link className="w-4 h-4" /> Link para os Pais
                </div>
                <p className="text-xs text-white/90 font-medium leading-relaxed">
                  Envie este link no grupo do WhatsApp. Os pais poderão escolher um dos horários disponíveis.
                </p>
                
                <button 
                  onClick={copyLink}
                  className="w-full py-3 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Link Copiado!" : "Copiar Link"}
                </button>
              </div>
            )}

            {/* LISTA DE AGENDAMENTOS */}
            {config && (
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-foreground font-black uppercase tracking-tight">
                  <Users className="w-5 h-5 text-primary" /> Visitas Confirmadas
                </div>

                {loadingAgendamentos ? (
                  <div className="py-4 flex justify-center"><Spinner size="sm" /></div>
                ) : !agendamentos || agendamentos.length === 0 ? (
                  <div className="text-center py-6 bg-muted/20 rounded-2xl border border-black/5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum agendamento ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {agendamentos.map(a => (
                      <div key={a.id} className="p-4 bg-muted/20 rounded-2xl border border-black/5 space-y-2 relative group">
                        <div className="flex items-center justify-between">
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {new Date(a.data_visita + "T12:00:00").toLocaleDateString('pt-BR').substring(0,5)} às {a.horario_visita}
                          </span>
                          <button 
                            onClick={() => removeAgendamentoMutation.mutate(a.id)}
                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/10 p-1.5 rounded-lg hover:bg-destructive hover:text-white"
                            title="Cancelar agendamento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{a.nome_crianca}</p>
                          <p className="text-xs font-medium text-muted-foreground">Responsável: {a.nome_responsavel}</p>
                        </div>
                        {a.telefone && (
                          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            📞 {a.telefone}
                          </p>
                        )}
                        {a.observacao && (
                          <div className="mt-2 p-2 bg-white rounded-xl border border-black/5 text-[10px] text-muted-foreground italic">
                            "{a.observacao}"
                          </div>
                        )}
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
