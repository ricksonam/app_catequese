import { ArrowLeft, Image as ImageIcon, Trash2, Share2, CalendarDays, X as XIcon, Check, Loader2, Send, Users, Sparkles, User, UserCircle, BookOpen, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMuralFotos, useMuralFotoMutation, useDeleteMuralFoto, useTurmas, useCatequizandos, useEncontros, useAtividades } from "@/hooks/useSupabaseData";
import { type MuralFoto } from "@/lib/store";
import { compressImage } from "@/lib/utils";
import { uploadFile } from "@/lib/supabaseStore";
import { Studio } from "@/components/Studio";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";


export default function MuralFotos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: fotos = [], isLoading } = useMuralFotos();
  const { data: turmas = [] } = useTurmas();
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: encontros = [] } = useEncontros();
  const { data: atividades = [] } = useAtividades();
  const mutation = useMuralFotoMutation();
  const deleteMutation = useDeleteMuralFoto();
  
  const [viewFoto, setViewFoto] = useState<MuralFoto | null>(null);
  const [viewPerfil, setViewPerfil] = useState<any>(null);
  const [resumo, setResumo] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("turma");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);
  const [selectedTurmaPerfilId, setSelectedTurmaPerfilId] = useState<string>("all");

  // Referência do encontro/atividade para a foto que está sendo importada
  const [selectedReferenciaId, setSelectedReferenciaId] = useState<string>("");
  const [selectedReferenciaTipo, setSelectedReferenciaTipo] = useState<'encontro' | 'atividade' | ''>("");
  const [selectedReferenciaNome, setSelectedReferenciaNome] = useState<string>("");
  const [selectedDataFoto, setSelectedDataFoto] = useState<string>(
    new Date().toLocaleDateString('en-CA') // Retorna YYYY-MM-DD no fuso horário local
  );
  const [isReferenciaModalOpen, setIsReferenciaModalOpen] = useState(false);

  const activeTurmaId = useMemo(() => localStorage.getItem("ivc_selected_turma") || "all", []);

  useEffect(() => {
    if (activeTurmaId !== "all") {
      setSelectedTurmaPerfilId(activeTurmaId);
      setSelectedTurmaId(activeTurmaId);
    } else if (turmas.length === 1) {
      setSelectedTurmaPerfilId(turmas[0].id);
      setSelectedTurmaId(turmas[0].id);
    }
  }, [turmas, activeTurmaId]);
  
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
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
    queryClient.invalidateQueries({ queryKey: ["encontros"] });
    queryClient.invalidateQueries({ queryKey: ["atividades"] });
  }, []);

  const turmasIds = useMemo(() => new Set(turmas.map(t => t.id)), [turmas]);

  // Separate photos into common vs creativity - filtered by active turma
  const fotosTurma = useMemo(() => {
    return fotos.filter((f) => {
      const isCorrectType = f.tipo !== 'criatividade';
      const belongsToUser = !f.turmaId || turmasIds.has(f.turmaId);
      if (!isCorrectType || !belongsToUser) return false;
      if (activeTurmaId === "all") return true;
      return f.turmaId === activeTurmaId;
    });
  }, [fotos, turmasIds, activeTurmaId]);

  const fotosCriatividades = useMemo(() => {
    return fotos.filter((f) => {
      const isCorrectType = f.tipo === 'criatividade';
      const belongsToUser = !f.turmaId || turmasIds.has(f.turmaId);
      if (!isCorrectType || !belongsToUser) return false;
      if (activeTurmaId === "all") return true;
      return f.turmaId === activeTurmaId;
    });
  }, [fotos, turmasIds, activeTurmaId]);

  // Catequizandos Perfis - filtered by user turmas first
  const perfis = useMemo(() => {
    const basePerfis = catequizandos.filter(c => turmasIds.has(c.turmaId));
    if (activeTurmaId === "all") return basePerfis;
    return basePerfis.filter(c => c.turmaId === activeTurmaId);
  }, [catequizandos, turmasIds, activeTurmaId]);

  const perfisFiltrados = useMemo(() => {
    if (selectedTurmaPerfilId === "all") return perfis;
    return perfis.filter(c => c.turmaId === selectedTurmaPerfilId);
  }, [perfis, selectedTurmaPerfilId]);

  // Encontros filtrados para a turma selecionada
  const encontrosFiltrados = useMemo(() => {
    const turmaIdRef = selectedTurmaId || (turmas.length === 1 ? turmas[0].id : "");
    return encontros
      .filter(e => !turmaIdRef || e.turmaId === turmaIdRef)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [encontros, selectedTurmaId, turmas]);

  const atividadesFiltradas = useMemo(() => {
    const turmaIdRef = selectedTurmaId || (turmas.length === 1 ? turmas[0].id : "");
    return atividades
      .filter(a => !turmaIdRef || a.turmaId === turmaIdRef)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [atividades, selectedTurmaId, turmas]);

  // Agrupamento por mês → dia
  const agruparFotos = (lista: MuralFoto[]) => {
    const months: Record<string, {
      label: string;
      days: Record<string, { dayLabel: string; dayNum: number; items: MuralFoto[] }>;
    }> = {};

    const sorted = [...lista].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    sorted.forEach(f => {
      const d = new Date(f.data);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const dayKey = `${monthKey}-${String(d.getDate()).padStart(2, '0')}`;
      const dayNum = d.getDate();
      const dayLabel = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

      if (!months[monthKey]) {
        months[monthKey] = {
          label: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
          days: {}
        };
      }
      if (!months[monthKey].days[dayKey]) {
        months[monthKey].days[dayKey] = { dayLabel, dayNum, items: [] };
      }
      months[monthKey].days[dayKey].items.push(f);
    });

    return Object.entries(months)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthKey, month]) => ({
        monthKey,
        label: month.label,
        days: Object.entries(month.days)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([dayKey, day]) => ({ dayKey, ...day }))
      }));
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const toastId = toast.loading("Carregando e otimizando arquivo...");
      try {
        const compressedBlob = await compressImage(f, 800, 0.7);
        const finalFile = new File([compressedBlob], "photo.jpg", { type: "image/jpeg" });
        const preview = URL.createObjectURL(finalFile);

        setPendingFile({ file: finalFile, preview });
        setResumo("");
        setSelectedReferenciaId("");
        setSelectedReferenciaTipo("");
        setSelectedReferenciaNome("");
        setSelectedDataFoto(new Date().toLocaleDateString('en-CA'));
        
        if (turmas.length === 1) {
          setSelectedTurmaId(turmas[0].id);
        } else if (turmas.length > 1 && !selectedTurmaId) {
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
    if (fileRef.current) fileRef.current.value = '';
    setSelectedReferenciaId("");
    setSelectedReferenciaTipo("");
    setSelectedReferenciaNome("");
    setSelectedDataFoto(new Date().toLocaleDateString('en-CA'));
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
      
      const dataIso = selectedDataFoto ? new Date(selectedDataFoto + 'T12:00:00').toISOString() : new Date().toISOString();
      const nova: MuralFoto = {
        id: crypto.randomUUID(),
        url: finalUrl,
        legenda: legendaSalva.trim() || (isCriatividade ? "Minha Arte" : "Nova Foto"),
        resumo: legendaSalva.trim(),
        data: dataIso,
        criadoEm: new Date().toISOString(),
        turmaId: turmaIdToUse,
        tipo: isCriatividade ? 'criatividade' : 'comum',
        referenciaId: selectedReferenciaId || undefined,
        referenciaTipo: (selectedReferenciaTipo as 'encontro' | 'atividade') || undefined,
        referenciaNome: selectedReferenciaNome || undefined
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

  const confirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await deleteMutation.mutateAsync(photoToDelete);
      setViewFoto(null);
      setDeleteConfirmOpen(false);
      setPhotoToDelete(null);
      toast.success("Item removido com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  // Botão "Importar fotos" circular reutilizável
  const ImportButton = () => (
    <div className="flex flex-col items-center justify-center py-4">
      <button
        onClick={() => fileRef.current?.click()}
        className="w-20 h-20 flex flex-col items-center justify-center rounded-full bg-white border-2 border-primary/30 shadow-xl text-primary hover:bg-primary/5 hover:border-primary/60 hover:scale-105 transition-all active:scale-95 group"
      >
        <ImageIcon className="w-7 h-7 mb-0.5 group-hover:scale-110 transition-transform duration-300" />
      </button>
      <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary/70">Importar fotos</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
           <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando Galeria...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="page-header animate-fade-in flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-black" /></button>
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

      <Tabs defaultValue="turma" value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in">
        <TabsList className="grid w-full grid-cols-3 mb-6 mt-4 bg-muted/80 p-2 rounded-2xl shadow-sm border border-border/50">
          <TabsTrigger value="turma" className="rounded-xl text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">Turma</TabsTrigger>
          <TabsTrigger value="criatividades" className="rounded-xl text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">Criações</TabsTrigger>
          <TabsTrigger value="perfis" className="rounded-xl text-[11px] font-black uppercase tracking-wider py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-2 data-[state=active]:border-primary data-[state=active]:shadow-lg border-2 border-transparent transition-all">Perfis</TabsTrigger>
        </TabsList>

        {/* ===================== ABA TURMA ===================== */}
        <TabsContent value="turma" className="space-y-6 mt-0">
          {/* Botão Importar */}
          <ImportButton />

          {fotosTurma.length === 0 ? (
            <div className="empty-state">
              <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><ImageIcon className="h-6 w-6" /></div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma foto de turma</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupedTurma.map((month, monthIdx) => (
                <div key={month.monthKey} className="space-y-6">
                  {/* Cabeçalho do mês */}
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {month.label}
                    </h2>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>

                  {/* Dias dentro do mês */}
                  <div className="space-y-5">
                    {month.days.map((day, dayIdx) => (
                      <div key={day.dayKey} className="space-y-2">
                        {/* Separador de dia */}
                        <div className="flex items-center gap-2 px-1 mb-1">
                          <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">{day.dayLabel}</span>
                          <div className="flex-1 h-px bg-border/20" />
                          <span className="text-[10px] text-muted-foreground/50">{day.items.length} {day.items.length === 1 ? 'foto' : 'fotos'}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {day.items.map((foto, i) => {
                            const isSelected = selectedIds.includes(foto.id);
                            return (
                              <div key={foto.id} className="relative aspect-square">
                                <button 
                                  onClick={() => setViewFoto(foto)} 
                                  className={`w-full h-full relative rounded-xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-all active:scale-[0.97] animate-float-up group ${isSelected ? 'ring-4 ring-primary ring-inset' : ''}`} 
                                  style={{ animationDelay: `${(monthIdx * 20 + dayIdx * 4 + i) * 30}ms` }}
                                >
                                  <img src={foto.url} alt={foto.legenda} loading="lazy" decoding="async" className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-90 opacity-80' : 'group-hover:scale-110'}`} />
                                  {isSelected && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[1px] pointer-events-none">
                                    </div>
                                  )}
                                  {foto.referenciaNome && (
                                    <div className="absolute bottom-0 inset-x-0 px-1 py-0.5 bg-black/50 backdrop-blur-sm">
                                      <p className="text-white text-[8px] font-bold truncate">{foto.referenciaNome}</p>
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
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===================== ABA CRIATIVIDADES ===================== */}
        <TabsContent value="criatividades" className="space-y-6 mt-0">
          {/* Botão Importar */}
          <ImportButton />

          {fotosCriatividades.length === 0 ? (
            <div className="empty-state bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
              <div className="icon-box bg-gradient-to-r from-primary to-accent text-white mx-auto mb-3"><Sparkles className="h-6 w-6" /></div>
              <p className="text-sm font-black uppercase text-foreground mb-1">Galeria Vazia</p>
              <p className="text-xs text-muted-foreground text-center max-w-[200px] mx-auto">Use o Estúdio para criar edições mágicas!</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupedCriatividades.map((month, monthIdx) => (
                <div key={month.monthKey} className="space-y-6">
                  <div className="flex items-center gap-3 px-1">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
                    <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                      {month.label}
                    </h2>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>

                  <div className="space-y-5">
                    {month.days.map((day, dayIdx) => (
                      <div key={day.dayKey} className="space-y-2">
                        <div className="flex items-center gap-2 px-1 mb-1">
                          <span className="text-[10px] font-black text-primary/50 uppercase tracking-widest">{day.dayLabel}</span>
                          <div className="flex-1 h-px bg-border/20" />
                          <span className="text-[10px] text-muted-foreground/50">{day.items.length} {day.items.length === 1 ? 'criação' : 'criações'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {day.items.map((foto, i) => (
                            <button 
                              key={foto.id} 
                              onClick={() => setViewFoto(foto)} 
                              className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted shadow-md hover:shadow-xl transition-all active:scale-[0.97] animate-float-up group border border-border/5" 
                              style={{ animationDelay: `${(monthIdx * 10 + dayIdx * 4 + i) * 50}ms` }}
                            >
                              <img src={foto.url} alt={foto.legenda} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
                              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                <p className="text-white text-xs font-black truncate">{foto.legenda}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===================== ABA PERFIS ===================== */}
        <TabsContent value="perfis" className="space-y-6 mt-0">
          <div className="flex flex-col items-center gap-3">
             <h2 className="text-lg font-black text-foreground text-center px-4">
               Fotos dos perfis dos catequizandos
             </h2>
             {turmas.length > 1 && (
               <select
                 value={selectedTurmaPerfilId}
                 onChange={(e) => setSelectedTurmaPerfilId(e.target.value)}
                 className="p-2.5 px-4 rounded-xl text-sm font-bold bg-white dark:bg-zinc-800 border-2 border-primary/20 text-primary focus:outline-none focus:border-primary shadow-sm"
               >
                 <option value="all">Todas as turmas</option>
                 {turmas.map(t => (
                   <option key={t.id} value={t.id}>{t.nome}</option>
                 ))}
               </select>
             )}
          </div>

          {perfisFiltrados.length === 0 ? (
            <div className="empty-state">
              <div className="icon-box bg-muted text-muted-foreground mx-auto mb-3"><UserCircle className="h-6 w-6" /></div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum catequizando na turma</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {perfisFiltrados.map((c, i) => {
                const tNome = turmas.find(t => t.id === c.turmaId)?.nome;
                return (
                 <button 
                   key={c.id} 
                   onClick={() => {
                       if (c.foto) setViewPerfil(c);
                   }}
                   className="flex flex-col items-center gap-2 animate-float-up group" style={{ animationDelay: `${i * 30}ms` }}
                 >
                   <div className="w-full aspect-square rounded-full overflow-hidden bg-muted border-2 border-border shadow-sm group-active:scale-95 transition-all">
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
                </button>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Studio Modal */}
      {studioPhotos && (
        <Studio 
          photos={studioPhotos}
          onClose={() => setStudioPhotos(null)}
          onSave={(blob, legenda) => publishPhoto(blob, legenda, true)}
        />
      )}

      {/* Normal Post Dialog */}
      {pendingFile && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black h-[100dvh] w-full animate-in fade-in duration-300 overflow-hidden">
            <div className="flex flex-col h-full w-full">
              <div className="flex-1 min-h-[40vh] relative flex items-center justify-center bg-zinc-900/50">
                 <button 
                   onClick={clearFiles} 
                   disabled={isPublishing}
                   className="absolute top-6 right-6 z-[110] p-4 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-xl transition-all active:scale-95 disabled:opacity-50 border border-white/10"
                 >
                   <XIcon className="w-6 h-6" />
                 </button>
                 <div className="w-full h-full p-4 flex items-center justify-center">
                   <img src={pendingFile.preview} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black/50" />
                 </div>
              </div>

              <div className="shrink-0 bg-white p-6 space-y-4 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-50 animate-in slide-in-from-bottom-full duration-500 max-h-[65dvh] overflow-y-auto pb-10 overscroll-contain">
                 <div className="space-y-3">
                   <h3 className="text-xl font-black text-foreground text-center">Registrar Memória</h3>
                   
                   <input 
                     type="text" 
                     placeholder="Dê um nome ou legenda para esta foto..." 
                     value={resumo} 
                     onChange={(e) => setResumo(e.target.value)} 
                     disabled={isPublishing}
                     className="w-full bg-zinc-100 border-2 border-transparent focus:border-primary focus:bg-white text-foreground placeholder-zinc-400 h-14 px-6 text-[16px] rounded-2xl outline-none transition-all disabled:opacity-50 font-medium" 
                   />
                   
                   {/* Campos Data e Encontro/Atividade */}
                   <div className="flex flex-col sm:flex-row gap-3">
                     
                     {/* Data da foto */}
                     <div className="flex-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
                         Data do registro
                       </label>
                       <input 
                         type="date"
                         value={selectedDataFoto}
                         onChange={(e) => setSelectedDataFoto(e.target.value)}
                         disabled={isPublishing}
                         className="w-full bg-zinc-100 border-2 border-transparent focus:border-primary h-14 px-4 text-sm rounded-2xl outline-none transition-all disabled:opacity-50 font-medium text-zinc-700"
                       />
                     </div>

                     {/* Botão para abrir o Modal Premium de Referência */}
                     {(encontrosFiltrados.length > 0 || atividadesFiltradas.length > 0) && (
                       <div className="flex-[2]">
                         <label className="text-[10px] font-black uppercase text-muted-foreground mb-1 block">
                           Vincular Encontro / Atividade
                         </label>
                         <button
                           type="button"
                           onClick={() => setIsReferenciaModalOpen(true)}
                           disabled={isPublishing}
                           className="w-full bg-zinc-100 border-2 border-transparent focus:border-primary hover:bg-zinc-200 h-14 px-4 text-left rounded-2xl transition-all disabled:opacity-50 flex items-center justify-between"
                         >
                           <span className="font-medium text-zinc-700 text-sm truncate pr-2">
                             {selectedReferenciaNome || "📌 Selecione um encontro..."}
                           </span>
                           <CalendarDays className="h-4 w-4 text-zinc-400 shrink-0" />
                         </button>
                       </div>
                     )}
                   </div>
                   
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
              <button onClick={() => setViewFoto(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-full hover:bg-black/60"><XIcon className="w-5 h-5"/></button>
              
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

                  {/* Data + referência de encontro/atividade */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <p className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest">
                      {new Date(viewFoto.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    {viewFoto.referenciaNome && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {viewFoto.referenciaTipo === 'encontro' ? <BookOpen className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        {viewFoto.referenciaNome}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleShare(viewFoto)}
                    disabled={isSharing}
                    className="flex flex-col items-center justify-center gap-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Compartilhar
                  </button>
                  <button 
                    onClick={() => {
                      setPhotoToDelete(viewFoto.id);
                      setDeleteConfirmOpen(true);
                    }} 
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

      {/* Modal View Perfil Foto */}
      <Dialog open={!!viewPerfil} onOpenChange={(open) => !open && setViewPerfil(null)}>
        <DialogContent className="max-w-[400px] w-[95vw] p-0 bg-zinc-950 border-white/10 rounded-[40px] overflow-hidden gap-0">
          {viewPerfil?.foto && (
            <div className="flex flex-col h-[85dvh] max-h-[800px] bg-zinc-950">
              <div className="flex-none p-4 pb-2 flex items-center justify-between">
                <button onClick={() => setViewPerfil(null)} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md">
                  <XIcon className="w-5 h-5" />
                </button>
                <span className="text-white font-black uppercase tracking-widest text-[10px] bg-white/10 px-4 py-2 rounded-full">
                  Perfil de Turma
                </span>
                <div className="w-11" />
              </div>

              <div className="flex-1 min-h-[50vh] flex items-center justify-center overflow-hidden p-2">
                <img src={viewPerfil.foto} alt={viewPerfil.nome} className="max-w-full max-h-full object-contain rounded-xl" />
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-1 text-center">
                  <p className="text-2xl font-black text-white leading-tight">{viewPerfil.nome}</p>
                </div>

                <div className="flex justify-center pt-2">
                  <button 
                    onClick={async () => {
                        const toastId = toast.loading("Preparando compartilhamento...");
                        try {
                           const fotoData = await fetch(viewPerfil.foto).then(res => res.blob());
                           const file = new File([fotoData], "perfil.jpg", { type: "image/jpeg" });
                           if (navigator.canShare && navigator.canShare({ files: [file] })) {
                             await navigator.share({
                               files: [file],
                               title: "Catequizando " + viewPerfil.nome
                             });
                           } else {
                             await navigator.share({
                               title: viewPerfil.nome,
                               url: viewPerfil.foto
                             });
                           }
                           toast.success("Enviado!", { id: toastId });
                        } catch (e) { toast.dismiss(toastId); }
                    }}
                    className="flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white min-w-[200px] py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all"
                  >
                    <Share2 className="w-5 h-5" /> Compartilhar
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <DeleteConfirmationDialog 
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Apagar Foto"
        description="Tem certeza que deseja apagar esta foto permanentemente do mural?"
        isLoading={deleteMutation.isPending}
      />

      {/* Dialog Premium para seleção de referência */}
      <Dialog open={isReferenciaModalOpen} onOpenChange={setIsReferenciaModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-border/50">
          <div className="p-6 pb-2 border-b border-border/30 bg-muted/20">
            <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Vincular a um Evento</h2>
            <p className="text-sm text-muted-foreground mt-1">Selecione o encontro ou atividade que esta foto registra.</p>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-6 bg-background">
            {encontrosFiltrados.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <BookOpen className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Encontros da Turma</h3>
                </div>
                <div className="grid gap-2">
                  {encontrosFiltrados.map(e => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setSelectedReferenciaId(e.id);
                        setSelectedReferenciaTipo('encontro');
                        setSelectedReferenciaNome(e.tema);
                        setIsReferenciaModalOpen(false);
                      }}
                      className={`flex flex-col text-left p-3 rounded-2xl border-2 transition-all ${
                        selectedReferenciaId === e.id 
                          ? 'border-primary bg-primary/10 shadow-sm' 
                          : 'border-transparent bg-muted/40 hover:bg-muted/70 hover:scale-[1.01]'
                      }`}
                    >
                      <span className="text-sm font-bold text-foreground line-clamp-1">{e.tema}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">
                        {new Date(e.data).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {atividadesFiltradas.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-primary">
                  <Activity className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Atividades e Eventos</h3>
                </div>
                <div className="grid gap-2">
                  {atividadesFiltradas.map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedReferenciaId(a.id);
                        setSelectedReferenciaTipo('atividade');
                        setSelectedReferenciaNome(a.nome);
                        setIsReferenciaModalOpen(false);
                      }}
                      className={`flex flex-col text-left p-3 rounded-2xl border-2 transition-all ${
                        selectedReferenciaId === a.id 
                          ? 'border-primary bg-primary/10 shadow-sm' 
                          : 'border-transparent bg-muted/40 hover:bg-muted/70 hover:scale-[1.01]'
                      }`}
                    >
                      <span className="text-sm font-bold text-foreground line-clamp-1">{a.nome}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase mt-0.5">
                        {new Date(a.data).toLocaleDateString("pt-BR")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => {
                setSelectedReferenciaId("");
                setSelectedReferenciaTipo("");
                setSelectedReferenciaNome("");
                setIsReferenciaModalOpen(false);
              }}
              className="w-full p-3 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors uppercase tracking-wider mt-4"
            >
              Nenhum / Desvincular
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
