import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPlanoByCode } from "@/lib/supabaseStore";
import { CalendarDays, Heart, BookOpen, Music, Star, Calendar, CheckCircle2, Cross } from "lucide-react";
import Spinner from "@/components/ui/spinner";

type SacramentoType = "batismo" | "eucaristia" | "crisma";

const ETAPAS_RITO = [
  {
    key: "reuniao_pais",
    label: "Reunião com os pais",
    icon: Heart,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-500",
    cardBg: "bg-rose-50 dark:bg-rose-900/10",
    border: "border-rose-200 dark:border-rose-800",
    textColor: "text-rose-700",
  },
  {
    key: "confissao",
    label: "Celebração Penitencial (Confissão)",
    icon: BookOpen,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-500",
    cardBg: "bg-violet-50 dark:bg-violet-900/10",
    border: "border-violet-200 dark:border-violet-800",
    textColor: "text-violet-700",
  },
  {
    key: "retiro",
    label: "Retiro Espiritual",
    icon: Cross,
    iconColor: "text-sky-500",
    iconBg: "bg-sky-500",
    cardBg: "bg-sky-50 dark:bg-sky-900/10",
    border: "border-sky-200 dark:border-sky-800",
    textColor: "text-sky-700",
  },
  {
    key: "ensaio",
    label: "Ensaio do Rito",
    icon: Music,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500",
    cardBg: "bg-emerald-50 dark:bg-emerald-900/10",
    border: "border-emerald-200 dark:border-emerald-800",
    textColor: "text-emerald-700",
  },
  {
    key: "confraternizacao",
    label: "Confraternização",
    icon: Star,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500",
    cardBg: "bg-amber-50 dark:bg-amber-900/10",
    border: "border-amber-200 dark:border-amber-800",
    textColor: "text-amber-700",
  },
] as const;

const SACRAMENTO_LABELS: Record<string, { label: string; gradient: string }> = {
  batismo: { label: "Batismo", gradient: "from-sky-500 to-blue-600" },
  eucaristia: { label: "Primeira Eucaristia", gradient: "from-amber-500 to-orange-600" },
  crisma: { label: "Crisma", gradient: "from-violet-500 to-purple-600" },
};

function formatData(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function isPast(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr + "T23:59:59") < new Date();
}

function isToday(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

export default function PublicRitoSacramental() {
  const { codigo, sacramento } = useParams<{ codigo: string; sacramento: string }>();
  const sacramentoKey = (sacramento || "eucaristia") as SacramentoType;

  const { data, isLoading, error } = useQuery({
    queryKey: ["public_plano", codigo],
    queryFn: () => fetchPublicPlanoByCode(codigo || ""),
    enabled: !!codigo,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Spinner size="lg" text="Buscando informações..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <CalendarDays className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Link Inválido ou Expirado</h1>
        <p className="text-muted-foreground mt-2 max-w-xs">Não conseguimos encontrar as informações. Verifique com o catequista.</p>
      </div>
    );
  }

  const { turma } = data;
  const sacInfo = SACRAMENTO_LABELS[sacramentoKey] || SACRAMENTO_LABELS.eucaristia;

  const ritoConfig =
    turma.trilhas_config?.[sacramentoKey]?.etapas_rito ||
    turma.trilhas_config?.[sacramentoKey]?.etapasRito ||
    (sacramentoKey === "eucaristia" ? turma.etapas_rito : undefined) ||
    {};

  const dataCelebracao =
    turma.trilhas_config?.[sacramentoKey]?.data_celebracao ||
    turma.trilhas_config?.[sacramentoKey]?.dataCelebracao ||
    (sacramentoKey === "eucaristia" ? turma.data_celebracao_sacramento : undefined);

  const etapasComDatas = ETAPAS_RITO.filter(e => !!ritoConfig[e.key]);
  const proximaEtapa = etapasComDatas.find(e => !isPast(ritoConfig[e.key]));

  return (
    <div className="min-h-screen bg-[#FAFBFF] dark:bg-zinc-950 pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-br ${sacInfo.gradient} text-white px-6 py-10 shadow-lg`}>
        <div className="max-w-lg mx-auto text-center space-y-3">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-black/10">
            <Star className="h-8 w-8 text-white" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Preparação Sacramental</p>
          <h1 className="text-2xl font-black leading-tight">{sacInfo.label}</h1>
          <p className="text-sm font-semibold text-white/80">{turma.nome} · {turma.ano}</p>
          {turma.comunidade_nome && (
            <p className="text-xs text-white/60 font-medium uppercase tracking-wide">{turma.comunidade_nome}</p>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-6 space-y-5">
        {/* Data da Celebração */}
        {dataCelebracao && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-amber-200 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-0.5">🎉 Data da Celebração</p>
              <p className="text-base font-black text-foreground capitalize">{formatData(dataCelebracao)}</p>
            </div>
          </div>
        )}

        {/* Próxima etapa destaque */}
        {proximaEtapa && (
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">⏰ Próxima Etapa</p>
            <p className="text-lg font-black text-foreground leading-tight">{proximaEtapa.label}</p>
            <p className="text-sm font-bold text-primary/70 mt-1 capitalize">{formatData(ritoConfig[proximaEtapa.key])}</p>
          </div>
        )}

        {/* Lista de Etapas com numeração */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 px-1">
            Roteiro de Preparação
          </p>

          {/* Linha de conexão vertical */}
          <div className="relative">
            {/* Linha vertical conectando os itens */}
            <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent z-0" />

            <div className="space-y-3 relative z-10">
              {ETAPAS_RITO.map((etapa, index) => {
                const Icon = etapa.icon;
                const dateVal = ritoConfig[etapa.key];
                const done = dateVal ? isPast(dateVal) : false;
                const today = dateVal ? isToday(dateVal) : false;
                const numero = index + 1;

                return (
                  <div
                    key={etapa.key}
                    className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                      today
                        ? "bg-amber-50 border-amber-300 shadow-md shadow-amber-100"
                        : done
                        ? "bg-emerald-50/60 border-emerald-200"
                        : dateVal
                        ? `${etapa.cardBg} ${etapa.border} shadow-sm`
                        : "bg-white dark:bg-zinc-900 border-border/40"
                    }`}
                  >
                    {/* Número de sequência + ícone */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      {/* Número */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white z-10 ${
                        done ? "bg-emerald-500" : today ? "bg-amber-500" : dateVal ? etapa.iconBg : "bg-muted-foreground/30"
                      }`}>
                        {done ? "✓" : numero}
                      </div>
                      {/* Ícone colorido */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                        done ? "bg-emerald-100" : today ? "bg-amber-100" : dateVal ? `${etapa.iconBg}/10` : "bg-muted/50"
                      }`}>
                        {done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <Icon className={`h-5 w-5 ${today ? "text-amber-500" : dateVal ? etapa.iconColor : "text-muted-foreground/40"}`} />
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-sm font-bold leading-tight ${done ? "text-emerald-700 line-through opacity-70" : "text-foreground"}`}>
                        {etapa.label}
                      </p>
                      {dateVal ? (
                        <p className={`text-xs mt-1 font-semibold capitalize ${done ? "text-emerald-600" : today ? "text-amber-600" : etapa.textColor}`}>
                          {today ? "🌟 Hoje! " : ""}{formatData(dateVal)}
                        </p>
                      ) : (
                        <p className="text-xs mt-1 text-muted-foreground italic">Data a definir</p>
                      )}
                    </div>

                    {/* Badge status */}
                    {today && (
                      <span className="shrink-0 self-center px-2 py-1 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase tracking-wide">
                        Hoje
                      </span>
                    )}
                    {done && !today && (
                      <span className="shrink-0 self-center px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wide">
                        ✓ Feito
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-muted/40 rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Em caso de dúvidas sobre as datas, entre em contato com o catequista da turma.
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-primary/10 shadow-2xl z-50 flex items-center gap-2">
        <img src="/app-logo.png" className="w-6 h-6 object-contain" alt="iCatequese" />
        <span className="text-xs font-black text-primary tracking-tighter uppercase italic">iCatequese Digital</span>
      </div>
    </div>
  );
}
