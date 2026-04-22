import { Bell, Cake, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useCatequizandos, useCatequistas } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BirthdayPerson {
  nome: string;
  tipo: "Catequizando" | "Catequista";
  dataAniversario: Date;
  diasRestantes: number;
}

export default function BirthdayBell() {
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: catequistas = [] } = useCatequistas();
  const [open, setOpen] = useState(false);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const thisYear = hoje.getFullYear();

  const aniversariantes = useMemo(() => {
    const list: BirthdayPerson[] = [];

    catequizandos.forEach((c) => {
      if (!c.dataNascimento) return;
      const bday = new Date(c.dataNascimento);
      const next = new Date(thisYear, bday.getMonth(), bday.getDate());
      if (next < hoje) next.setFullYear(thisYear + 1);
      const dias = Math.ceil((next.getTime() - hoje.getTime()) / 86400000);
      if (dias <= 30) {
        list.push({ nome: c.nome, tipo: "Catequizando", dataAniversario: next, diasRestantes: dias });
      }
    });

    catequistas.forEach((c) => {
      if (!c.dataNascimento) return;
      const bday = new Date(c.dataNascimento);
      const next = new Date(thisYear, bday.getMonth(), bday.getDate());
      if (next < hoje) next.setFullYear(thisYear + 1);
      const dias = Math.ceil((next.getTime() - hoje.getTime()) / 86400000);
      if (dias <= 30) {
        list.push({ nome: c.nome, tipo: "Catequista", dataAniversario: next, diasRestantes: dias });
      }
    });

    return list.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [catequizandos, catequistas]);

  const count = aniversariantes.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative p-2 transition-colors active:scale-95"
      >
        <Bell className={`h-5 w-5 text-foreground ${count > 0 ? "animate-swing" : ""}`} />
        {count > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 animate-pulse">
            {count}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Cake className="h-5 w-5 text-gold" />
              Aniversários Próximos
            </DialogTitle>
          </DialogHeader>
          {aniversariantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum aniversário nos próximos 30 dias</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {aniversariantes.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.diasRestantes === 0 ? "bg-gold/20" : "bg-primary/10"}`}>
                    <Cake className={`h-4 w-4 ${a.diasRestantes === 0 ? "text-gold" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.tipo} • {a.dataAniversario.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    a.diasRestantes === 0
                      ? "bg-gold/20 text-gold"
                      : a.diasRestantes <= 7
                        ? "bg-caution/10 text-caution"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {a.diasRestantes === 0 ? "🎉 Hoje!" : `${a.diasRestantes}d`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
