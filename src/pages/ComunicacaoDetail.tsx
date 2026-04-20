import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, ExternalLink, Download, FileText, CheckCircle2, UserCircle, Printer, PieChart } from "lucide-react";
import { fetchComunicacaoRespostas, fetchPublicComunicacaoForm } from "@/lib/supabaseStore";
import { toast } from "sonner";
import { formatarDataVigente } from "@/lib/utils";
import type { ComunicacaoResposta, ComunicacaoForm } from "@/lib/store";

export default function ComunicacaoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // In a real scenario we might have a specific hook fetching form by ID,
  // but we can use the public fetcher since this page is for the owner too and the form is public
  // Wait, fetchPublic uses codigo_acesso, so we need fetchFormById. 
  // Let's use a quick query to fetch just this form by id using supabase.
  const { data: form, isLoading: loadingForm } = useQuery({
    queryKey: ['form_detail', id],
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.from("comunicacao_forms").select("*").eq("id", id).single();
      if (error) throw error;
      return data as ComunicacaoForm;
    },
    enabled: !!id
  });

  const { data: respostas = [], isLoading: loadingRespostas } = useQuery({
    queryKey: ["comunicacao_respostas_detalhe", id],
    queryFn: () => fetchComunicacaoRespostas(id!),
    enabled: !!id
  });

  const getLinkPublico = () => {
    if (!form) return "";
    return `${window.location.origin}/f/${form.codigo_acesso}`;
  };

  const handleShareWhatsApp = () => {
    if (!form) return;
    const url = getLinkPublico();
    const texto = `Olá! Participe da nossa pesquisa: *${form.titulo}*\n\nAcesse o link abaixo:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getLinkPublico());
    toast.success("Link copiado para a área de transferência!");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loadingForm) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">Carregando detalhes...</div>;
  }

  if (!form) {
    return <div className="p-8 text-center text-destructive font-bold">Formulário não encontrado.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20 animate-fade-in print:animate-none print:opacity-100 print:text-black print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 z-10 bg-slate-100/80 dark:bg-zinc-950/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0 print:hidden gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/comunicacao')} className="back-btn">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground truncate max-w-[200px] sm:max-w-md">{form.titulo}</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                {respostas.length} {respostas.length === 1 ? 'Resposta' : 'Respostas'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Chips */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button 
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20 whitespace-nowrap"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-[11px] font-black tracking-widest uppercase">WhatsApp</span>
          </button>
          <button 
            onClick={handleCopyLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors border border-blue-500/20 whitespace-nowrap"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-[11px] font-black tracking-widest uppercase">Copiar Link</span>
          </button>
        </div>
      </div>

      {/* Identificação e Imprimir (Hidden on Print) */}
      <div className="print:hidden float-card p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-3xl border-2 border-black/5 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
             <CheckCircle2 className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Resultado da Pesquisa</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Visualize ou exporte as respostas abaixo</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-black/5 font-bold text-xs tracking-widest uppercase"
        >
          <Printer className="h-4 w-4" />
          Imprimir PDF
        </button>
      </div>

      <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-center">
        <h1 className="text-2xl font-black">{form.titulo}</h1>
        <p className="text-sm text-gray-500 mt-2">Relatório de Resultados da Pesquisa - Gerado em {new Date().toLocaleDateString()}</p>
      </div>

      {/* Estatísticas (Resumo) */}
      {!loadingRespostas && respostas.length > 0 && form.campos.some(c => ['radio', 'checkbox', 'rating'].includes(c.type)) && (
        <div className="space-y-4 mb-6 print:mb-8">
           <h2 className="text-sm font-black uppercase tracking-widest text-foreground pl-2 flex items-center gap-2 print:text-black">
             <PieChart className="h-4 w-4 text-purple-500" />
             Resumo das Respostas
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {form.campos.filter(c => ['radio', 'checkbox', 'rating'].includes(c.type)).map(campo => {
                // Calcular frequência das respostas
                const frequencia: Record<string, number> = {};
                respostas.forEach(r => {
                  const val = r.respostas[campo.id];
                  if (val !== undefined && val !== null && val !== '') {
                    if (Array.isArray(val)) {
                      val.forEach(v => { frequencia[v] = (frequencia[v] || 0) + 1; });
                    } else {
                      frequencia[val] = (frequencia[val] || 0) + 1;
                    }
                  }
                });

                const totalRespondido = Object.values(frequencia).reduce((a, b) => a + b, 0);

                return (
                  <div key={`stats-${campo.id}`} className="float-card p-4 border border-black/5 flex flex-col gap-3">
                    <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{campo.label}</p>
                    <div className="space-y-2 mt-auto">
                      {Object.entries(frequencia).sort((a,b) => b[1] - a[1]).map(([resposta, qtd]) => {
                        const porcentagem = totalRespondido > 0 ? Math.round((qtd / totalRespondido) * 100) : 0;
                        return (
                          <div key={resposta} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="truncate max-w-[70%]">{resposta}</span>
                              <span className="text-muted-foreground">{qtd} ({porcentagem}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${porcentagem}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(frequencia).length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">Nenhuma resposta quantitativa ainda.</p>
                      )}
                    </div>
                  </div>
                );
             })}
           </div>
        </div>
      )}

      {/* Responses List */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-foreground pl-2 flex items-center gap-2 print:text-black">
          <CheckCircle2 className="h-4 w-4 text-success" />
          Lista de Respostas Recebidas
        </h2>

        {loadingRespostas ? (
           <div className="p-8 text-center animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs">Carregando respostas...</div>
        ) : respostas.length === 0 ? (
          <div className="float-card p-10 text-center flex flex-col items-center justify-center">
             <UserCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
             <p className="font-bold text-foreground">Nenhuma resposta recebida ainda.</p>
             <p className="text-sm text-muted-foreground mt-2">Compartilhe o link com as famílias para começar a receber respostas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {respostas.map((resp, i) => (
              <div key={resp.id} className="float-card p-5 group flex flex-col gap-4 border-l-4 border-success print:border-black print:shadow-none print:break-inside-avoid">
                <div className="flex justify-between items-start border-b border-black/5 pb-3">
                  <div>
                    <h3 className="font-bold text-lg">{resp.nome_respondente}</h3>
                    {resp.telefone && <p className="text-sm text-muted-foreground">{resp.telefone}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">Recebido em</span>
                    <span className="text-xs font-bold text-foreground">{resp.criado_em ? formatarDataVigente(resp.criado_em) : '-'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {form.campos.map(campo => {
                    const respostaUser = resp.respostas[campo.id];
                    return (
                      <div key={campo.id} className="bg-muted/30 p-3 rounded-xl border border-black/5 print:bg-white print:border-black/20">
                        <p className="text-xs font-bold text-muted-foreground mb-1">{campo.label}</p>
                        <p className="text-sm font-medium text-foreground">
                          {Array.isArray(respostaUser) ? respostaUser.join(', ') : (respostaUser || <span className="italic opacity-50">Sem resposta</span>)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                {resp.pontuacao !== undefined && (
                  <div className="mt-2 text-right">
                    <span className="inline-block px-3 py-1 bg-purple-500/10 text-purple-600 font-black text-xs uppercase tracking-widest rounded-lg border border-purple-500/20">
                      Pontuação: {resp.pontuacao}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
