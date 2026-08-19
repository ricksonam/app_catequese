import { Bell, Cake, Droplets } from "lucide-react";
import { useMemo, useState } from "react";
import { useCatequizandos, useCatequistas } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BirthdayPerson {
  nome: string;
  tipo: "Catequizando" | "Catequista";
  subtipo: "nascimento" | "batismo";
  dataAniversario: Date;
  diasRestantes: number; // negativo = passou, 0 = hoje, positivo = falta X dias
}

/**
 * Calcula quantos dias faltam (positivo) ou já passaram (negativo) em relação a hoje,
 * considerando o ano corrente do mês/dia informado.
 */
function calcDiasRelativosAoHoje(hoje: Date, thisYear: number, month: number, day: number): { date: Date; dias: number } {
  const thisYearDate = new Date(thisYear, month, day);
  thisYearDate.setHours(0, 0, 0, 0);
  const diffMs = thisYearDate.getTime() - hoje.getTime();
  const dias = Math.round(diffMs / 86400000);
  return { date: thisYearDate, dias };
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
      // Aniversário de nascimento
      if (c.dataNascimento) {
        const bday = new Date(c.dataNascimento + (c.dataNascimento.includes("T") ? "" : "T12:00:00"));
        if (bday.getMonth() === thisMonth) {
          const { date, dias } = calcDiasRelativosAoHoje(hoje, thisYear, bday.getMonth(), bday.getDate());
          // Incluir: passou nos últimos 6 dias OU falta até 31 dias
          if (dias >= -6 && dias <= 31) {
            list.push({ nome: c.nome, tipo: "Catequizando", subtipo: "nascimento", dataAniversario: date, diasRestantes: dias });
          }
        }
      }

      // Aniversário de batismo
      const dataBatismo = c.sacramentos?.batismo?.data;
      if (dataBatismo && c.sacramentos?.batismo?.recebido) {
        const bday = new Date(dataBatismo + (dataBatismo.includes("T") ? "" : "T12:00:00"));
        if (bday.getMonth() === thisMonth) {
          const { date, dias } = calcDiasRelativosAoHoje(hoje, thisYear, bday.getMonth(), bday.getDate());
          if (dias >= -6 && dias <= 31) {
            list.push({ nome: c.nome, tipo: "Catequizando", subtipo: "batismo", dataAniversario: date, diasRestantes: dias });
          }
        }
      }
    });

    // ── Catequistas ──────────────────────────────────────────────
    catequistas.forEach((c) => {
      if (!c.dataNascimento) return;
      const bday = new Date(c.dataNascimento + (c.dataNascimento.includes("T") ? "" : "T12:00:00"));
      if (bday.getMonth() === thisMonth) {
        const { date, dias } = calcDiasRelativosAoHoje(hoje, thisYear, bday.getMonth(), bday.getDate());
        if (dias >= -6 && dias <= 31) {
          list.push({ nome: c.nome, tipo: "Catequista", subtipo: "nascimento", dataAniversario: date, diasRestantes: dias });
        }
      }
    });

    // Ordena: passados primeiro (do mais recente), depois hoje, depois futuros
    return list.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [catequizandos, catequistas, hoje, thisYear, thisMonth]);

  // Badge conta apenas aniversários de hoje em diante (passados não entram no badge)
  const count = aniversariantes.filter((a) => a.diasRestantes >= 0).length;

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
                const jaPassou = a.diasRestantes < 0;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      jaPassou
                        ? "bg-rose-50/60 border border-rose-100"
                        : "bg-muted/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isHoje
                          ? isBatismo ? "bg-blue-400/20" : "bg-gold/20"
                          : jaPassou
                            ? isBatismo ? "bg-blue-100" : "bg-rose-100"
                            : isBatismo ? "bg-blue-500/10" : "bg-primary/10"
                      }`}
                    >
                      {isBatismo ? (
                        <Droplets
                          className={`h-4 w-4 ${
                            isHoje ? "text-blue-500" : jaPassou ? "text-blue-400" : "text-blue-400"
                          }`}
                        />
                      ) : (
                        <Cake
                          className={`h-4 w-4 ${
                            isHoje ? "text-gold" : jaPassou ? "text-rose-400" : "text-primary"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.tipo}
                        {" • "}
                        <span className={isBatismo && !jaPassou ? "text-blue-500 font-medium" : ""}>
                          {isBatismo ? "Batismo" : "Nascimento"}
                        </span>
                        {" • "}
                        {a.dataAniversario.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        jaPassou
                          ? "bg-rose-100 text-rose-500"
                          : isHoje
                            ? isBatismo
                              ? "bg-blue-400/20 text-blue-500"
                              : "bg-gold/20 text-gold"
                            : a.diasRestantes <= 7
                              ? "bg-caution/10 text-caution"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {jaPassou
                        ? `Já passou · ${Math.abs(a.diasRestantes)}d`
                        : isHoje
                          ? isBatismo ? "💧 Hoje!" : "🎉 Hoje!"
                          : `${a.diasRestantes}d`
                      }
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
