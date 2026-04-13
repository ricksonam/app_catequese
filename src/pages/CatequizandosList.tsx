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
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
interface ResponsavelForm { id: string; nome: string; telefone: string; vinculo: 'pais' | 'avós' | 'tios' | 'outros'; }
interface CatequizandoForm {
  nome: string; dataNascimento: string; email: string; telefone: string;
  endereco: string; numero: string; bairro: string; complemento: string;
  necessidadeEspecial: string; observacao: string; foto: string;
  batismo: SacramentoInfo; eucaristia: SacramentoInfo; crisma: SacramentoInfo;
  participacaoPastoral: string;
  responsaveis: ResponsavelForm[];
}

const NECESSIDADES_ESPECIAIS = [
  { id: "nenhuma", label: "Nenhuma", lanyard: null, color: "" },
  { id: "tea", label: "Autismo (TEA)", lanyard: "quebra-cabeça", color: "bg-blue-500", pattern: "🧩" },
  { id: "tdah", label: "TDAH", lanyard: "girassol", color: "bg-green-500", pattern: "🌻" },
  { id: "visual", label: "Deficiência Visual", lanyard: "branco/azul", color: "bg-white border-blue-500", pattern: "🦯" },
  { id: "auditiva", label: "Deficiência Auditiva", lanyard: "azul", color: "bg-blue-700", pattern: "👂" },
  { id: "fisica", label: "Deficiência Física", lanyard: "azul/branco", color: "bg-blue-600", pattern: "♿" },
  { id: "oculta", label: "Deficiências Ocultas", lanyard: "girassol", color: "bg-green-100 border-green-500", pattern: "🌻" },
  { id: "outro", label: "Outro", lanyard: "cinza", color: "bg-gray-400", pattern: "⭕" },
];

function LanyardDrawing({ type }: { type: string }) {
  const need = NECESSIDADES_ESPECIAIS.find(n => n.id === type);
  if (!need || !need.lanyard) return null;

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-white/50 rounded-2xl border-2 border-dashed border-black/10 animate-in zoom-in-95">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Cordão de Identificação</p>
      <div className="relative w-full max-w-[200px] h-12 flex items-center justify-center">
        {/* Simulação do Cordão (Strap) */}
        <div className={`absolute inset-x-0 h-6 rounded-full border-2 border-black/10 ${need.color} shadow-sm overflow-hidden flex items-center justify-around px-2`}>
          {[...Array(6)].map((_, i) => (
            <span key={i} className="text-xs filter saturate-150 drop-shadow-sm">{need.pattern}</span>
          ))}
        </div>
        {/* O Crachá (Badge) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 w-10 h-14 bg-white rounded-md border-2 border-black/10 shadow-lg flex flex-col items-center p-1 z-10">
          <div className="w-6 h-1 bg-black/10 rounded-full mb-1" />
          <div className="w-full h-8 bg-muted/20 rounded flex items-center justify-center text-lg">{need.pattern}</div>
          <div className="w-full h-1 bg-black/5 rounded-full mt-1.5" />
          <div className="w-3/4 h-1 bg-black/5 rounded-full mt-1" />
        </div>
      </div>
      <p className="text-xs font-bold text-foreground mt-4 uppercase">{need.lanyard}</p>
    </div>
  );
}

const emptyForm: CatequizandoForm = {
  nome: "", dataNascimento: new Date().toISOString().split('T')[0], email: "", telefone: "",
  endereco: "", numero: "", bairro: "", complemento: "",
  necessidadeEspecial: "nenhuma", observacao: "", foto: "",
  batismo: { recebido: false, paroquia: "", data: "" }, eucaristia: { recebido: false, paroquia: "", data: "" }, crisma: { recebido: false, paroquia: "", data: "" },
  participacaoPastoral: "",
  responsaveis: [{ id: crypto.randomUUID(), nome: "", telefone: "", vinculo: 'pais' }],
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
      responsavel: form.responsaveis[0]?.nome || "", telefone: form.telefone, email: form.email, 
      endereco: form.endereco, numero: form.numero, bairro: form.bairro, complemento: form.complemento,
      necessidadeEspecial: form.necessidadeEspecial, observacao: form.observacao, status: 'ativo',
      foto: form.foto || undefined,
      sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma } as any,
      responsaveis: form.responsaveis as any[],
      dadosPastorais: {
        sacramentos: { batismo: form.batismo, eucaristia: form.eucaristia, crisma: form.crisma },
        participacaoPastoral: form.participacaoPastoral
      } as any
    };
    try { await mutation.mutateAsync(novo); setForm({ ...emptyForm }); setShowSacramentos(false); setOpen(false); toast.success("Catequizando adicionado!"); }
    catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const addResponsavel = (isEdit: boolean) => {
    const newItem = { id: crypto.randomUUID(), nome: "", telefone: "", vinculo: 'pais' as const };
    if (isEdit) setEditForm(f => ({ ...f, responsaveis: [...f.responsaveis, newItem] }));
    else setForm(f => ({ ...f, responsaveis: [...f.responsaveis, newItem] }));
  };

  const removeResponsavel = (id: string, isEdit: boolean) => {
    if (isEdit) setEditForm(f => ({ ...f, responsaveis: f.responsaveis.filter(r => r.id !== id) }));
    else setForm(f => ({ ...f, responsaveis: f.responsaveis.filter(r => r.id !== id) }));
  };

  const updateResponsavel = (id: string, field: string, value: string, isEdit: boolean) => {
    const update = (r: ResponsavelForm) => r.id === id ? { ...r, [field]: value } : r;
    if (isEdit) setEditForm(f => ({ ...f, responsaveis: f.responsaveis.map(update) }));
    else setForm(f => ({ ...f, responsaveis: f.responsaveis.map(update) }));
  };

  const handleStatusChange = (catequizando: Catequizando, newStatus: CatequizandoStatus) => {
    mutation.mutate({ ...catequizando, status: newStatus });
    setViewItem({ ...catequizando, status: newStatus });
    toast.success(`Status alterado para ${statusConfig[newStatus].label}`);
  };

  const handleEdit = () => {
    if (!viewItem) return;
    setEditForm({
      nome: viewItem.nome, dataNascimento: viewItem.dataNascimento,
      telefone: viewItem.telefone, email: viewItem.email, 
      endereco: viewItem.endereco || "", numero: viewItem.numero || "", bairro: viewItem.bairro || "", complemento: viewItem.complemento || "",
      necessidadeEspecial: viewItem.necessidadeEspecial || "", observacao: viewItem.observacao || "", foto: viewItem.foto || "",
      batismo: (viewItem.dadosPastorais?.sacramentos?.batismo || viewItem.sacramentos?.batismo || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      eucaristia: (viewItem.dadosPastorais?.sacramentos?.eucaristia || viewItem.sacramentos?.eucaristia || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      crisma: (viewItem.dadosPastorais?.sacramentos?.crisma || viewItem.sacramentos?.crisma || { recebido: false, paroquia: "", data: "" }) as SacramentoInfo,
      participacaoPastoral: viewItem.dadosPastorais?.participacaoPastoral || "",
      responsaveis: (viewItem.responsaveis?.length ? viewItem.responsaveis : [{ id: crypto.randomUUID(), nome: viewItem.responsavel || "", telefone: viewItem.telefone || "", vinculo: 'pais' }]) as ResponsavelForm[],
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!viewItem || !editForm.nome) { toast.error("Nome é obrigatório"); return; }
    const updated: Catequizando = {
      ...viewItem, nome: editForm.nome, dataNascimento: editForm.dataNascimento,
      responsavel: editForm.responsaveis[0]?.nome || "",
      telefone: editForm.telefone, email: editForm.email, 
      endereco: editForm.endereco, numero: editForm.numero, bairro: editForm.bairro, complemento: editForm.complemento,
      necessidadeEspecial: editForm.necessidadeEspecial,
      observacao: editForm.observacao, foto: editForm.foto || undefined,
      responsaveis: editForm.responsaveis as any[],
      dadosPastorais: {
        sacramentos: { batismo: editForm.batismo as any, eucaristia: editForm.eucaristia as any, crisma: editForm.crisma as any },
        participacaoPastoral: editForm.participacaoPastoral
      } as any,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="back-btn shrink-0"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">Catequizandos</h1>
            <p className="text-xs text-muted-foreground truncate">{list.length} cadastrados</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex-1 sm:flex-none">
            {id && <ReportModule context="catequizandos" turmaId={id} />}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><button className="action-btn-sm shrink-0 whitespace-nowrap"><Plus className="h-4 w-4" /> Novo</button></DialogTrigger>
            <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto border-border/30 w-full max-w-2xl">
              <DialogHeader><DialogTitle className="text-2xl font-black">Ficha de Inscrição</DialogTitle></DialogHeader>
              <div className="space-y-8 mt-4 pb-6">
                {/* SEÇÃO 1: DADOS PESSOAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary font-black">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm"><UserPlus className="w-5 h-5" /></div>
                    <span className="text-lg tracking-tight">DADOS PESSOAIS</span>
                  </div>
                  <Separator className="bg-primary/20 h-0.5" />
                  
                  <div className="flex justify-center mb-4">
                    <ImagePicker 
                      onImageUpload={(url) => setForm(f => ({ ...f, foto: url }))} 
                      folder="catequizandos" 
                      currentImageUrl={form.foto} 
                      shape="circle" 
                      label="Foto de Perfil"
                    />
                  </div>

                  <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomDatePicker 
                      label="Data de Nascimento" 
                      value={form.dataNascimento} 
                      onChange={(v) => updateField("dataNascimento", v)} 
                    />
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label>
                      <div className="h-10 flex items-center px-3 bg-muted/30 rounded-md border border-input font-bold text-primary">
                        {calcularIdade(form.dataNascimento) || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", mascaraTelefone(v))} />
                    <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput label="Endereço / Rua" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
                    <div className="grid grid-cols-2 gap-4">
                       <FieldInput label="Número" value={form.numero} onChange={(v) => updateField("numero", v)} />
                       <FieldInput label="Bairro" value={form.bairro} onChange={(v) => updateField("bairro", v)} />
                    </div>
                  </div>
                  <FieldInput label="Complemento" value={form.complemento} onChange={(v) => updateField("complemento", v)} />
                </div>

                {/* SEÇÃO 2: DADOS PASTORAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-orange-600 font-black">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">✝️</div>
                    <span className="text-lg tracking-tight">DADOS PASTORAIS</span>
                  </div>
                  <Separator className="bg-orange-500/20 h-0.5" />

                  <div className="space-y-4 bg-white p-5 rounded-2xl border-2 border-orange-100 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sacramentos Recebidos</p>
                    <div className="grid grid-cols-1 gap-4">
                      {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                        <div key={sac} className="space-y-2">
                          <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={form[sac].recebido} 
                              onChange={(e) => updateSacramento(sac, "recebido", e.target.checked)} 
                              className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary" 
                            />
                            <span className="text-sm font-bold text-foreground capitalize">{sac}</span>
                          </label>
                          {form[sac].recebido && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7 animate-in slide-in-from-left-2">
                              <FieldInput label="Paróquia" value={form[sac].paroquia} onChange={(v) => updateSacramento(sac, "paroquia", v)} placeholder="Local do sacramento" />
                              <CustomDatePicker label="Data" value={form[sac].data || ""} onChange={(v) => updateSacramento(sac, "data", v)} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Participa de alguma Pastoral ou Grupo?</label>
                    <textarea 
                      value={form.participacaoPastoral} 
                      onChange={(e) => setForm(f => ({ ...f, participacaoPastoral: e.target.value }))} 
                      className="form-input min-h-[60px] resize-none" 
                      placeholder="Ex: Coroinhas, Infância Missionária, etc..." 
                    />
                  </div>
                </div>

                {/* SEÇÃO 3: DADOS DO RESPONSÁVEL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-500 font-bold">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-[-4px]">👥</div>
                      <span>DADOS DO RESPONSÁVEL</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => addResponsavel(false)}
                      className="text-[10px] font-black uppercase text-blue-600 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Outro
                    </button>
                  </div>
                  <Separator className="bg-blue-500/20 h-0.5" />

                  <div className="space-y-4">
                    {form.responsaveis.map((resp, idx) => (
                      <div key={resp.id} className="p-5 bg-white border-2 border-blue-100 rounded-2xl space-y-4 relative group animate-in zoom-in-95 shadow-sm">
                        {form.responsaveis.length > 1 && (
                          <button 
                            onClick={() => removeResponsavel(resp.id, false)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FieldInput label="Nome do Responsável" value={resp.nome} onChange={(v) => updateResponsavel(resp.id, "nome", v, false)} />
                          <FieldInput label="Telefone Contato" type="tel" value={resp.telefone} onChange={(v) => updateResponsavel(resp.id, "telefone", mascaraTelefone(v), false)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Vínculo / Parentesco</label>
                          <Select 
                            value={resp.vinculo} 
                            onValueChange={(v) => updateResponsavel(resp.id, "vinculo", v, false)}
                          >
                            <SelectTrigger className="h-10 bg-background">
                              <SelectValue placeholder="Selecione o vínculo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pais">Pais</SelectItem>
                              <SelectItem value="avós">Avós</SelectItem>
                              <SelectItem value="tios">Tios</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* OBSERVAÇÕES E NECESSIDADES */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground font-bold">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">📝</div>
                    <span>OUTRAS INFORMAÇÕES</span>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Necessidade Especial</label>
                      <Select 
                        value={form.necessidadeEspecial} 
                        onValueChange={(v) => updateField("necessidadeEspecial", v)}
                      >
                        <SelectTrigger className="h-10 bg-background border-2 border-black/10">
                          <SelectValue placeholder="Selecione se houver" />
                        </SelectTrigger>
                        <SelectContent>
                          {NECESSIDADES_ESPECIAIS.map(n => (
                            <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.necessidadeEspecial !== "nenhuma" && (
                        <div className="mt-4">
                          <LanyardDrawing type={form.necessidadeEspecial} />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação Geral</label>
                      <textarea 
                        value={form.observacao} 
                        onChange={(e) => updateField("observacao", e.target.value)} 
                        className="form-input min-h-[80px] resize-none border-2 border-black/10" 
                        placeholder="Anotações extras sobre o catequizando..." 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAdd} 
                  disabled={mutation.isPending} 
                  className="w-full action-btn h-12 text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {mutation.isPending ? "Salvando..." : "CONCLUIR INSCRIÇÃO"}
                </button>
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
            <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden relative">
              {/* Header Bar Clean */}
              <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 border-b border-black/5 bg-background/90 backdrop-blur-md">
                <span className="text-sm font-bold text-foreground truncate pr-4">{viewItem.nome}</span>
                <div className="flex items-center gap-4 z-50">
                  <button onClick={handleEdit} className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-sm hover:scale-110 active:scale-95"><Pencil className="h-5 w-5" /></button>
                  <button onClick={handleDelete} className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all shadow-sm hover:scale-110 active:scale-95"><Trash2 className="h-5 w-5" /></button>
                  <div className="w-px h-6 bg-black/10 mx-1" />
                  <button onClick={() => { setViewItem(null); setEditMode(false); }} className="p-2.5 rounded-xl bg-muted text-foreground hover:bg-black/10 transition-all shadow-sm hover:scale-110 active:scale-95"><X className="h-5 w-5" /></button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                {/* Perfil Minimalista */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden shrink-0 border border-black/5">
                    {viewItem.foto ? <img src={viewItem.foto} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl font-bold text-accent-foreground">{viewItem.nome.charAt(0).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h2 className="text-2xl font-black text-foreground leading-tight tracking-tight mb-2">{viewItem.nome}</h2>
                    <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusConfig[viewItem.status || 'ativo'].color}`}>
                        {statusConfig[viewItem.status || 'ativo'].label}
                      </span>
                      {viewItem.dataNascimento && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                          {calcularIdade(viewItem.dataNascimento)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identificação Especial (Cordão) */}
                {viewItem.necessidadeEspecial && viewItem.necessidadeEspecial !== "nenhuma" && (
                   <LanyardDrawing type={viewItem.necessidadeEspecial} />
                )}

                {/* Blocos de Informação em Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dados Pessoais */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-black/10 shadow-sm">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                       <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shadow-sm"><UserPlus className="w-4 h-4" /></span> Dados Pessoais
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-muted-foreground">Nascimento</span>
                         <span className="text-base font-black text-foreground text-right">{viewItem.dataNascimento ? new Date(viewItem.dataNascimento + 'T00:00').toLocaleDateString("pt-BR") : "Não informado"}</span>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-muted-foreground">Telefone</span>
                         <span className="text-base font-black text-foreground text-right">{viewItem.telefone || "—"}</span>
                      </div>
                      <div className="h-px bg-black/5" />
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-muted-foreground">E-mail</span>
                         <span className="text-base font-black text-foreground text-right truncate max-w-[150px]">{viewItem.email || "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="bg-white rounded-2xl p-6 border-2 border-black/10 shadow-sm">
                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shadow-sm">📍</span> Endereço
                    </h4>
                    <p className="text-base font-black text-foreground leading-snug">
                      {viewItem.endereco || viewItem.bairro || viewItem.numero ? (
                        <>
                          {viewItem.endereco}{viewItem.numero ? `, ${viewItem.numero}` : ""}
                          <span className="block text-muted-foreground font-bold text-xs mt-1">
                            {viewItem.bairro ? `Bairro: ${viewItem.bairro} ` : ""}
                            {viewItem.complemento ? `(${viewItem.complemento})` : ""}
                          </span>
                        </>
                      ) : <span className="text-muted-foreground italic text-sm">Nenhum cadastrado</span>}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-sm">
                  <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500 shadow-sm">👥</span> Responsáveis
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewItem.responsaveis?.length ? (
                      viewItem.responsaveis.map(resp => (
                        <div key={resp.id} className="p-3 bg-white border border-blue-100 rounded-xl">
                          <p className="text-sm font-bold text-foreground truncate">{resp.nome}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase">{resp.vinculo}</span>
                            <span className="text-[11px] font-medium text-muted-foreground">{resp.telefone}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-3 bg-white border border-blue-100 rounded-xl">
                        <p className="text-sm font-bold text-foreground">{viewItem.responsavel || "Não informado"}</p>
                        <p className="text-[11px] text-muted-foreground">{viewItem.telefone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DADOS PASTORAIS E SACRAMENTOS */}
                <div className="bg-white rounded-2xl p-6 border-2 border-orange-100 shadow-sm">
                  <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 shadow-sm">✝️</span> Dados Pastorais
                  </h4>
                  
                  {viewItem.dadosPastorais?.participacaoPastoral && (
                    <div className="mb-4 p-4 bg-white border-2 border-orange-100 rounded-2xl">
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-wider mb-1">Participação em Pastorais/Grupos</p>
                      <p className="text-base font-black">{viewItem.dadosPastorais.participacaoPastoral}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    {(["batismo", "eucaristia", "crisma"] as const).map(sac => { 
                      const s = viewItem.dadosPastorais?.sacramentos?.[sac] || viewItem.sacramentos?.[sac]; 
                      const isOk = s?.recebido;
                      return (
                        <div key={sac} className="flex-1 flex flex-col items-start p-4 bg-white border-2 border-orange-100 rounded-2xl">
                          <div className="flex items-center gap-2 mb-2 w-full">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isOk ? 'bg-success text-white' : 'bg-muted-foreground/30 text-white'}`}>
                              <span className="text-[12px] font-black">{isOk ? '✓' : ''}</span>
                            </div>
                            <span className={`text-sm font-black capitalize ${isOk ? 'text-foreground' : 'text-muted-foreground'}`}>{sac}</span>
                          </div>
                          {isOk ? (
                            <div className="text-xs font-bold text-muted-foreground w-full">
                              {s.paroquia && <p className="truncate"><span className="opacity-70 font-black">Local:</span> {s.paroquia}</p>}
                              {s.data && <p><span className="opacity-70 font-black">Data:</span> {new Date(s.data + 'T00:00').toLocaleDateString("pt-BR")}</p>}
                              {!s.paroquia && !s.data && <p className="italic">Sem detalhes</p>}
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-muted-foreground/50 italic">Pendente</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Observações */}
                {viewItem.observacao && (
                  <div className="bg-accent/5 rounded-2xl p-5 border border-accent/10">
                    <h4 className="text-[10px] font-black text-accent-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                       <span className="w-4 h-4 rounded bg-accent/10 flex items-center justify-center text-accent">📝</span> Anotações
                    </h4>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{viewItem.observacao}</p>
                  </div>
                )}
                
                {/* Alterar Status */}
                <div className="pt-4 border-t-2 border-black/10 pb-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 text-center">Situação do Aluno</p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {(Object.keys(statusConfig) as CatequizandoStatus[]).map(s => {
                      const isAtivo = (viewItem.status || 'ativo') === s;
                      return (
                        <button key={s} onClick={() => handleStatusChange(viewItem, s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${isAtivo ? 'bg-foreground text-background border-foreground shadow-md scale-105' : 'bg-muted text-muted-foreground hover:bg-black/5 border-black/10'}`}>
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
            <div className="p-5 sm:p-6 bg-background rounded-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle className="text-xl font-bold">Editar Inscrição</DialogTitle>
                  <button onClick={() => setEditMode(false)} className="p-2 rounded-xl bg-muted hover:bg-black/5 transition-colors"><X className="h-4 w-4" /></button>
                </div>
              </DialogHeader>
              <div className="space-y-8 mt-4 pb-6">
                {/* SEÇÃO 1: DADOS PESSOAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary font-black">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm"><Pencil className="w-5 h-5" /></div>
                    <span className="text-lg tracking-tight">DADOS PESSOAIS</span>
                  </div>
                  <Separator className="bg-primary/20 h-0.5" />
                  
                  <div className="flex justify-center mb-4">
                    <ImagePicker 
                      onImageUpload={(url) => setEditForm(f => ({ ...f, foto: url }))} 
                      folder="catequizandos" 
                      currentImageUrl={editForm.foto} 
                      shape="circle" 
                      label="Alterar Foto"
                    />
                  </div>

                  <FieldInput label="Nome completo *" value={editForm.nome} onChange={(v) => setEditForm(f => ({ ...f, nome: v }))} />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomDatePicker 
                      label="Data de Nascimento" 
                      value={editForm.dataNascimento} 
                      onChange={(v) => setEditForm(f => ({ ...f, dataNascimento: v }))} 
                    />
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Idade</label>
                      <div className="h-10 flex items-center px-3 bg-muted/30 rounded-md border border-input font-bold text-primary">
                        {calcularIdade(editForm.dataNascimento) || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput label="Telefone" type="tel" value={editForm.telefone} onChange={(v) => setEditForm(f => ({ ...f, telefone: mascaraTelefone(v) }))} />
                    <FieldInput label="E-mail" type="email" value={editForm.email} onChange={(v) => setEditForm(f => ({ ...f, email: v }))} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput label="Endereço / Rua" value={editForm.endereco} onChange={(v) => setEditForm(f => ({ ...f, endereco: v }))} />
                    <div className="grid grid-cols-2 gap-4">
                      <FieldInput label="Número" value={editForm.numero} onChange={(v) => setEditForm(f => ({ ...f, numero: v }))} />
                       <FieldInput label="Bairro" value={editForm.bairro} onChange={(v) => setEditForm(f => ({ ...f, bairro: v }))} />
                    </div>
                  </div>
                  <FieldInput label="Complemento" value={editForm.complemento} onChange={(v) => setEditForm(f => ({ ...f, complemento: v }))} />
                </div>

                {/* SEÇÃO 2: DADOS PASTORAIS */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-orange-600 font-black">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">✝️</div>
                    <span className="text-lg tracking-tight">DADOS PASTORAIS</span>
                  </div>
                  <Separator className="bg-orange-500/20 h-0.5" />

                  <div className="space-y-4 bg-white p-5 rounded-2xl border-2 border-orange-100 shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sacramentos Recebidos</p>
                    <div className="grid grid-cols-1 gap-4">
                      {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                        <div key={sac} className="space-y-2">
                          <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={editForm[sac].recebido} 
                              onChange={(e) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], recebido: e.target.checked } }))} 
                              className="w-5 h-5 rounded-md border-border text-primary focus:ring-primary" 
                            />
                            <span className="text-sm font-bold text-foreground capitalize">{sac}</span>
                          </label>
                          {editForm[sac].recebido && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7 animate-in slide-in-from-left-2">
                              <FieldInput label="Paróquia" value={editForm[sac].paroquia} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], paroquia: v } }))} placeholder="Local do sacramento" />
                              <CustomDatePicker label="Data" value={editForm[sac].data || ""} onChange={(v) => setEditForm(f => ({ ...f, [sac]: { ...f[sac], data: v } }))} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Participa de alguma Pastoral ou Grupo?</label>
                    <textarea 
                      value={editForm.participacaoPastoral} 
                      onChange={(e) => setEditForm(f => ({ ...f, participacaoPastoral: e.target.value }))} 
                      className="form-input min-h-[60px] resize-none" 
                    />
                  </div>
                </div>

                {/* SEÇÃO 3: DADOS DO RESPONSÁVEL */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-500 font-bold">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mt-[-4px]">👥</div>
                      <span>DADOS DO RESPONSÁVEL</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => addResponsavel(true)}
                      className="text-[10px] font-black uppercase text-blue-600 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Outro
                    </button>
                  </div>
                  <Separator className="bg-blue-500/20 h-0.5" />

                  <div className="space-y-4">
                    {editForm.responsaveis.map((resp, idx) => (
                      <div key={resp.id} className="p-5 bg-white border-2 border-blue-100 rounded-2xl space-y-4 relative group animate-in zoom-in-95 shadow-sm">
                        {editForm.responsaveis.length > 1 && (
                          <button 
                            onClick={() => removeResponsavel(resp.id, true)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FieldInput label="Nome do Responsável" value={resp.nome} onChange={(v) => updateResponsavel(resp.id, "nome", v, true)} />
                          <FieldInput label="Telefone Contato" type="tel" value={resp.telefone} onChange={(v) => updateResponsavel(resp.id, "telefone", mascaraTelefone(v), true)} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Vínculo / Parentesco</label>
                          <Select 
                            value={resp.vinculo} 
                            onValueChange={(v) => updateResponsavel(resp.id, "vinculo", v, true)}
                          >
                            <SelectTrigger className="h-10 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pais">Pais</SelectItem>
                              <SelectItem value="avós">Avós</SelectItem>
                              <SelectItem value="tios">Tios</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Necessidade Especial</label>
                    <Select 
                      value={editForm.necessidadeEspecial} 
                      onValueChange={(v) => setEditForm(f => ({ ...f, necessidadeEspecial: v }))}
                    >
                      <SelectTrigger className="h-10 bg-background border-2 border-black/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NECESSIDADES_ESPECIAIS.map(n => (
                          <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Observação Geral</label>
                    <textarea value={editForm.observacao} onChange={(e) => setEditForm(f => ({ ...f, observacao: e.target.value }))} className="form-input min-h-[60px] resize-none border-2 border-black/10" />
                  </div>
                </div>
                
                <button 
                  onClick={handleSaveEdit} 
                  disabled={mutation.isPending} 
                  className="w-full action-btn h-12 text-lg font-black"
                >
                  {mutation.isPending ? "Salvando..." : "SALVAR ALTERAÇÕES"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
