import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings2, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useComunicacaoFormMutation } from "@/hooks/useSupabaseData";
import { fetchComunicacaoFormById } from "@/lib/supabaseStore";
import { toast } from "sonner";
import { generateUUID } from "@/lib/utils";
import type { ComunicacaoFormType, ComunicacaoFormField } from "@/lib/store";

export default function ComunicacaoBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const formMutation = useComunicacaoFormMutation();
  
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<ComunicacaoFormType>("pesquisa");
  const [campos, setCampos] = useState<ComunicacaoFormField[]>([]);
  const [mostrarPontuacao, setMostrarPontuacao] = useState(false);
  const [isPago, setIsPago] = useState(false);
  const [valor, setValor] = useState(0);
  const [chavePix, setChavePix] = useState("");
  const [vagasTotais, setVagasTotais] = useState<number | undefined>(undefined);
  const [dataEvento, setDataEvento] = useState("");
  const [prazoInscricao, setPrazoInscricao] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [localEvento, setLocalEvento] = useState("");
  const [codigoAcessoOriginal, setCodigoAcessoOriginal] = useState("");

  const { data: existingForm, isLoading: loadingExisting } = useQuery({
    queryKey: ['fetch_form_edit', id],
    queryFn: () => fetchComunicacaoFormById(id!),
    enabled: isEditing
  });

  useEffect(() => {
    if (existingForm) {
      setTitulo(existingForm.titulo);
      setDescricao(existingForm.descricao || "");
      setTipo(existingForm.tipo);
      setCampos(existingForm.campos);
      setMostrarPontuacao(existingForm.configuracoes?.mostrarPontuacao || false);
      setIsPago(existingForm.configuracoes?.isPago || false);
      setValor(existingForm.configuracoes?.valor || 0);
      setChavePix(existingForm.configuracoes?.chavePix || "");
      setVagasTotais(existingForm.configuracoes?.vagasTotais);
      setDataEvento(existingForm.configuracoes?.dataEvento || "");
      setPrazoInscricao(existingForm.configuracoes?.prazoInscricao || "");
      setPublicoAlvo(existingForm.configuracoes?.publicoAlvo || "");
      setLocalEvento(existingForm.configuracoes?.localEvento || "");
      setCodigoAcessoOriginal(existingForm.codigo_acesso);
    }
  }, [existingForm]);

  const handleAddCampo = (tipoCampo: ComunicacaoFormField['type']) => {
    const novoCampo: ComunicacaoFormField = {
      id: generateUUID(),
      type: tipoCampo,
      label: "",
      required: false,
      options: ['radio', 'checkbox'].includes(tipoCampo) ? ["Opção 1"] : undefined
    };
    setCampos([...campos, novoCampo]);
  };

  const handleRemoveCampo = (id: string) => {
    setCampos(campos.filter(c => c.id !== id));
  };

  const updateCampo = (id: string, updates: Partial<ComunicacaoFormField>) => {
    setCampos(campos.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addOptionToCampo = (campoId: string) => {
    setCampos(campos.map(c => {
      if (c.id === campoId && c.options) {
        return { ...c, options: [...c.options, `Opção ${c.options.length + 1}`] };
      }
      return c;
    }));
  };

  const updateOption = (campoId: string, optIndex: number, newValue: string) => {
    setCampos(campos.map(c => {
      if (c.id === campoId && c.options) {
        const newOpts = [...c.options];
        newOpts[optIndex] = newValue;
        return { ...c, options: newOpts };
      }
      return c;
    }));
  };

  const removeOption = (campoId: string, optIndex: number) => {
    setCampos(campos.map(c => {
      if (c.id === campoId && c.options) {
        return { ...c, options: c.options.filter((_, i) => i !== optIndex) };
      }
      return c;
    }));
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    if (campos.length === 0) {
      toast.error("Adicione ao menos uma pergunta");
      return;
    }

    // Validações básicas
    for (const c of campos) {
      if (!c.label.trim()) {
        toast.error("Todas as perguntas precisam ter um título");
        return;
      }
      if (c.options && c.options.length < 2 && ['radio', 'checkbox'].includes(c.type)) {
        toast.error(`A pergunta "${c.label}" precisa de pelo menos 2 opções`);
        return;
      }
    }

    try {
      const finalId = id || generateUUID();
      const codigoAcesso = isEditing ? codigoAcessoOriginal : `${tipo.substring(0,3)}${Math.floor(Math.random()*90000)+10000}`.toUpperCase();
      
      await formMutation.mutateAsync({
        id: finalId,
        titulo,
        descricao,
        tipo,
        codigo_acesso: codigoAcesso,
        campos,
        configuracoes: {
          mostrarPontuacao: tipo === 'avaliacao' ? mostrarPontuacao : false,
          aceitandoRespostas: true,
          isPago: tipo === 'evento' ? isPago : false,
          valor: tipo === 'evento' ? valor : 0,
          chavePix: tipo === 'evento' ? chavePix : "",
          vagasTotais: tipo === 'evento' ? vagasTotais : undefined,
          vagasDisponiveis: tipo === 'evento' ? (isEditing ? existingForm?.configuracoes?.vagasDisponiveis : vagasTotais) : undefined,
          dataEvento: tipo === 'evento' ? dataEvento : "",
          prazoInscricao: tipo === 'evento' ? prazoInscricao : "",
          publicoAlvo: tipo === 'evento' ? publicoAlvo : "",
          localEvento: tipo === 'evento' ? localEvento : ""
        }
      });
      
      toast.success(isEditing ? "Formulário atualizado com sucesso!" : "Formulário criado com sucesso!");
      navigate('/comunicacao');
    } catch (err) {
      toast.error(isEditing ? "Erro ao atualizar formulário" : "Erro ao salvar formulário");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-20 animate-fade-in relative pt-4">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-100/80 dark:bg-zinc-950/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">{isEditing ? "Editar Formulário" : "Novo Formulário"}</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Partilha em Família</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={formMutation.isPending}
          className="action-btn py-2.5 px-6 gap-2"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">{formMutation.isPending ? "Salvando..." : "Salvar e Gerar Link"}</span>
          <span className="sm:hidden">{formMutation.isPending ? "..." : "Salvar"}</span>
        </button>
      </div>

      {/* Basic Info */}
      <div className="float-card p-6 flex flex-col gap-6 border-t-4 border-purple-500">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Título do Formulário <span className="text-red-500">*</span></label>
            <input 
              value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Refletindo sobre a Eucaristia"
              className="w-full text-lg font-bold bg-transparent border-b-2 border-black/10 focus:border-purple-500 pb-2 outline-none transition-colors"
            />
          </div>
          <div className="sm:w-1/3 space-y-2">
            <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Tipo</label>
            <select 
              value={tipo} 
              onChange={e => {
                const newTipo = e.target.value as ComunicacaoFormType;
                setTipo(newTipo);
                if (newTipo === 'evento' && campos.length === 0) {
                  setCampos([
                    { id: generateUUID(), type: 'text', label: 'Nome Completo', required: true },
                    { id: generateUUID(), type: 'text', label: 'Telefone para Contato', required: true }
                  ]);
                }
              }}
              className="w-full p-2.5 rounded-xl bg-muted/50 border border-black/5 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-bold"
            >
              <option value="pesquisa">Pesquisa / Enquete</option>
              <option value="questionario">Questionário</option>
              <option value="avaliacao">Avaliação (Com Nota)</option>
              <option value="evento">Inscrição de Eventos</option>
            </select>
          </div>
        </div>

        {tipo === 'evento' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-black/5 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Data e Hora do Evento</label>
              <input 
                type="datetime-local"
                value={dataEvento} onChange={e => setDataEvento(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-muted/50 border border-black/5 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Prazo para Inscrição</label>
              <input 
                type="date"
                value={prazoInscricao} onChange={e => setPrazoInscricao(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-muted/50 border border-black/5 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Local do Evento</label>
              <input 
                value={localEvento} onChange={e => setLocalEvento(e.target.value)}
                placeholder="Ex: Salão Paroquial"
                className="w-full p-2.5 rounded-xl bg-muted/50 border border-black/5 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Público Alvo</label>
              <input 
                value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)}
                placeholder="Ex: Jovens, Famílias..."
                className="w-full p-2.5 rounded-xl bg-muted/50 border border-black/5 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Vagas / Lote (Opcional)</label>
              <input 
                type="number"
                value={vagasTotais || ""} onChange={e => setVagasTotais(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ex: 50"
                className="w-full p-2.5 rounded-xl bg-muted/50 border border-black/5 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-bold"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-black/5">
                <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Evento Pago?</label>
                <input 
                  type="checkbox" 
                  checked={isPago} onChange={e => setIsPago(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>
              {isPago && (
                <div className="grid grid-cols-2 gap-3 animate-in zoom-in-95">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest pl-1">Valor (R$)</label>
                    <input 
                      type="number"
                      value={valor} onChange={e => setValor(parseFloat(e.target.value))}
                      className="w-full p-2 rounded-lg bg-white border border-black/10 outline-none text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest pl-1">Chave PIX</label>
                    <input 
                      value={chavePix} onChange={e => setChavePix(e.target.value)}
                      placeholder="E-mail, CPF ou Celular"
                      className="w-full p-2 rounded-lg bg-white border border-black/10 outline-none text-xs font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-zinc-900 tracking-widest pl-1">Descrição / Introdução (Opcional)</label>
          <textarea 
            value={descricao} onChange={e => setDescricao(e.target.value)}
            placeholder="Escreva uma mensagem de acolhida para as famílias ou catequizandos..."
            className="w-full min-h-[80px] p-4 rounded-2xl bg-muted/30 border border-border/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm resize-none"
          />
        </div>
      </div>

      {/* Fields List */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground pl-2 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-purple-500" />
          Perguntas ({campos.length})
        </h2>

        {campos.map((campo, index) => (
          <div key={campo.id} className="float-card p-5 group flex flex-col gap-4 animate-slide-up" style={{ animationDelay: `${index * 50}ms`}}>
            <div className="flex items-start gap-4">
              <div className="mt-2 cursor-move opacity-30 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    value={campo.label}
                    onChange={e => updateCampo(campo.id, { label: e.target.value })}
                    placeholder={`Pergunta ${index + 1}...`}
                    className="flex-1 text-base font-bold bg-muted/30 px-4 py-2.5 rounded-xl border border-transparent focus:border-purple-500/30 outline-none"
                  />
                  <select
                    value={campo.type}
                    onChange={e => updateCampo(campo.id, { 
                      type: e.target.value as any, 
                      options: ['radio', 'checkbox'].includes(e.target.value) ? ["Opção 1"] : undefined 
                    })}
                    className="sm:w-48 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 outline-none text-xs font-bold"
                  >
                    <option value="text">Texto Curto</option>
                    <option value="textarea">Texto Longo</option>
                    <option value="radio">Múltipla Escolha (1)</option>
                    <option value="checkbox">Caixas de Seleção (Márias)</option>
                    {tipo === 'avaliacao' && <option value="rating">Nota (1 a 5)</option>}
                  </select>
                </div>

                {/* Opções das Perguntas */}
                {['radio', 'checkbox'].includes(campo.type) && campo.options && (
                  <div className="pl-2 space-y-2 border-l-2 border-black/5 ml-2">
                    {campo.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <div className={`w-4 h-4 shrink-0 border-2 border-muted-foreground/30 ${campo.type === 'radio' ? 'rounded-full' : 'rounded-sm'}`} />
                        <input 
                          value={opt}
                          onChange={e => updateOption(campo.id, oIdx, e.target.value)}
                          className="flex-1 bg-transparent border-b border-transparent hover:border-black/10 focus:border-purple-500 outline-none py-1 text-sm transition-colors"
                        />
                        <button onClick={() => removeOption(campo.id, oIdx)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                           <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => addOptionToCampo(campo.id)}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 mt-2 px-2 py-1 rounded-md hover:bg-purple-500/10 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Adicionar Opção
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end items-center gap-4 pt-4 mt-2 border-t border-black/5">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Obrigatória <span className="text-red-500">*</span></span>
                <input 
                  type="checkbox" 
                  checked={campo.required} 
                  onChange={e => updateCampo(campo.id, { required: e.target.checked })}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </label>
              <div className="w-px h-4 bg-border" />
              <button onClick={() => handleRemoveCampo(campo.id)} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        <button 
          onClick={() => handleAddCampo('radio')}
          className="w-full flex flex-col items-center justify-center p-6 rounded-[24px] border-2 border-dashed border-purple-500/30 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-90 transition-transform duration-300 mb-3">
            <Plus className="h-6 w-6" />
          </div>
          <span className="font-bold tracking-wide">Adicionar Pergunta</span>
        </button>
      </div>
    </div>
  );
}
