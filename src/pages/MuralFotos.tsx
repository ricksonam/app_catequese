import { ArrowLeft, Plus, Image as ImageIcon, Trash2, Camera, Share2, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMuralFotos, useMuralFotoMutation, useDeleteMuralFoto } from "@/hooks/useSupabaseData";
import { ImagePicker } from "@/components/ImagePicker";
import { type MuralFoto } from "@/lib/store";

export default function MuralFotos() {
  const navigate = useNavigate();
  const { data: fotos = [], isLoading } = useMuralFotos();
  const mutation = useMuralFotoMutation();
  const deleteMutation = useDeleteMuralFoto();
  
  const [viewFoto, setViewFoto] = useState<MuralFoto | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [resumo, setResumo] = useState("");
  const [showResumoDialog, setShowResumoDialog] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Agrupamento por mÃªs
  const groupedFotos = useMemo(() => {
    const groups: Record<string, { label: string; items: MuralFoto[] }> = {};
    
    // Ordena por data (mais recente primeiro)
    const sorted = [...fotos].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
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
  }, [fotos]);

  const handleShare = async (foto: MuralFoto) => {
    if (!navigator.share) {
      toast.error("Compartilhamento nÃ£o suportado neste navegador");
      return;
    }

    try {
      setIsSharing(true);
      await navigator.share({
        title: foto.legenda || "Foto do Mural",
        text: foto.resumo || "Confira este momento da nossa catequese!",
        url: foto.url
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error("Erro ao compartilhar");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleImagePicked = (url: string) => {
    setPendingUrl(url);
    setResumo("");
    setShowResumoDialog(true);
  };

  const handleSaveFoto = async () => {
    if (!pendingUrl) return;
    const nova: MuralFoto = {
      id: crypto.randomUUID(),
      url: pendingUrl,
      legenda: resumo.split('\n')[0] || "Foto",
      resumo: resumo,
      data: new Date().toISOString(),
      criadoEm: new Date().toISOString(),
    };
    
    try {
      await mutation.mutateAsync(nova);
      setPendingUrl(null);
      setResumo("");
      setShowResumoDialog(false);
      toast.success("Foto adicionada ao mural!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
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
          <p className="text-xs text-muted-foreground">{fotos.length} fotos</p>
        </div>
      </div>

      <div className="float-card p-5 animate-float-up">
        <ImagePicker 
          onImageUpload={handleImagePicked} 
          folder="mural" 
          label="Adicionar Nova Foto"
          className="w-full"
        />
      </div>

      {fotos.length === 0 ? (
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

      {/* Resumo dialog */}
      <Dialog open={showResumoDialog} onOpenChange={(o) => { if (!o) { setShowResumoDialog(false); setPendingUrl(null); } }}>
        <DialogContent className="rounded-2xl max-w-sm border-border/30">
          <div className="space-y-4">
            {pendingUrl && (
              <img src={pendingUrl} className="w-full max-h-48 object-contain rounded-xl bg-muted" alt="" />
            )}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Legenda/Resumo (opcional)</label>
              <textarea
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                className="form-input min-h-[80px] resize-none"
                placeholder="Descreva o momento..."
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowResumoDialog(false); setPendingUrl(null); }} 
                disabled={mutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button onClick={handleSaveFoto} disabled={mutation.isPending} className="flex-1 action-btn">
                {mutation.isPending ? "Salvando..." : "Postar no Mural"}
              </button>
            </div>
          </div>
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
