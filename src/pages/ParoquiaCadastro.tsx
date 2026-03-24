import { useNavigate } from "react-router-dom";
import { getParoquias, saveParoquia, deleteParoquia, type Paroquia } from "@/lib/store";
import { ArrowLeft, Plus, Church, Trash2, Eye } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FormData { nome: string; tipo: Paroquia['tipo']; endereco: string; telefone: string; email: string; responsavel: string; observacao: string; }
const emptyForm: FormData = { nome: "", tipo: "Paróquia", endereco: "", telefone: "", email: "", responsavel: "", observacao: "" };

export default function ParoquiaCadastro() {
  const navigate = useNavigate();
  const [list, setList] = useState(getParoquias());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [viewItem, setViewItem] = useState<Paroquia | null>(null);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    saveParoquia({ id: crypto.randomUUID(), ...form });
    setList(getParoquias()); setForm({ ...emptyForm }); setOpen(false);
    toast.success("Cadastro realizado!");
  };

  const handleDelete = (id: string) => { deleteParoquia(id); setList(getParoquias()); setViewItem(null); toast.success("Removido!"); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Paróquia / Área / Escola</h1>
            <p className="text-xs text-muted-foreground">{list.length} cadastrados</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Novo Cadastro</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                <select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} className="form-input">
                  <option>Paróquia</option><option>Área Pastoral</option><option>Escola</option>
                </select>
              </div>
              <FieldInput label="Endereço" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", v)} />
                <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
              </div>
              <FieldInput label="Responsável" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label>
                <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" />
              </div>
              <button onClick={handleAdd} className="w-full action-btn">Salvar</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><Church className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum cadastro realizado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={item.id} className="float-card flex items-center gap-3 px-4 py-3.5 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="icon-box bg-primary/10"><Church className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.nome}</p>
                <p className="text-xs text-muted-foreground">{item.tipo}{item.endereco && ` • ${item.endereco}`}</p>
              </div>
              <button onClick={() => setViewItem(item)} className="back-btn"><Eye className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30">
          <DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 text-sm">
              <InfoRow label="Tipo" value={viewItem.tipo} />
              <InfoRow label="Endereço" value={viewItem.endereco} />
              <InfoRow label="Telefone" value={viewItem.telefone} />
              <InfoRow label="E-mail" value={viewItem.email} />
              <InfoRow label="Responsável" value={viewItem.responsavel} />
              <InfoRow label="Observação" value={viewItem.observacao} />
              <button onClick={() => handleDelete(viewItem.id)} className="w-full flex items-center justify-center gap-2 text-destructive py-2.5 mt-3 rounded-xl hover:bg-destructive/10 text-sm font-semibold">
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
  return <p><span className="text-muted-foreground">{label}:</span> <span className="font-semibold text-foreground">{value}</span></p>;
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" />
    </div>
  );
}
