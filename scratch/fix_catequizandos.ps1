$content = @'
import { useParams, useNavigate } from "react-router-dom";
import { useTurmas, useCatequizandos, useCatequizandoMutation, useDeleteCatequizando } from "@/hooks/useSupabaseData";
import { type Catequizando, type CatequizandoStatus } from "@/lib/store";
import { ArrowLeft, Plus, UserPlus, ChevronDown, ChevronUp, ChevronRight, Camera, Pencil, Trash2, X, Printer } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ReportModule from "@/components/reports/ReportModule";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";
import { mascaraTelefone } from "@/lib/utils";

// --- Helpers ---
function InfoRow({ label, value }: { label: string; value?: string }) { 
  if (!value) return null; 
  return <p><span className="text-muted-foreground">{label}:</span> <span className="font-semibold text-foreground">{value}</span></p>; 
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="form-input" 
      />
    </div>
  );
}

function calcularIdade(dataNascimento: string): string {
  if (!dataNascimento) return "";
  const hoje = new Date(); const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

interface SacramentoInfo { recebido: boolean; paroquia: string; data: string; }
interface CatequizandoForm {
  nome: string; dataNascimento: string; responsavel: string; telefone: string; email: string;
  endereco: string; numero: string; bairro: string; complemento: string;
  necessidadeEspecial: string; observacao: string; foto: string;
  batismo: SacramentoInfo; eucaristia: SacramentoInfo; crisma: SacramentoInfo;
}

const emptyForm: CatequizandoForm = {
  nome: "", dataNascimento: "", responsavel: "", telefone: "", email: "", 
  endereco: "", numero: "", bairro: "", complemento: "",
  necessidadeEspecial: "", observacao: "", foto: "",
  batismo: { recebido: false, paroquia: "", data: "" }, eucaristia: { recebido: false, paroquia: "", data: "" }, crisma: { recebido: false, paroquia: "", data: "" },
};

const statusConfig: Record<CatequizandoStatus, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-success/10 text-success" },
  desistente: { label: "Desistente", color: "bg-destructive/10 text-destructive" },
  afastado: { label: "Afastado", color: "bg-warning/10 text-warning" },
};

export default function CatequizandosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: list = [], isLoading } = useCatequizandos(id);
  const mutation = useCatequizandoMutation();
  const deleteMut = useDeleteCatequizando();
  const turma = turmas.find((t) => t.id === id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showSacramentos, setShowSacramentos] = useState(false);
  const [viewItem, setViewItem] = useState<Catequizando | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showEditSacramentos, setShowEditSacramentos] = useState(false);

  const updateField = useCallback((field: string, value: string) => { setForm((f) => ({ ...f, [field]: value })); }, []);
  const updateSacramento = useCallback((sac: 'batismo' | 'eucaristia' | 'crisma', field: string, value: string | boolean) => { setForm((f) => ({ ...f, [sac]: { ...f[sac], [field]: value } })); }, []);

  const handleAdd = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    const novo: Catequizando = {
      id: crypto.randomUUID(), turmaId: id!, nome: form.nome, dataNascimento: form.dataNascimento,
      responsavel: form.responsavel, telefone: form.telefone, email: form.email, 
      endereco: form.endereco, numero: form.numero, bairro: form.bairro, complemento: form.complemento,
      necessidadeEspecial: form.necessidadeEspecial, observacao: form.observacao, status: 'ativo',
      foto: form.foto || undefined, sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma } as any,
    };
    try { await mutation.mutateAsync(novo); setForm({ ...emptyForm }); setShowSacramentos(false); setOpen(false); toast.success("Catequizando adicionado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleStatusChange = (catequizando: Catequizando, newStatus: CatequizandoStatus) => {
    mutation.mutate({ ...catequizando, status: newStatus });
    setViewItem({ ...catequizando, status: newStatus });
    toast.success(`Status alterado para ${statusConfig[newStatus].label}`);
  };

  const handleEdit = () => {
    if (!viewItem) return;
    setEditForm({
      nome: viewItem.nome, dataNascimento: viewItem.dataNascimento, responsavel: viewItem.responsavel,
      telefone: viewItem.telefone, email: viewItem.email, 
      endereco: viewItem.endereco || "", numero: viewItem.numero || "", bairro: viewItem.bairro || "", complemento: viewItem.complemento || "",
      necessidadeEspecial: viewItem.necessidadeEspecial || "", observacao: viewItem.observacao || "", foto: viewItem.foto || "",
      batismo: (viewItem.sacramentos?.batismo || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      eucaristia: (viewItem.sacramentos?.eucaristia || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      crisma: (viewItem.sacramentos?.crisma || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!viewItem || !editForm.nome) { toast.error("Nome é obrigatório"); return; }
    const updated: Catequizando = {
      ...viewItem, nome: editForm.nome, dataNascimento: editForm.dataNascimento, responsavel: editForm.responsavel,
      telefone: editForm.telefone, email: editForm.email, 
      endereco: editForm.endereco, numero: editForm.numero, bairro: editForm.bairro, complemento: editForm.complemento,
      necessidadeEspecial: editForm.necessidadeEspecial,
      observacao: editForm.observacao, foto: editForm.foto || undefined,
      sacramentos: { batismo: editForm.batismo as any, eucaristia: editForm.eucaristia as any, crisma: editForm.crisma as any },
    };
    try { await mutation.mutateAsync(updated); setViewItem(updated); setEditMode(false); toast.success("Atualizado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const handleDelete = async () => {
    if (!viewItem) return;
    if (!confirm(`Excluir ${viewItem.nome}?`)) return;
    try { await deleteMut.mutateAsync(viewItem.id); setViewItem(null); toast.success("Excluído!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div><h1 className="text-xl font-bold text-foreground">Catequizandos</h1><p className="text-xs text-muted-foreground">{turma?.nome} • {list.length} cadastrados</p></div>
        </div>
        <div className="flex items-center gap-2">
          {id && <ReportModule context="catequizandos" turmaId={id} />}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><button className="action-btn-sm"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
              <DialogHeader><DialogTitle>Novo Catequizando</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="flex justify-center mb-2">
                  <ImagePicker 
                    onImageUpload={(url) => setForm(f => ({ ...f, foto: url }))} 
                    folder="catequizandos" 
                    currentImageUrl={form.foto} 
                    shape="circle" 
                    label="Foto de Perfil"
                  />
                </div>
                <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Data de nascimento" type="date" value={form.dataNascimento} onChange={(v) => updateField("dataNascimento", v)} />
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label><div className="form-input text-muted-foreground">{calcularIdade(form.dataNascimento) || "—"}</div></div>
                </div>
                <FieldInput label="Responsável" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", mascaraTelefone(v))} />
                  <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
                </div>
                <FieldInput label="Rua / Logradouro" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
                <div className="grid grid-cols-3 gap-2">
                  <FieldInput label="Número" value={form.numero} onChange={(v) => updateField("numero", v)} />
                  <div className="col-span-2">
                    <FieldInput label="Bairro" value={form.bairro} onChange={(v) => updateField("bairro", v)} />
                  </div>
                </div>
                <FieldInput label="Complemento" value={form.complemento} onChange={(v) => updateField("complemento", v)} />
                <FieldInput label="Necessidade especial" value={form.necessidadeEspecial} onChange={(v) => updateField("necessidadeEspecial", v)} placeholder="Se houver, descreva aqui" />
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label><textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" placeholder="Anotações..." /></div>
                <button type="button" onClick={() => setShowSacramentos(!showSacramentos)} className="w-full flex items-center justify-between form-input font-semibold">Sacramentos Recebidos {showSacramentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                {showSacramentos && (
                  <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                    {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                      <div key={sac} className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={form[sac].recebido} onChange={(e) => updateSacramento(sac, "recebido", e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" /><span className="text-sm font-semibold text-foreground capitalize">{sac}</span></label>
                        {form[sac].recebido && <div className="grid grid-cols-2 gap-2 ml-6"><FieldInput label="Paróquia" value={form[sac].paroquia} onChange={(v) => updateSacramento(sac, "paroquia", v)} placeholder="Nome da paróquia" /><FieldInput label="Data" type="date" value={form[sac].data} onChange={(v) => updateSacramento(sac, "data", v)} /></div>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleAdd} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : "Adicionar"}</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty-state animate-float-up"><div className="icon-box bg-accent/15 text-accent-foreground mx-auto mb-3"><UserPlus className="h-6 w-6" /></div><p className="text-sm font-medium text-muted-foreground">Nenhum catequizando cadastrado</p></div>
      ) : (
        <div className="space-y-2">{list.map((c, i) => {
          const st = statusConfig[c.status || 'ativo'];
          return (
            <button key={c.id} onClick={() => { setViewItem(c); setEditMode(false); }} className="float-card w-full flex items-center gap-3 px-4 py-3.5 animate-float-up text-left active:scale-[0.98] transition-transform" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden shrink-0">
                {c.foto ? <img src={c.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-sm font-bold text-accent-foreground">{c.nome.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{c.nome}</p>
                  <span className={`pill-btn ${st.color} shrink-0`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.dataNascimento && (
                    <>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.dataNascimento + 'T00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-lg border border-primary/15">
                        {calcularIdade(c.dataNascimento)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 px-1">
                {id && (
                  <ReportModule 
                    context="catequizandos" 
                    turmaId={id} 
                    initialDocId={c.id}
                    instantReport="cat_individual"
                    trigger={
                      <button className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all group/btn border border-transparent hover:border-primary/20">
                        <Printer className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase">Relatório</span>
                      </button>
                    }
                  />
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </button>
          );
        })}</div>
      )}

      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) { setViewItem(null); setEditMode(false); } }}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
          {viewItem && !editMode && (
            <>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden shrink-0">
                  {viewItem.foto ? <img src={viewItem.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl font-bold text-accent-foreground">{viewItem.nome.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0"><h2 className="text-lg font-bold text-foreground">{viewItem.nome}</h2>{viewItem.dataNascimento && <p className="text-xs text-muted-foreground">{calcularIdade(viewItem.dataNascimento)}</p>}</div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <button onClick={handleEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"><Pencil className="h-4 w-4" /> Editar</button>
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"><Trash2 className="h-4 w-4" /> Excluir</button>
              </div>
              <div className="space-y-4 text-sm mt-4">
                <div><p className="text-xs font-semibold text-muted-foreground mb-2">Status</p>
                  <div className="flex gap-2 flex-wrap">{(Object.keys(statusConfig) as CatequizandoStatus[]).map(s => (
                    <button key={s} onClick={() => handleStatusChange(viewItem, s)} className={`pill-btn transition-all ${(viewItem.status || 'ativo') === s ? statusConfig[s].color + ' ring-2 ring-offset-1 ring-current' : 'pill-btn-inactive'}`}>{statusConfig[s].label}</button>
                  ))}</div>
                </div>
                <div className="space-y-2.5">
                  <InfoRow label="Data de nascimento" value={viewItem.dataNascimento ? `${new Date(viewItem.dataNascimento + 'T00:00').toLocaleDateString("pt-BR")} (${calcularIdade(viewItem.dataNascimento)})` : undefined} />
                  <InfoRow label="Responsável" value={viewItem.responsavel} />
                  <InfoRow label="Telefone" value={viewItem.telefone} />
                  <InfoRow label="E-mail" value={viewItem.email} />
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Endereço</p>
                    <p className="text-sm font-medium text-foreground">
                      {viewItem.endereco}{viewItem.numero ? `, ${viewItem.numero}` : ""}
                      {viewItem.bairro ? ` - ${viewItem.bairro}` : ""}
                      {viewItem.complemento ? ` (${viewItem.complemento})` : ""}
                    </p>
                  </div>
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
              <DialogHeader><div className="flex items-center justify-between"><DialogTitle>Editar Catequizando</DialogTitle><button onClick={() => setEditMode(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button></div></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="flex justify-center mb-2">
                  <ImagePicker 
                    onImageUpload={(url) => setEditForm(f => ({ ...f, foto: url }))} 
                    folder="catequizandos" 
                    currentImageUrl={editForm.foto} 
                    shape="circle" 
                    label="Alterar Foto"
                  />
                </div>
                <FieldInput label="Nome completo *" value={editForm.nome} onChange={(v) => setEditForm(f => ({ ...f, nome: v }))} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Data de nascimento" type="date" value={editForm.dataNascimento} onChange={(v) => setEditForm(f => ({ ...f, dataNascimento: v }))} />
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label><div className="form-input text-muted-foreground">{calcularIdade(editForm.dataNascimento) || "—"}</div></div>
                </div>
                <FieldInput label="Responsável" value={editForm.responsavel} onChange={(v) => setEditForm(f => ({ ...f, responsavel: v }))} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Telefone" type="tel" value={editForm.telefone} onChange={(v) => setEditForm(f => ({ ...f, telefone: mascaraTelefone(v) }))} />
                  <FieldInput label="E-mail" type="email" value={editForm.email} onChange={(v) => setEditForm(f => ({ ...f, email: v }))} />
                </div>
                <FieldInput label="Rua / Logradouro" value={editForm.endereco} onChange={(v) => setEditForm(f => ({ ...f, endereco: v }))} />
                <div className="grid grid-cols-3 gap-2">
                  <FieldInput label="Número" value={editForm.numero} onChange={(v) => setEditForm(f => ({ ...f, numero: v }))} />
                  <div className="col-span-2">
                    <FieldInput label="Bairro" value={editForm.bairro} onChange={(v) => setEditForm(f => ({ ...f, bairro: v }))} />
                  </div>
                </div>
                <FieldInput label="Complemento" value={editForm.complemento} onChange={(v) => setEditForm(f => ({ ...f, complemento: v }))} />
                <FieldInput label="Necessidade especial" value={editForm.necessidadeEspecial} onChange={(v) => setEditForm(f => ({ ...f, necessidadeEspecial: v }))} />
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação</label><textarea value={editForm.observacao} onChange={(e) => setEditForm(f => ({ ...f, observacao: e.target.value }))} className="form-input min-h-[60px] resize-none" /></div>
                <button type="button" onClick={() => setShowEditSacramentos(!showEditSacramentos)} className="w-full flex items-center justify-between form-input font-semibold">Sacramentos {showEditSacramentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                {showEditSacramentos && (
                  <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                    {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                      <div key={sac} className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editForm[sac].recebido} onChange={(e) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], recebido: e.target.checked } }))} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" /><span className="text-sm font-semibold text-foreground capitalize">{sac}</span></label>
                        {editForm[sac].recebido && <div className="grid grid-cols-2 gap-2 ml-6"><FieldInput label="Paróquia" value={editForm[sac].paroquia} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], paroquia: v } }))} /><FieldInput label="Data" type="date" value={editForm[sac].data} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], data: v } }))} /></div>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleSaveEdit} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : "Salvar"}</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
'@

$content | Set-Content 'c:\Users\Toshiba\Desktop\Projetos no Antigravity\projeto catequese no lovable\src\pages\CatequizandosList.tsx' -Encoding utf8
