import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { NOMES_TURMA, DIAS_SEMANA, type Turma } from "@/lib/store";
import { useTurmaMutation } from "@/hooks/useSupabaseData";
import { EtapaMap } from "@/components/EtapaMap";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function TurmaForm() {
  const navigate = useNavigate();
  const mutation = useTurmaMutation();
  const [form, setForm] = useState({
    nome: "", ano: new Date().getFullYear().toString(), diaCatequese: "", horario: "", local: "", etapa: "pre-catecumenato", outrosDados: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.nome || !form.diaCatequese || !form.horario || !form.local) {
      toast.error("Preencha os campos obrigatórios"); return;
    }
    const turma: Turma = { id: crypto.randomUUID(), ...form, criadoEm: new Date().toISOString() };
    try {
      await mutation.mutateAsync(turma);
      toast.success("Turma criada com sucesso!");
      navigate(`/turmas/${turma.id}`);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header animate-fade-in">
        <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <h1 className="text-xl font-bold text-foreground">Nova Turma</h1>
      </div>
      <div className="space-y-4">
        <div className="float-card p-5 space-y-3 animate-float-up">
          <label className="text-sm font-semibold text-foreground">Nome da Turma *</label>
          <select value={form.nome} onChange={(e) => update("nome", e.target.value)} className="form-input">
            <option value="">Selecione...</option>
            {NOMES_TURMA.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '60ms' }}>
            <label className="text-sm font-semibold text-foreground">Ano / Ciclo *</label>
            <input type="text" value={form.ano} onChange={(e) => update("ano", e.target.value)} className="form-input" placeholder="2025" />
          </div>
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '120ms' }}>
            <label className="text-sm font-semibold text-foreground">Dia *</label>
            <select value={form.diaCatequese} onChange={(e) => update("diaCatequese", e.target.value)} className="form-input">
              <option value="">Selecione...</option>
              {DIAS_SEMANA.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '180ms' }}>
            <label className="text-sm font-semibold text-foreground">Horário *</label>
            <input type="time" value={form.horario} onChange={(e) => update("horario", e.target.value)} className="form-input" />
          </div>
          <div className="float-card p-4 space-y-2 animate-float-up" style={{ animationDelay: '240ms' }}>
            <label className="text-sm font-semibold text-foreground">Local *</label>
            <input type="text" value={form.local} onChange={(e) => update("local", e.target.value)} className="form-input" placeholder="Salão paroquial" />
          </div>
        </div>
        <div className="float-card p-5 space-y-3 animate-float-up" style={{ animationDelay: '300ms' }}>
          <label className="text-sm font-semibold text-foreground">Etapa da Catequese (Tempo)</label>
          <EtapaMap etapaAtual={form.etapa} onSelect={(id) => update("etapa", id)} />
        </div>
        <div className="float-card p-5 space-y-2 animate-float-up" style={{ animationDelay: '360ms' }}>
          <label className="text-sm font-semibold text-foreground">Outros dados</label>
          <textarea value={form.outrosDados} onChange={(e) => update("outrosDados", e.target.value)} className="form-input min-h-[80px] resize-none" placeholder="Observações, anotações..." />
        </div>
      </div>
      <button onClick={handleSave} disabled={mutation.isPending} className="w-full action-btn animate-float-up" style={{ animationDelay: '420ms' }}>
        {mutation.isPending ? "Salvando..." : "Criar Turma"}
      </button>
    </div>
  );
}
