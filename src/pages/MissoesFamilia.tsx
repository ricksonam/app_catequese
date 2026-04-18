import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMissoesFamilia } from "@/hooks/useSupabaseData";
import { Heart, Plus, Share2, Copy, Sparkles, BookOpen, Dice5, HelpCircle, ArrowLeft, Trophy, Trash2, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/ui/spinner";
import { categoriasMissao, missoesTemplates } from "@/lib/missoesTemplates";
import { useAuth } from "@/contexts/AuthContext";

export default function MissoesFamilia() {
  const { id: turmaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState("familia");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracao, setDuracao] = useState("");
  const [materiais, setMateriais] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [missaoToDelete, setMissaoToDelete] = useState<string | null>(null);

  // Fetch missoes
  const { data: missoes = [], isLoading } = useMissoesFamilia(turmaId);

  const deleteMissao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("missoes_familia").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoesFamilia", turmaId] });
      toast({ title: "Missão excluída" });
      setMissaoToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  });

  const concluirMissaoAdmin = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("missoes_familia").update({ finalizada: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoesFamilia", turmaId] });
      toast({ title: "Missão marcada como concluída" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    }
  });

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const createMissao = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("missoes_familia").insert({
        turma_id: turmaId,
        titulo,
        categoria: selectedCategoria,
        descricao,
        duracao,
        materiais,
        codigo_compartilhamento: generateCode(),
        criado_por: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missoesFamilia", turmaId] });
      toast({ title: "Missão criada com sucesso!" });
      setIsCreateModalOpen(false);
      // Reset form
      setTitulo("");
      setDescricao("");
      setDuracao("");
      setMateriais("");
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar missão", description: error.message, variant: "destructive" });
    },
  });

  const handleSugestaoMagica = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const templates = missoesTemplates[selectedCategoria as keyof typeof missoesTemplates];
      if (templates && templates.length > 0) {
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
        setTitulo(randomTemplate.titulo);
        setDescricao(randomTemplate.descricao);
      }
      setIsGenerating(false);
    }, 600); // Fake delay for animation
  };

  const handleShare = async (codigo: string) => {
    const url = `${window.location.origin}/missao/${codigo}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Missão em Família - iCatequese",
          text: "Vocês receberam uma nova Missão da Catequese! Clique para ver:",
          url: url,
        });
        return;
      } catch (err) {
        console.log("Error sharing", err);
      }
    }
    
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "O link da missão foi copiado para sua área de transferência." });
  };

  const currentCategoryObj = categoriasMissao.find(c => c.id === selectedCategoria);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* Header Premium - Minimalist version only with back button since name is now in content */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-border/50 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shadow-sm border border-border/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Header Redesign as Balloon */}
        <div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
          <div className="space-y-1">
             <h1 className="text-3xl font-black text-foreground tracking-tight whitespace-nowrap">Catequese em Família</h1>
          </div>

          {/* Balloon Explanation */}
          <div className="relative bg-white dark:bg-zinc-900 border-2 border-rose-500/20 p-5 rounded-[2.5rem] shadow-xl shadow-rose-500/5 max-w-sm group">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-zinc-900 border-t-2 border-l-2 border-rose-500/20 rotate-45"></div>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
              Crie pequenas missões semanais, envie o link no WhatsApp e engaje as famílias de forma divertida!
            </p>
          </div>

          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            size="lg"
            className="rounded-2xl h-14 px-10 shadow-xl shadow-rose-500/25 bg-rose-500 hover:bg-rose-600 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2" /> Criar Nova Missão
          </Button>
        </div>

        {/* Lista de Missões */}
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" text="Carregando missões..." /></div>
        ) : missoes.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-dashed border-border p-12 rounded-3xl text-center">
             <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <Heart className="h-8 w-8" />
             </div>
             <h3 className="text-lg font-bold text-foreground mb-1">Nenhuma missão ainda!</h3>
             <p className="text-muted-foreground text-sm max-w-sm mx-auto">Comece a envolver os pais criando sua primeira missão divertida.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(
              missoes.reduce((groups: { [key: string]: any[] }, missao) => {
                const date = new Date(missao.criadoEm || Date.now());
                const month = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                const monthFormatted = month.charAt(0).toUpperCase() + month.slice(1);
                if (!groups[monthFormatted]) groups[monthFormatted] = [];
                groups[monthFormatted].push(missao);
                return groups;
              }, {})
            ).map(([month, monthMissoes]) => (
              <div key={month} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground shrink-0">{month}</h2>
                  <div className="h-px bg-border flex-1" />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {monthMissoes.map((missao) => {
                    const catObj = categoriasMissao.find(c => c.id === missao.categoria) || categoriasMissao[0];
                    return (
                      <div key={missao.id} className="bg-white dark:bg-zinc-900 border-2 border-black/[0.08] dark:border-white/[0.08] rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        {/* Visible Black Line Concept - A structural divider or accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10" />
                        
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-3 py-1 ${catObj.color}/10 ${catObj.textClass} rounded-full text-[10px] font-black uppercase tracking-wider border border-current opacity-70`}>
                            {catObj.label}
                          </span>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/30" onClick={() => handleShare(missao.codigoCompartilhamento)}>
                            <Share2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                        
                        <div className="text-center flex flex-col items-center mb-6">
                          <h3 className="text-lg font-black text-foreground leading-tight mb-2 text-center">{missao.titulo}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed text-center px-2">{missao.descricao}</p>
                          
                          {/* Visible separator line inside card */}
                          <div className="w-16 h-0.5 bg-black/10 dark:bg-white/10 rounded-full mb-4" />
                          
                          <button 
                            onClick={() => handleShare(missao.codigoCompartilhamento)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all active:scale-95"
                          >
                            <Copy className="h-3 w-3" />
                            Link da Missão
                          </button>
                        </div>
                        
                        <div className="pt-5 border-t-2 border-black/[0.03] dark:border-white/[0.03] flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                 <Trophy className="h-5 w-5" />
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-base font-black text-foreground leading-none">{missao.concluidas || 0}</span>
                                 <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Concluídas</span>
                               </div>
                            </div>
                            {!missao.finalizada && (
                              <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => setMissaoToDelete(missao.id)}>
                                <Trash2 className="h-4.5 w-4.5" />
                              </Button>
                            )}
                          </div>

                          <div className="flex justify-center w-full">
                            {missao.finalizada ? (
                              <div className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Missão Finalizada</span>
                              </div>
                            ) : (
                              <Button 
                                onClick={() => concluirMissaoAdmin.mutate(missao.id)}
                                className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 group-hover:scale-[1.02] transition-transform"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Concluída
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={!!missaoToDelete} onOpenChange={() => setMissaoToDelete(null)}>
        <DialogContent className="max-w-xs rounded-3xl p-6 text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-black mb-2">Excluir Missão?</DialogTitle>
          <p className="text-sm text-muted-foreground mb-6">Esta ação não pode ser desfeita e o link deixará de funcionar.</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setMissaoToDelete(null)} className="rounded-xl">Cancelar</Button>
            <Button variant="destructive" className="rounded-xl bg-rose-500 hover:bg-rose-600" onClick={() => missaoToDelete && deleteMissao.mutate(missaoToDelete)}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md w-[calc(100%-24px)] rounded-[32px] p-6 bg-white dark:bg-zinc-950 border-border/50">
          <DialogHeader className="mb-4">
             <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
               <Heart className="h-6 w-6" />
             </div>
            <DialogTitle className="text-xl font-black">Nova Missão</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Categoria Selector */}
            {/* Categoria Selector */}
            <div className="flex flex-col items-center">
               <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-2">Categoria da Semana</label>
               <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                 <SelectTrigger className="w-full h-12 rounded-2xl bg-muted/30 border-2 border-border/50 font-bold justify-center text-center focus:ring-rose-500">
                   <SelectValue placeholder="Selecione uma categoria" />
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl">
                   {categoriasMissao.map(cat => (
                     <SelectItem key={cat.id} value={cat.id} className="font-bold cursor-pointer rounded-xl py-2">
                       {cat.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>

            {/* Campos de Texto com Sugestão Mágica */}
            <div className="relative p-5 bg-muted/10 border-2 border-border/30 rounded-[28px]">
               <div className="flex flex-col items-center mb-4 space-y-2">
                 <label className="text-sm font-black text-foreground uppercase tracking-wider text-center flex items-center gap-2">
                   <BookOpen className="h-4 w-4 text-rose-500" />
                   Título e Missão
                 </label>
                 <Button 
                   type="button" 
                   variant="ghost" 
                   size="sm" 
                   onClick={handleSugestaoMagica}
                   disabled={isGenerating}
                   className={`h-8 px-4 text-[10px] font-black rounded-full uppercase tracking-wider bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 shadow-sm ${isGenerating ? 'animate-pulse' : ''}`}
                 >
                   <Sparkles className={`h-3 w-3 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} /> 
                   Usar Sugestão Mágica
                 </Button>
               </div>
               
               <Input 
                 placeholder="Ex: Noite de Filmes Santos" 
                 className="font-black text-center h-12 text-[15px] mb-4 bg-white dark:bg-zinc-900 border-2 border-border/50 focus-visible:ring-rose-500 rounded-2xl shadow-sm"
                 value={titulo}
                 onChange={(e) => setTitulo(e.target.value)}
               />
               <Textarea 
                 placeholder="Descreva o que a família precisará fazer..." 
                 className="min-h-[120px] resize-none font-medium mb-4 bg-white dark:bg-zinc-900 border-2 border-border/50 focus-visible:ring-rose-500 rounded-2xl p-4 shadow-sm text-center leading-relaxed"
                 value={descricao}
                 onChange={(e) => setDescricao(e.target.value)}
               />
               
               <div className="grid grid-cols-2 gap-3 mt-4">
                 <div>
                   <label className="text-[10px] font-black text-muted-foreground uppercase opacity-80 mb-2 block text-center">Duração Estimada</label>
                   <Input 
                     placeholder="Ex: 15 min" 
                     className="bg-white dark:bg-zinc-900 border-2 border-border/50 focus-visible:ring-rose-500 rounded-xl text-sm font-bold text-center shadow-sm"
                     value={duracao}
                     onChange={(e) => setDuracao(e.target.value)}
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-muted-foreground uppercase opacity-80 mb-2 block text-center">Materiais</label>
                   <Input 
                     placeholder="Bíblia, lápis..." 
                     className="bg-white dark:bg-zinc-900 border-2 border-border/50 focus-visible:ring-rose-500 rounded-xl text-sm font-bold text-center shadow-sm"
                     value={materiais}
                     onChange={(e) => setMateriais(e.target.value)}
                   />
                 </div>
               </div>
            </div>

            <Button  
               className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm uppercase tracking-wider"
               disabled={!titulo || !descricao || createMissao.isPending}
               onClick={() => createMissao.mutate()}
            >
              {createMissao.isPending ? <Spinner size="sm" color="white" /> : "Gerar Link de Missão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
