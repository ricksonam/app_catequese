import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDiarioEspiritual } from "@/hooks/useDiarioEspiritual";
import { useEncontros } from "@/hooks/useSupabaseData";
import { ArrowLeft, BookHeart, Save } from "lucide-react";

export default function DiarioEspiritualForm() {
  const { id, diarioId } = useParams();
  const navigate = useNavigate();
  const { diarios, criarDiario, atualizarDiario } = useDiarioEspiritual(id!);
  const { data: encontros = [] } = useEncontros(id);

  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split("T")[0]);
  const [encontroId, setEncontroId] = useState("");
  const [comoFoi, setComoFoi] = useState("");
  const [pontosPositivos, setPontosPositivos] = useState("");
  const [pontosNegativos, setPontosNegativos] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [evolucao, setEvolucao] = useState("");

  const isEditing = !!diarioId;

  useEffect(() => {
    if (isEditing && diarios) {
      const diario = diarios.find((d) => d.id === diarioId);
      if (diario) {
        setDataRegistro(diario.data_registro || "");
        setEncontroId(diario.encontro_id || "");
        setComoFoi(diario.como_foi || "");
        setPontosPositivos(diario.pontos_positivos || "");
        setPontosNegativos(diario.pontos_negativos || "");
        setObservacoes(diario.observacoes_catequizandos || "");
        setEvolucao(diario.evolucao_espiritual || "");
      }
    }
  }, [diarioId, diarios, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      turma_id: id!,
      data_registro: dataRegistro,
      encontro_id: encontroId || null,
      como_foi: comoFoi,
      pontos_positivos: pontosPositivos,
      pontos_negativos: pontosNegativos,
      observacoes_catequizandos: observacoes,
      evolucao_espiritual: evolucao,
    };

    if (isEditing) {
      await atualizarDiario.mutateAsync({ id: diarioId!, updates: payload });
    } else {
      await criarDiario.mutateAsync(payload);
    }
    navigate(`/turmas/${id}/diario`);
  };

  const isPending = criarDiario.isPending || atualizarDiario.isPending;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-center min-h-[44px] relative pt-4">
        <button onClick={() => navigate(`/turmas/${id}/diario`)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border-2 border-black/5 shadow-sm active:scale-90 transition-all absolute left-0">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-black text-foreground tracking-tight uppercase">
            {isEditing ? "Editar Registro" : "Novo Registro"}
          </h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
            Diário Espiritual
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto w-full">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-black/5 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data do Registro <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={dataRegistro}
                onChange={(e) => setDataRegistro(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Encontro Referente</label>
              <select
                value={encontroId}
                onChange={(e) => setEncontroId(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="">Nenhum (Registro Geral)</option>
                {encontros.map(e => (
                  <option key={e.id} value={e.id}>{e.tema}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <BookHeart className="w-4 h-4" /> Como foi o encontro/momento?
            </label>
            <textarea
              placeholder="Descreva de forma geral como foi o encontro, o clima da turma..."
              value={comoFoi}
              onChange={(e) => setComoFoi(e.target.value)}
              className="w-full min-h-[100px] p-4 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Pontos Positivos</label>
              <textarea
                placeholder="O que deu certo? O que surpreendeu?"
                value={pontosPositivos}
                onChange={(e) => setPontosPositivos(e.target.value)}
                className="w-full min-h-[100px] p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-destructive uppercase tracking-wider">Pontos a Melhorar</label>
              <textarea
                placeholder="O que não saiu como planejado? Dificuldades?"
                value={pontosNegativos}
                onChange={(e) => setPontosNegativos(e.target.value)}
                className="w-full min-h-[100px] p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm focus:ring-2 focus:ring-destructive/20 focus:border-destructive outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Observações sobre os Catequizandos</label>
            <textarea
              placeholder="Comportamento individual ou em grupo, participações marcantes..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full min-h-[100px] p-4 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-primary uppercase tracking-wider">Evolução Espiritual e Comportamental</label>
            <textarea
              placeholder="Como você percebe o crescimento deles na fé e no entendimento?"
              value={evolucao}
              onChange={(e) => setEvolucao(e.target.value)}
              className="w-full min-h-[100px] p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 transition-all"
          >
            {isPending ? (
              <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Salvar Registro
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
