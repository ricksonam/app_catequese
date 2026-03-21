import { useParams, useNavigate } from "react-router-dom";
import { getCatequizandos, saveCatequizando, getTurmas, type Catequizando } from "@/lib/store";
import { ArrowLeft, Plus, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Sacramento {
  recebido: boolean;
  paroquia: string;
  data: string;
}

interface CatequizandoForm {
  nome: string;
  dataNascimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  endereco: string;
  necessidadeEspecial: string;
  observacao: string;
  batismo: Sacramento;
  eucaristia: Sacramento;
  crisma: Sacramento;
}

const emptyForm: CatequizandoForm = {
  nome: "",
  dataNascimento: "",
  responsavel: "",
  telefone: "",
  email: "",
  endereco: "",
  necessidadeEspecial: "",
  observacao: "",
  batismo: { recebido: false, paroquia: "", data: "" },
  eucaristia: { recebido: false, paroquia: "", data: "" },
  crisma: { recebido: false, paroquia: "", data: "" },
};

function calcularIdade(dataNascimento: string): string {
  if (!dataNascimento) return "";
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

export default function CatequizandosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const [list, setList] = useState(getCatequizandos(id));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatequizandoForm>({ ...emptyForm });
  const [showSacramentos, setShowSacramentos] = useState(false);

  const updateField = useCallback((field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

  const updateSacramento = useCallback((sac: 'batismo' | 'eucaristia' | 'crisma', field: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [sac]: { ...f[sac], [field]: value } }));
  }, []);

  const handleAdd = () => {
    if (!form.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    const novo: Catequizando = {
      id: crypto.randomUUID(),
      turmaId: id!,
      nome: form.nome,
      dataNascimento: form.dataNascimento,
      responsavel: form.responsavel,
      telefone: form.telefone,
      email: form.email,
      endereco: form.endereco,
      necessidadeEspecial: form.necessidadeEspecial,
      observacao: form.observacao,
      sacramentos: {
        batismo: form.batismo,
        eucaristia: form.eucaristia,
        crisma: form.crisma,
      },
    };
    saveCatequizando(novo);
    setList(getCatequizandos(id));
    setForm({ ...emptyForm });
    setShowSacramentos(false);
    setOpen(false);
    toast.success("Catequizando adicionado!");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Catequizandos</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome} • {list.length} cadastrados</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold">
              <Plus className="h-4 w-4" /> Novo
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Catequizando</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <FieldInput label="Nome completo *" value={form.nome} onChange={(v) => updateField("nome", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Data de nascimento" type="date" value={form.dataNascimento} onChange={(v) => updateField("dataNascimento", v)} />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Idade</label>
                  <div className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground">
                    {calcularIdade(form.dataNascimento) || "—"}
                  </div>
                </div>
              </div>
              <FieldInput label="Responsável" value={form.responsavel} onChange={(v) => updateField("responsavel", v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Telefone" type="tel" value={form.telefone} onChange={(v) => updateField("telefone", v)} />
                <FieldInput label="E-mail" type="email" value={form.email} onChange={(v) => updateField("email", v)} />
              </div>
              <FieldInput label="Endereço" value={form.endereco} onChange={(v) => updateField("endereco", v)} />
              <FieldInput label="Necessidade especial" value={form.necessidadeEspecial} onChange={(v) => updateField("necessidadeEspecial", v)} placeholder="Se houver, descreva aqui" />
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Observação</label>
                <textarea
                  value={form.observacao}
                  onChange={(e) => updateField("observacao", e.target.value)}
                  className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[60px] resize-none"
                  placeholder="Anotações..."
                />
              </div>

              {/* Sacramentos */}
              <button
                type="button"
                onClick={() => setShowSacramentos(!showSacramentos)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted rounded-xl text-sm font-medium text-foreground"
              >
                Sacramentos Recebidos
                {showSacramentos ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showSacramentos && (
                <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                  {(["batismo", "eucaristia", "crisma"] as const).map((sac) => (
                    <div key={sac} className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form[sac].recebido}
                          onChange={(e) => updateSacramento(sac, "recebido", e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground capitalize">{sac}</span>
                      </label>
                      {form[sac].recebido && (
                        <div className="grid grid-cols-2 gap-2 ml-6">
                          <FieldInput label="Paróquia" value={form[sac].paroquia} onChange={(v) => updateSacramento(sac, "paroquia", v)} placeholder="Nome da paróquia" />
                          <FieldInput label="Data" type="date" value={form[sac].data} onChange={(v) => updateSacramento(sac, "data", v)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleAdd}
                className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold"
              >
                Adicionar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <UserPlus className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum catequizando cadastrado</p>
        </div>
      ) : (
        <div className="ios-card overflow-hidden">
          {list.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < list.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-sm font-bold text-accent-foreground">
                  {c.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{c.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {c.dataNascimento && `${calcularIdade(c.dataNascimento)}`}
                  {c.responsavel && ` • Resp: ${c.responsavel}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldInput({ label, type = "text", value, onChange, placeholder }: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
      />
    </div>
  );
}
