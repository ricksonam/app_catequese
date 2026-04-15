import { ArrowLeft, Image as ImageIcon, Trash2, Camera, Share2, CalendarDays, X, Check, Loader2, Send, Users, Sparkles, User, UserCircle, Aperture } from "lucide-react";
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
import { Studio } from "@/components/Studio";

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
  
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  
  const [isPublishing, setIsPublishing] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startStudio = () => {
    if (selectedIds.length > 0) {
      setStudioPhotos(fotos.filter(f => selectedIds.includes(f.id)));
      setSelectedIds([]);
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
      toast.info("Marque as caixinhas nas fotos e clique neste botão novamente!");
    }
  };

  const [studioPhotos, setStudioPhotos] = useState<MuralFoto[] | null>(null);

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
        
           setPendingFile({ file: finalFile, preview });

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
    setPendingFile(null);
    if (cameraRef.current) cameraRef.current.value = '';
    if (fileRef.current) fileRef.current.value = '';
  };

  // Publisher function for BOTH Normal photos and Editor photos
  const publishPhoto = async (blob: Blob, legendaSalva: string, isCriatividade: boolean) => {
    const turmaIdToUse = turmas.length === 1 ? turmas[0].id : selectedTurmaId;
    if (!turmaIdToUse) {
      toast.error("Por favor, selecione uma turma nas opções.");
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
            <h1 className="text-xl font-bold text-foreground">Mural de fotos</h1>
            <p className="text-xs text-muted-foreground">{fotosTurma.length + fotosCriatividades.length} memórias</p>
          </div>
        </div>
        <button 
          onClick={startStudio}
          className={`p-2.5 px-4 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-sm ${selectedIds.length > 0 ? 'bg-primary text-white scale-105 shadow-xl shadow-primary/30' : 'bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary hover:bg-primary/20'}`}
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">
            {selectedIds.length > 0 ? `Ao Estúdio (${selectedIds.length})` : "Estúdio"}
          </span>
        </button>
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
                   
                   <div className="grid grid-cols-4 gap-2">
                     {group.items.map((foto, i) => {
                       const isSelected = selectedIds.includes(foto.id);
                       return (
                         <div className="relative aspect-square">
                         <button 
                           onClick={() => setViewFoto(foto)} 
                           className={`w-full h-full relative rounded-xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-all active:scale-[0.97] animate-float-up group ${isSelected ? 'ring-4 ring-primary ring-inset' : ''}`} 
                           style={{ animationDelay: `${(groupIdx * 4 + i) * 30}ms` }}
                         >
                           <img src={foto.url} alt={foto.legenda} className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-90 opacity-80' : 'group-hover:scale-110'}`} />
                           {isSelected && (
                             <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px] pointer-events-none">
                             </div>
                           )}
                         </button>
                         {isSelectionMode && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(foto.id);
                              }}
                              className={`absolute top-2 right-2 w-7 h-7 rounded-full border-[2.5px] border-white shadow-xl flex items-center justify-center z-10 transition-all ${isSelected ? 'bg-primary scale-110' : 'bg-black/50 hover:bg-black/70 backdrop-blur-md'}`}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                            </button>
                          )}
                         </div>
                       );
                     })}
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

      {/* FIXED BOTTOM ACTION BAR - FLOATING BUTTONS */}
      {!viewFoto && !pendingFile && !editorFile && !studioPhotos && (
        <div className="fixed bottom-10 left-0 right-0 px-6 z-[90] flex items-center justify-between pointer-events-none pb-safe">
          <div className="flex-1 flex justify-start pointer-events-auto">
            <button 
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 flex flex-col items-center justify-center rounded-2xl bg-white border-2 border-primary/20 shadow-xl text-primary hover:bg-primary/5 transition-all active:scale-90 animate-in fade-in slide-in-from-left-4 duration-500"
            >
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Galeria</span>
            </button>
          </div>
          
          <div className="flex-0 pointer-events-auto relative mt-2">
            <button 
              onClick={() => cameraRef.current?.click()}
              className="w-20 h-20 flex items-center justify-center rounded-full bg-white text-primary border border-zinc-200 shadow-2xl transition-all active:scale-95 group relative"
            >
              <div className="absolute inset-1.5 rounded-full border-[5px] border-primary group-hover:bg-primary group-hover:border-primary/10 transition-all duration-300"></div>
              <Camera className="w-7 h-7 relative z-10 group-hover:text-white transition-colors duration-300" strokeWidth={2.5} />
            </button>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-primary drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] pointer-events-none whitespace-nowrap">
               FOTO
            </span>
          </div>

          <div className="flex-1" />
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, false)} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, false)} />

      {/* Studio Modal */}
      {studioPhotos && (
        <Studio 
          photos={studioPhotos}
          onClose={() => setStudioPhotos(null)}
          onSave={(blob, legenda) => publishPhoto(blob, legenda, true)}
        />
      )}

      {/* Normal Post Dialog - Fixed Overlay (No Radix override issues) */}
      {pendingFile && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black h-[100dvh] w-full animate-in fade-in duration-300 overflow-hidden">
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 min-h-[40vh] relative flex items-center justify-center bg-zinc-900/50">
                 <button 
                   onClick={clearFiles} 
                   disabled={isPublishing}
                   className="absolute top-6 right-6 z-[110] p-4 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-xl transition-all active:scale-95 disabled:opacity-50 border border-white/10"
                 >
                   <X className="w-6 h-6" />
                 </button>
                 <div className="w-full h-full p-4 flex items-center justify-center">
                   <img src={pendingFile.preview} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black/50" />
                 </div>
              </div>

              <div className="shrink-0 bg-white p-6 space-y-5 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-50 animate-in slide-in-from-bottom-full duration-500 max-h-[60dvh] overflow-y-auto pb-10 overscroll-contain">
                 <div className="space-y-4">
                   <h3 className="text-xl font-black text-foreground text-center">Registrar Memória</h3>
                   
                   <input 
                     type="text" 
                     placeholder="Dê um nome ou legenda para esta foto..." 
                     value={resumo} 
                     onChange={(e) => setResumo(e.target.value)} 
                     disabled={isPublishing}
                     className="w-full bg-zinc-100 border-2 border-transparent focus:border-primary focus:bg-white text-foreground placeholder-zinc-400 h-14 px-6 text-[16px] rounded-2xl outline-none transition-all disabled:opacity-50 font-medium" 
                   />
                   
                   {turmas.length > 1 ? (
                      <div className="relative">
                        <select 
                          value={selectedTurmaId} 
                          onChange={(e) => setSelectedTurmaId(e.target.value)} 
                          disabled={isPublishing}
                          className="w-full bg-zinc-100 border-2 border-transparent focus:border-primary h-14 px-6 text-[16px] rounded-2xl appearance-none outline-none transition-all disabled:opacity-50 font-bold text-primary"
                        >
                           <option value="" disabled>Selecione a Turma</option>
                           {turmas.map(t => (
                             <option key={t.id} value={t.id}>{t.nome}</option>
                           ))}
                        </select>
                        <Users className="w-6 h-6 absolute right-5 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" />
                      </div>
                   ) : turmas.length === 1 ? (
                      <div className="bg-primary/5 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary"/>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-black text-primary/60 tracking-widest">Postando em</span>
                          <span className="text-sm font-bold text-foreground">{turmas[0].nome}</span>
                        </div>
                      </div>
                   ) : null}
                 </div>

                 <button 
                   onClick={() => publishPhoto(pendingFile.file, resumo, false)} 
                   disabled={isPublishing || turmas.length === 0} 
                   className="w-full h-16 text-white font-black bg-gradient-to-r from-primary to-accent rounded-2xl flex justify-center gap-3 items-center transition-all active:scale-[0.98] shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none text-lg"
                 >
                    {isPublishing ? <Loader2 className="w-6 h-6 animate-spin"/> : <Send className="w-6 h-6"/>} 
                    {isPublishing ? "Salvando..." : "Salvar no Mural"}
                 </button>
              </div>
            </div>
        </div>
      )}

      {/* View dialog for both Types */}
      <Dialog open={!!viewFoto} onOpenChange={() => setViewFoto(null)}>
        <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-md border-border/30 bg-background/95 backdrop-blur-3xl shadow-2xl">
          {viewFoto && (
            <div className="relative">
              <button onClick={() => setViewFoto(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full hover:bg-black/60"><X className="w-5 h-5"/></button>
              
              <div className="h-[50vh] w-full bg-black flex items-center justify-center overflow-hidden">
                <img src={viewFoto.url} alt={viewFoto.legenda} className="max-w-full max-h-full object-contain" />
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

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => {
                      setViewFoto(null);
                      setStudioPhotos([viewFoto]);
                    }}
                    className="flex flex-col items-center justify-center gap-1 bg-primary/10 text-primary py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-primary/20"
                  >
                    <Sparkles className="w-4 h-4" /> Estúdio
                  </button>
                  <button 
                    onClick={() => handleShare(viewFoto)}
                    disabled={isSharing}
                    className="flex flex-col items-center justify-center gap-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Compartilhar
                  </button>
                  <button 
                    onClick={() => handleDelete(viewFoto.id)} 
                    disabled={deleteMutation.isPending}
                    className="flex flex-col items-center justify-center gap-1 text-destructive bg-destructive/10 py-3 rounded-2xl hover:bg-destructive/20 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
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
