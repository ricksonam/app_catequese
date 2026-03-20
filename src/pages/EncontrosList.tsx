import { useParams, useNavigate } from "react-router-dom";
import { getEncontros, saveEncontro, getTurmas, type Encontro } from "@/lib/store";
import { ArrowLeft, Plus, CalendarDays, Check } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function EncontrosList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const turma = getTurmas().find((t) => t.id === id);
  const [encontros, setEncontros] = useState(getEncontros(id));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", data: "", descricao: "" });

  const handleAdd = () => {
    if (!form.titulo || !form.data) {
      toast.error("Preencha título e data");
      return;
    }
    const novo: Encontro = {
      id: crypto.randomUUID(),
      turmaId: id!,
      ...form,
      realizado: false,
    };
    saveEncontro(novo);
    setEncontros(getEncontros(id));
    setForm({ titulo: "", data: "", descricao: "" });
    setOpen(false);
    toast.success("Encontro adicionado!");
  };

  const toggleRealizado = (enc: Encontro) => {
    saveEncontro({ ...enc, realizado: !enc.realizado });
    setEncontros(getEncontros(id));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/turmas/${id}`)} className="p-2 rounded-xl hover:bg-muted">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Encontros</h1>
            <p className="text-xs text-muted-foreground">{turma?.nome}</p>
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
              <DialogTitle>Novo Encontro</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <input
                type="text"
                placeholder="Título do encontro"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
              />
              <input
                type="date"
                value={form.data}
                onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none"
              />
              <textarea
                placeholder="Descrição (opcional)"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm text-foreground border-0 focus:ring-2 focus:ring-primary outline-none min-h-[60px] resize-none"
              />
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

      {encontros.length === 0 ? (
        <div className="ios-card p-8 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum encontro cadastrado</p>
        </div>
      ) : (
        <div className="ios-card overflow-hidden">
          {encontros
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .map((enc, i) => (
              <div
                key={enc.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < encontros.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <button
                  onClick={() => toggleRealizado(enc)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    enc.realizado
                      ? "bg-success border-success text-success-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {enc.realizado && <Check className="h-4 w-4" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${enc.realizado ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {enc.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(enc.data).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
