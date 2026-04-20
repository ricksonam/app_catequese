import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NOMES_TURMA, DIAS_SEMANA, type Turma } from "@/lib/store";
import { useTurmas, useTurmaMutation, useComunidades, useCatequistas } from "@/hooks/useSupabaseData";
import { EtapaMap } from "@/components/EtapaMap";
import { ArrowLeft, Check, ChevronDown, Pencil, UserCheck, Users, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    codigoAcesso: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

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
        codigoAcesso: existingTurma.codigoAcesso || "",
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

  const filteredCatequistas = catequistas.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <h1 className="text-xl font-bold text-foreground inline-flex items-center gap-2">
          {isEditing ? <><Pencil className="h-5 w-5" /> Editar Turma</> : "Nova Turma"}
        </h1>
      </div>

      <div className="space-y-5">
        {/* IDENTIFICAÇÃO DA TURMA */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold px-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">🏛️</div>
            <span className="text-sm uppercase tracking-wider">Identificação</span>
          </div>
          
          <div className="float-card p-5 space-y-4 animate-float-up">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Nome da Turma *</label>
              <select value={form.nome} onChange={(e) => update("nome", e.target.value)} className="form-input h-12 text-base font-bold">
                <option value="">Selecione...</option>
                {NOMES_TURMA.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Ano/Ciclo *</label>
                <select value={form.ano} onChange={(e) => update("ano", e.target.value)} className="form-input h-11">
                  <option value="1° Ano">1° Ano</option>
                  <option value="2° Ano">2° Ano</option>
                  <option value="3° Ano">3° Ano</option>
                  <option value="Ciclo 1">Ciclo 1</option>
                  <option value="Ciclo 2">Ciclo 2</option>
                  <option value="Ciclo 3">Ciclo 3</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Dia do Encontro *</label>
                <select value={form.diaCatequese} onChange={(e) => update("diaCatequese", e.target.value)} className="form-input h-11">
                  <option value="">Selecione...</option>
                  {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/5">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Horário *</label>
                <input type="time" value={form.horario} onChange={(e) => update("horario", e.target.value)} className="form-input h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Local *</label>
                <input type="text" value={form.local} onChange={(e) => update("local", e.target.value)} className="form-input h-11" placeholder="Ex: Salão Paroquial" />
              </div>
            </div>
          </div>
        </div>

        {/* COMUNIDADE E CATEQUISTAS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-500 font-bold px-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">👥</div>
            <span className="text-sm uppercase tracking-wider">Comunidade e Equipe</span>
          </div>

          <div className="float-card p-5 space-y-6 animate-float-up" style={{ animationDelay: '100ms' }}>
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Comunidade *</label>
              <select value={form.comunidadeId} onChange={(e) => update("comunidadeId", e.target.value)} className="form-input h-11 border-2 border-blue-100">
                <option value="">Selecione a comunidade...</option>
                {comunidades.map((c) => <option key={c.id} value={c.id}>{c.name || c.nome}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  Catequistas Responsáveis *
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black tracking-normal",
                    form.catequistasIds.length > 0 ? "bg-success/10 text-success border border-success/20" : "bg-muted text-muted-foreground"
                  )}>
                    {form.catequistasIds.length} selecionado(s)
                  </span>
                </label>
                
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 h-9 text-xs bg-muted/30 border-transparent focus:bg-background transition-all rounded-xl border focus:border-blue-200"
                  />
                </div>
              </div>

              {/* Seletor Visual de Catequistas */}
              <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-100">
                {filteredCatequistas.map((cat) => {
                  const isSelected = form.catequistasIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCatequista(cat.id)}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-2xl border-2 transition-all active:scale-[0.98] text-left group",
                        isSelected 
                          ? "bg-blue-50/50 border-blue-500 shadow-sm shadow-blue-500/10" 
                          : "bg-background border-muted/40 hover:border-blue-200"
                      )}
                    >
                      <div className="relative">
                        <Avatar className={cn(
                          "h-12 w-12 border-2 transition-all group-hover:scale-105",
                          isSelected ? "border-blue-500 ring-2 ring-blue-500/20" : "border-muted/30"
                        )}>
                          <AvatarImage src={cat.foto} alt={cat.nome} />
                          <AvatarFallback className={cn(
                            "font-black text-sm",
                            isSelected ? "bg-blue-500 text-white" : "bg-muted"
                          )}>
                            {cat.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-lg border-2 border-white animate-in zoom-in-50">
                            <Check className="h-3 w-3" strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-bold truncate",
                          isSelected ? "text-blue-700" : "text-foreground"
                        )}>{cat.nome}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{cat.telefone || "Sem telefone"}</p>
                      </div>

                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-blue-500 border-blue-500 shadow-sm" : "bg-white border-muted/50"
                      )}>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
                {filteredCatequistas.length === 0 && (
                  <div className="py-8 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                    <p className="text-sm font-medium text-muted-foreground italic">Nenhum catequista encontrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TEMPO DA CATEQUESE */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-orange-500 font-bold px-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">⏳</div>
            <span className="text-sm uppercase tracking-wider">Tempo da Catequese</span>
          </div>

          <div className="float-card p-5 space-y-6 animate-float-up" style={{ animationDelay: '200ms' }}>

            <div className="space-y-3">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block">Etapa do Tempo da Catequese</label>
              <EtapaMap etapaAtual={form.etapa} onSelect={(id) => update("etapa", id)} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Observações Adicionais</label>
              <textarea value={form.outrosDados} onChange={(e) => update("outrosDados", e.target.value)} className="form-input min-h-[100px] resize-none border-2 border-black/5" placeholder="Observações, recomendações..." />
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={mutation.isPending || !form.nome || !form.diaCatequese || !form.comunidadeId || form.catequistasIds.length === 0} 
        className="w-full action-btn h-14 text-lg font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] animate-float-up" 
        style={{ animationDelay: '300ms' }}
      >
        {mutation.isPending ? "Salvando..." : (isEditing ? "SALVAR ALTERAÇÕES" : "CRIAR ESTA TURMA")}
      </button>
    </div>
  );
}
