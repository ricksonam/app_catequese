import { useState } from "react";
import { 
  FileText, Plus, MessageSquare, ListTodo, Search, Filter, 
  MoreVertical, Copy, Eye, Trash2, PieChart, ExternalLink
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border-t border-purple-500/20 shadow-inner">
            <MessageSquare className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Comunicação</h1>
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-0.5">Pesquisas e Questionários</p>
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
          {(['todos', 'pesquisa', 'questionario', 'avaliacao'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                filter === f 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                  : 'bg-white dark:bg-zinc-900 text-muted-foreground border-transparent hover:border-black/5'
              }`}
            >
              {f}
            </button>
          ))}
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
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={(e) => copyLink(form.codigo_acesso, e)}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
                      title="Copiar Link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(form.id, e)}
                      className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
