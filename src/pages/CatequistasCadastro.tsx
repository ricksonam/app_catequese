import { useNavigate } from "react-router-dom";
import { useCatequistas, useCatequistaMutation, useDeleteCatequista, useComunidades } from "@/hooks/useSupabaseData";
import { type CatequistaCadastro } from "@/lib/store";
import { ArrowLeft, Plus, UserCheck, Trash2, Eye } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FormData { nome: string; dataNascimento: string; endereco: string; profissao: string; telefone: string; email: string; comunidadeId: string; formacao: string; anosExperiencia: string; observacao: string; }
const emptyForm: FormData = { nome: "", dataNascimento: "", endereco: "", profissao: "", telefone: "", email: "", comunidadeId: "", formacao: "", anosExperiencia: "", observacao: "" };

function calcAge(birth: string): number | null { if (!birth) return null; const b = new Date(birth); const now = new Date(); let age = now.getFullYear() - b.getFullYear(); if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--; return age; }

export default function CatequistasCadastro() {
  const navigate = useNavigate();
  const { data: comunidades = [] } = useComunidades();
  const { data: list = [], isLoading } = useCatequistas();
  const mutation = useCatequistaMutation();
  const deleteMut = useDeleteCatequista();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [viewItem, setViewItem] = useState<CatequistaCadastro | null>(null);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    try { await mutation.mutateAsync({ id: crypto.randomUUID(), ...form }); setForm({ ...emptyForm }); setOpen(false); toast.success("Catequista cadastrado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleDelete = async (cid: string) => {
    try { await deleteMut.mutateAsync(cid); setViewItem(null); toast.success("Removido!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const getComunidadeNome = (cid: string) => comunidades.find(c => c.id === cid)?.nome || "—";

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button><div><h1 className="text-xl font-bold text-foreground">Catequistas</h1><p className="text-xs text-muted-foreground">{list.length} cadastrados</p></div></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Novo Catequista</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Data de nascimento</label><input type="date" value={form.dataNascimento} onChange={(e) => updateField("dataNascimento", e.target.value)} className="form-input" /></div>
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label><div className="form-input text-muted-foreground">{form.dataNascimento ? `${calcAge(form.dataNascimento)} anos` : "—"}</div></div>
              </div>
              <FieldInput label="Endereço" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
              <FieldInput label="Profissão" value={form.profissao} onChange={(v) => updateField("profissao", v)} />
              <div className="grid grid-cols-2 gap-2"><FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", v)} /><FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} /></div>
              {comunidades.length > 0 && <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Comunidade</label><select value={form.comunidadeId} onChange={(e) => updateField("comunidadeId", e.target.value)} className="form-input"><option value="">Selecione...</option>{comunidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>}
              <FieldInput label="Formação" value={form.formacao} onChange={(v) => updateField("formacao", v)} placeholder="Ex: Teologia, Pedagogia..." />
              <FieldInput label="Anos de experiência" value={form.anosExperiencia} onChange={(v) => updateField("anosExperiencia", v)} />
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label><textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" /></div>
              <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {list.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-success/10 text-success mx-auto mb-3"><UserCheck className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhum catequista cadastrado</p></div>
      ) : (
        <div className="space-y-2">{list.map((item, i) => (
          <div key={item.id} className="float-card flex items-center gap-3 px-4 py-3.5 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-sm font-bold text-primary">{item.nome.charAt(0).toUpperCase()}</span></div>
            <div className="flex-1"><p className="text-sm font-semibold text-foreground">{item.nome}</p><p className="text-xs text-muted-foreground">{item.formacao || 'Catequista'}{item.anosExperiencia && ` • ${item.anosExperiencia} anos`}</p></div>
            <button onClick={() => setViewItem(item)} className="back-btn"><Eye className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        ))}</div>
      )}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 text-sm">
            {viewItem.dataNascimento && <InfoRow label="Nascimento" value={`${new Date(viewItem.dataNascimento).toLocaleDateString("pt-BR")} (${calcAge(viewItem.dataNascimento)} anos)`} />}
            <InfoRow label="Endereço" value={viewItem.endereco} /><InfoRow label="Profissão" value={viewItem.profissao} /><InfoRow label="Telefone" value={viewItem.telefone} /><InfoRow label="E-mail" value={viewItem.email} /><InfoRow label="Comunidade" value={viewItem.comunidadeId ? getComunidadeNome(viewItem.comunidadeId) : undefined} /><InfoRow label="Formação" value={viewItem.formacao} /><InfoRow label="Experiência" value={viewItem.anosExperiencia ? `${viewItem.anosExperiencia} anos` : undefined} /><InfoRow label="Observação" value={viewItem.observacao} />
            <button onClick={() => handleDelete(viewItem.id)} className="w-full flex items-center justify-center gap-2 text-destructive py-2.5 mt-3 rounded-xl hover:bg-destructive/10 text-sm font-semibold"><Trash2 className="h-4 w-4" /> Excluir</button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) { if (!value) return null; return <p><span className="text-muted-foreground">{label}:</span> <span className="font-semibold text-foreground">{value}</span></p>; }
function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) { const ref = useRef<HTMLInputElement>(null); return <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label><input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" /></div>; }
