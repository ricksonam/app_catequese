import { useParams, useNavigate } from "react-router-dom";
import { getCatequizandos, saveCatequizando, deleteCatequizando, getTurmas, type Catequizando, type CatequizandoStatus } from "@/lib/store";
import { ArrowLeft, Plus, UserPlus, ChevronDown, ChevronUp, ChevronRight, Camera, Pencil, Trash2, X } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Sacramento { recebido: boolean; paroquia: string; data: string; }
interface CatequizandoForm {
  nome: string; dataNascimento: string; responsavel: string; telefone: string; email: string;
  endereco: string; necessidadeEspecial: string; observacao: string; foto: string;
  batismo: Sacramento; eucaristia: Sacramento; crisma: Sacramento;
}

const emptyForm: CatequizandoForm = {
  nome: "", dataNascimento: "", responsavel: "", telefone: "", email: "", endereco: "", necessidadeEspecial: "", observacao: "", foto: "",
  batismo: { recebido: false, paroquia: "", data: "" },
  eucaristia: { recebido: false, paroquia: "", data: "" },
  crisma: { recebido: false, paroquia: "", data: "" },
};

function calcularIdade(dataNascimento: string): string {
  if (!dataNascimento) return "";
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

const statusConfig: Record<CatequizandoStatus, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success" },
  desistente: { label: "Desistente", color: "bg-destructive/10 text-destructive" },
  afastado: { label: "Afastado", color: "bg-warning/10 text-warning" },
};

export default function CatequizandosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const [list, setList] = useState(getCatequizandos(id));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showSacramentos, setShowSacramentos] = useState(false);
  const [viewItem, setViewItem] = useState<Catequizando | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showEditSacramentos, setShowEditSacramentos] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const editFotoRef = useRef<HTMLInputElement>(null);

  const updateField = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const updateSacramento = useCallback((sac: 'batismo' | 'eucaristia' | 'crisma', field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [sac]: { ...f[sac], [field]: value } }));
  }, []);

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>, target: 'add' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      if (target === 'add') setForm(f => ({ ...f, foto: url }));
      else setEditForm(f => ({ ...f, foto: url }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAdd = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    const novo: Catequizando = {
      id: crypto.randomUUID(), turmaId: id!, nome: form.nome, dataNascimento: form.dataNascimento,
      responsavel: form.responsavel, telefone: form.telefone, email: form.email, endereco: form.endereco,
      necessidadeEspecial: form.necessidadeEspecial, observacao: form.observacao, status: 'ativo',
      foto: form.foto || undefined,
      sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma },
    };
    saveCatequizando(novo);
    setList(getCatequizandos(id));
    setForm({ ...emptyForm });
    setShowSacramentos(false);
    setOpen(false);
    toast.success("Catequizando adicionado!");
  };

  const handleStatusChange = (catequizando: Catequizando, newStatus: CatequizandoStatus) => {
    const updated = { ...catequizando, status: newStatus };
    saveCatequizando(updated);
    setList(getCatequizandos(id));
    setViewItem(updated);
    toast.success(`Status alterado para ${statusConfig[newStatus].label}`);
  };

  const handleEdit = () => {
    if (!viewItem) return;
    setEditForm({
      nome: viewItem.nome, dataNascimento: viewItem.dataNascimento, responsavel: viewItem.responsavel,
      telefone: viewItem.telefone, email: viewItem.email, endereco: viewItem.endereco || "",
      necessidadeEspecial: viewItem.necessidadeEspecial || "", observacao: viewItem.observacao || "",
      foto: (viewItem as any).foto || "",
      batismo: viewItem.sacramentos?.batismo || { recebido: false, paroquia: "", data: "" },
      eucaristia: viewItem.sacramentos?.eucaristia || { recebido: false, paroquia: "", data: "" },
      crisma: viewItem.sacramentos?.crisma || { recebido: false, paroquia: "", data: "" },
    });
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!viewItem || !editForm.nome) { toast.error("Nome é obrigatório"); return; }
    const updated: Catequizando = {
      ...viewItem, nome: editForm.nome, dataNascimento: editForm.dataNascimento,
      responsavel: editForm.responsavel, telefone: editForm.telefone, email: editForm.email,
      endereco: editForm.endereco, necessidadeEspecial: editForm.necessidadeEspecial,
      observacao: editForm.observacao, foto: editForm.foto || undefined,
      sacramentos: { batismo: editForm.batismo, eucaristia: editForm.eucaristia, crisma: editForm.crisma },
    };
    saveCatequizando(updated);
    setList(getCatequizandos(id));
    setViewItem(updated);
    setEditMode(false);
    toast.success("Catequizando atualizado!");
  };

  const handleDelete = () => {
    if (!viewItem) return;
    if (!confirm(`Excluir ${viewItem.nome}?`)) return;
    deleteCatequizando(viewItem.id);
    setList(getCatequizandos(id));
    setViewItem(null);
    toast.success("Catequizando excluído!");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Catequizandos</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {list.length} cadastrados</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Novo Catequizando</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              {/* Foto */}
              <div className="flex justify-center">
                <button onClick={() => fotoRef.current?.click()} className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors">
                  {form.foto ? (
                    <img src={form.foto} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
                <input ref={fotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFoto(e, 'add')} />
              </div>

              <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Data de nascimento" type="date" value={form.dataNascimento} onChange={(v) => updateField("dataNascimento", v)} />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label>
                  <div className="form-input text-muted-foreground">{calcularIdade(form.dataNascimento) || "—"}</div>
                </div>
              </div>
              <FieldInput label="Responsável" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", v)} />
                <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
              </div>
              <FieldInput label="Endereço" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
              <FieldInput label="Necessidade especial" value={form.necessidadeEspecial} onChange={(v) => updateField("necessidadeEspecial", v)} placeholder="Se houver, descreva aqui" />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label>
                <textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" placeholder="Anotações..." />
              </div>

              <button type="button" onClick={() => setShowSacramentos(!showSacramentos)} className="w-full flex items-center justify-between form-input font-semibold">
                Sacramentos Recebidos
                {showSacramentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showSacramentos && (
                <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                  {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                    <div key={sac} className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form[sac].recebido} onChange={(e) => updateSacramento(sac, "recebido", e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                        <span className="text-sm font-semibold text-foreground capitalize">{sac}</span>
                      </label>
                      {form[sac].recebido && (
                        <div className="grid grid-cols-2 gap-2 ml-6">
                          <FieldInput label="Paróquia" value={form[sac].paroquia} onChange={(v) => updateSacramento(sac, "paroquia", v)} placeholder="Nome da paróquia" />
                          <FieldInput label="Data" type="date" value={form[sac].data} onChange={(v) => updateSacramento(sac, "data", v)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleAdd} className="w-full action-btn">Adicionar</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-accent/15 text-accent-foreground mx-auto mb-3">
            <UserPlus className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum catequizando cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c, i) => {
            const st = statusConfig[c.status || 'ativo'];
            return (
              <button key={c.id} onClick={() => { setViewItem(c); setEditMode(false); }} className="float-card w-full flex items-center gap-3 px-4 py-3.5 animate-float-up text-left active:scale-[0.98] transition-transform" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden shrink-0">
                  {(c as any).foto ? (
                    <img src={(c as any).foto} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-sm font-bold text-accent-foreground">{c.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{c.nome}</p>
                    <span className={`pill-btn ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.dataNascimento && calcularIdade(c.dataNascimento)}
                    {c.responsavel && ` • ${c.responsavel}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* View / Edit Dialog */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) { setViewItem(null); setEditMode(false); } }}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
          {viewItem && !editMode && (
            <>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden shrink-0">
                    {(viewItem as any).foto ? (
                      <img src={(viewItem as any).foto} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-2xl font-bold text-accent-foreground">{viewItem.nome.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{viewItem.nome}</h2>
                    {viewItem.dataNascimento && (
                      <p className="text-xs text-muted-foreground">{calcularIdade(viewItem.dataNascimento)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={handleEdit} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={handleDelete} className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-sm mt-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Status</p>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(statusConfig) as CatequizandoStatus[]).map(s => (
                      <button key={s} onClick={() => handleStatusChange(viewItem, s)} className={`pill-btn transition-all ${(viewItem.status || 'ativo') === s ? statusConfig[s].color + ' ring-2 ring-offset-1 ring-current' : 'pill-btn-inactive'}`}>
                        {statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2.5">
                  <InfoRow label="Data de nascimento" value={viewItem.dataNascimento ? `${new Date(viewItem.dataNascimento + 'T00:00').toLocaleDateString("pt-BR")} (${calcularIdade(viewItem.dataNascimento)})` : undefined} />
                  <InfoRow label="Responsável" value={viewItem.responsavel} />
                  <InfoRow label="Telefone" value={viewItem.telefone} />
                  <InfoRow label="E-mail" value={viewItem.email} />
                  <InfoRow label="Endereço" value={viewItem.endereco} />
                  <InfoRow label="Necessidade especial" value={viewItem.necessidadeEspecial} />
                  <InfoRow label="Observação" value={viewItem.observacao} />
                </div>
                {viewItem.sacramentos && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Sacramentos</p>
                    {(["batismo", "eucaristia", "crisma"] as const).map(sac => {
                      const s = viewItem.sacramentos![sac];
                      return (
                        <div key={sac} className="flex items-center gap-2 py-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${s.recebido ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                          <span className="capitalize font-semibold text-foreground">{sac}</span>
                          {s.recebido && s.paroquia && <span className="text-muted-foreground text-xs">• {s.paroquia}</span>}
                          {s.recebido && s.data && <span className="text-muted-foreground text-xs">• {new Date(s.data + 'T00:00').toLocaleDateString("pt-BR")}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {viewItem && editMode && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Editar Catequizando</DialogTitle>
                  <button onClick={() => setEditMode(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>
                </div>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="flex justify-center">
                  <button onClick={() => editFotoRef.current?.click()} className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors">
                    {editForm.foto ? (
                      <img src={editForm.foto} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <input ref={editFotoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFoto(e, 'edit')} />
                </div>
                <FieldInput label="Nome completo *" value={editForm.nome} onChange={(v) => setEditForm(f => ({ ...f, nome: v }))} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Data de nascimento" type="date" value={editForm.dataNascimento} onChange={(v) => setEditForm(f => ({ ...f, dataNascimento: v }))} />
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label>
                    <div className="form-input text-muted-foreground">{calcularIdade(editForm.dataNascimento) || "—"}</div>
                  </div>
                </div>
                <FieldInput label="Responsável" value={editForm.responsavel} onChange={(v) => setEditForm(f => ({ ...f, responsavel: v }))} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Telefone" type="tel" value={editForm.telefone} onChange={(v) => setEditForm(f => ({ ...f, telefone: v }))} />
                  <FieldInput label="E-mail" type="email" value={editForm.email} onChange={(v) => setEditForm(f => ({ ...f, email: v }))} />
                </div>
                <FieldInput label="Endereço" value={editForm.endereco} onChange={(v) => setEditForm(f => ({ ...f, endereco: v }))} />
                <FieldInput label="Necessidade especial" value={editForm.necessidadeEspecial} onChange={(v) => setEditForm(f => ({ ...f, necessidadeEspecial: v }))} />
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label>
                  <textarea value={editForm.observacao} onChange={(e) => setEditForm(f => ({ ...f, observacao: e.target.value }))} className="form-input min-h-[60px] resize-none" />
                </div>

                <button type="button" onClick={() => setShowEditSacramentos(!showEditSacramentos)} className="w-full flex items-center justify-between form-input font-semibold">
                  Sacramentos Recebidos
                  {showEditSacramentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showEditSacramentos && (
                  <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                    {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                      <div key={sac} className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={editForm[sac].recebido} onChange={(e) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], recebido: e.target.checked } }))} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                          <span className="text-sm font-semibold text-foreground capitalize">{sac}</span>
                        </label>
                        {editForm[sac].recebido && (
                          <div className="grid grid-cols-2 gap-2 ml-6">
                            <FieldInput label="Paróquia" value={editForm[sac].paroquia} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], paroquia: v } }))} />
                            <FieldInput label="Data" type="date" value={editForm[sac].data} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], data: v } }))} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={handleSaveEdit} className="w-full action-btn">Salvar Alterações</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
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
