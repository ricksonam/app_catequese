import { useParams, useNavigate } from "react-router-dom";
import { getCatequizandos, saveCatequizando, getTurmas, type Catequizando } from "@/lib/store";
import { ArrowLeft, Plus, Users, UserPlus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CatequizandosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const [list, setList] = useState(getCatequizandos(id));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", dataNascimento: "", responsavel: "", telefone: "", email: "" });

  const handleAdd = () => {
    if (!form.nome) {
      toast.error("Nome é obrigatório");
      return;
    }
    const novo: Catequizando = {
      id: crypto.randomUUID(),
      turmaId: id!,
      ...form,
    };
    saveCatequizando(novo);
    setList(getCatequizandos(id));
    setForm({ nome: "", dataNascimento: "", responsavel: "", telefone: "", email: "" });
    setOpen(false);
    toast.success("Catequizando adicionado!");
  };

  const Field = ({ label, type = "text", field }: { label: string; type?: string; field: keyof typeof form }) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
      />
    </div>
  );

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
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Novo Catequizando</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Field label="Nome completo *" field="nome" />
              <Field label="Data de nascimento" type="date" field="dataNascimento" />
              <Field label="Responsável" field="responsavel" />
              <Field label="Telefone" type="tel" field="telefone" />
              <Field label="E-mail" type="email" field="email" />
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
                  {c.responsavel && `Resp: ${c.responsavel}`}
                  {c.dataNascimento && ` • ${new Date(c.dataNascimento).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
