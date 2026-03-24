import { ArrowLeft, Plus, Image, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Foto { id: string; url: string; legenda: string; data: string; }
const FOTOS_KEY = "ivc_mural_fotos";
function getFotos(): Foto[] { return JSON.parse(localStorage.getItem(FOTOS_KEY) || "[]"); }
function saveFotos(fotos: Foto[]) { localStorage.setItem(FOTOS_KEY, JSON.stringify(fotos)); }

export default function MuralFotos() {
  const navigate = useNavigate();
  const [fotos, setFotos] = useState(getFotos());
  const [viewFoto, setViewFoto] = useState<Foto | null>(null);
  const [legenda, setLegenda] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const nova: Foto = { id: crypto.randomUUID(), url: reader.result as string, legenda: legenda || file.name, data: new Date().toISOString() };
      const updated = [nova, ...fotos]; saveFotos(updated); setFotos(updated); setLegenda("");
      toast.success("Foto adicionada!");
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleDelete = (id: string) => {
    const updated = fotos.filter((f) => f.id !== id); saveFotos(updated); setFotos(updated); setViewFoto(null);
    toast.success("Foto removida!");
  };

  return (
    <div className="space-y-5">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mural de Fotos</h1>
          <p className="text-xs text-muted-foreground">{fotos.length} fotos</p>
        </div>
      </div>

      <div className="float-card p-5 space-y-3 animate-float-up">
        <input type="text" value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda da foto (opcional)" className="form-input" />
        <button onClick={() => fileRef.current?.click()} className="w-full action-btn">
          <Plus className="h-4 w-4" /> Adicionar Foto
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {fotos.length === 0 ? (
        <div className="empty-state animate-float-up" style={{ animationDelay: '100ms' }}>
          <div className="icon-box bg-gold/15 text-gold mx-auto mb-3"><Image className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhuma foto adicionada</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((foto, i) => (
            <button key={foto.id} onClick={() => setViewFoto(foto)} className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow animate-float-up" style={{ animationDelay: `${i * 40}ms` }}>
              <img src={foto.url} alt={foto.legenda} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!viewFoto} onOpenChange={() => setViewFoto(null)}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden max-w-sm border-border/30">
          {viewFoto && (
            <div>
              <img src={viewFoto.url} alt={viewFoto.legenda} className="w-full max-h-[60vh] object-contain bg-foreground/5" />
              <div className="p-5 space-y-2">
                <p className="text-sm font-semibold text-foreground">{viewFoto.legenda}</p>
                <p className="text-xs text-muted-foreground">{new Date(viewFoto.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                <button onClick={() => handleDelete(viewFoto.id)} className="w-full flex items-center justify-center gap-2 text-destructive py-2.5 rounded-xl hover:bg-destructive/10 text-sm font-semibold">
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
