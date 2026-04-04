import { useParams, useNavigate } from "react-router-dom";
import { type Encontro, type RoteiroStep, ORACAO_TIPOS, ROTEIRO_STEPS } from "@/lib/store";
import { MODELOS_ENCONTROS, type ModeloEncontro } from "@/lib/modelosEncontros";
import { useTurmas, useEncontros, useCatequistas, useEncontroMutation } from "@/hooks/useSupabaseData";
import { ArrowLeft, Clock, User, ChevronDown, ChevronUp, Library, Search, Trash2, Plus, Timer, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function createEmptyRoteiro(): RoteiroStep[] {
  return ROTEIRO_STEPS.map((s) => ({
    id: crypto.randomUUID(), tipo: s.tipo, label: s.label, conteudo: "", tempo: 0, catequista: "",
    oracaoTipo: s.tipo === "oracao_inicial" ? "Oração Simples" : undefined,
  }));
}

function modeloToRoteiro(modelo: ModeloEncontro): RoteiroStep[] {
  return modelo.roteiro.map((s) => ({ ...s, id: crypto.randomUUID() }));
}

export default function EncontroForm() {
  const { id, encontroId } = useParams();
  const navigate = useNavigate();
  const { data: turmas = [] } = useTurmas();
  const { data: encontros = [] } = useEncontros(id);
  const { data: catequistas = [] } = useCatequistas();
  const mutation = useEncontroMutation();
  const turma = turmas.find((t) => t.id === id);
  const existing = encontroId ? encontros.find((e) => e.id === encontroId) : null;

  const [tema, setTema] = useState(existing?.tema || "");
  const [data, setData] = useState(existing?.data || "");
  const [leituraBiblica, setLeituraBiblica] = useState(existing?.leituraBiblica || "");
  const [materialApoio, setMaterialApoio] = useState(existing?.materialApoio || "");
  const [roteiro, setRoteiro] = useState<RoteiroStep[]>(existing?.roteiro || createEmptyRoteiro());
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showModelos, setShowModelos] = useState(false);
  const [modeloSearch, setModeloSearch] = useState("");
  const [newStepLabel, setNewStepLabel] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepPosition, setNewStepPosition] = useState<number>(-1);

  const totalTempo = roteiro.reduce((sum, s) => sum + (s.tempo || 0), 0);

  const updateStep = (stepId: string, field: keyof RoteiroStep, value: string | number) => {
    setRoteiro((prev) => prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s)));
  };

  const removeStep = (stepId: string) => {
    setRoteiro((prev) => prev.filter((s) => s.id !== stepId));
    if (expandedStep === stepId) setExpandedStep(null);
    toast.success("Tópico removido");
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= roteiro.length) return;
    const newRoteiro = [...roteiro];
    [newRoteiro[index], newRoteiro[newIndex]] = [newRoteiro[newIndex], newRoteiro[index]];
    setRoteiro(newRoteiro);
  };

  const addStep = () => {
    if (!newStepLabel.trim()) { toast.error("Digite o nome do tópico"); return; }
    const newStep: RoteiroStep = { id: crypto.randomUUID(), tipo: "desenvolvimento", label: newStepLabel.trim(), conteudo: "", tempo: 0, catequista: "" };
    if (newStepPosition >= 0 && newStepPosition < roteiro.length) {
      const updated = [...roteiro]; updated.splice(newStepPosition + 1, 0, newStep); setRoteiro(updated);
    } else { setRoteiro((prev) => [...prev, newStep]); }
    setNewStepLabel(""); setShowAddStep(false); setNewStepPosition(-1);
    toast.success("Tópico adicionado");
  };

  const applyModelo = (modelo: ModeloEncontro) => {
    setTema(modelo.tema); setLeituraBiblica(modelo.leituraBiblica);
    setMaterialApoio(modelo.materialApoio); setRoteiro(modeloToRoteiro(modelo));
    setShowModelos(false); toast.success("Modelo aplicado!");
  };

  const handleSave = async () => {
    if (!tema || !data) { toast.error("Preencha o tema e a data"); return; }
    const encontro: Encontro = {
      id: existing?.id || crypto.randomUUID(), turmaId: id!, tema, data, leituraBiblica, materialApoio,
      roteiro, status: existing?.status || "pendente", presencas: existing?.presencas || [],
      criadoEm: existing?.criadoEm || new Date().toISOString(),
    };
    try {
      await mutation.mutateAsync(encontro);
      toast.success(existing ? "Encontro atualizado!" : "Encontro criado!");
      navigate(`/turmas/${id}/encontros`);
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const filteredModelos = modeloSearch
    ? MODELOS_ENCONTROS.filter((m) => m.tema.toLowerCase().includes(modeloSearch.toLowerCase()) || m.categoria.toLowerCase().includes(modeloSearch.toLowerCase()))
    : MODELOS_ENCONTROS;

  const defaultCatequista = catequistas.length === 1 ? catequistas[0].nome : "";
  const formatTempo = (min: number) => { if (min < 60) return `${min}min`; const h = Math.floor(min / 60); const m = min % 60; return m > 0 ? `${h}h${m}min` : `${h}h`; };

  return (
    <>
      <div className="space-y-5 pb-28">
        <div className="page-header animate-fade-in">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{existing ? "Editar Encontro" : "Novo Encontro"}</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome}</p>
          </div>
        </div>

        {!existing && (
          <button onClick={() => setShowModelos(true)} className="w-full float-card flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-foreground animate-float-up">
            <Library className="h-4 w-4 text-primary" /> Usar Modelo da Biblioteca
          </button>
        )}

        <div className="float-card p-5 space-y-4 animate-float-up" style={{ animationDelay: '60ms' }}>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tema *</label><input type="text" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: O Batismo de Jesus" className="form-input" /></div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Data *</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} className="form-input" /></div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Leitura Bíblica do Tema</label><input type="text" value={leituraBiblica} onChange={(e) => setLeituraBiblica(e.target.value)} placeholder="Ex: Mt 3,13-17" className="form-input" /></div>
          <div><label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Material de Apoio</label><textarea value={materialApoio} onChange={(e) => setMaterialApoio(e.target.value)} placeholder="Materiais necessários..." className="form-input min-h-[60px] resize-none" /></div>
        </div>

        <div className="animate-float-up" style={{ animationDelay: '120ms' }}>
          <p className="section-title">Roteiro do Encontro</p>
          <div className="space-y-2">
            {roteiro.map((step, i) => {
              const isExpanded = expandedStep === step.id;
              return (
                <div key={step.id} className="float-card overflow-hidden">
                  <button onClick={() => setExpandedStep(isExpanded ? null : step.id)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm font-semibold text-foreground">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {step.tempo > 0 && <span className="pill-btn pill-btn-inactive">{step.tempo}min</span>}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => moveStep(i, "up")} disabled={i === 0} className="flex items-center gap-1 text-xs font-semibold text-primary disabled:text-muted-foreground disabled:opacity-40 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"><ArrowUpCircle className="h-3.5 w-3.5" /> Mover acima</button>
                        <button onClick={() => moveStep(i, "down")} disabled={i === roteiro.length - 1} className="flex items-center gap-1 text-xs font-semibold text-primary disabled:text-muted-foreground disabled:opacity-40 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"><ArrowDownCircle className="h-3.5 w-3.5" /> Mover abaixo</button>
                      </div>
                      {step.tipo === "oracao_inicial" && (
                        <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Tipo de Oração</label><select value={step.oracaoTipo || ""} onChange={(e) => updateStep(step.id, "oracaoTipo", e.target.value)} className="form-input">{ORACAO_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                      )}
                      <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Conteúdo</label><textarea value={step.conteudo} onChange={(e) => updateStep(step.id, "conteudo", e.target.value)} placeholder={`Descreva o conteúdo de ${step.label}...`} className="form-input min-h-[80px] resize-none" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Tempo (min)</label><input type="number" min={0} value={step.tempo || ""} onChange={(e) => updateStep(step.id, "tempo", parseInt(e.target.value) || 0)} placeholder="0" className="form-input" /></div>
                        <div><label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Catequista</label>
                          {catequistas.length > 1 ? (
                            <select value={step.catequista} onChange={(e) => updateStep(step.id, "catequista", e.target.value)} className="form-input"><option value="">Selecione...</option>{catequistas.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}</select>
                          ) : (
                            <input type="text" value={step.catequista || defaultCatequista} onChange={(e) => updateStep(step.id, "catequista", e.target.value)} placeholder="Responsável" className="form-input" />
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeStep(step.id)} className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-xl text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Remover Tópico</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {showAddStep ? (
            <div className="float-card p-4 mt-2 space-y-3 animate-scale-in">
              <label className="text-xs font-semibold text-muted-foreground block">Nome do novo tópico</label>
              <input type="text" value={newStepLabel} onChange={(e) => setNewStepLabel(e.target.value)} placeholder="Ex: Dinâmica extra..." className="form-input" onKeyDown={(e) => e.key === "Enter" && addStep()} />
              <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">Inserir após</label>
                <select value={newStepPosition} onChange={(e) => setNewStepPosition(parseInt(e.target.value))} className="form-input">
                  <option value={-1}>No final da lista</option>
                  {roteiro.map((s, i) => <option key={s.id} value={i}>Após {i + 1}. {s.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addStep} className="flex-1 action-btn text-sm py-2.5">Adicionar</button>
                <button onClick={() => { setShowAddStep(false); setNewStepLabel(""); setNewStepPosition(-1); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground bg-muted/50 hover:bg-muted transition-colors">Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowAddStep(true)} className="w-full float-card flex items-center justify-center gap-2 py-3 mt-2 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"><Plus className="h-4 w-4" /> Adicionar Tópico</button>
          )}
        </div>
        <button onClick={handleSave} disabled={mutation.isPending} className="w-full action-btn">{mutation.isPending ? "Salvando..." : existing ? "Salvar Alterações" : "Criar Encontro"}</button>

        <Dialog open={showModelos} onOpenChange={setShowModelos}>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto border-border/30">
            <DialogHeader><DialogTitle>Biblioteca de Modelos</DialogTitle></DialogHeader>
            <div className="relative mt-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input type="text" value={modeloSearch} onChange={(e) => setModeloSearch(e.target.value)} placeholder="Buscar modelo..." className="form-input pl-10" /></div>
            <div className="space-y-2 mt-2 max-h-[50vh] overflow-y-auto">
              {filteredModelos.map((m) => (
                <button key={m.id} onClick={() => applyModelo(m)} className="w-full float-card p-3.5 text-left">
                  <p className="text-sm font-bold text-foreground">{m.tema}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">📖 {m.leituraBiblica}</p>
                  <span className="pill-btn pill-btn-inactive mt-1.5 inline-block">{m.categoria}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {totalTempo > 0 && (
        <div className="fixed bottom-24 right-5 z-[100] animate-scale-in pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 pointer-events-auto">
            <Timer className="h-4 w-4" /><span className="text-sm font-bold tabular-nums">{formatTempo(totalTempo)}</span>
          </div>
        </div>
      )}
    </>
  );
}
