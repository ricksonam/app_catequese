import { ArrowLeft, Image as ImageIcon, Trash2, Camera, Share2, CalendarDays, X, Loader2, Send, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMuralFotos, useMuralFotoMutation, useDeleteMuralFoto, useTurmas } from "@/hooks/useSupabaseData";
import { type MuralFoto } from "@/lib/store";
import { compressImage } from "@/lib/utils";
import { uploadFile } from "@/lib/supabaseStore";

export default function MuralFotos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: fotos = [], isLoading } = useMuralFotos();
  const { data: turmas = [] } = useTurmas();
  const mutation = useMuralFotoMutation();
  const deleteMutation = useDeleteMuralFoto();
  
  const [viewFoto, setViewFoto] = useState<MuralFoto | null>(null);
  const [resumo, setResumo] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  
  // Novo State para Foto Dinâmica
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Força refetch ao entrar na página para garantir que a RLS do banco
  // seja sempre consultada — usuários removidos de turmas não verão
  // fotos daquela turma assim que abrirem o mural novamente.
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["turmas"] });
    queryClient.invalidateQueries({ queryKey: ["mural_fotos"] });
  }, []);

  const fotosVisiveis = useMemo(() => {
    // Dupla camada de segurança:
    // 1. RLS do banco já filtra fotos por ownership/membership ao buscar
    // 2. Frontend filtra pelo conjunto de turmas atuais do usuário
    //    (cobre o caso de cache desatualizado após remoção de acesso)
    const turmasIds = new Set(turmas.map(t => t.id));
    return fotos.filter((f) => !f.turmaId || turmasIds.has(f.turmaId));
  }, [fotos, turmas]);

  // Agrupamento por mÃªs
  const groupedFotos = useMemo(() => {
    const groups: Record<string, { label: string; items: MuralFoto[] }> = {};
    
    // Ordena por data (mais recente primeiro)
    const sorted = [...fotosVisiveis].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    sorted.forEach(f => {
      const d = new Date(f.data);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = {
          label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
          items: []
        };
      }
      groups[key].items.push(f);
    });
    
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [fotosVisiveis]);

  const handleShare = async (foto: MuralFoto) => {
    if (!navigator.share) {
      toast.error("Compartilhamento nÃ£o suportado neste navegador");
      return;
    }

    const toastId = toast.loading("Preparando foto para compartilhar...");
    try {
      setIsSharing(true);
      
      // 1. Busca a imagem como Blob
      const response = await fetch(foto.url);
      const blob = await response.blob();
      
      // 2. Cria o arquivo com nome baseado na legenda
      const fileName = `${(foto.legenda || "foto").replace(/\s+/g, "_")}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      // 3. Verifica se pode compartilhar arquivos
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: foto.legenda || "Foto do Mural",
          text: foto.resumo || ""
        });
        toast.success("Pronto!", { id: toastId });
      } else {
        // Fallback para link se nÃ£o puder compartilhar arquivo
        await navigator.share({
          title: foto.legenda || "Foto do Mural",
          text: foto.resumo || "",
          url: foto.url
        });
        toast.success("Link compartilhado!", { id: toastId });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Share error:", error);
        toast.error("Erro ao preparar foto para envio", { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const toastId = toast.loading("Preparando câmera...");
      try {
        // COMRIME IMEDIATAMENTE para evitar gargalos e memory crashes (OOM) no Safari/Chrome Mobile
        const compressedBlob = await compressImage(f, 800, 0.7);
        const finalFile = new File([compressedBlob], "photo.jpg", { type: "image/jpeg" });
        const preview = URL.createObjectURL(finalFile);
        
        setPendingFile({ file: finalFile, preview });
        setResumo(""); // reseta legenda
        
        if (turmas.length === 1) {
          setSelectedTurmaId(turmas[0].id);
        } else if (turmas.length > 1 && !selectedTurmaId) {
          setSelectedTurmaId(turmas[0].id);
        }
        toast.dismiss(toastId);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao otimizar foto. Tente novamente.", { id: toastId });
      }
    }
  };

  const clearPendingFile = () => {
    if (pendingFile) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
    if (cameraRef.current) cameraRef.current.value = '';
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePublish = async () => {
    if (!pendingFile) return;
    const turmaIdToUse = turmas.length === 1 ? turmas[0].id : selectedTurmaId;
    
    if (!turmaIdToUse) {
      toast.error("Por favor, selecione uma turma");
      return;
    }
    
    setIsPublishing(true);
    const toastId = toast.loading("Salvando foto...");
    
    try {
      // Já está comprimido! Fazemos o upload direto!
      const fileName = `${crypto.randomUUID()}.jpg`;
      const finalUrl = await uploadFile(pendingFile.file, "mural", fileName);
      
      const nova: MuralFoto = {
        id: crypto.randomUUID(),
        url: finalUrl,
        legenda: resumo.trim() || "Nova Foto",
        resumo: resumo.trim(),
        data: new Date().toISOString(),
        criadoEm: new Date().toISOString(),
        turmaId: turmaIdToUse
      };
      
      await mutation.mutateAsync(nova);
      clearPendingFile();
      toast.success("Foto postada com sucesso!", { id: toastId });
    } catch(e: any) {
      toast.error("Erro ao publicar: " + e.message, { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setViewFoto(null);
      toast.success("Foto removida!");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mural de Fotos</h1>
          <p className="text-xs text-muted-foreground">{fotosVisiveis.length} fotos</p>
        </div>
      </div>

      {/* Modern Picture Inputs */}
      <div className="grid grid-cols-2 gap-3 animate-float-up">
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <Camera className="w-7 h-7" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-foreground">Tirar Foto</span>
        </button>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] bg-gradient-to-b from-gold/10 to-transparent border border-gold/20 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-gold text-white rounded-full flex items-center justify-center shadow-lg shadow-gold/30">
            <ImageIcon className="w-7 h-7" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-foreground">Galeria</span>
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {fotosVisiveis.length === 0 ? (
        <div className="empty-state animate-float-up" style={{ animationDelay: '100ms' }}>
          <div className="icon-box bg-primary/15 text-primary mx-auto mb-3"><ImageIcon className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhuma foto adicionada</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {groupedFotos.map(([key, group], groupIdx) => (
            <div key={key} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h2 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {group.label}
                </h2>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] font-bold text-muted-foreground">{group.items.length} fotos</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2.5">
                {group.items.map((foto, i) => (
                  <button 
                    key={foto.id} 
                    onClick={() => setViewFoto(foto)} 
                    className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-all active:scale-[0.97] animate-float-up group" 
                    style={{ animationDelay: `${(groupIdx * 3 + i) * 40}ms` }}
                  >
                    <img src={foto.url} alt={foto.legenda} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                      <div className="bg-white/90 backdrop-blur-sm text-[9px] font-black text-primary px-1.5 py-0.5 rounded-lg shadow-sm border border-primary/10">
                        Dia {new Date(foto.data).getDate()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Post Creator Dialog */}
      <Dialog open={!!pendingFile} onOpenChange={(o) => { if(!o && !isPublishing) clearPendingFile(); }}>
        <DialogContent className="fixed inset-0 min-h-[100dvh] w-full max-w-none m-0 p-0 rounded-none bg-black flex flex-col z-[100] border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:max-w-none">
          {pendingFile && (
            <div className="flex flex-col h-[100dvh] w-full">
              {/* Image Preview Container */}
              <div className="flex-1 min-h-0 relative flex items-center justify-center bg-black">
                 <button 
                   onClick={clearPendingFile} 
                   disabled={isPublishing}
                   className="absolute top-4 right-4 z-[110] p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-colors disabled:opacity-50"
                 >
                   <X className="w-5 h-5" />
                 </button>
                 <img src={pendingFile.preview} className="w-full h-full object-contain pointer-events-none" />
              </div>

              {/* Action Panel */}
              <div className="shrink-0 bg-zinc-950 p-5 space-y-4 rounded-t-3xl border-t border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.8)] z-50 pb-8">
                 <input 
                   type="text" 
                   placeholder="Escreva uma legenda..." 
                   value={resumo} 
                   onChange={(e) => setResumo(e.target.value)} 
                   disabled={isPublishing}
                   className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-white/40 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-5 text-[15px] rounded-xl outline-none transition-all disabled:opacity-50" 
                 />
                 
                 {turmas.length > 1 ? (
                    <div className="relative">
                      <select 
                        value={selectedTurmaId} 
                        onChange={(e) => setSelectedTurmaId(e.target.value)} 
                        disabled={isPublishing}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white focus:border-primary h-12 px-5 text-[15px] rounded-xl appearance-none outline-none transition-all disabled:opacity-50"
                      >
                         <option value="" disabled className="bg-zinc-900 text-zinc-400">-- Para qual turma? --</option>
                         {turmas.map(t => (
                           <option key={t.id} value={t.id} className="bg-zinc-900 text-white">{t.nome}</option>
                         ))}
                      </select>
                      <Users className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                    </div>
                 ) : turmas.length === 1 ? (
                    <div className="text-white/60 text-xs text-center flex justify-center items-center gap-1.5 py-1">
                      <Users className="w-4 h-4 text-primary"/>
                      Será publicado diretamente para <strong className="text-white shrink-0 truncate max-w-[200px]">{turmas[0].nome}</strong>
                    </div>
                 ) : (
                    <div className="text-red-400/80 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-xs text-center font-medium">
                      Você precisa estar em uma turma para postar.
                    </div>
                 )}

                 <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={clearPendingFile} 
                      disabled={isPublishing}
                      className="flex-1 h-12 text-white font-bold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex justify-center gap-2 items-center transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                       <Trash2 className="w-[18px] h-[18px] text-red-500"/>
                    </button>
                    <button 
                      onClick={handlePublish} 
                      disabled={isPublishing || turmas.length === 0} 
                      className="flex-[3] h-12 text-primary-foreground font-black bg-primary hover:bg-primary/90 rounded-xl flex justify-center gap-2 items-center transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                    >
                       {isPublishing ? <Loader2 className="w-[18px] h-[18px] animate-spin"/> : <Send className="w-[18px] h-[18px]"/>} 
                       {isPublishing ? "Salvando..." : "Salvar no Mural"}
                    </button>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewFoto} onOpenChange={() => setViewFoto(null)}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden max-w-sm border-border/30">
          {viewFoto && (
            <div>
              <img src={viewFoto.url} alt={viewFoto.legenda} className="w-full max-h-[60vh] object-contain bg-foreground/5" />
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground leading-tight">{viewFoto.legenda}</p>
                  {viewFoto.resumo && <p className="text-xs text-muted-foreground leading-relaxed">{viewFoto.resumo}</p>}
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest pt-1">
                    {new Date(viewFoto.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleShare(viewFoto)}
                    disabled={isSharing}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-2.5 rounded-xl hover:bg-primary/20 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    <Share2 className="h-4 w-4" /> {isSharing ? "Aguarde..." : "Compartilhar"}
                  </button>
                  <button 
                    onClick={() => handleDelete(viewFoto.id)} 
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-2 text-destructive bg-destructive/5 px-4 py-2.5 rounded-xl hover:bg-destructive/10 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> {deleteMutation.isPending ? "" : ""}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
