import { ArrowLeft, Plus, FileText, Link2, Trash2, ExternalLink, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Material { id: string; titulo: string; descricao: string; tipo: "link" | "anotacao"; conteudo: string; categoria: string; criadoEm: string; }
const MATERIAIS_KEY = "ivc_materiais";
const CATEGORIAS = ["Documentos da Igreja", "Dinâmicas", "Orações", "Cantos", "Catequese", "Formação", "Outros"];
function getMateriais(): Material[] { return JSON.parse(localStorage.getItem(MATERIAIS_KEY) || "[]"); }
function saveMateriais(m: Material[]) { localStorage.setItem(MATERIAIS_KEY, JSON.stringify(m)); }

interface FormData { titulo: string; descricao: string; tipo: "link" | "anotacao"; conteudo: string; categoria: string; }
const emptyForm: FormData = { titulo: "", descricao: "", tipo: "anotacao", conteudo: "", categoria: "Catequese" };

export default function MaterialApoio() {
  const navigate = useNavigate();
  const [materiais, setMateriais] = useState(getMateriais());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [filtro, setFiltro] = useState("Todos");

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = () => {
    if (!form.titulo) { toast.error("Título é obrigatório"); return; }
    const updated = [{ id: crypto.randomUUID(), ...form, criadoEm: new Date().toISOString() }, ...materiais];
    saveMateriais(updated); setMateriais(updated); setForm({ ...emptyForm }); setOpen(false);
    toast.success("Material adicionado!");
  };

  const handleDelete = (id: string) => {
    const updated = materiais.filter((m) => m.id !== id); saveMateriais(updated); setMateriais(updated);
    toast.success("Removido!");
  };

  const filtered = filtro === "Todos" ? materiais : materiais.filter((m) => m.categoria === filtro);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Material de Apoio</h1>
            <p className="text-xs text-muted-foreground">{materiais.length} materiais</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Novo Material</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Título *" value={form.titulo} onChange={(v) => updateField("titulo", v)} />
              <FieldInput label="Descrição" value={form.descricao} onChange={(v) => updateField("descricao", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Categoria</label>
                <select value={form.categoria} onChange={(e) => updateField("categoria", e.target.value)} className="form-input">
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                <div className="flex gap-2">
                  <button onClick={() => updateField("tipo", "anotacao")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.tipo === "anotacao" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"}`}>Anotação</button>
                  <button onClick={() => updateField("tipo", "link")} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.tipo === "link" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"}`}>Link</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">{form.tipo === "link" ? "URL" : "Conteúdo"}</label>
                <textarea value={form.conteudo} onChange={(e) => updateField("conteudo", e.target.value)} placeholder={form.tipo === "link" ? "https://..." : "Escreva o conteúdo..."} className="form-input min-h-[80px] resize-none" />
              </div>
              <button onClick={handleAdd} className="w-full action-btn">Salvar</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide animate-float-up">
        {["Todos", ...CATEGORIAS].map((c) => (
          <button key={c} onClick={() => setFiltro(c)} className={`shrink-0 pill-btn ${filtro === c ? "pill-btn-active" : "pill-btn-inactive"}`}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state animate-float-up" style={{ animationDelay: '100ms' }}>
          <div className="icon-box bg-liturgical/10 text-liturgical mx-auto mb-3"><FolderOpen className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum material encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((mat, i) => (
            <div key={mat.id} className="float-card p-4 animate-float-up" style={{ animationDelay: `${(i + 1) * 50}ms` }}>
              <div className="flex items-start gap-3">
                <div className={`icon-box ${mat.tipo === "link" ? "bg-primary/10" : "bg-accent/15"}`}>
                  {mat.tipo === "link" ? <Link2 className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-accent-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{mat.titulo}</p>
                  {mat.descricao && <p className="text-xs text-muted-foreground mt-0.5">{mat.descricao}</p>}
                  <span className="pill-btn pill-btn-inactive mt-1.5 inline-block">{mat.categoria}</span>
                  {mat.tipo === "link" && mat.conteudo && (
                    <a href={mat.conteudo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline font-semibold">
                      <ExternalLink className="h-3 w-3" /> Abrir link
                    </a>
                  )}
                  {mat.tipo === "anotacao" && mat.conteudo && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{mat.conteudo}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(mat.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input ref={ref} type="text" value={value} onChange={(e) => onChange(e.target.value)} className="form-input" />
    </div>
  );
}
