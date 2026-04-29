import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePublicComunicacaoForm, useComunicacaoRespostaMutation } from "@/hooks/useSupabaseData";
import { Church, CheckCircle, Send, AlertTriangle, Calendar, MapPin, Users, Ticket, Wallet, Copy, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PublicFormResponder() {
  const { codigo } = useParams<{ codigo: string }>();
  const { data: form, isLoading, error } = usePublicComunicacaoForm(codigo || '');
  const submitMutation = useComunicacaoRespostaMutation();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleTextChange = (id: string, value: string) => {
    setRespostas(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (id: string, option: string, checked: boolean) => {
    setRespostas(prev => {
      const current = prev[id] || [];
      if (checked) {
        return { ...prev, [id]: [...current, option] };
      } else {
        return { ...prev, [id]: current.filter((o: string) => o !== option) };
      }
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); // limpa tudo que não é número
    
    // Aplica a máscara: (00) 00000-0000 ou (00) 0000-0000
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    if (val.length > 9) { // (11) 99999-9999
      val = `${val.slice(0, 10)}-${val.slice(10)}`;
    } else if (val.length > 8 && val.length <= 9) { // (11) 9999-9999
      val = `${val.slice(0, 9)}-${val.slice(9)}`;
    }
    
    setTelefone(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    if (!nome.trim()) {
      toast.error("Por favor, preencha o seu nome.");
      return;
    }

    // Validate required fields
    for (const campo of form.campos) {
      if (campo.required) {
        // Se for campo de Nome ou Telefone em evento, o valor já está nos estados 'nome' e 'telefone'
        if (form.tipo === 'evento') {
          const labelNorm = campo.label.toLowerCase().trim();
          if (labelNorm.includes('nome') && !nome.trim()) {
            toast.error(`O campo "${campo.label}" é obrigatório.`);
            return;
          }
          if (labelNorm.includes('telefone') && !telefone.trim()) {
            toast.error(`O campo "${campo.label}" é obrigatório.`);
            return;
          }
        }

        const val = respostas[campo.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          // Só dar erro se não for um dos campos que já validamos acima
          const isAutoMapping = form.tipo === 'evento' && (campo.label.toLowerCase().includes('nome') || campo.label.toLowerCase().includes('telefone'));
          if (!isAutoMapping) {
            toast.error(`A pergunta "${campo.label}" é obrigatória.`);
            return;
          }
        }
      }
    }

    let pontuacaoCalculada: number | undefined = undefined;
    if (form.tipo === 'avaliacao' && form.configuracoes?.mostrarPontuacao) {
      pontuacaoCalculada = 0;
      // In a real scenario we'd check against correct answers if form had `correctOption`.
      // For now, keeping it simple as it wasn't requested. 
    }

    try {
      if (form.tipo === 'evento') {
        // Use RPC for atomic slot decrement
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error: rpcError } = await supabase.rpc('register_event_participation', {
          p_form_id: form.id,
          p_nome: nome,
          p_telefone: telefone,
          p_respostas: respostas,
          p_pontuacao: pontuacaoCalculada
        });

        if (rpcError) throw rpcError;
        if (data && !data.success) {
          toast.error(data.message || "Erro ao realizar inscrição.");
          return;
        }
      } else {
        await submitMutation.mutateAsync({
          form_id: form.id,
          nome_respondente: nome,
          telefone: telefone,
          respostas,
          pontuacao: pontuacaoCalculada
        });
      }
      setSubmitted(true);
    } catch (err) {
      toast.error("Ocorreu um erro ao enviar sua resposta. Tente novamente.");
    }
  };

  const handleCopyPix = () => {
    if (form?.configuracoes?.chavePix) {
      navigator.clipboard.writeText(form.configuracoes.chavePix);
      toast.success("Chave PIX copiada!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6">
        <div className="w-16 h-16 border-4 border-liturgical border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-black uppercase tracking-widest text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-black text-foreground mb-2">Formulário não encontrado</h1>
        <p className="text-muted-foreground max-w-sm">O link que você tentou acessar pode estar incorreto ou o formulário foi removido.</p>
      </div>
    );
  }

  if (submitted) {
    const isPaidEvent = form.tipo === 'evento' && form.configuracoes?.isPago;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 text-center">
        <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-4">
          {form.tipo === 'evento' ? "Inscrição Realizada!" : "Agradecemos!"}
        </h1>
        <p className="text-muted-foreground max-w-sm text-lg mb-8">
          {form.tipo === 'evento' 
            ? `Sua participação no evento "${form.titulo}" foi registrada com sucesso.`
            : "Sua resposta foi enviada e registrada com sucesso."}
        </p>

        {isPaidEvent && (
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-xl border-2 border-orange-500/20 animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black uppercase tracking-tight">Pagamento via PIX</h2>
                <p className="text-xs text-muted-foreground font-bold">Finalize sua inscrição realizando o pagamento</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-zinc-950 p-6 rounded-2xl border border-black/5 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Valor do Evento</p>
              <p className="text-3xl font-black text-foreground">R$ {form.configuracoes?.valor?.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Chave PIX</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-black/5 font-bold text-sm truncate">
                    {form.configuracoes?.chavePix}
                  </div>
                  <button 
                    onClick={handleCopyPix}
                    className="p-4 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-left">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                  Após realizar o pagamento, salve o comprovante para apresentar no dia do evento ou envie para a coordenação da catequese.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4 selection:bg-liturgical/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-liturgical/10 mb-4 shadow-sm">
            <Church className="h-8 w-8 text-liturgical" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">{form.titulo}</h1>
          
          {form.tipo === 'evento' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-1">
                <Calendar className="h-5 w-5 text-orange-500" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Data</span>
                <span className="text-xs font-bold text-foreground">
                  {form.configuracoes?.dataEvento ? new Date(form.configuracoes.dataEvento).toLocaleDateString('pt-BR') : 'A definir'}
                </span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-1">
                <MapPin className="h-5 w-5 text-blue-500" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Local</span>
                <span className="text-xs font-bold text-foreground truncate w-full text-center">
                  {form.configuracoes?.localEvento || 'A definir'}
                </span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-1">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Público</span>
                <span className="text-xs font-bold text-foreground truncate w-full text-center">
                  {form.configuracoes?.publicoAlvo || 'Todos'}
                </span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center gap-1">
                <Ticket className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vagas</span>
                <span className="text-xs font-bold text-foreground">
                  {form.configuracoes?.vagasDisponiveis !== undefined ? `${form.configuracoes.vagasDisponiveis} restam` : 'Ilimitadas'}
                </span>
              </div>
            </div>
          )}

          {form.descricao && (
            <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 shadow-sm">
              {form.descricao}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-20">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-sm border border-black/5 space-y-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-liturgical border-b-2 border-liturgical/20 pb-2 mb-6">
              {form.tipo === 'evento' ? 'Formulário de Inscrição' : 'Identificação'}
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground pl-1">Seu Nome Completo <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: João Silva da Paz..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border-2 border-transparent focus:border-liturgical outline-none transition-colors text-base font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground pl-1">Telefone / WhatsApp <span className="text-muted-foreground font-normal text-xs">(Opicional)</span></label>
                <input 
                  type="tel" 
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border-2 border-transparent focus:border-liturgical outline-none transition-colors text-base font-medium"
                />
              </div>
            </div>

            {form.tipo !== 'evento' && (
              <div className="pt-8 border-t border-black/5">
                <h2 className="text-xl font-black uppercase tracking-widest text-liturgical border-b-2 border-liturgical/20 pb-2 mb-6">
                  Respostas
                </h2>
              </div>
            )}

            <div className={cn("space-y-8", form.tipo === 'evento' ? "pt-4" : "")}>
              {form.campos
                .filter(campo => {
                  if (form.tipo === 'evento') {
                    const labelNorm = campo.label.toLowerCase().trim();
                    if (labelNorm.includes('nome') || labelNorm.includes('telefone')) return false;
                  }
                  return true;
                })
                .map((campo, index) => (
                  <div key={campo.id} className="space-y-3 pt-4 first:pt-0">
                    <label className="block text-base font-bold text-foreground leading-snug">
                      <span className="text-liturgical mr-2">
                        {form.tipo === 'evento' ? index + 3 : index + 1}.
                      </span>
                      {campo.label}
                      {campo.required && <span className="text-destructive ml-1">*</span>}
                    </label>

                    {(campo.type === 'text' || campo.type === 'textarea') && (
                      <textarea
                        required={campo.required}
                        rows={campo.type === 'text' ? 1 : 4}
                        value={respostas[campo.id] || ''}
                        onChange={e => handleTextChange(campo.id, e.target.value)}
                        placeholder="Sua resposta..."
                        className="w-full bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border-2 border-transparent focus:border-liturgical outline-none transition-colors text-base font-medium resize-none"
                      />
                    )}

                    {campo.type === 'radio' && campo.options && (
                      <div className="space-y-2 mt-2">
                        {campo.options.map((opt, i) => (
                          <label key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-black/5 hover:border-liturgical/30 cursor-pointer bg-slate-50 dark:bg-zinc-950 transition-colors">
                            <input 
                              type="radio" 
                              name={campo.id}
                              required={campo.required}
                              checked={respostas[campo.id] === opt}
                              onChange={() => handleTextChange(campo.id, opt)}
                              className="w-5 h-5 accent-liturgical"
                            />
                            <span className="text-base font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {campo.type === 'checkbox' && campo.options && (
                      <div className="space-y-2 mt-2">
                        {campo.options.map((opt, i) => (
                          <label key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-black/5 hover:border-liturgical/30 cursor-pointer bg-slate-50 dark:bg-zinc-950 transition-colors">
                            <input 
                              type="checkbox" 
                              checked={(respostas[campo.id] || []).includes(opt)}
                              onChange={e => handleCheckboxChange(campo.id, opt, e.target.checked)}
                              className="w-5 h-5 accent-liturgical rounded"
                            />
                            <span className="text-base font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {campo.type === 'rating' && (
                      <div className="flex bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-black/5 overflow-hidden">
                        {[1, 2, 3, 4, 5].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleTextChange(campo.id, num.toString())}
                            className={`flex-1 py-4 font-black transition-colors ${
                              respostas[campo.id] === num.toString() 
                                ? 'bg-liturgical text-white' 
                                : 'hover:bg-liturgical/10 text-muted-foreground'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={submitMutation.isPending || (form.tipo === 'evento' && form.configuracoes?.vagasDisponiveis !== undefined && form.configuracoes.vagasDisponiveis <= 0)}
            className="w-full py-8 text-xl font-black rounded-3xl bg-liturgical hover:bg-liturgical/90 shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {submitMutation.isPending ? "PROCESSANDO..." : 
             (form.tipo === 'evento' && form.configuracoes?.vagasDisponiveis !== undefined && form.configuracoes.vagasDisponiveis <= 0) 
             ? "VAGAS ESGOTADAS" 
             : form.tipo === 'evento' ? "REALIZAR INSCRIÇÃO" : "ENVIAR RESPOSTA"}
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </form>
      </div>
    </div>
  );
}
