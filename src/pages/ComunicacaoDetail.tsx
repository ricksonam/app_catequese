import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, ExternalLink, Download, FileText, CheckCircle2, UserCircle, Printer } from "lucide-react";
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20 animate-fade-in print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-slate-100/80 dark:bg-zinc-950/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0 print:hidden">
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
      </div>

      {/* Actions (Hidden on Print) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <button 
          onClick={handleShareWhatsApp}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
        >
          <Share2 className="h-6 w-6" />
          <span className="text-xs font-bold tracking-widest uppercase">WhatsApp</span>
        </button>
        <button 
          onClick={handleCopyLink}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
        >
          <ExternalLink className="h-6 w-6" />
          <span className="text-xs font-bold tracking-widest uppercase">Copiar Link</span>
        </button>
        <button 
          onClick={handlePrint}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20 transition-colors border border-slate-500/20"
        >
          <Printer className="h-6 w-6" />
          <span className="text-xs font-bold tracking-widest uppercase">Imprimir PDF</span>
        </button>
      </div>

      <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-center">
        <h1 className="text-2xl font-black">{form.titulo}</h1>
        <p className="text-sm text-gray-500 mt-2">Relatório de Respostas - Gerado em {new Date().toLocaleDateString()}</p>
      </div>

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
