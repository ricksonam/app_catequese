import { useNavigate } from "react-router-dom";
import { useParoquias, useParoquiaMutation, useDeleteParoquia } from "@/hooks/useSupabaseData";
import { type Paroquia } from "@/lib/store";
import { ArrowLeft, Plus, Church, Trash2, Eye, Lock } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface FormData { nome: string; endereco: string; telefone: string; email: string; responsavel: string; }
const emptyForm: FormData = { nome: "", endereco: "", telefone: "", email: "", responsavel: "" };

export default function ParoquiaCadastro() {
  const navigate = useNavigate();
  const { data: list = [], isLoading } = useParoquias();
  const mutation = useParoquiaMutation();
  const deleteMut = useDeleteParoquia();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [viewItem, setViewItem] = useState<Paroquia | null>(null);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    try { await mutation.mutateAsync({ id: crypto.randomUUID(), ...form }); setForm({ ...emptyForm }); setOpen(false); toast.success("Cadastro realizado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteMut.mutateAsync(id); setViewItem(null); toast.success("Removido!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button><div><h1 className="text-xl font-bold text-foreground">Paróquia / Área / Escola</h1><p className="text-xs text-muted-foreground">{list.length} cadastrados</p></div></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Novo Cadastro</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <FieldInput label="Endereço" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
              <div className="grid grid-cols-2 gap-2"><FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", v)} /><FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} /></div>
              <FieldInput label="Pároco responsável" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
              <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {list.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><Church className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhum cadastro realizado</p></div>
      ) : (
        <div className="space-y-2">{list.map((item, i) => {
          const isShared = (item as any).isShared;
          return (
          <div key={item.id} className="float-card flex items-center gap-3 px-4 py-3.5 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="icon-box bg-primary/10"><Church className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{item.nome}</p>
                {isShared && (
                  <span className="flex items-center gap-0.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    <Lock className="h-2.5 w-2.5" /> Compartilhado
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{item.endereco}</p>
            </div>
            <button onClick={() => setViewItem(item)} className="back-btn"><Eye className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          );
        })}</div>
      )}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 text-sm">
            {(viewItem as any).isShared && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <Lock className="h-4 w-4 shrink-0" />
                <p className="text-xs font-semibold">Registro compartilhado pela turma. Apenas visualização.</p>
              </div>
            )}
            <InfoRow label="Endereço" value={viewItem.endereco} /><InfoRow label="Telefone" value={viewItem.telefone} /><InfoRow label="E-mail" value={viewItem.email} /><InfoRow label="Pároco responsável" value={viewItem.responsavel} />
            {!(viewItem as any).isShared && (
              <button onClick={() => handleDelete(viewItem.id)} className="w-full flex items-center justify-center gap-2 text-destructive py-2.5 mt-3 rounded-xl hover:bg-destructive/10 text-sm font-semibold"><Trash2 className="h-4 w-4" /> Excluir</button>
            )}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) { if (!value) return null; return <p><span className="text-muted-foreground">{label}:</span> <span className="font-semibold text-foreground">{value}</span></p>; }
function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) { 
  const ref = useRef<HTMLInputElement>(null); 
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-900 mb-1 block">{labelWithRedAsterisk}</label>
      <input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" />
    </div>
  ); 
}
