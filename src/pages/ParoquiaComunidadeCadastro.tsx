import { useNavigate } from "react-router-dom";
import { useParoquias, useComunidades, useParoquiaMutation, useComunidadeMutation, useDeleteParoquia, useDeleteComunidade } from "@/hooks/useSupabaseData";
import { type Paroquia, type Comunidade } from "@/lib/store";
import { ArrowLeft, Plus, Church, Trash2, Eye, Users, MapPin, Phone, Mail, FileText, Pencil, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { mascaraTelefone } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";


interface UnifiedFormData {
  // Paroquia
  pNome: string;
  pEndereco: string;
  pTelefone: string;
  pEmail: string;
  pResponsavel: string;
  pCidade: string;
  pEstado: string;
  // Comunidade
  cNome: string;
  cEndereco: string;
  cResponsavel: string;
  cTelefone: string;
  cCidade: string;
  cEstado: string;
}

const emptyForm: UnifiedFormData = {
  pNome: "", pEndereco: "", pTelefone: "", pEmail: "", pResponsavel: "", pCidade: "", pEstado: "",
  cNome: "", cEndereco: "", cResponsavel: "", cTelefone: "", cCidade: "", cEstado: "",
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
  const [viewPId, setViewPId] = useState<string | null>(null);
  
  // States for isolated Community management (Nova comunidade na Paróquia)
  const [cFormOpen, setCFormOpen] = useState(false);
  const [cForm, setCForm] = useState({
    id: "", paroquiaId: "", nome: "", endereco: "", responsavel: "", telefone: "", cidade: "", estado: ""
  });
  const [deletePConfirmOpen, setDeletePConfirmOpen] = useState(false);
  const [deleteCConfirmOpen, setDeleteCConfirmOpen] = useState(false);
  const [pToDelete, setPToDelete] = useState<{id: string, nome: string} | null>(null);
  const [cToDelete, setCToDelete] = useState<{id: string, nome: string} | null>(null);


  const updateField = useCallback((field: keyof UnifiedFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const groups = paroquias.map(p => {
    const cList = comunidades.filter(com => com.paroquiaId === p.id);
    return { p, cList };
  });

  const activeGroup = viewPId ? groups.find(g => g.p.id === viewPId) : null;
  const editingGroup = editingIds ? groups.find(g => g.p.id === editingIds.pId) : null;

  const handleSave = async () => {
    if (!form.pNome) {
      toast.error("O campo Nome da Paróquia é obrigatório");
      return;
    }
    
    // Only require cNome on Create
    if (!editingIds && !form.cNome) {
      toast.error("O campo Nome da Comunidade Inicial é obrigatório");
      return;
    }

    try {
      const pId = editingIds?.pId || crypto.randomUUID();

      // 1. Save Paroquia
      await pMutation.mutateAsync({
        id: pId,
        nome: form.pNome,
        endereco: form.pEndereco,
        telefone: form.pTelefone,
        email: form.pEmail,
        responsavel: form.pResponsavel,
        cidade: form.pCidade,
        estado: form.pEstado,
      });

      // 2. Save Comunidade ONLY IF Create mode
      if (!editingIds) {
        const cId = crypto.randomUUID();
        await cMutation.mutateAsync({
          id: cId,
          nome: form.cNome,
          paroquiaId: pId,
          endereco: form.cEndereco,
          responsavel: form.cResponsavel,
          telefone: form.cTelefone,
          cidade: form.cCidade,
          estado: form.cEstado,
        });
      }

      setForm({ ...emptyForm });
      setEditingIds(null);
      setOpen(false);
      toast.success(editingIds ? "Paróquia atualizada com sucesso!" : "Cadastro realizado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const confirmDeleteP = async () => {
    if (!pToDelete) return;
    try {
      const comsToDelete = comunidades.filter(c => c.paroquiaId === pToDelete.id);
      for (const c of comsToDelete) {
        await cDelete.mutateAsync(c.id);
      }
      await pDelete.mutateAsync(pToDelete.id);
      setViewPId(null);
      setDeletePConfirmOpen(false);
      setPToDelete(null);
      toast.success("Paróquia/Comunidade excluída com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const confirmDeleteC = async () => {
    if (!cToDelete) return;
    try {
      await cDelete.mutateAsync(cToDelete.id);
      setDeleteCConfirmOpen(false);
      setCToDelete(null);
      toast.success("Comunidade excluída com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };


  const openEdit = (p: Paroquia) => {
    setForm({
      pNome: p.nome, pEndereco: p.endereco, pTelefone: p.telefone, pEmail: p.email, pResponsavel: p.responsavel,
      pCidade: p.cidade || "", pEstado: p.estado || "",
      cNome: "", cEndereco: "", cResponsavel: "", cTelefone: "", cCidade: "", cEstado: "",
    });
    setEditingIds({ pId: p.id, cId: "" });
    setViewPId(null);
    setOpen(true);
  };

  const handleSaveSingleComunidade = async () => {
    if (!cForm.nome) { toast.error("O campo Nome da Comunidade é obrigatório"); return; }
    try {
      await cMutation.mutateAsync({
        id: cForm.id || crypto.randomUUID(),
        paroquiaId: cForm.paroquiaId,
        nome: cForm.nome,
        endereco: cForm.endereco,
        responsavel: cForm.responsavel,
        telefone: cForm.telefone,
        cidade: cForm.cidade,
        estado: cForm.estado,
      });
      setCFormOpen(false);
      toast.success("Comunidade salva!");
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const openNew = () => {
    setForm({ ...emptyForm });
    setEditingIds(null);
    setOpen(true);
  };

  if (loadingP || loadingC) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-lg bg-primary/20 animate-pulse" /></div>;

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
          <p className="text-xs text-muted-foreground">{groups.length} cadastrados</p>
          </div>
        </div>
        <button onClick={openNew} className="action-btn-sm">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {/* List */}
      {groups.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3">
            <Church className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nenhum cadastro realizado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, i) => (
            <div 
              key={group.p.id} 
              onClick={() => setViewPId(group.p.id)}
              className="float-card p-4 animate-float-up space-y-3 cursor-pointer hover:border-liturgical/30 hover:shadow-lg transition-all active:scale-[0.98] group" 
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-liturgical/10 flex items-center justify-center shrink-0 border border-liturgical/20 group-hover:scale-105 transition-transform">
                    <Church className="h-5 w-5 text-liturgical" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{group.p.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary/15 transition-colors">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              {group.cList.length > 0 && (
                <div className="flex items-center gap-3 pl-4 border-l-2 border-primary/20 ml-5">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 border border-accent/20">
                    <Users className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate max-w-[200px]">{group.cList.map(c => c.nome).join(', ')}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{group.cList.length} comunidade{group.cList.length > 1 ? 's' : ''}</p>
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
              <FieldInput 
                label="Nome *" 
                value={form.pNome} 
                onChange={(v) => updateField("pNome", v)} 
                placeholder="Digite o nome da paróquia/área/escola"
              />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Cidade" value={form.pCidade} onChange={(v) => updateField("pCidade", v)} />
                <FieldInput label="Estado" value={form.pEstado} onChange={(v) => updateField("pEstado", v)} />
              </div>
              <FieldInput label="Endereço" value={form.pEndereco} onChange={(v) => updateField("pEndereco", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Telefone" type="tel" value={form.pTelefone} onChange={(v) => updateField("pTelefone", mascaraTelefone(v))} />
                <FieldInput label="E-mail" type="email" value={form.pEmail} onChange={(v) => updateField("pEmail", v)} />
              </div>
              <FieldInput label="Pároco responsável" value={form.pResponsavel} onChange={(v) => updateField("pResponsavel", v)} />
            </div>

            {/* Section 2: Community */}
            {!editingIds ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                  <Users className="h-4 w-4 text-accent-foreground" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Dados da Comunidade / Núcleo</h3>
                </div>
                <FieldInput 
                  label="Nome da Comunidade *" 
                  value={form.cNome} 
                  onChange={(v) => updateField("cNome", v)} 
                  placeholder="Digite o nome da comunidade/núcleo"
                />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Cidade" value={form.cCidade} onChange={(v) => updateField("cCidade", v)} />
                  <FieldInput label="Estado" value={form.cEstado} onChange={(v) => updateField("cEstado", v)} />
                </div>
                <FieldInput label="Endereço da Comunidade" value={form.cEndereco} onChange={(v) => updateField("cEndereco", v)} />
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="Responsável" value={form.cResponsavel} onChange={(v) => updateField("cResponsavel", v)} />
                  <FieldInput label="Telefone" type="tel" value={form.cTelefone} onChange={(v) => updateField("cTelefone", mascaraTelefone(v))} />
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent-foreground" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Comunidades Vinculadas</h3>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      setCForm({ id: "", paroquiaId: editingIds.pId, nome: "", tipo: "Comunidade", endereco: "", responsavel: "", telefone: "", cidade: "", estado: "", observacao: "" });
                      setCFormOpen(true);
                    }}
                    className="text-[10px] font-black text-accent-foreground bg-accent/10 hover:bg-accent/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Nova
                  </button>
                </div>
                
                {editingGroup?.cList.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhuma comunidade vinculada.</p>
                )}

                {editingGroup?.cList.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/30">
                    <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">{c.nome}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setCForm({ id: c.id, paroquiaId: c.paroquiaId, nome: c.nome, endereco: c.endereco || "", responsavel: c.responsavel || "", telefone: c.telefone || "", cidade: c.cidade || "", estado: c.estado || "" });
                          setCFormOpen(true);
                        }}
                        className="text-primary bg-primary/10 hover:bg-primary/20 p-2 rounded-lg transition-colors active:scale-95"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setCToDelete({ id: c.id, nome: c.nome });
                          setDeleteCConfirmOpen(true);
                        }}
                        className="text-destructive bg-destructive/10 hover:bg-destructive/20 p-2 rounded-lg transition-colors active:scale-95"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Voltar</button>
              <button 
                onClick={handleSave} 
                disabled={pMutation.isPending || cMutation.isPending} 
                className="flex-[2] action-btn"
              >
                {(pMutation.isPending || cMutation.isPending) ? "Salvando..." : editingIds ? "Salvar Alterações" : "Salvar Tudo"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!viewPId} onOpenChange={() => setViewPId(null)}>
        <DialogContent className="rounded-[32px] border-border/30 max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden bg-gradient-to-b from-[hsl(var(--liturgical))]/10 to-background max-w-md w-11/12 max-w-[400px]">
          {activeGroup && (
            <div className="flex flex-col h-full relative">
              {/* Decorative Header */}
              <div className="relative pt-8 pb-5 px-6 flex flex-col items-center text-center mt-6">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[hsl(var(--liturgical))]/20 to-transparent pointer-events-none" />
                
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[hsl(var(--liturgical))] to-[hsl(var(--liturgical))]/70 flex items-center justify-center shadow-xl shadow-[hsl(var(--liturgical))]/20 mb-4 border border-white/20 relative z-10 animate-float">
                  <Church className="h-10 w-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-black text-foreground tracking-tight drop-shadow-sm mb-2">{activeGroup.p.nome}</h2>
                
                {activeGroup.cList.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground bg-white/60 dark:bg-black/60 px-4 py-2 rounded-2xl border border-border/50 shadow-sm w-full max-w-[280px]">
                    <Users className="h-4 w-4 text-accent-foreground shrink-0" />
                    <span className="truncate">Comunidades: <span className="text-foreground">{activeGroup.cList.map(c => c.nome).join(', ')}</span></span>
                  </div>
                )}
              </div>

              <div className="px-6 pb-8 space-y-5">
                {/* Paróquia Info */}
                <div className="float-card p-5 space-y-4 border-[hsl(var(--liturgical))]/20 bg-white/50 dark:bg-black/20">
                  <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                      <Church className="h-4 w-4 text-[hsl(var(--liturgical))]" />
                      <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Detalhes da Sede</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <InfoRow icon={MapPin} label="Endereço" value={activeGroup.p.endereco} />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoRow label="Cidade" value={activeGroup.p.cidade} />
                      <InfoRow label="Estado" value={activeGroup.p.estado} />
                    </div>
                    <InfoRow icon={Phone} label="Telefone" value={activeGroup.p.telefone} />
                    <InfoRow icon={Mail} label="E-mail" value={activeGroup.p.email} />
                    <InfoRow icon={Users} label="Pároco responsável" value={activeGroup.p.responsavel} />
                  </div>
                </div>

                {/* Separação e Título de Comunidades */}
                {activeGroup.cList.length > 0 && (
                  <div className="flex items-center gap-2.5 pt-2">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Vinculadas ({activeGroup.cList.length})</h3>
                  </div>
                )}

                {/* Comunidades Info Loop */}
                {activeGroup.cList.map(c => (
                  <div key={c.id} className="float-card p-5 space-y-4 border-accent/20 bg-white/50 dark:bg-black/20">
                    <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                        <Users className="h-4 w-4 text-accent-foreground" />
                        <h3 className="text-xs font-black text-foreground uppercase tracking-widest">{c.nome}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <InfoRow icon={MapPin} label="Endereço" value={c.endereco} />
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Cidade" value={c.cidade} />
                        <InfoRow label="Estado" value={c.estado} />
                      </div>
                      <InfoRow icon={Phone} label="Telefone" value={c.telefone} />
                      <InfoRow icon={Users} label="Responsável" value={c.responsavel} />
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-3">
                  <button 
                    onClick={() => openEdit(activeGroup.p)} 
                    className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary py-3.5 rounded-2xl hover:bg-primary/20 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </button>
                  <button 
                    onClick={() => {
                      setPToDelete({ id: activeGroup.p.id, nome: activeGroup.p.nome });
                      setDeletePConfirmOpen(true);
                    }} 
                    className="flex-[0.6] flex items-center justify-center gap-2 text-destructive bg-destructive/10 px-6 py-3.5 rounded-2xl hover:bg-destructive/20 text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </button>

                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for Single Community additions/edits */}
      <Dialog open={cFormOpen} onOpenChange={setCFormOpen}>
        <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto border-border/30 max-w-sm">
          <DialogHeader className="pt-2">
            <DialogTitle>{cForm.id ? "Editar Comunidade" : "Nova Comunidade"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2 pb-2">
            <FieldInput 
              label="Nome *" 
              value={cForm.nome} 
              onChange={(v) => setCForm(p => ({ ...p, nome: v }))} 
              placeholder="Digite o nome da comunidade/núcleo"
            />
            <FieldInput label="Endereço" value={cForm.endereco} onChange={(v) => setCForm(p => ({ ...p, endereco: v }))} />
            <div className="grid grid-cols-2 gap-2">
              <FieldInput label="Cidade" value={cForm.cidade} onChange={(v) => setCForm(p => ({ ...p, cidade: v }))} />
              <FieldInput label="Estado" value={cForm.estado} onChange={(v) => setCForm(p => ({ ...p, estado: v }))} />
            </div>
            <FieldInput label="Responsável" value={cForm.responsavel} onChange={(v) => setCForm(p => ({ ...p, responsavel: v }))} />
            <FieldInput label="Telefone" type="tel" value={cForm.telefone} onChange={(v) => setCForm(p => ({ ...p, telefone: mascaraTelefone(v) }))} />
            <div className="flex gap-2 pt-4">
              <button onClick={() => setCFormOpen(false)} className="flex-1 py-3 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSaveSingleComunidade} disabled={cMutation.isPending} className="flex-[2] action-btn">
                {cMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteConfirmationDialog
        open={deletePConfirmOpen}
        onOpenChange={setDeletePConfirmOpen}
        onConfirm={confirmDeleteP}
        itemName={pToDelete?.nome}
        description="Esta ação excluirá a Sede e TODAS as comunidades vinculadas a ela permanentemente."
        isLoading={pDelete.isPending || cDelete.isPending}
      />

      <DeleteConfirmationDialog
        open={deleteCConfirmOpen}
        onOpenChange={setDeleteCConfirmOpen}
        onConfirm={confirmDeleteC}
        itemName={cToDelete?.nome}
        isLoading={cDelete.isPending}
      />
    </div>
  );
}


function InfoRow({ icon: Icon, label, value }: { icon?: any; label: string; value?: string }) { 
  if (!value) return null; 
  return (
    <div className="flex gap-3">
      {Icon && (
        <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 border border-border/50">
          <Icon className="h-4 w-4 text-muted-foreground/80" />
        </div>
      )}
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.15em]">{label}</span>
        <span className="text-sm font-bold text-foreground leading-snug truncate">{value}</span>
      </div>
    </div>
  );
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) { 
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-900 mb-1 block">{labelWithRedAsterisk}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="form-input" />
    </div>
  ); 
}

function FieldTextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) { 
  const labelWithRedAsterisk = label.includes("*") ? (
    <>
      {label.replace("*", "")}
      <span className="text-red-500">*</span>
    </>
  ) : label;

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-900 mb-1 block">{labelWithRedAsterisk}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="form-input min-h-[60px] resize-none" />
    </div>
  ); 
}
