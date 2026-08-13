import { Bell, Cake, Droplets } from "lucide-react";
import { useMemo, useState } from "react";
import { useCatequizandos, useCatequistas } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BirthdayPerson {
  nome: string;
  tipo: "Catequizando" | "Catequista";
  subtipo: "nascimento" | "batismo";
  dataAniversario: Date;
  diasRestantes: number;
}

/** Retorna a próxima ocorrência de (mês, dia) a partir de hoje, e quantos dias faltam */
function calcNextOccurrence(hoje: Date, thisYear: number, month: number, day: number): { next: Date; dias: number } {
  const next = new Date(thisYear, month, day);
  next.setHours(0, 0, 0, 0);
  if (next < hoje) next.setFullYear(thisYear + 1);
  const dias = Math.ceil((next.getTime() - hoje.getTime()) / 86400000);
  return { next, dias };
}

export default function BirthdayBell() {
  const { data: catequizandos = [] } = useCatequizandos();
  const { data: catequistas = [] } = useCatequistas();
  const [open, setOpen] = useState(false);

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const thisYear = hoje.getFullYear();
  const thisMonth = hoje.getMonth();

  const aniversariantes = useMemo(() => {
    const list: BirthdayPerson[] = [];

    // ── Catequizandos ────────────────────────────────────────────
    catequizandos.forEach((c) => {
      // Aniversário de nascimento (somente se for neste mês)
      if (c.dataNascimento) {
        const bday = new Date(c.dataNascimento + (c.dataNascimento.includes("T") ? "" : "T12:00:00"));
        if (bday.getMonth() === thisMonth) {
          const { next, dias } = calcNextOccurrence(hoje, thisYear, bday.getMonth(), bday.getDate());
          if (dias <= 31) {
            list.push({ nome: c.nome, tipo: "Catequizando", subtipo: "nascimento", dataAniversario: next, diasRestantes: dias });
          }
        }
      }

      // Aniversário de batismo (somente se for neste mês)
      const dataBatismo = c.sacramentos?.batismo?.data;
      if (dataBatismo && c.sacramentos?.batismo?.recebido) {
        const bday = new Date(dataBatismo + (dataBatismo.includes("T") ? "" : "T12:00:00"));
        if (bday.getMonth() === thisMonth) {
          const { next, dias } = calcNextOccurrence(hoje, thisYear, bday.getMonth(), bday.getDate());
          if (dias <= 31) {
            list.push({ nome: c.nome, tipo: "Catequizando", subtipo: "batismo", dataAniversario: next, diasRestantes: dias });
          }
        }
      }
    });

    // ── Catequistas ──────────────────────────────────────────────
    catequistas.forEach((c) => {
      if (!c.dataNascimento) return;
      const bday = new Date(c.dataNascimento + (c.dataNascimento.includes("T") ? "" : "T12:00:00"));
      if (bday.getMonth() === thisMonth) {
        const { next, dias } = calcNextOccurrence(hoje, thisYear, bday.getMonth(), bday.getDate());
        if (dias <= 31) {
          list.push({ nome: c.nome, tipo: "Catequista", subtipo: "nascimento", dataAniversario: next, diasRestantes: dias });
        }
      }
    });

    return list.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [catequizandos, catequistas, hoje, thisYear, thisMonth]);

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
              Aniversários do Mês
            </DialogTitle>
          </DialogHeader>
          {aniversariantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum aniversário neste mês</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {aniversariantes.map((a, i) => {
                const isBatismo = a.subtipo === "batismo";
                const isHoje = a.diasRestantes === 0;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isHoje
                          ? isBatismo ? "bg-blue-400/20" : "bg-gold/20"
                          : isBatismo ? "bg-blue-500/10" : "bg-primary/10"
                      }`}
                    >
                      {isBatismo ? (
                        <Droplets
                          className={`h-4 w-4 ${isHoje ? "text-blue-500" : "text-blue-400"}`}
                        />
                      ) : (
                        <Cake
                          className={`h-4 w-4 ${isHoje ? "text-gold" : "text-primary"}`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.tipo}
                        {" • "}
                        <span className={isBatismo ? "text-blue-500 font-medium" : ""}>
                          {isBatismo ? "Batismo" : "Nascimento"}
                        </span>
                        {" • "}
                        {a.dataAniversario.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isHoje
                          ? isBatismo ? "bg-blue-400/20 text-blue-500" : "bg-gold/20 text-gold"
                          : a.diasRestantes <= 7
                            ? "bg-caution/10 text-caution"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isHoje ? (isBatismo ? "💧 Hoje!" : "🎉 Hoje!") : `${a.diasRestantes}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
