import { useState } from "react";
import { Users, MapPin, ArrowRight, Sparkles, Check, Search } from "lucide-react";
import { useTurmaMutation, useComunidades, useCatequistas, useTurmas } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NOMES_TURMA, DIAS_SEMANA } from "@/lib/store";
import { EtapaMap } from "@/components/EtapaMap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TurmaStepProps {
  open?: boolean;
  onSuccess: () => void;
  embedded?: boolean;
}

export function TurmaStep({ open, onSuccess, embedded }: TurmaStepProps) {
  const mutation = useTurmaMutation();
  const { data: comunidades = [] } = useComunidades();
  const { data: catequistas = [] } = useCatequistas();
  const { data: turmas = [] } = useTurmas();

  const [form, setForm] = useState({
    nome: "",
    ano: "1° Ano",
    diaCatequese: "",
    horario: "",
    local: "",
    etapa: "pre-catecumenato",
    outrosDados: "",
    comunidadeId: comunidades[0]?.id || "",
    catequistasIds: [] as string[],
  });

  const [searchTerm, setSearchTerm] = useState("");

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const toggleCatequista = (id: string) => {
    const ids = form.catequistasIds.includes(id)
      ? form.catequistasIds.filter(x => x !== id)
      : [...form.catequistasIds, id];
    update("catequistasIds", ids);
  };

  const handleSave = async () => {
    if (!form.nome || !form.diaCatequese || !form.horario) {
      toast.error("Preencha os campos obrigatórios da turma");
      return;
    }
    try {
      const id = crypto.randomUUID();
      await mutation.mutateAsync({
        id,
        nome: form.nome,
        ano: form.ano,
        diaCatequese: form.diaCatequese,
        horario: form.horario,
        local: form.local,
        etapa: form.etapa,
        outrosDados: form.outrosDados,
        comunidadeId: form.comunidadeId || comunidades[0]?.id || "",
        catequistasIds: form.catequistasIds.length > 0 ? form.catequistasIds : [catequistas[0]?.id].filter(Boolean) as string[],
        criadoEm: new Date().toISOString(),
        codigoAcesso: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
      toast.success("Primeira turma criada!");
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const filteredCatequistas = catequistas.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canSave = form.nome && form.diaCatequese && form.horario;

  const formContent = (
    <div className={cn("flex flex-col", !embedded && "max-h-[92vh]")}>
      {!embedded && (
        <>
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shrink-0" />
          <div className="flex flex-col items-center text-center pt-6 pb-3 px-8 shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2 shadow-inner">
              <Users className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passo 3 de 3</p>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Sua Turma</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 max-w-sm">
              Para finalizar, crie a sua primeira turma de catequese com todas as informações necessárias.
            </p>
          </div>
        </>
      )}

      {/* Scrollable Form */}
      <div className={cn("overflow-y-auto flex-1 px-6 pb-6 space-y-5", embedded ? "pt-2" : "pt-0")}>
        {/* Identificação */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black/5 pb-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-sm">🏛️</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Identificação</p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Nome da Turma *</label>
            <select
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
            >
              <option value="">Selecione...</option>
              {NOMES_TURMA.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Ano/Ciclo *</label>
              <select
                value={form.ano}
                onChange={(e) => update("ano", e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
              >
                <option value="1° Ano">1° Ano</option>
                <option value="2° Ano">2° Ano</option>
                <option value="3° Ano">3° Ano</option>
                <option value="Ciclo 1">Ciclo 1</option>
                <option value="Ciclo 2">Ciclo 2</option>
                <option value="Ciclo 3">Ciclo 3</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Dia do Encontro *</label>
              <select
                value={form.diaCatequese}
                onChange={(e) => update("diaCatequese", e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
              >
                <option value="">Selecione...</option>
                {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Horário *</label>
              <input
                type="time"
                value={form.horario}
                onChange={(e) => update("horario", e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Local</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  value={form.local}
                  onChange={(e) => update("local", e.target.value)}
                  placeholder="Salão Paroquial"
                  className="w-full h-11 pl-9 pr-4 rounded-2xl bg-muted/30 border-2 border-transparent focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comunidade e Catequistas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black/5 pb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">👥</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Comunidade e Equipe</p>
          </div>

          {comunidades.length > 0 && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Comunidade</label>
              <select
                value={form.comunidadeId}
                onChange={(e) => update("comunidadeId", e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-muted/30 border-2 border-blue-100 focus:border-blue-400 focus:bg-background transition-all outline-none text-sm font-bold appearance-none"
              >
                <option value="">Selecione a comunidade...</option>
                {comunidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          {catequistas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  Catequistas
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black tracking-normal",
                    form.catequistasIds.length > 0 ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-muted text-muted-foreground"
                  )}>
                    {form.catequistasIds.length} selecionado(s)
                  </span>
                </label>
                <div className="relative w-36">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 h-8 text-xs bg-muted/30 border-transparent focus:bg-background transition-all rounded-xl border focus:border-emerald-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredCatequistas.map((cat) => {
                  const isSelected = form.catequistasIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCatequista(cat.id)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-2xl border-2 transition-all active:scale-[0.98] text-left group",
                        isSelected
                          ? "bg-emerald-50/50 border-emerald-500 shadow-sm shadow-emerald-500/10"
                          : "bg-background border-muted/40 hover:border-emerald-200"
                      )}
                    >
                      <div className="relative">
                        <Avatar className={cn("h-10 w-10 border-2 transition-all", isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-muted/30")}>
                          <AvatarImage src={cat.foto} alt={cat.nome} />
                          <AvatarFallback className={cn("font-black text-xs", isSelected ? "bg-emerald-500 text-white" : "bg-muted")}>
                            {cat.nome.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-lg border-2 border-white animate-in zoom-in-50">
                            <Check className="h-2.5 w-2.5" strokeWidth={4} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-bold truncate", isSelected ? "text-emerald-700" : "text-foreground")}>{cat.nome}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          {turmas.filter(t => t.catequistasIds?.includes(cat.id)).length > 0 
                            ? `Vinculado a ${turmas.filter(t => t.catequistasIds?.includes(cat.id)).length} turma(s)` 
                            : "Disponível"}
                        </p>
                      </div>
                      <div className={cn("w-5 h-5 rounded-full border-[3px] flex items-center justify-center transition-all", isSelected ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-400 dark:border-slate-500")}>
                        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                      </div>
                    </button>
                  );
                })}
                {filteredCatequistas.length === 0 && (
                  <div className="py-6 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
                    <p className="text-sm font-medium text-muted-foreground italic">Nenhum catequista encontrado</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Etapa */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-black/5 pb-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-sm">⏳</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Tempo da Catequese</p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-2">Etapa</label>
            <EtapaMap etapaAtual={form.etapa} onSelect={(id) => update("etapa", id)} />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block mb-1">Observações Adicionais</label>
            <textarea
              value={form.outrosDados}
              onChange={(e) => update("outrosDados", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-muted/30 border-2 border-black/5 focus:border-emerald-500/50 focus:bg-background transition-all outline-none text-sm font-bold resize-none min-h-[80px]"
              placeholder="Observações, recomendações..."
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={mutation.isPending || !canSave}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
        >
          {mutation.isPending ? "Salvando..." : "Finalizar Cadastro"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (embedded) return formContent;

  return (
    <Dialog open={open || false} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 max-h-[92vh] flex flex-col">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
