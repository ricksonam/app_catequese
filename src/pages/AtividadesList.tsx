import { useParams, useNavigate } from "react-router-dom";
import { getAtividades, saveAtividade, deleteAtividade, getTurmas, ATIVIDADE_TIPOS, type Atividade, type AtividadeTipo } from "@/lib/store";
import { ArrowLeft, Plus, ListChecks, Eye, Trash2 } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FormData {
  nome: string;
  descricao: string;
  tipo: AtividadeTipo;
  data: string;
  local: string;
  horario: string;
  observacao: string;
}

const emptyForm: FormData = { nome: "", descricao: "", tipo: "Eventos geral", data: "", local: "", horario: "", observacao: "" };

export default function AtividadesList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find(t => t.id === id);
  const [list, setList] = useState(getAtividades(id));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [viewItem, setViewItem] = useState<Atividade | null>(null);

  const updateField = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleAdd = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    const novo: Atividade = { id: crypto.randomUUID(), turmaId: id!, ...form, criadoEm: new Date().toISOString() };
    saveAtividade(novo);
    setList(getAtividades(id));
    setForm({ ...emptyForm });
    setOpen(false);
    toast.success("Atividade criada!");
  };

  const handleDelete = (aid: string) => {
    deleteAtividade(aid);
    setList(getAtividades(id));
    setViewItem(null);
    toast.success("Removida!");
  };

  const tipoColors: Record<string, string> = {
    'Retiro': 'bg-primary/10 text-primary',
    'Celebração': 'bg-liturgical/10 text-liturgical',
    'Encontro de pais': 'bg-accent/20 text-accent-foreground',
    'Gincana': 'bg-success/10 text-success',
    'Passeios': 'bg-gold/20 text-gold',
    'Jornada': 'bg-primary/10 text-primary',
    'Eventos geral': 'bg-muted text-muted-foreground',
    'Outros': 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Atividades</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {list.length} atividades</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">
              <Plus className="h-4 w-4" /> Nova
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Atividade</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
                <textarea value={form.descricao} onChange={(e) => updateField("descricao", e.target.value)} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[60px] resize-none" placeholder="Descreva a atividade..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                <select value={form.tipo} onChange={(e) => updateField("tipo", e.target.value)} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none">
                  {ATIVIDADE_TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Data" type="date" value={form.data} onChange={(v) => updateField("data", v)} />
                <FieldInput label="Horário" type="time" value={form.horario} onChange={(v) => updateField("horario", v)} />
              </div>
              <FieldInput label="Local" value={form.local} onChange={(v) => updateField("local", v)} />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Observação</label>
                <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[60px] resize-none" />
              </div>
              <button onClick={handleAdd} className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold">Criar Atividade</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <ListChecks className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma atividade cadastrada</p>
        </div>
      ) : (
        <div className="ios-card overflow-hidden">
          {list.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${i < list.length - 1 ? "border-b border-border/50" : ""}`}>
              <div className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${tipoColors[item.tipo] || 'bg-muted text-muted-foreground'}`}>
                {item.tipo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {item.data && new Date(item.data + 'T00:00').toLocaleDateString("pt-BR")}
                  {item.horario && ` • ${item.horario}`}
                  {item.local && ` • ${item.local}`}
                </p>
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
              <InfoRow label="Descrição" value={viewItem.descricao} />
              <InfoRow label="Data" value={viewItem.data ? new Date(viewItem.data + 'T00:00').toLocaleDateString("pt-BR") : undefined} />
              <InfoRow label="Horário" value={viewItem.horario} />
              <InfoRow label="Local" value={viewItem.local} />
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
