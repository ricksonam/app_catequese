import { useNavigate } from "react-router-dom";
import { getComunidades, saveComunidade, deleteComunidade, getParoquias, type Comunidade } from "@/lib/store";
import { ArrowLeft, Plus, Users, Trash2, Eye } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FormData {
  nome: string;
  tipo: Comunidade['tipo'];
  paroquiaId: string;
  endereco: string;
  responsavel: string;
  telefone: string;
  observacao: string;
}

const emptyForm: FormData = { nome: "", tipo: "Comunidade", paroquiaId: "", endereco: "", responsavel: "", telefone: "", observacao: "" };

export default function ComunidadesCadastro() {
  const navigate = useNavigate();
  const paroquias = getParoquias();
  const [list, setList] = useState(getComunidades());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [viewItem, setViewItem] = useState<Comunidade | null>(null);

  const updateField = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleAdd = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    const novo: Comunidade = { id: crypto.randomUUID(), ...form };
    saveComunidade(novo);
    setList(getComunidades());
    setForm({ ...emptyForm });
    setOpen(false);
    toast.success("Cadastro realizado!");
  };

  const handleDelete = (id: string) => {
    deleteComunidade(id);
    setList(getComunidades());
    setViewItem(null);
    toast.success("Removido!");
  };

  const getParoquiaNome = (id: string) => paroquias.find(p => p.id === id)?.nome || "—";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Comunidades / Núcleos</h1>
            <p className="text-xs text-muted-foreground">{list.length} cadastrados</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">
              <Plus className="h-4 w-4" /> Novo
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Comunidade / Núcleo</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                <select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none">
                  <option>Comunidade</option>
                  <option>Núcleo</option>
                  <option>Grupo</option>
                </select>
              </div>
              {paroquias.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Paróquia vinculada</label>
                  <select value={form.paroquiaId} onChange={(e) => updateField("paroquiaId", e.target.value)} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none">
                    <option value="">Selecione...</option>
                    {paroquias.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
              )}
              <FieldInput label="Endereço" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
              <FieldInput label="Responsável" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
              <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", v)} />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Observação</label>
                <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[60px] resize-none" />
              </div>
              <button onClick={handleAdd} className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold">Salvar</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum cadastro realizado</p>
        </div>
      ) : (
        <div className="ios-card overflow-hidden">
          {list.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i < list.length - 1 ? "border-b border-border/50" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">{item.tipo}{item.paroquiaId && ` • ${getParoquiaNome(item.paroquiaId)}`}</p>
              </div>
              <button onClick={() => setViewItem(item)} className="p-2 rounded-lg hover:bg-muted"><Eye className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 text-sm">
              <InfoRow label="Tipo" value={viewItem.tipo} />
              <InfoRow label="Paróquia" value={viewItem.paroquiaId ? getParoquiaNome(viewItem.paroquiaId) : undefined} />
              <InfoRow label="Endereço" value={viewItem.endereco} />
              <InfoRow label="Responsável" value={viewItem.responsavel} />
              <InfoRow label="Telefone" value={viewItem.telefone} />
              <InfoRow label="Observação" value={viewItem.observacao} />
              <button onClick={() => handleDelete(viewItem.id)} className="w-full flex items-center justify-center gap-2 text-destructive py-2 mt-3 rounded-xl hover:bg-destructive/10 text-sm font-medium">
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <p><span className="text-muted-foreground">{label}:</span> <span className="font-medium text-foreground">{value}</span></p>;
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none" />
    </div>
  );
}
