import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usePublicComunicacaoForm, useComunicacaoRespostaMutation } from "@/hooks/useSupabaseData";
import { Church, CheckCircle, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
        const val = respostas[campo.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          toast.error(`A pergunta "${campo.label}" é obrigatória.`);
          return;
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
      await submitMutation.mutateAsync({
        form_id: form.id,
        nome_respondente: nome,
        telefone: telefone,
        respostas,
        pontuacao: pontuacaoCalculada
      });
      setSubmitted(true);
    } catch (err) {
      toast.error("Ocorreu um erro ao enviar sua resposta. Tente novamente.");
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 text-center">
        <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>
        <h1 className="text-3xl font-black text-foreground mb-4">Agradecemos!</h1>
        <p className="text-muted-foreground max-w-sm text-lg">Sua resposta foi enviada e registrada com sucesso.</p>
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
          {form.descricao && (
            <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-xl mx-auto bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 shadow-sm">
              {form.descricao}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-20">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-sm border border-black/5 space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest text-liturgical border-b-2 border-liturgical/20 pb-2 mb-6">
              Identificação
            </h2>
            
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
                onChange={e => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border-2 border-transparent focus:border-liturgical outline-none transition-colors text-base font-medium"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] shadow-sm border border-black/5 space-y-8">
            <h2 className="text-xl font-black uppercase tracking-widest text-liturgical border-b-2 border-liturgical/20 pb-2 mb-6">
              Respostas
            </h2>

            {form.campos.map((campo, index) => (
              <div key={campo.id} className="space-y-3 pt-4 first:pt-0">
                <label className="block text-base font-bold text-foreground leading-snug">
                  <span className="text-liturgical mr-2">{index + 1}.</span>
                  {campo.label}
                  {campo.required && <span className="text-destructive ml-1">*</span>}
                </label>

                {/* TEXT FIELDS */}
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

                {/* RADIO BUTTONS */}
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

                {/* CHECKBOXES */}
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

                {/* RATING */}
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

          <Button 
            type="submit" 
            disabled={submitMutation.isPending}
            className="w-full py-8 text-xl font-black rounded-3xl bg-liturgical hover:bg-liturgical/90 shadow-xl hover:-translate-y-1 transition-all"
          >
            {submitMutation.isPending ? "ENVIANDO..." : "ENVIAR RESPOSTA"}
            <Send className="ml-2 w-6 h-6" />
          </Button>
        </form>
      </div>
    </div>
  );
}
