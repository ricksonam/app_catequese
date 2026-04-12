import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NOMES_TURMA, DIAS_SEMANA, type Turma } from "@/lib/store";
import { useTurmas, useTurmaMutation, useComunidades, useCatequistas } from "@/hooks/useSupabaseData";
import { EtapaMap } from "@/components/EtapaMap";
import { ArrowLeft, Check, ChevronDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TurmaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: turmas = [], isLoading: isLoadingTurmas } = useTurmas();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();
  const mutation = useTurmaMutation();

  const isEditing = Boolean(id);
  const existingTurma = turmas.find(t => t.id === id);

  const [form, setForm] = useState({
    nome: "",
    ano: "1° Ano",
    diaCatequese: "",
    horario: "",
    local: "",
    etapa: "pre-catecumenato",
    outrosDados: "",
    comunidadeId: "",
    catequistasIds: [] as string[],
  });

  useEffect(() => {
    if (isEditing && existingTurma) {
      setForm({
        nome: existingTurma.nome,
        ano: existingTurma.ano,
        diaCatequese: existingTurma.diaCatequese,
        horario: existingTurma.horario,
        local: existingTurma.local,
        etapa: existingTurma.etapa,
        outrosDados: existingTurma.outrosDados || "",
        comunidadeId: existingTurma.comunidadeId || "",
        catequistasIds: existingTurma.catequistasIds || [],
      });
    }
  }, [isEditing, existingTurma]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCatequista = (id: string) => {
    const ids = form.catequistasIds.includes(id)
      ? form.catequistasIds.filter(x => x !== id)
      : [...form.catequistasIds, id];
    update("catequistasIds", ids);
  };

  const handleSave = async () => {
    if (!form.nome || !form.diaCatequese || !form.horario || !form.local || !form.comunidadeId || form.catequistasIds.length === 0) {
      toast.error("Preencha todos os campos obrigatórios, incluindo comunidade e catequistas"); return;
    }
    const turma: Turma = { 
      id: isEditing ? id! : crypto.randomUUID(), 
      ...form, 
      criadoEm: isEditing ? existingTurma?.criadoEm || new Date().toISOString() : new Date().toISOString() 
    };
    try {
      await mutation.mutateAsync(turma);
      toast.success(isEditing ? "Alterações salvas!" : "Turma criada com sucesso!");
      navigate(`/turmas/${turma.id}`);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <h1 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
          {isEditing ? <><Pencil className="h-5 w-5" /> Editar Turma</> : "Nova Turma"}
        </h1>
      </div>
      <div className="space-y-4">
        <div className="float-card p-5 space-y-3 animate-float-up">
          <label className="text-sm font-semibold text-foreground">Nome da Turma *</label>
          <select value={form.nome} onChange={(e) => update("nome", e.target.value)} className="form-input">
            <option value="">Selecione...</option>
            {NOMES_TURMA.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '60ms' }}>
            <label className="text-sm font-semibold text-foreground">Etapas da Catequese *</label>
            <select value={form.ano} onChange={(e) => update("ano", e.target.value)} className="form-input">
              <option value="1° Ano">1° Ano</option>
              <option value="2° Ano">2° Ano</option>
              <option value="3° Ano">3° Ano</option>
              <option value="Ciclo 1">Ciclo 1</option>
              <option value="Ciclo 2">Ciclo 2</option>
              <option value="Ciclo 3">Ciclo 3</option>
            </select>
          </div>
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '120ms' }}>
            <label className="text-sm font-semibold text-foreground">Dia *</label>
            <select value={form.diaCatequese} onChange={(e) => update("diaCatequese", e.target.value)} className="form-input">
              <option value="">Selecione...</option>
              {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '180ms' }}>
            <label className="text-sm font-semibold text-foreground">Comunidade *</label>
            <select value={form.comunidadeId} onChange={(e) => update("comunidadeId", e.target.value)} className="form-input">
              <option value="">Selecione a comunidade...</option>
              {comunidades.map((c) => <option key={c.id} value={c.id}>{c.name || c.nome}</option>)}
            </select>
          </div>
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '240ms' }}>
            <label className="text-sm font-semibold text-foreground">Catequistas *</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="form-input flex items-center justify-between text-left">
                  <span className="truncate">
                    {form.catequistasIds.length === 0 
                      ? "Selecionar catequistas..." 
                      : `${form.catequistasIds.length} selecionado(s)`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
                {catequistas.map((cat) => (
                  <DropdownMenuCheckboxItem
                    key={cat.id}
                    checked={form.catequistasIds.includes(cat.id)}
                    onCheckedChange={() => toggleCatequista(cat.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {cat.nome}
                  </DropdownMenuCheckboxItem>
                ))}
                {catequistas.length === 0 && (
                  <div className="p-2 text-xs text-center text-muted-foreground">Nenhum catequista encontrado</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '300ms' }}>
            <label className="text-sm font-semibold text-foreground">Horário *</label>
            <input type="time" value={form.horario} onChange={(e) => update("horario", e.target.value)} className="form-input" />
          </div>
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '360ms' }}>
            <label className="text-sm font-semibold text-foreground">Local *</label>
            <input type="text" value={form.local} onChange={(e) => update("local", e.target.value)} className="form-input" placeholder="Salão paroquial" />
          </div>
        </div>
        <div className="float-card p-5 space-y-3 animate-float-up" style={{ animationDelay: '420ms' }}>
          <label className="text-sm font-semibold text-foreground">Etapa da Catequese (Tempo)</label>
          <EtapaMap etapaAtual={form.etapa} onSelect={(id) => update("etapa", id)} />
        </div>
        <div className="float-card p-5 space-y-2 animate-float-up" style={{ animationDelay: '480ms' }}>
          <label className="text-sm font-semibold text-foreground">Outros dados</label>
          <textarea value={form.outrosDados} onChange={(e) => update("outrosDados", e.target.value)} className="form-input min-h-[80px] resize-none" placeholder="Observações, anotações..." />
        </div>
      </div>
      <button onClick={handleSave} disabled={mutation.isPending || !form.nome || !form.diaCatequese || !form.comunidadeId || form.catequistasIds.length === 0} className="w-full action-btn animate-float-up" style={{ animationDelay: '540ms' }}>
        {mutation.isPending ? "Salvando..." : (isEditing ? "Salvar Alterações" : "Criar Turma")}
      </button>
    </div>
  );
}
