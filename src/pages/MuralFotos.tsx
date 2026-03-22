import { ArrowLeft, Plus, Image, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Foto {
  id: string;
  url: string;
  legenda: string;
  data: string;
}

const FOTOS_KEY = "ivc_mural_fotos";

function getFotos(): Foto[] {
  return JSON.parse(localStorage.getItem(FOTOS_KEY) || "[]");
}
function saveFotos(fotos: Foto[]) {
  localStorage.setItem(FOTOS_KEY, JSON.stringify(fotos));
}

export default function MuralFotos() {
  const navigate = useNavigate();
  const [fotos, setFotos] = useState(getFotos());
  const [viewFoto, setViewFoto] = useState<Foto | null>(null);
  const [legenda, setLegenda] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const nova: Foto = {
        id: crypto.randomUUID(),
        url: reader.result as string,
        legenda: legenda || file.name,
        data: new Date().toISOString(),
      };
      const updated = [nova, ...fotos];
      saveFotos(updated);
      setFotos(updated);
      setLegenda("");
      toast.success("Foto adicionada!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDelete = (id: string) => {
    const updated = fotos.filter((f) => f.id !== id);
    saveFotos(updated);
    setFotos(updated);
    setViewFoto(null);
    toast.success("Foto removida!");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mural de Fotos</h1>
            <p className="text-xs text-muted-foreground">{fotos.length} fotos</p>
          </div>
        </div>
      </div>

      <div className="ios-card p-4 space-y-3">
        <input
          type="text"
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          placeholder="Legenda da foto (opcional)"
          className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Adicionar Foto
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {fotos.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <Image className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma foto adicionada</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((foto) => (
            <button
              key={foto.id}
              onClick={() => setViewFoto(foto)}
              className="aspect-square rounded-xl overflow-hidden bg-muted"
            >
              <img src={foto.url} alt={foto.legenda} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!viewFoto} onOpenChange={() => setViewFoto(null)}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden max-w-sm">
          {viewFoto && (
            <div>
              <img src={viewFoto.url} alt={viewFoto.legenda} className="w-full max-h-[60vh] object-contain bg-black" />
              <div className="p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">{viewFoto.legenda}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(viewFoto.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
                <button
                  onClick={() => handleDelete(viewFoto.id)}
                  className="w-full flex items-center justify-center gap-2 text-destructive py-2 rounded-xl hover:bg-destructive/10 text-sm font-medium"
                >
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
