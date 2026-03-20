import { useParams, useNavigate } from "react-router-dom";
import { getTurmas, saveEncontro, getEncontros, type Encontro, type RoteiroStep, ORACAO_TIPOS, ROTEIRO_STEPS } from "@/lib/store";
import { ArrowLeft, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function createEmptyRoteiro(): RoteiroStep[] {
  return ROTEIRO_STEPS.map((s) => ({
    id: crypto.randomUUID(),
    tipo: s.tipo,
    label: s.label,
    conteudo: "",
    tempo: 0,
    catequista: "",
    oracaoTipo: s.tipo === "oracao_inicial" ? "Oração Simples" : undefined,
  }));
}

export default function EncontroForm() {
  const { id, encontroId } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);

  const existing = encontroId ? getEncontros(id).find((e) => e.id === encontroId) : null;

  const [tema, setTema] = useState(existing?.tema || "");
  const [data, setData] = useState(existing?.data || "");
  const [leituraBiblica, setLeituraBiblica] = useState(existing?.leituraBiblica || "");
  const [materialApoio, setMaterialApoio] = useState(existing?.materialApoio || "");
  const [roteiro, setRoteiro] = useState<RoteiroStep[]>(existing?.roteiro || createEmptyRoteiro());
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const updateStep = (stepId: string, field: keyof RoteiroStep, value: string | number) => {
    setRoteiro((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = () => {
    if (!tema || !data) {
      toast.error("Preencha o tema e a data");
      return;
    }
    const encontro: Encontro = {
      id: existing?.id || crypto.randomUUID(),
      turmaId: id!,
      tema,
      data,
      leituraBiblica,
      materialApoio,
      roteiro,
      status: existing?.status || "pendente",
      presencas: existing?.presencas || [],
      criadoEm: existing?.criadoEm || new Date().toISOString(),
    };
    saveEncontro(encontro);
    toast.success(existing ? "Encontro atualizado!" : "Encontro criado!");
    navigate(`/turmas/${id}/encontros`);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{existing ? "Editar Encontro" : "Novo Encontro"}</h1>
          <p className="text-xs text-muted-foreground">{turma?.nome}</p>
        </div>
      </div>

      {/* Basic fields */}
      <div className="ios-card p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tema *</label>
          <input
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Ex: O Batismo de Jesus"
            className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Data *</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Leitura Bíblica do Tema</label>
          <input
            type="text"
            value={leituraBiblica}
            onChange={(e) => setLeituraBiblica(e.target.value)}
            placeholder="Ex: Mt 3,13-17"
            className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Material de Apoio</label>
          <textarea
            value={materialApoio}
            onChange={(e) => setMaterialApoio(e.target.value)}
            placeholder="Materiais necessários, links, referências..."
            className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[60px] resize-none"
          />
        </div>
      </div>

      {/* Roteiro */}
      <div>
        <p className="ios-section-title">Roteiro do Encontro</p>
        <div className="space-y-2">
          {roteiro.map((step, i) => {
            const isExpanded = expandedStep === step.id;
            return (
              <div key={step.id} className="ios-card overflow-hidden">
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-foreground">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.tempo > 0 && (
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {step.tempo}min
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                    {step.tipo === "oracao_inicial" && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de Oração</label>
                        <select
                          value={step.oracaoTipo || ""}
                          onChange={(e) => updateStep(step.id, "oracaoTipo", e.target.value)}
                          className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                        >
                          {ORACAO_TIPOS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Conteúdo</label>
                      <textarea
                        value={step.conteudo}
                        onChange={(e) => updateStep(step.id, "conteudo", e.target.value)}
                        placeholder={`Descreva o conteúdo de ${step.label}...`}
                        className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Tempo (min)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={step.tempo || ""}
                          onChange={(e) => updateStep(step.id, "tempo", parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <User className="h-3 w-3" /> Catequista
                        </label>
                        <input
                          type="text"
                          value={step.catequista}
                          onChange={(e) => updateStep(step.id, "catequista", e.target.value)}
                          placeholder="Responsável"
                          className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-semibold shadow-sm"
      >
        {existing ? "Salvar Alterações" : "Criar Encontro"}
      </button>
    </div>
  );
}
