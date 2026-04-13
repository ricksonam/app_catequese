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
    if (!form.nome) { toast.error("Nome Ã© obrigatÃ³rio"); return; }
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
    if (!viewItem || !editForm.nome) { toast.error("Nome Ã© obrigatÃ³rio"); return; }
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
    try { await deleteMut.mutateAsync(viewItem.id); setViewItem(null); toast.success("ExcluÃ­do!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div><h1 className="text-xl font-bold text-foreground">Catequizandos</h1><p className="text-xs text-muted-foreground">{turma?.nome} â€¢ {list.length} cadastrados</p></div>
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
                  <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label><div className="form-input text-muted-foreground">{calcularIdade(form.dataNascimento) || "â€”"}</div></div>
                </div>
                <FieldInput label="ResponsÃ¡vel" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", mascaraTelefone(v))} />
                  <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
                </div>
                <FieldInput label="Rua / Logradouro" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
                <div className="grid grid-cols-3 gap-2">
                  <FieldInput label="NÃºmero" value={form.numero} onChange={(v) => updateField("numero", v)} />
                  <div className="col-span-2">
                    <FieldInput label="Bairro" value={form.bairro} onChange={(v) => updateField("bairro", v)} />
                  </div>
                </div>
                <FieldInput label="Complemento" value={form.complemento} onChange={(v) => updateField("complemento", v)} />
                <FieldInput label="Necessidade especial" value={form.necessidadeEspecial} onChange={(v) => updateField("necessidadeEspecial", v)} placeholder="Se houver, descreva aqui" />
                <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">ObservaÃ§Ã£o</label><textarea value={form.observacao} onChange={(e) => updateField("observacao", e.target.value)} className="form-input min-h-[60px] resize-none" placeholder="AnotaÃ§Ãµes..." /></div>
                <button type="button" onClick={() => setShowSacramentos(!showSacramentos)} className="w-full flex items-center justify-between form-input font-semibold">Sacramentos Recebidos {showSacramentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
                {showSacramentos && (
                  <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                    {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                      <div key={sac} className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={form[sac].recebido} onChange={(e) => updateSacramento(sac, "recebido", e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" /><span className="text-sm font-semibold text-foreground capitalize">{sac}</span></label>
                        {form[sac].recebido && <div className="grid grid-cols-2 gap-2 ml-6"><FieldInput label="ParÃ³quia" value={form[sac].paroquia} onChange={(v) => updateSacramento(sac, "paroquia", v)} placeholder="Nome da parÃ³quia" /><FieldInput label="Data" type="date" value={form[sac].data} onChange={(v) => updateSacramento(sac, "data", v)} /></div>}
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
            <button key={c.id} onClick={() => { setViewItem(c); setEditMode(false); }} className="relative w-full group animate-float-up text-left" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 bg-card rounded-2xl border border-black/5 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all active:scale-[0.98]">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shadow-inner ring-2 ring-background">
                    {c.foto ? <img src={c.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-lg font-black text-primary/70">{c.nome.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${st.color.split(' ')[0]}`} title={`Status: ${st.label}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">{c.nome}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {c.responsavel && (
                      <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold text-muted-foreground max-w-full truncate">
                         Resp: <span className="text-foreground ml-1 truncate">{c.responsavel.split(' ')[0]}</span>
                      </span>
                    )}
                    {c.dataNascimento && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30 hidden sm:block" />
                        <span className="text-[10px] sm:text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                          {calcularIdade(c.dataNascimento)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="shrink-0 pl-2">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex flex-col items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}</div>
      )}

      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) { setViewItem(null); setEditMode(false); } }}>
        <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30 p-0 sm:p-0">
          {viewItem && !editMode && (
            <div className="flex flex-col h-full relative bg-background">
              {/* Hero Banner */}
              <div className="relative pt-8 pb-5 px-6 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent text-center border-b border-black/5">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={handleEdit} className="p-2 rounded-full bg-white/50 hover:bg-white text-primary shadow-sm transition-all border border-black/5"><Pencil className="h-4 w-4" /></button>
                  <button onClick={handleDelete} className="p-2 rounded-full bg-white/50 hover:bg-white text-destructive shadow-sm transition-all border border-black/5"><Trash2 className="h-4 w-4" /></button>
                </div>
                
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-white shadow-xl ring-4 ring-white/50 flex items-center justify-center overflow-hidden mb-4 relative z-10">
                  {viewItem.foto ? <img src={viewItem.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-4xl font-black text-primary/70">{viewItem.nome.charAt(0).toUpperCase()}</span>}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2 leading-tight px-2">{viewItem.nome}</h2>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${(statusConfig[viewItem.status || 'ativo']).color.replace('text-','border-')} ${(statusConfig[viewItem.status || 'ativo']).color}`}>
                    {statusConfig[viewItem.status || 'ativo'].label}
                  </span>
                  {viewItem.dataNascimento && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 bg-primary/10 text-primary">
                      {calcularIdade(viewItem.dataNascimento)}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {/* Alerta Necessidade Especial */}
                {viewItem.necessidadeEspecial && (
                  <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-xl">
                    <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" /> Atenção Especial
                    </p>
                    <p className="text-sm font-semibold text-destructive/80 leading-snug">{viewItem.necessidadeEspecial}</p>
                  </div>
                )}

                {/* Blocos de Informação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card Pessoal */}
                  <div className="bg-muted/30 rounded-2xl p-4 border border-black/5">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Dados Pessoais</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                         <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Nascimento</p>
                         <p className="font-semibold text-foreground">{viewItem.dataNascimento ? new Date(viewItem.dataNascimento + 'T00:00').toLocaleDateString("pt-BR") : "Não informada"}</p>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div>
                         <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Telefone</p>
                         <p className="font-semibold text-foreground">{viewItem.telefone || "—"}</p>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div>
                         <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">E-mail</p>
                         <p className="font-semibold text-foreground truncate">{viewItem.email || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Endereço e Responsável */}
                  <div className="space-y-4">
                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><UserPlus className="h-12 w-12 text-primary" /></div>
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 relative z-10">Responsável</h4>
                      <p className="text-base font-bold text-foreground leading-tight relative z-10">{viewItem.responsavel || "Não informado"}</p>
                    </div>

                    <div className="bg-muted/30 rounded-2xl p-4 border border-black/5">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Endereço</h4>
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {viewItem.endereco || viewItem.bairro || viewItem.numero ? (
                          <>
                            {viewItem.endereco}{viewItem.numero ? `, ${viewItem.numero}` : ""}
                            <br />
                            <span className="text-muted-foreground font-medium text-xs">
                              {viewItem.bairro ? `Bairro: ${viewItem.bairro} ` : ""}
                              {viewItem.complemento ? `(${viewItem.complemento})` : ""}
                            </span>
                          </>
                        ) : <span className="text-muted-foreground">Nenhum cadatrado</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sacramentos Grid */}
                {viewItem.sacramentos && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Situação Sacramental</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["batismo", "eucaristia", "crisma"] as const).map(sac => { 
                        const s = viewItem.sacramentos![sac]; 
                        const isOk = s?.recebido;
                        return (
                          <div key={sac} className={`p-3.5 rounded-2xl border ${isOk ? 'bg-success/5 border-success/20' : 'bg-muted/50 border-black/5'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black capitalize text-foreground">{sac}</span>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${isOk ? 'bg-success/20 text-success' : 'bg-black/5 text-muted-foreground'}`}>
                                {isOk ? '✓' : '-'}
                              </div>
                            </div>
                            {isOk ? (
                              <div className="text-[10px] font-medium text-muted-foreground space-y-0.5">
                                {s.paroquia && <p className="truncate"><span className="font-semibold text-foreground/70">P:</span> {s.paroquia}</p>}
                                {s.data && <p><span className="font-semibold text-foreground/70">D:</span> {new Date(s.data + 'T00:00').toLocaleDateString("pt-BR")}</p>}
                                {!s.paroquia && !s.data && <p className="italic">S/ Detalhes</p>}
                              </div>
                            ) : (
                              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Pendente</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Observações */}
                {viewItem.observacao && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Anotações</h4>
                    <p className="text-sm text-amber-900/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacao}</p>
                  </div>
                )}
                
                {/* Alterar Status */}
                <div className="pt-4 border-t border-black/5 pb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 text-center">Ativar / Inativar Cadastro</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {(Object.keys(statusConfig) as CatequizandoStatus[]).map(s => {
                      const isAtivo = (viewItem.status || 'ativo') === s;
                      return (
                        <button key={s} onClick={() => handleStatusChange(viewItem, s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isAtivo ? 'bg-foreground text-background border-foreground shadow-[0_4px_10px_-3px_rgba(0,0,0,0.3)]' : 'bg-muted text-muted-foreground hover:bg-muted/70 border-black/5'}`}>
                          {statusConfig[s].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {viewItem && editMode && (
            <div className="p-5 sm:p-6 bg-background rounded-2xl">
              <DialogHeader><div className="flex items-center justify-between"><DialogTitle>Editar Catequizando</DialogTitle><button onClick={() => setEditMode(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button></div></DialogHeader>
              <div className="space-y-3 mt-4">
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
                  <div className="space-y-3 pl-3 border-l-2 border-primary/20 mt-2">
                    {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                      <div key={sac} className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editForm[sac].recebido} onChange={(e) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], recebido: e.target.checked } }))} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" /><span className="text-sm font-semibold text-foreground capitalize">{sac}</span></label>
                        {editForm[sac].recebido && <div className="grid grid-cols-2 gap-2 ml-6"><FieldInput label="Paróquia" value={editForm[sac].paroquia} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], paroquia: v } }))} /><FieldInput label="Data" type="date" value={editForm[sac].data} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], data: v } }))} /></div>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={handleSaveEdit} disabled={mutation.isPending} className="w-full action-btn mt-4">{mutation.isPending ? "Salvando..." : "Salvar"}</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
