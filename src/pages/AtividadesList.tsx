import { useParams, useNavigate } from "react-router-dom";
import { getAtividades, saveAtividade, deleteAtividade, getTurmas, ATIVIDADE_TIPOS, type Atividade, type AtividadeTipo } from "@/lib/store";
import { ArrowLeft, Plus, ListChecks, Eye, Trash2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FormData { nome: string; descricao: string; tipo: AtividadeTipo; data: string; local: string; horario: string; observacao: string; }
const emptyForm: FormData = { nome: "", descricao: "", tipo: "Eventos geral", data: "", local: "", horario: "", observacao: "" };

const tipoColors: Record<string, string> = {
  'Retiro': 'bg-primary/10 text-primary', 'Celebração': 'bg-liturgical/10 text-liturgical',
  'Encontro de pais': 'bg-accent/15 text-accent-foreground', 'Gincana': 'bg-success/10 text-success',
  'Passeios': 'bg-gold/15 text-gold', 'Jornada': 'bg-primary/10 text-primary',
  'Eventos geral': 'bg-muted text-muted-foreground', 'Outros': 'bg-muted text-muted-foreground',
};

export default function AtividadesList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find(t => t.id === id);
  const [list, setList] = useState(getAtividades(id));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [viewItem, setViewItem] = useState<Atividade | null>(null);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    saveAtividade({ id: crypto.randomUUID(), turmaId: id!, ...form, criadoEm: new Date().toISOString() });
    setList(getAtividades(id)); setForm({ ...emptyForm }); setOpen(false);
    toast.success("Atividade criada!");
  };

  const handleDelete = (aid: string) => { deleteAtividade(aid); setList(getAtividades(id)); setViewItem(null); toast.success("Removida!"); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Atividades</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {list.length} atividades</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Nova</button></DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Descrição</label>
                <textarea value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} className="form-input min-h-[60px] resize-none" placeholder="Descreva a atividade..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                <select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} className="form-input">
                  {ATIVIDADE_TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Data" type="date" value={form.data} onChange={(v) => updateField("data", v)} />
                <FieldInput label="Horário" type="time" value={form.horario} onChange={(v) => updateField("horario", v)} />
              </div>
              <FieldInput label="Local" value={form.local} onChange={(v) => updateField("local", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label>
                <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" />
              </div>
              <button onClick={handleAdd} className="w-full action-btn">Criar Atividade</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-liturgical/10 text-liturgical mx-auto mb-3"><ListChecks className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhuma atividade cadastrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={item.id} className="float-card flex items-center gap-3 px-4 py-3.5 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
              <span className={`pill-btn ${tipoColors[item.tipo] || 'bg-muted text-muted-foreground'}`}>{item.tipo}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {item.data && new Date(item.data + 'T00:00').toLocaleDateString("pt-BR")}
                  {item.horario && ` • ${item.horario}`}
                  {item.local && ` • ${item.local}`}
                </p>
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
              <InfoRow label="Descrição" value={viewItem.descricao} />
              <InfoRow label="Data" value={viewItem.data ? new Date(viewItem.data + 'T00:00').toLocaleDateString("pt-BR") : undefined} />
              <InfoRow label="Horário" value={viewItem.horario} />
              <InfoRow label="Local" value={viewItem.local} />
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
