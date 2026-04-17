import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMissoesFamilia } from "@/hooks/useSupabaseData";
import { Heart, Plus, Share2, Copy, Sparkles, BookOpen, Dice5, HelpCircle, ArrowLeft, Trophy } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch missoes
  const { data: missoes = [], isLoading } = useMissoesFamilia(turmaId);

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
      {/* Header Premium */}
      <div className="bg-white dark:bg-zinc-900 border-b border-border/50 px-6 py-6 shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full shadow-sm border border-border/50">
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
               <p className="text-[10px] font-black tracking-[0.2em] text-rose-500 uppercase">Missões Semanais</p>
               <h1 className="text-xl font-black text-foreground">Catequese em Família</h1>
             </div>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full shadow-lg shadow-rose-500/20 bg-rose-500 hover:bg-rose-600 font-bold"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Missão
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Banner/Instruções */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
             <Heart className="w-32 h-32" />
           </div>
           <div className="relative z-10 max-w-md">
             <h2 className="text-2xl font-black mb-2 leading-tight">Engaje as famílias de forma divertida!</h2>
             <p className="text-rose-100 font-medium text-sm leading-relaxed mb-4">
               Crie pequenas missões semanais, envie o link no WhatsApp e veja os corações encherem quando as famílias concluírem a atividade!
             </p>
           </div>
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
          <div className="grid gap-4 sm:grid-cols-2">
            {missoes.map((missao) => {
              const catObj = categoriasMissao.find(c => c.id === missao.categoria) || categoriasMissao[0];
              return (
                <div key={missao.id} className="bg-white dark:bg-zinc-900 border border-border/50 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 ${catObj.color}/10 ${catObj.textClass} rounded-full text-[10px] font-black uppercase tracking-wider`}>
                      {catObj.label}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleShare(missao.codigo_compartilhamento)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <h3 className="font-bold text-foreground leading-tight mb-1">{missao.titulo}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{missao.descricao}</p>
                  
                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold">
                       <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                         <Trophy className="h-4 w-4" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-foreground leading-none">{missao.concluidas}</span>
                         <span className="text-[9px] text-muted-foreground uppercase opacity-70">Concluídas</span>
                       </div>
                    </div>
                    
                    <Button size="sm" variant="outline" className="h-8 rounded-full text-xs font-bold" onClick={() => handleShare(missao.codigo_compartilhamento)}>
                      <Copy className="h-3 w-3 mr-1.5" /> Link
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
            <div>
               <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Categoria da Semana</label>
               <div className="grid grid-cols-2 gap-2">
                 {categoriasMissao.map(cat => (
                   <button
                     key={cat.id}
                     type="button"
                     onClick={() => setSelectedCategoria(cat.id)}
                     className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                       selectedCategoria === cat.id 
                         ? `${cat.color} text-white border-transparent shadow-md` 
                         : "bg-transparent text-muted-foreground hover:bg-muted border-border/50"
                     }`}
                   >
                     {cat.label}
                   </button>
                 ))}
               </div>
            </div>

            {/* Campos de Texto com Sugestão Mágica */}
            <div className="relative">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-xs font-bold text-muted-foreground uppercase">Título e Missão</label>
                 <Button 
                   type="button" 
                   variant="ghost" 
                   size="sm" 
                   onClick={handleSugestaoMagica}
                   disabled={isGenerating}
                   className={`h-7 px-2 text-[10px] font-black rounded-full uppercase tracking-wider bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 ${isGenerating ? 'animate-pulse' : ''}`}
                 >
                   <Sparkles className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} /> 
                   Sugestão Mágica
                 </Button>
               </div>
               
               <Input 
                 placeholder="Ex: Noite de Filmes Santos" 
                 className="font-bold mb-3 bg-muted/30 border-border/50 focus-visible:ring-rose-500 rounded-xl"
                 value={titulo}
                 onChange={(e) => setTitulo(e.target.value)}
               />
               <Textarea 
                 placeholder="Descreva o que a família precisará fazer..." 
                 className="min-h-[100px] resize-none bg-muted/30 border-border/50 focus-visible:ring-rose-500 rounded-xl"
                 value={descricao}
                 onChange={(e) => setDescricao(e.target.value)}
               />
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
