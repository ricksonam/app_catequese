import { useState } from "react";
import { 
  FileText, Plus, MessageSquare, ListTodo, Search, Filter, 
  MoreVertical, Copy, Eye, Trash2, PieChart, ExternalLink, Pencil,
  Info, X, BarChart2, Share2, ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComunicacaoForms, useDeleteComunicacaoForm } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { formatarDataVigente } from "@/lib/utils";
import type { ComunicacaoForm } from "@/lib/store";

export default function ComunicacaoHub() {
  const navigate = useNavigate();
  const { data: formularios = [], isLoading } = useComunicacaoForms();
  const deleteForm = useDeleteComunicacaoForm();
  
  const [filter, setFilter] = useState<'todos' | 'pesquisa' | 'questionario' | 'avaliacao'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const filteredForms = formularios.filter(f => {
    const matchesFilter = filter === 'todos' || f.tipo === filter;
    const matchesSearch = f.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Tem certeza que deseja excluir? Todas as respostas também serão apagadas.")) {
      try {
        await deleteForm.mutateAsync(id);
        toast.success("Excluído com sucesso!");
      } catch (err) {
        toast.error("Erro ao excluir.");
      }
    }
  };

  const copyLink = (codigo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/f/${codigo}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado! Cole no WhatsApp para enviar às famílias.");
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'pesquisa': return <Search className="h-4 w-4" />;
      case 'questionario': return <ListTodo className="h-4 w-4" />;
      case 'avaliacao': return <PieChart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'pesquisa': return "text-blue-500 bg-blue-500/10 border-blue-200/50";
      case 'questionario': return "text-emerald-500 bg-emerald-500/10 border-emerald-200/50";
      case 'avaliacao': return "text-purple-500 bg-purple-500/10 border-purple-200/50";
      default: return "text-gray-500 bg-gray-500/10 border-gray-200/50";
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative min-h-[80vh]">

      {/* ── MODAL DE INFORMAÇÕES ── */}
      {showInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do modal */}
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">iAvalia</h2>
                    <p className="text-[10px] uppercase tracking-widest text-purple-500 font-bold">Módulo de Avaliação</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all active:scale-95"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                O <strong className="text-foreground">iAvalia</strong> permite criar{" "}
                <strong>pesquisas</strong>, <strong>questionários</strong> e{" "}
                <strong>avaliações</strong> para enviar às famílias e catequizandos de forma
                simples e prática.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-purple-500/8 border border-purple-500/15">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">1. Crie um formulário</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Adicione perguntas de múltipla escolha, texto livre ou notas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-blue-500/8 border border-blue-500/15">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">2. Compartilhe o link</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Copie o link gerado e envie pelo WhatsApp para os responsáveis.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <BarChart2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">3. Veja os resultados</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Acompanhe as respostas em tempo real pelo painel do catequista.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-inner">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            {/* Título com ícone de info ao lado */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">iAvalia</h1>
              <button
                onClick={() => setShowInfo(true)}
                className="w-6 h-6 rounded-full bg-purple-500/15 text-purple-500 flex items-center justify-center hover:bg-purple-500/25 hover:scale-110 transition-all active:scale-95"
                title="Saiba mais sobre o iAvalia"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-0.5">
              Pesquisas e Questionários
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/comunicacao/novo')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none"
        >
          <Plus className="h-5 w-5" />
          Criar Novo
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar por título ou descrição..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 shadow-sm focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-sm font-medium"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(['todos', 'pesquisa', 'questionario', 'avaliacao'] as const).map(f => {
            const labelMap: Record<string, string> = {
              'todos': 'Todos',
              'pesquisa': 'Pesquisas',
              'questionario': 'Questionários',
              'avaliacao': 'Avaliações'
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                  filter === f 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                    : 'bg-white dark:bg-zinc-900 text-muted-foreground border-transparent hover:border-black/5'
                }`}
              >
                {labelMap[f]}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <MessageSquare className="h-10 w-10 animate-bounce opacity-20 mb-4" />
          <p className="font-bold tracking-widest text-xs uppercase animate-pulse">Carregando...</p>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground text-center px-4 bg-white/50 dark:bg-zinc-900/50 rounded-[32px] border-2 border-dashed border-black/5">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-purple-400" />
          </div>
          <p className="font-black text-lg mb-2 text-foreground/70">Nenhum formulário</p>
          <p className="text-sm max-w-sm">Você ainda não criou pesquisas ou questionários com esse filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredForms.map(form => (
            <div 
              key={form.id} 
              onClick={() => navigate(`/comunicacao/${form.id}`)}
              className="float-card p-5 cursor-pointer flex flex-col justify-between group h-full"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 uppercase tracking-widest text-[9px] font-black ${getTypeColor(form.tipo)}`}>
                    {getTypeIcon(form.tipo)}
                    {form.tipo}
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/comunicacao/${form.id}/editar`);
                      }}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-purple-500/10 hover:text-purple-600 transition-all active:scale-95 shadow-sm border border-transparent hover:border-purple-500/20"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(form.id, e)}
                      className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all active:scale-95 shadow-sm border border-transparent hover:border-destructive/20"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg leading-tight mb-2 text-foreground group-hover:text-purple-600 transition-colors line-clamp-2">
                  {form.titulo}
                </h3>
                
                {form.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {form.descricao}
                  </p>
                )}

                {/* Chip com o Link Público */}
                <div className="flex justify-center my-4">
                  <div 
                    onClick={(e) => copyLink(form.codigo_acesso, e)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full border border-black/5 hover:border-purple-500/30 hover:bg-purple-500/10 transition-colors group/link"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover/link:text-purple-600 transition-colors" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground group-hover/link:text-purple-600 transition-colors truncate max-w-[150px] sm:max-w-[200px]">
                      {`${window.location.origin}/f/${form.codigo_acesso}`}
                    </span>
                    <Copy className="h-3 w-3 text-muted-foreground opacity-50 group-hover/link:opacity-100 group-hover/link:text-purple-600 transition-opacity" />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 mt-2 border-t border-black/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {form.criado_em ? formatarDataVigente(form.criado_em) : 'Recente'}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black text-purple-600 uppercase tracking-widest">
                  Ver Resultados <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Minimal stub for internal ChevronRight as it wasn't imported from lucide above
const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>
);
