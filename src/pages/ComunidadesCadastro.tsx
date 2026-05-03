import { useNavigate } from "react-router-dom";
import { useComunidades, useComunidadeMutation, useDeleteComunidade, useParoquias } from "@/hooks/useSupabaseData";
import { type Comunidade } from "@/lib/store";
import { ArrowLeft, Plus, Users, Trash2, Eye } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";


interface FormData { nome: string; paroquiaId: string; endereco: string; responsavel: string; telefone: string; }
const emptyForm: FormData = { nome: "", paroquiaId: "", endereco: "", responsavel: "", telefone: "" };

export default function ComunidadesCadastro() {
  const navigate = useNavigate();
  const { data: paroquias = [] } = useParoquias();
  const { data: list = [], isLoading } = useComunidades();
  const mutation = useComunidadeMutation();
  const deleteMut = useDeleteComunidade();
  const [open, setOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Comunidade | null>(null);
  const [usarEnderecoParoquia, setUsarEnderecoParoquia] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    try { await mutation.mutateAsync({ id: crypto.randomUUID(), ...form }); setForm({ ...emptyForm }); setOpen(false); toast.success("Cadastro realizado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const confirmDelete = async () => {
    if (!viewItem) return;
    try { 
      await deleteMut.mutateAsync(viewItem.id); 
      setViewItem(null); 
      setDeleteConfirmOpen(false);
      toast.success("Removido!"); 
    }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };


  const handleEnderecoParoquia = (checked: boolean) => {
    setUsarEnderecoParoquia(checked);
    if (checked && form.paroquiaId) {
      const paroquia = paroquias.find(p => p.id === form.paroquiaId);
      if (paroquia) {
        updateField("endereco", paroquia.endereco);
      }
    }
  };

  const getParoquiaNome = (id: string) => paroquias.find(p => p.id === id)?.nome || "—";

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3"><button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button><div><h1 className="text-xl font-bold text-foreground">Comunidades / Núcleos</h1><p className="text-xs text-muted-foreground">{list.length} cadastrados</p></div></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Nova Comunidade / Núcleo</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              {paroquias.length > 0 && <div><label className="text-xs font-semibold text-zinc-900 mb-1 block">Paróquia vinculada</label><select value={form.paroquiaId} onChange={(e) => updateField("paroquiaId", e.target.value)} className="form-input"><option value="">Selecione...</option>{paroquias.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>}
              
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="usarEnderecoParoquia" 
                  checked={usarEnderecoParoquia} 
                  onChange={(e) => handleEnderecoParoquia(e.target.checked)}
                  className="rounded border-border/50 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="usarEnderecoParoquia" className="text-xs font-medium text-muted-foreground cursor-pointer">Usar mesmo endereço da paróquia</label>
              </div>

              <FieldInput label="Endereço" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
              <FieldInput label="Responsável" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
              <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", v)} />
              <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {list.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-accent/15 text-accent-foreground mx-auto mb-3"><Users className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhum cadastro realizado</p></div>
      ) : (
        <div className="space-y-2">{list.map((item, i) => (
          <div key={item.id} className="float-card flex items-center gap-3 px-4 py-3.5 animate-float-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="icon-box bg-accent/15"><Users className="h-5 w-5 text-accent-foreground" /></div>
            <div className="flex-1"><p className="text-sm font-semibold text-foreground">{item.nome}</p><p className="text-xs text-muted-foreground">{item.paroquiaId && `${getParoquiaNome(item.paroquiaId)}`}</p></div>
            <button onClick={() => setViewItem(item)} className="back-btn"><Eye className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        ))}</div>
      )}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30"><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 text-sm">
            <InfoRow label="Paróquia" value={viewItem.paroquiaId ? getParoquiaNome(viewItem.paroquiaId) : undefined} /><InfoRow label="Endereço" value={viewItem.endereco} /><InfoRow label="Responsável" value={viewItem.responsavel} /><InfoRow label="Telefone" value={viewItem.telefone} />
            <button onClick={() => setDeleteConfirmOpen(true)} className="w-full flex items-center justify-center gap-2 text-destructive py-2.5 mt-3 rounded-xl hover:bg-destructive/10 text-sm font-semibold"><Trash2 className="h-4 w-4" /> Excluir</button>

          </div>}
        </DialogContent>
      </Dialog>
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        itemName={viewItem?.nome}
        isLoading={deleteMut.isPending}
      />
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
