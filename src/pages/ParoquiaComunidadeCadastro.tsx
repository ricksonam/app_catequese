import { useNavigate } from "react-router-dom";
import { useParoquias, useComunidades, useParoquiaMutation, useComunidadeMutation, useDeleteParoquia, useDeleteComunidade } from "@/hooks/useSupabaseData";
import { type Paroquia, type Comunidade } from "@/lib/store";
import { ArrowLeft, Plus, Church, Trash2, Eye, Users } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface UnifiedFormData {
  // Paroquia
  pNome: string;
  pTipo: string;
  pEndereco: string;
  pTelefone: string;
  pEmail: string;
  pResponsavel: string;
  pObservacao: string;
  // Comunidade
  cNome: string;
  cTipo: string;
  cEndereco: string;
  cResponsavel: string;
  cTelefone: string;
  cObservacao: string;
}

const emptyForm: UnifiedFormData = {
  pNome: "", pTipo: "Paróquia", pEndereco: "", pTelefone: "", pEmail: "", pResponsavel: "", pObservacao: "",
  cNome: "", cTipo: "Comunidade", cEndereco: "", cResponsavel: "", cTelefone: "", cObservacao: "",
};

export default function ParoquiaComunidadeCadastro() {
  const navigate = useNavigate();
  const { data: paroquias = [], isLoading: loadingP } = useParoquias();
  const { data: comunidades = [], isLoading: loadingC } = useComunidades();
  
  const pMutation = useParoquiaMutation();
  const cMutation = useComunidadeMutation();
  const pDelete = useDeleteParoquia();
  const cDelete = useDeleteComunidade();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UnifiedFormData>({ ...emptyForm });
  const [editingIds, setEditingIds] = useState<{ pId: string; cId: string } | null>(null);
  const [viewPair, setViewPair] = useState<{ p: Paroquia; c: Comunidade } | null>(null);

  const updateField = useCallback((field: keyof UnifiedFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  // We consider a "pair" as a Parish and the community linked to it.
  // For simplicity, we'll list paroquias and try to find their linked comunidads
  const pairs = paroquias.map(p => {
    const c = comunidades.find(com => com.paroquiaId === p.id);
    return { p, c };
  });

  const handleSave = async () => {
    if (!form.pNome || !form.cNome) {
      toast.error("Nomes da Paróquia e da Comunidade são obrigatórios");
      return;
    }

    try {
      const pId = editingIds?.pId || crypto.randomUUID();
      const cId = editingIds?.cId || crypto.randomUUID();

      // 1. Save Paroquia
      await pMutation.mutateAsync({
        id: pId,
        nome: form.pNome,
        tipo: form.pTipo as any,
        endereco: form.pEndereco,
        telefone: form.pTelefone,
        email: form.pEmail,
        responsavel: form.pResponsavel,
        observacao: form.pObservacao,
      });

      // 2. Save Comunidade linked to this pId
      await cMutation.mutateAsync({
        id: cId,
        nome: form.cNome,
        tipo: form.cTipo as any,
        paroquiaId: pId,
        endereco: form.cEndereco,
        responsavel: form.cResponsavel,
        telefone: form.cTelefone,
        observacao: form.cObservacao,
      });

      setForm({ ...emptyForm });
      setEditingIds(null);
      setOpen(false);
      toast.success("Cadastro realizado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const handleDelete = async (pId: string, cId?: string) => {
    try {
      if (cId) await cDelete.mutateAsync(cId);
      await pDelete.mutateAsync(pId);
      setViewPair(null);
      toast.success("Registros removidos!");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const openEdit = (p: Paroquia, c?: Comunidade) => {
    setForm({
      pNome: p.nome, pTipo: p.tipo, pEndereco: p.endereco, pTelefone: p.telefone, pEmail: p.email, pResponsavel: p.responsavel, pObservacao: p.observacao,
      cNome: c?.nome || "", cTipo: c?.tipo || "Comunidade", cEndereco: c?.endereco || "", cResponsavel: c?.responsavel || "", cTelefone: c?.telefone || "", cObservacao: c?.observacao || "",
    });
    setEditingIds({ pId: p.id, cId: c?.id || "" });
    setViewPair(null);
    setOpen(true);
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditingIds(null);
    setOpen(true);
  };

  if (loadingP || loadingC) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Paróquia e Comunidade</h1>
            <p className="text-xs text-muted-foreground">{pairs.length} cadastrados</p>
          </div>
        </div>
        <button onClick={openNew} className="action-btn-sm">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {/* List */}
      {pairs.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3">
            <Church className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum cadastro realizado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pairs.map((pair, i) => (
            <div key={pair.p.id} className="float-card p-4 animate-float-up space-y-3" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="icon-box bg-primary/10 text-primary shrink-0">
                    <Church className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{pair.p.nome}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{pair.p.tipo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(pair.p, pair.c)} className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {pair.c && (
                <div className="flex items-center gap-3 pl-4 border-l-2 border-primary/20">
                  <div className="icon-box-sm bg-accent/15 text-accent-foreground shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{pair.c.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{pair.c.tipo}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Unified Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto border-border/30 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingIds ? "Editar Cadastro" : "Novo Cadastro"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4 pb-2">
            {/* Section 1: Parish */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                <Church className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Dados da Paróquia / Área / Escola</h3>
              </div>
              <FieldInput label="Nome da Paróquia *" value={form.pNome} onChange={(v) => updateField("pNome", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo</label>
                <select value={form.pTipo} onChange={(e) => updateField("pTipo", e.target.value)} className="form-input">
                  <option>Paróquia</option>
                  <option>Área Missionária</option>
                  <option>Escola</option>
                </select>
              </div>
              <FieldInput label="Endereço" value={form.pEndereco} onChange={(v) => updateField("pEndereco", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Telefone" type="tel" value={form.pTelefone} onChange={(v) => updateField("pTelefone", v)} />
                <FieldInput label="E-mail" type="email" value={form.pEmail} onChange={(v) => updateField("pEmail", v)} />
              </div>
              <FieldInput label="Responsável" value={form.pResponsavel} onChange={(v) => updateField("pResponsavel", v)} />
              <FieldTextArea label="Observação" value={form.pObservacao} onChange={(v) => updateField("pObservacao", v)} />
            </div>

            {/* Section 2: Community */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                <Users className="h-4 w-4 text-accent-foreground" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Dados da Comunidade / Núcleo</h3>
              </div>
              <FieldInput label="Nome da Comunidade *" value={form.cNome} onChange={(v) => updateField("cNome", v)} />
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo da Comunidade</label>
                <select value={form.cTipo} onChange={(e) => updateField("cTipo", e.target.value)} className="form-input">
                  <option>Comunidade</option>
                  <option>Núcleo</option>
                  <option>Grupo</option>
                </select>
              </div>
              <FieldInput label="Endereço da Comunidade" value={form.cEndereco} onChange={(v) => updateField("cEndereco", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Responsável" value={form.cResponsavel} onChange={(v) => updateField("cResponsavel", v)} />
                <FieldInput label="Telefone" type="tel" value={form.cTelefone} onChange={(v) => updateField("cTelefone", v)} />
              </div>
              <FieldTextArea label="Observação da Comunidade" value={form.cObservacao} onChange={(v) => updateField("cObservacao", v)} />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Voltar</button>
              <button 
                onClick={handleSave} 
                disabled={pMutation.isPending || cMutation.isPending} 
                className="flex-[2] action-btn"
              >
                {(pMutation.isPending || cMutation.isPending) ? "Salvando..." : editingIds ? "Atualizar" : "Salvar Tudo"}
              </button>
            </div>
            
            {editingIds && (
              <button 
                onClick={() => handleDelete(editingIds.pId, editingIds.cId)}
                className="w-full flex items-center justify-center gap-2 p-3 text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-xl text-xs font-bold transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir todo o cadastro
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!viewPair} onOpenChange={() => setViewPair(null)}>
        <DialogContent className="rounded-2xl border-border/30 max-h-[85vh] overflow-y-auto">
          {viewPair && (
            <div className="space-y-5">
              <DialogHeader>
                <DialogTitle>{viewPair.p.nome} & {viewPair.c?.nome || "Comunidade"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-primary/5 space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest pb-1 border-b border-primary/10">Paróquia / Área / Escola</p>
                  <InfoRow label="Nome" value={viewPair.p.nome} />
                  <InfoRow label="Tipo" value={viewPair.p.tipo} />
                  <InfoRow label="Endereço" value={viewPair.p.endereco} />
                  <InfoRow label="Telefone" value={viewPair.p.telefone} />
                  <InfoRow label="E-mail" value={viewPair.p.email} />
                  <InfoRow label="Responsável" value={viewPair.p.responsavel} />
                  <InfoRow label="Observação" value={viewPair.p.observacao} />
                </div>
                
                {viewPair.c && (
                  <div className="p-4 rounded-2xl bg-accent/5 space-y-2">
                    <p className="text-[10px] font-bold text-accent-foreground uppercase tracking-widest pb-1 border-b border-accent/10">Comunidade / Núcleo</p>
                    <InfoRow label="Nome" value={viewPair.c.nome} />
                    <InfoRow label="Tipo" value={viewPair.c.tipo} />
                    <InfoRow label="Endereço" value={viewPair.c.endereco} />
                    <InfoRow label="Responsável" value={viewPair.c.responsavel} />
                    <InfoRow label="Telefone" value={viewPair.c.telefone} />
                    <InfoRow label="Observação" value={viewPair.c.observacao} />
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <button onClick={() => openEdit(viewPair.p, viewPair.c)} className="w-full action-btn">Editar Tudo</button>
                  <button onClick={() => handleDelete(viewPair.p.id, viewPair.c?.id)} className="w-full py-3 text-destructive text-sm font-bold hover:bg-destructive/10 rounded-xl transition-all">Excluir Cadastro</button>
                </div>
              </div>
            </div>
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
      <span className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) { 
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" />
    </div>
  ); 
}

function FieldTextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { 
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="form-input min-h-[60px] resize-none" />
    </div>
  ); 
}
