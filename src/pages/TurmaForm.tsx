import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveTurma, NOMES_TURMA, DIAS_SEMANA, type Turma } from "@/lib/store";
import { EtapaMap } from "@/components/EtapaMap";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function TurmaForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    ano: new Date().getFullYear().toString(),
    diaCatequese: "",
    horario: "",
    local: "",
    etapa: "pre-catecumenato",
    outrosDados: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.nome || !form.diaCatequese || !form.horario || !form.local) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const turma: Turma = {
      id: crypto.randomUUID(),
      ...form,
      criadoEm: new Date().toISOString(),
    };
    saveTurma(turma);
    toast.success("Turma criada com sucesso!");
    navigate(`/turmas/${turma.id}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Nova Turma</h1>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Nome da Turma */}
        <div className="ios-card p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">Nome da Turma *</label>
          <select
            value={form.nome}
            onChange={(e) => update("nome", e.target.value)}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">Selecione...</option>
            {NOMES_TURMA.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Ano e Dia */}
        <div className="grid grid-cols-2 gap-3">
          <div className="ios-card p-4 space-y-2">
            <label className="text-sm font-medium text-foreground">Ano / Ciclo *</label>
            <input
              type="text"
              value={form.ano}
              onChange={(e) => update("ano", e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
              placeholder="2025"
            />
          </div>
          <div className="ios-card p-4 space-y-2">
            <label className="text-sm font-medium text-foreground">Dia *</label>
            <select
              value={form.diaCatequese}
              onChange={(e) => update("diaCatequese", e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Selecione...</option>
              {DIAS_SEMANA.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Horário e Local */}
        <div className="grid grid-cols-2 gap-3">
          <div className="ios-card p-4 space-y-2">
            <label className="text-sm font-medium text-foreground">Horário *</label>
            <input
              type="time"
              value={form.horario}
              onChange={(e) => update("horario", e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div className="ios-card p-4 space-y-2">
            <label className="text-sm font-medium text-foreground">Local *</label>
            <input
              type="text"
              value={form.local}
              onChange={(e) => update("local", e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Salão paroquial"
            />
          </div>
        </div>

        {/* Etapa */}
        <div className="ios-card p-4 space-y-3">
          <label className="text-sm font-medium text-foreground">Etapa da Catequese (Tempo)</label>
          <EtapaMap etapaAtual={form.etapa} onSelect={(id) => update("etapa", id)} />
        </div>

        {/* Outros dados */}
        <div className="ios-card p-4 space-y-2">
          <label className="text-sm font-medium text-foreground">Outros dados</label>
          <textarea
            value={form.outrosDados}
            onChange={(e) => update("outrosDados", e.target.value)}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[80px] resize-none"
            placeholder="Observações, anotações..."
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl text-base font-semibold shadow-sm active:scale-[0.98] transition-transform"
      >
        Criar Turma
      </button>
    </div>
  );
}
