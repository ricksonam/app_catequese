import { useNavigate } from "react-router-dom";
import { useCatequistas, useCatequistaMutation, useDeleteCatequista, useComunidades } from "@/hooks/useSupabaseData";
import { type CatequistaCadastro } from "@/lib/store";
import { ArrowLeft, Plus, UserCheck, Trash2, Pencil, Phone, Mail, MapPin, BookOpen, Briefcase, Calendar, Clock, ChevronRight, X, User } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";
import { mascaraTelefone } from "@/lib/utils";

type CatequistaStatus = "ativo" | "inativo" | "afastado";

interface FormData {
  nome: string; dataNascimento: string; endereco: string; 
  numero: string; bairro: string; complemento: string;
  profissao: string; telefone: string;
  email: string; comunidadeId: string; formacao: string; 
  anosExperiencia: string; observacao: string; status: CatequistaStatus;
  foto: string;
}
const emptyForm: FormData = {
  nome: "", dataNascimento: "", endereco: "", 
  numero: "", bairro: "", complemento: "",
  profissao: "", telefone: "",
  email: "", comunidadeId: "", formacao: "", anosExperiencia: "", observacao: "", status: "ativo",
  foto: "",
};

function calcAge(birth: string): number | null {
  if (!birth) return null;
  const b = new Date(birth); const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
}

const STATUS_MAP: Record<CatequistaStatus, { label: string; color: string; bg: string }> = {
  ativo: { label: "Ativo", color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/15" },
  inativo: { label: "Inativo", color: "text-muted-foreground", bg: "bg-muted" },
  afastado: { label: "Afastado", color: "text-[hsl(var(--caution))]", bg: "bg-[hsl(var(--caution))]/15" },
};

export default function CatequistasCadastro() {
  const navigate = useNavigate();
  const { data: comunidades = [] } = useComunidades();
  const { data: list = [], isLoading } = useCatequistas();
  const mutation = useCatequistaMutation();
  const deleteMut = useDeleteCatequista();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [viewItem, setViewItem] = useState<CatequistaCadastro | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const updateField = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    try {
      const id = editMode && editingId ? editingId : crypto.randomUUID();
      await mutation.mutateAsync({ id, ...form });
      setForm({ ...emptyForm });
      setOpen(false);
      if (editMode && editingId) {
        setViewItem({ id, ...form } as any);
        setEditMode(false);
        setEditingId(null);
      }
      toast.success(editMode ? "Catequista atualizado!" : "Catequista cadastrado!");
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleDelete = async (cid: string) => {
    try { await deleteMut.mutateAsync(cid); setViewItem(null); toast.success("Removido!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const openEdit = (item: CatequistaCadastro) => {
    setForm({
      nome: item.nome, dataNascimento: item.dataNascimento, 
      endereco: item.endereco, numero: item.numero || "", bairro: item.bairro || "", complemento: item.complemento || "",
      profissao: item.profissao, telefone: item.telefone, email: item.email,
      comunidadeId: item.comunidadeId || "", formacao: item.formacao,
      anosExperiencia: item.anosExperiencia, observacao: item.observacao,
      status: (item as any).status || "ativo",
      foto: item.foto || "",
    });
    setEditMode(true);
    setEditingId(item.id);
    setViewItem(null);
    setOpen(true);
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditMode(false);
    setEditingId(null);
    setOpen(true);
  };

  const getComunidadeNome = (cid: string) => comunidades.find(c => c.id === cid)?.nome || "—";
  const getStatus = (item: CatequistaCadastro): CatequistaStatus => (item as any).status || "ativo";

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div><h1 className="text-xl font-bold text-foreground">Catequistas</h1><p className="text-xs text-muted-foreground">{list.length} cadastrados</p></div>
        </div>
        <button onClick={openNew} className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] mx-auto mb-3"><UserCheck className="h-6 w-6" /></div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum catequista cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((item, i) => {
            const status = getStatus(item);
            const st = STATUS_MAP[status];
            const age = calcAge(item.dataNascimento);
            return (
              <button
                key={item.id}
                onClick={() => setViewItem(item)}
                className="float-card w-full text-left p-4 animate-float-up border-l-4 border-l-primary active:scale-[0.98] transition-transform"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {item.foto ? <img src={item.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-lg font-bold text-primary">{item.nome.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.nome}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.formacao || "Catequista"}{age !== null ? ` • ${age} anos` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                      {item.anosExperiencia && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item.anosExperiencia} anos exp.
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditMode(false); }}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
          <DialogHeader><DialogTitle>{editMode ? "Editar Catequista" : "Novo Catequista"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex justify-center mb-2">
              <ImagePicker 
                onImageUpload={(url) => updateField("foto", url)} 
                folder="catequistas" 
                currentImageUrl={form.foto} 
                shape="circle" 
                label="Foto de Perfil"
              />
            </div>
            <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Data de nascimento</label><input type="date" value={form.dataNascimento} onChange={(e) => updateField("dataNascimento", e.target.value)} className="form-input" /></div>
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label><div className="form-input text-muted-foreground">{form.dataNascimento ? `${calcAge(form.dataNascimento)} anos` : "—"}</div></div>
            </div>
            <FieldInput label="Rua / Logradouro" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
            <div className="grid grid-cols-3 gap-2">
              <FieldInput label="Número" value={form.numero} onChange={(v) => updateField("numero", v)} />
              <div className="col-span-2">
                <FieldInput label="Bairro" value={form.bairro} onChange={(v) => updateField("bairro", v)} />
              </div>
            </div>
            <FieldInput label="Complemento" value={form.complemento} onChange={(v) => updateField("complemento", v)} />
            <FieldInput label="Profissão" value={form.profissao} onChange={(v) => updateField("profissao", v)} />
            <div className="grid grid-cols-2 gap-2">
              <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", mascaraTelefone(v))} />
              <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
            </div>
            {comunidades.length > 0 && (
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Comunidade</label>
                <select value={form.comunidadeId} onChange={(e) => updateField("comunidadeId", e.target.value)} className="form-input">
                  <option value="">Selecione...</option>{comunidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            )}
            <FieldInput label="Formação" value={form.formacao} onChange={(v) => updateField("formacao", v)} placeholder="Ex: Teologia, Pedagogia..." />
            <FieldInput label="Anos de experiência" value={form.anosExperiencia} onChange={(v) => updateField("anosExperiencia", v)} />
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={(e) => updateField("status", e.target.value as CatequistaStatus)} className="form-input">
                <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="afastado">Afastado</option>
              </select>
            </div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label><textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" /></div>
            
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setOpen(false)} 
                className="flex-1 py-3 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleSave} 
                disabled={mutation.isPending} 
                className="flex-[2] action-btn"
              >
                {mutation.isPending ? "Salvando..." : editMode ? "Atualizar" : "Salvar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="rounded-2xl border-border/30 p-0 overflow-hidden max-w-md">
          {viewItem && (() => {
            const status = getStatus(viewItem);
            const st = STATUS_MAP[status];
            const age = calcAge(viewItem.dataNascimento);
            return (
              <>
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent pt-8 pb-6 px-6">
                  <button onClick={() => setViewItem(null)} className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors">
                    <X className="h-4 w-4 text-foreground" />
                  </button>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-muted border-4 border-background flex items-center justify-center mb-3 shadow-lg overflow-hidden">
                      {viewItem.foto ? <img src={viewItem.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl font-bold text-primary">{viewItem.nome.charAt(0).toUpperCase()}</span>}
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{viewItem.nome}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{viewItem.formacao || "Catequista"}</p>
                    <span className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="px-5 py-4 space-y-3">
                  {viewItem.dataNascimento && (
                    <DetailRow icon={<Calendar className="h-4 w-4" />} label="Nascimento" value={`${new Date(viewItem.dataNascimento).toLocaleDateString("pt-BR")}${age !== null ? ` (${age} anos)` : ""}`} />
                  )}
                  {viewItem.telefone && <DetailRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={viewItem.telefone} />}
                  {viewItem.email && <DetailRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={viewItem.email} />}
                  {viewItem.endereco && (
                    <div className="p-3 rounded-xl bg-muted/30">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Endereço</p>
                      <p className="text-sm font-medium text-foreground">
                        {viewItem.endereco}{viewItem.numero ? `, ${viewItem.numero}` : ""}
                        {viewItem.bairro ? ` - ${viewItem.bairro}` : ""}
                        {viewItem.complemento ? ` (${viewItem.complemento})` : ""}
                      </p>
                    </div>
                  )}
                  {viewItem.profissao && <DetailRow icon={<Briefcase className="h-4 w-4" />} label="Profissão" value={viewItem.profissao} />}
                  {viewItem.comunidadeId && <DetailRow icon={<User className="h-4 w-4" />} label="Comunidade" value={getComunidadeNome(viewItem.comunidadeId)} />}
                  {viewItem.formacao && <DetailRow icon={<BookOpen className="h-4 w-4" />} label="Formação" value={viewItem.formacao} />}
                  {viewItem.anosExperiencia && <DetailRow icon={<Clock className="h-4 w-4" />} label="Experiência" value={`${viewItem.anosExperiencia} anos`} />}
                  {viewItem.observacao && (
                    <div className="p-3 rounded-xl bg-muted/50">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Observação</p>
                      <p className="text-sm text-foreground">{viewItem.observacao}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="px-5 pb-5 space-y-2">
                  <button
                    onClick={() => openEdit(viewItem)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(viewItem.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
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
