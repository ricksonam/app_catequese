import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicVisitaConfig, publicAgendarVisita } from "@/lib/supabaseStore";
import { Calendar, Clock, UserPlus, Phone, CheckCircle2, AlertCircle, ArrowRight, Home, Heart } from "lucide-react";
import { mascaraTelefone, cn } from "@/lib/utils";
import { toast } from "sonner";
import Spinner from "@/components/ui/spinner";

// Componente visual para campos
function FieldInput({ label, value, onChange, placeholder, type = "text" }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-black text-zinc-900 uppercase tracking-widest block ml-1">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[48px] px-4 rounded-xl border-2 border-black/10 bg-white focus:bg-white focus:border-primary focus:ring-0 transition-all font-bold text-sm"
      />
    </div>
  );
}

export default function PublicAgendaVisita() {
  const { token } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null);

  const { data: config, isLoading, error } = useQuery({
    queryKey: ["public_visita", token],
    queryFn: () => fetchPublicVisitaConfig(token || ""),
    enabled: !!token,
  });

  const [form, setForm] = useState({
    nome_responsavel: "",
    nome_crianca: "",
    telefone: "",
    observacao: "",
  });

  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedData || !selectedHorario) {
      toast.error("Por favor, selecione um dia e horário.");
      return;
    }
    if (!form.nome_responsavel || !form.nome_crianca || !form.telefone) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
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
        observacao: form.observacao
      });
      setIsSuccess(true);
      toast.success("Visita agendada com sucesso!");
      window.scrollTo(0, 0);
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar visita. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" text="Carregando..." /></div>;

  if (error || !config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#F8F9FE]">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-tight">Link Inválido</h1>
        <p className="text-muted-foreground mt-2 max-w-xs text-sm">Este link de agendamento não existe ou foi removido.</p>
      </div>
    );
  }

  if (!config.ativo) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-6 text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Clock className="h-12 w-12 opacity-50" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Agendamento Encerrado</h1>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              As inscrições para estas visitas já foram encerradas pelo catequista.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-500 border border-black/5">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">Visita Confirmada!</h1>
            <p className="text-sm text-muted-foreground font-medium">
              A visita do catequista à família de <span className="text-primary font-bold">{form.nome_crianca}</span> está agendada.
            </p>
          </div>

          <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-5 space-y-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Data e Horário</p>
            <p className="text-xl font-black text-primary tracking-tight">
              {new Date(selectedData + "T12:00:00").toLocaleDateString('pt-BR')} às {selectedHorario}
            </p>
          </div>

          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-widest leading-relaxed">
            O catequista já recebeu a sua confirmação. Que Deus abençoe!
          </p>
        </div>
      </div>
    );
  }

  // Filtrar os horários disponíveis (remover os já agendados)
  const ocupadosSet = new Set(config.agendamentos_ocupados.map((a: any) => `${a.data}_${a.horario}`));
  
  const diasDisponiveis = config.dias_horarios.map((dia: any) => {
    const horariosLivres = dia.horarios.filter((h: string) => !ocupadosSet.has(`${dia.data}_${h}`));
    return { ...dia, horariosLivres };
  }).filter((dia: any) => dia.horariosLivres.length > 0);

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-black/5 px-6 py-8 shadow-sm">
        <div className="max-w-md mx-auto flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-inner mb-2">
             <Home className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Agendamento de</p>
            <h1 className="text-2xl font-black text-foreground tracking-tighter leading-tight uppercase">
              {config.titulo}
            </h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-1">
              Turma {config.turma_nome}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-8">
        
        {config.tema && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 flex items-start gap-3 shadow-sm">
             <Heart className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
             <div className="space-y-1">
                <h4 className="text-[10px] font-black text-indigo-800 uppercase tracking-[0.2em]">Pauta da Visita</h4>
                <p className="text-xs font-bold text-indigo-900/80 leading-relaxed">
                  {config.tema}
                </p>
             </div>
          </div>
        )}

        {diasDisponiveis.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-black/5 shadow-sm space-y-4">
             <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto" />
             <h3 className="font-black text-foreground uppercase tracking-widest text-sm">Agenda Lotada</h3>
             <p className="text-xs text-muted-foreground font-medium px-4">Não há mais horários disponíveis para agendamento. Fale com o catequista.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 1. Escolha do Horário */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
              <div className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-tight text-sm">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">1</div>
                 Escolha um Horário
              </div>
              
              <div className="space-y-6">
                {diasDisponiveis.map((dia: any) => (
                  <div key={dia.data} className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(dia.data + "T12:00:00").toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {dia.horariosLivres.map((h: string) => {
                        const isSelected = selectedData === dia.data && selectedHorario === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              setSelectedData(dia.data);
                              setSelectedHorario(h);
                            }}
                            className={cn(
                              "py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all border-2",
                              isSelected 
                                ? "bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                                : "bg-white border-black/10 text-muted-foreground hover:border-indigo-300 hover:text-indigo-600"
                            )}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Seus Dados */}
            <div className={cn("bg-white rounded-3xl p-6 shadow-sm border border-black/5 space-y-6 transition-all duration-500", !selectedData && "opacity-50 pointer-events-none")}>
              <div className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-tight text-sm">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">2</div>
                 Dados da Família
              </div>
              
              <div className="space-y-4">
                <FieldInput label="Seu Nome (Responsável) *" value={form.nome_responsavel} onChange={(v: string) => updateField("nome_responsavel", v)} placeholder="Ex: Maria Silva" />
                <FieldInput label="Nome do Catequizando *" value={form.nome_crianca} onChange={(v: string) => updateField("nome_crianca", v)} placeholder="Ex: Joãozinho" />
                <FieldInput label="Seu WhatsApp *" type="tel" value={form.telefone} onChange={(v: string) => updateField("telefone", mascaraTelefone(v))} placeholder="(00) 00000-0000" />
                
                <div className="pt-2">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-widest block ml-1 mb-1">Alguma observação? (Opcional)</label>
                  <textarea 
                    value={form.observacao} 
                    onChange={(e) => updateField("observacao", e.target.value)} 
                    className="w-full min-h-[80px] p-4 rounded-xl border-2 border-black/10 bg-white focus:border-primary focus:ring-0 transition-all font-bold text-sm resize-none" 
                    placeholder="Ex: O endereço é na casa dos fundos..." 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !selectedData}
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? <Spinner size="sm" color="white" text="Agendando..." /> : "Confirmar Agendamento"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
