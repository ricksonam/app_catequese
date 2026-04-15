import { ArrowLeft, Image as ImageIcon, Trash2, Camera, Share2, CalendarDays, X, Loader2, Send, Users, Sparkles, User, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMuralFotos, useMuralFotoMutation, useDeleteMuralFoto, useTurmas, useCatequizandos } from "@/hooks/useSupabaseData";
import { type MuralFoto } from "@/lib/store";
import { compressImage } from "@/lib/utils";
import { uploadFile } from "@/lib/supabaseStore";
import { PhotoEditor } from "@/components/PhotoEditor";

export default function MuralFotos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: fotos = [], isLoading } = useMuralFotos();
  const { data: turmas = [] } = useTurmas();
  // Fetch catequizandos without a specific turma to be filtered later
  const { data: catequizandos = [] } = useCatequizandos();
  const mutation = useMuralFotoMutation();
  const deleteMutation = useDeleteMuralFoto();
  
  const [viewFoto, setViewFoto] = useState<MuralFoto | null>(null);
  const [resumo, setResumo] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  
  // State for normal post creator
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  // State for Photo Editor flow
  const [editorFile, setEditorFile] = useState<{ file: File; preview: string } | null>(null);
  
  const [isPublishing, setIsPublishing] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editorFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["turmas"] });
    queryClient.invalidateQueries({ queryKey: ["mural_fotos"] });
    queryClient.invalidateQueries({ queryKey: ["catequizandos"] });
  }, []);

  const turmasIds = useMemo(() => new Set(turmas.map(t => t.id)), [turmas]);

  // Separate photos into common vs creativity
  const fotosTurma = useMemo(() => {
    return fotos.filter((f) => (!f.turmaId || turmasIds.has(f.turmaId)) && f.tipo !== 'criatividade');
  }, [fotos, turmasIds]);

  const fotosCriatividades = useMemo(() => {
    return fotos.filter((f) => (!f.turmaId || turmasIds.has(f.turmaId)) && f.tipo === 'criatividade');
  }, [fotos, turmasIds]);

  // Catequizandos Perfis
  const perfis = useMemo(() => {
    return catequizandos.filter(c => turmasIds.has(c.turmaId));
  }, [catequizandos, turmasIds]);

  const agruparFotos = (lista: MuralFoto[]) => {
    const groups: Record<string, { label: string; items: MuralFoto[] }> = {};
    const sorted = [...lista].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
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
  };

  const groupedTurma = useMemo(() => agruparFotos(fotosTurma), [fotosTurma]);
  const groupedCriatividades = useMemo(() => agruparFotos(fotosCriatividades), [fotosCriatividades]);

  const handleShare = async (foto: MuralFoto) => {
    if (!navigator.share) {
      toast.error("Compartilhamento não suportado neste navegador");
      return;
    }
    const toastId = toast.loading("Preparando foto para compartilhar...");
    try {
      setIsSharing(true);
      const response = await fetch(foto.url);
      const blob = await response.blob();
      const fileName = `${(foto.legenda || "foto").replace(/\s+/g, "_")}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: foto.legenda || "Estúdio Mágico iCatequese",
          text: foto.resumo || ""
        });
        toast.success("Pronto!", { id: toastId });
      } else {
        await navigator.share({
          title: foto.legenda || "Foto",
          text: foto.resumo || "",
          url: foto.url
        });
        toast.success("Link compartilhado!", { id: toastId });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error("Erro ao preparar foto", { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEditorFlow: boolean = false) => {
    const f = e.target.files?.[0];
    if (f) {
      const toastId = toast.loading("Preparando câmera...");
      try {
        const compressedBlob = await compressImage(f, 800, 0.7);
        const finalFile = new File([compressedBlob], "photo.jpg", { type: "image/jpeg" });
        const preview = URL.createObjectURL(finalFile);
        
        if (isEditorFlow) {
           setEditorFile({ file: finalFile, preview });
        } else {
           setPendingFile({ file: finalFile, preview });
        }

        setResumo(""); // reseta legenda
        
        if (turmas.length === 1) {
          setSelectedTurmaId(turmas[0].id);
        } else if (turmas.length > 1 && !selectedTurmaId) {
           // Seleciona a primeira turma por padrão
          setSelectedTurmaId(turmas[0].id);
        }
        toast.dismiss(toastId);
      } catch (err) {
        toast.error("Erro ao otimizar foto.", { id: toastId });
      }
    }
  };

  const clearFiles = () => {
    if (pendingFile) URL.revokeObjectURL(pendingFile.preview);
    if (editorFile) URL.revokeObjectURL(editorFile.preview);
    setPendingFile(null);
    setEditorFile(null);
    if (cameraRef.current) cameraRef.current.value = '';
    if (fileRef.current) fileRef.current.value = '';
    if (editorFileRef.current) editorFileRef.current.value = '';
  };

  // Publisher function for BOTH Normal photos and Editor photos
  const publishPhoto = async (blob: Blob, legendaSalva: string, isCriatividade: boolean) => {
    const turmaIdToUse = turmas.length === 1 ? turmas[0].id : selectedTurmaId;
    if (!turmaIdToUse) {
      toast.error("Por favor, selecione uma turma nas opções.");
      if (pendingFile) {} // Show fallback selection if needed, but in Editor we might not have the select UI easily accessible.
      return;
    }
    
    setIsPublishing(true);
    const toastId = toast.loading("Publicando no Mural...");
    
    try {
      const fileName = `${crypto.randomUUID()}-${isCriatividade ? 'criatividade' : 'comum'}.jpg`;
      const finalUrl = await uploadFile(blob, "mural", fileName);
      
      const nova: MuralFoto = {
        id: crypto.randomUUID(),
        url: finalUrl,
        legenda: legendaSalva.trim() || (isCriatividade ? "Minha Arte" : "Nova Foto"),
        resumo: legendaSalva.trim(),
        data: new Date().toISOString(),
        criadoEm: new Date().toISOString(),
        turmaId: turmaIdToUse,
        tipo: isCriatividade ? 'criatividade' : 'comum'
      };
      
      await mutation.mutateAsync(nova);
      clearFiles();
      toast.success("Sucesso! Item publicado no mural.", { id: toastId });
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
      toast.success("Item removido com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-4 pb-32">
      <div className="page-header animate-fade-in flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mural Smart</h1>
            <p className="text-xs text-muted-foreground">{fotosTurma.length + fotosCriatividades.length} memórias</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="turma" className="w-full animate-fade-in">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/60 p-1.5 rounded-2xl">
          <TabsTrigger value="turma" className="rounded-xl text-xs font-bold uppercase tracking-wider py-2">Turma</TabsTrigger>
          <TabsTrigger value="criatividades" className="rounded-xl text-xs font-bold uppercase tracking-wider py-2">Criações</TabsTrigger>
          <TabsTrigger value="perfis" className="rounded-xl text-xs font-bold uppercase tracking-wider py-2">Perfis</TabsTrigger>
        </TabsList>

        {/* ===================== ABA TURMA ===================== */}
        <TabsContent value="turma" className="space-y-6 mt-0">
          {fotosTurma.length === 0 ? (
            <div className="empty-state">
              <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><ImageIcon className="h-6 w-6" /></div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma foto de turma</p>
            </div>
          ) : (
             <div className="space-y-8">
               {groupedTurma.map(([key, group], groupIdx) => (
                 <div key={key} className="space-y-4">
                   <div className="flex items-center gap-3 px-1">
                     <div className="w-1.5 h-6 bg-primary rounded-full" />
                     <h2 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                       <CalendarDays className="h-4 w-4 text-primary" />
                       {group.label}
                     </h2>
                     <div className="flex-1 h-px bg-border/40" />
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
                       </button>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          )}
        </TabsContent>

        {/* ===================== ABA CRIATIVIDADES ===================== */}
        <TabsContent value="criatividades" className="space-y-6 mt-0">
          {fotosCriatividades.length === 0 ? (
            <div className="empty-state bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
              <div className="icon-box bg-gradient-to-r from-primary to-accent text-white mx-auto mb-3"><Sparkles className="h-6 w-6" /></div>
              <p className="text-sm font-black uppercase text-foreground mb-1">Galeria Vazia</p>
              <p className="text-xs text-muted-foreground text-center max-w-[200px] mx-auto">Use o Estúdio para criar edições mágicas!</p>
            </div>
          ) : (
            <div className="space-y-8">
               {groupedCriatividades.map(([key, group], groupIdx) => (
                 <div key={key} className="space-y-4">
                   <div className="flex items-center gap-3 px-1">
                     <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
                     <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                       {group.label}
                     </h2>
                     <div className="flex-1 h-px bg-border/40" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                     {group.items.map((foto, i) => (
                       <button 
                         key={foto.id} 
                         onClick={() => setViewFoto(foto)} 
                         className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted shadow-md hover:shadow-xl transition-all active:scale-[0.97] animate-float-up group border border-border/5" 
                         style={{ animationDelay: `${i * 50}ms` }}
                       >
                         <img src={foto.url} alt={foto.legenda} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                         <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                           <p className="text-white text-xs font-black truncate">{foto.legenda}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          )}
        </TabsContent>

        {/* ===================== ABA PERFIS ===================== */}
        <TabsContent value="perfis" className="space-y-6 mt-0">
          {perfis.length === 0 ? (
            <div className="empty-state">
              <div className="icon-box bg-muted text-muted-foreground mx-auto mb-3"><UserCircle className="h-6 w-6" /></div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum catequizando na turma</p>
            </div>
          ) : (
             <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
               {perfis.map((c, i) => {
                 const tNome = turmas.find(t => t.id === c.turmaId)?.nome;
                 return (
                 <div key={c.id} className="flex flex-col items-center gap-2 animate-float-up" style={{ animationDelay: `${i * 30}ms` }}>
                   <div className="w-full aspect-square rounded-full overflow-hidden bg-muted border-2 border-border shadow-sm">
                     {c.foto ? (
                       <img src={c.foto} alt={c.nome} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                         <User className="h-8 w-8 opacity-50" />
                       </div>
                     )}
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-bold text-foreground leading-tight line-clamp-1">{c.nome.split(' ')[0]}</p>
                     <p className="text-[9px] text-muted-foreground truncate max-w-full">{tNome}</p>
                   </div>
                 </div>
               )})}
             </div>
          )}
        </TabsContent>
      </Tabs>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-[80px] left-0 right-0 px-4 z-[90] flex justify-center pb-safe">
        <div className="bg-foreground/95 p-1.5 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-md flex items-center gap-1 border border-white/10">
          <button 
            onClick={() => fileRef.current?.click()}
            className="w-12 h-12 flex flex-col items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ImageIcon className="w-5 h-5 mb-0.5" />
            <span className="text-[8px] font-black uppercase">Galeria</span>
          </button>
          
          <button 
            onClick={() => cameraRef.current?.click()}
            className="w-12 h-12 flex flex-col items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[8px] font-black uppercase">Foto</span>
          </button>

          <div className="w-px h-8 bg-zinc-700 mx-1" />

          {/* ESTÚDIO MÁGICO BUTTON */}
          <button 
            onClick={() => editorFileRef.current?.click()}
            className="h-12 px-6 bg-gradient-to-r from-primary to-accent rounded-full flex gap-2 items-center text-white shadow-inner mx-1 ml-1 active:scale-95 transition-all hover:opacity-90 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">Estúdio</span>
          </button>
        </div>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, false)} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, false)} />
      <input ref={editorFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, true)} />

      {/* Editor Modal */}
      {editorFile && (
        <PhotoEditor 
          imageSrc={editorFile.preview}
          onClose={clearFiles}
          onSave={(blob, legenda, isCriatividade) => publishPhoto(blob, legenda, isCriatividade)}
        />
      )}

      {/* Normal Post Dialog */}
      <Dialog open={!!pendingFile} onOpenChange={(o) => { if(!o && !isPublishing) clearFiles(); }}>
        <DialogContent className="fixed inset-0 min-h-[100dvh] w-full max-w-none m-0 p-0 rounded-none bg-black flex flex-col z-[100] border-none data-[state=open]:animate-in data-[state=closed]:animate-out sm:max-w-none">
          {pendingFile && (
            <div className="flex flex-col h-[100dvh] w-full">
              <div className="flex-1 min-h-0 relative flex items-center justify-center bg-black">
                 <button 
                   onClick={clearFiles} 
                   disabled={isPublishing}
                   className="absolute top-4 right-4 z-[110] p-3 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-colors disabled:opacity-50"
                 >
                   <X className="w-5 h-5" />
                 </button>
                 <img src={pendingFile.preview} className="w-full h-full object-contain pointer-events-none" />
              </div>

              <div className="shrink-0 bg-zinc-950 p-5 space-y-4 rounded-t-3xl border-t border-zinc-800 shadow-[0_-10px_20px_rgba(0,0,0,0.8)] z-50 pb-8">
                 <input 
                   type="text" 
                   placeholder="Escreva uma legenda simples..." 
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
                      Publicar para: <strong className="text-white">{turmas[0].nome}</strong>
                    </div>
                 ) : null}

                 <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => publishPhoto(pendingFile.file, resumo, false)} 
                      disabled={isPublishing || turmas.length === 0} 
                      className="flex-1 h-12 text-primary-foreground font-black bg-primary hover:bg-primary/90 rounded-xl flex justify-center gap-2 items-center transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                    >
                       {isPublishing ? <Loader2 className="w-[18px] h-[18px] animate-spin"/> : <Send className="w-[18px] h-[18px]"/>} 
                       {isPublishing ? "Salvando..." : "Salvar no Mural Normal"}
                    </button>
                 </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View dialog for both Types */}
      <Dialog open={!!viewFoto} onOpenChange={() => setViewFoto(null)}>
        <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-md border-border/30 bg-background/95 backdrop-blur-3xl shadow-2xl">
          {viewFoto && (
            <div className="relative">
              <button onClick={() => setViewFoto(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full hover:bg-black/60"><X className="w-5 h-5"/></button>
              
              <div className="aspect-[3/4] w-full bg-black/10 flex items-center justify-center overflow-hidden">
                <img src={viewFoto.url} alt={viewFoto.legenda} className="w-full h-full object-cover" />
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  {viewFoto.tipo === 'criatividade' && (
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary/20 to-accent/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                       <Sparkles className="w-3 h-3" /> Criatividade
                    </span>
                  )}
                  <p className="text-xl font-bold text-foreground leading-tight">{viewFoto.legenda}</p>
                  {viewFoto.resumo && viewFoto.resumo !== viewFoto.legenda && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{viewFoto.resumo}</p>
                  )}
                  <p className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest pt-1">
                    {new Date(viewFoto.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleShare(viewFoto)}
                    disabled={isSharing}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                  >
                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="h-4 h-4" />} Compartilhar
                  </button>
                  <button 
                    onClick={() => handleDelete(viewFoto.id)} 
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-2 text-destructive bg-destructive/10 px-4 py-3.5 rounded-2xl hover:bg-destructive/20 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 w-4" />} Remover
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
