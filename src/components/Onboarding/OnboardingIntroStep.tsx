import { Church, UserCheck, Users, ArrowRight, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface OnboardingIntroStepProps {
  open: boolean;
  onStart: () => void;
}

const etapas = [
  {
    step: "01",
    icon: Church,
    title: "Paróquia e Comunidade",
    desc: "Defina onde sua catequese acontece — o espaço de missão da sua fé.",
    color: "from-violet-600 to-indigo-600",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    border: "border-violet-200 dark:border-violet-800/40",
    iconColor: "text-violet-600",
  },
  {
    step: "02",
    icon: UserCheck,
    title: "Perfil do Catequista",
    desc: "Crie o seu perfil. Você poderá adicionar outros catequistas depois.",
    color: "from-sky-600 to-indigo-500",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    border: "border-sky-200 dark:border-sky-800/40",
    iconColor: "text-sky-600",
  },
  {
    step: "03",
    icon: Users,
    title: "Sua Primeira Turma",
    desc: "Cadastre a turma para começar a registrar encontros, catequizandos e muito mais.",
    color: "from-emerald-600 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800/40",
    iconColor: "text-emerald-600",
  },
];

export function OnboardingIntroStep({ open, onStart }: OnboardingIntroStepProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md w-[95vw] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 max-h-[92vh] flex flex-col">

        {/* Barra topo multicolorida */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-sky-500 via-emerald-400 to-violet-600 shrink-0" />

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 px-7 pb-7">

          {/* Header */}
          <div className="flex flex-col items-center text-center pt-5 pb-3">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-xl border border-black/5 p-2">
                <img src="/app-logo.png" className="w-full h-full object-contain" alt="Logo iCatequese" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                <Lock className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Configuração Inicial</p>
              <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
            </div>

            <h2 className="text-xl font-black text-foreground tracking-tight leading-tight">
              Bem-vindo ao <span className="text-primary">iCatequese!</span>
              <br />
              <span className="text-sm text-muted-foreground font-medium">Antes de começar, 3 cadastros rápidos</span>
            </h2>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5 max-w-xs">
              Para desbloquear os recursos do <strong>iCatequese</strong>, precisamos de algumas informações básicas. Leva menos de 3 minutos!
            </p>
          </div>

          {/* Etapas */}
          <div className="space-y-2 mb-4">
            {etapas.map((e, i) => {
              const Icon = e.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 ${e.bg} ${e.border} transition-all`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Número */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${e.color} flex items-center justify-center shadow-md`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[8px] font-black text-muted-foreground/60 tracking-widest">{e.step}</span>
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black ${e.iconColor} leading-tight`}>{e.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{e.desc}</p>
                  </div>

                  <CheckCircle2 className="h-4 w-4 text-muted-foreground/20 shrink-0" />
                </div>
              );
            })}
          </div>

          {/* Nota de tranquilidade */}
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 rounded-xl p-3 mb-4 text-left">
            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-relaxed">
              <strong>Não se preocupe!</strong> Você pode editar e completar todos esses dados a qualquer momento depois dentro do aplicativo.
            </p>
          </div>

          {/* Botão CTA */}
          <button
            onClick={onStart}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 via-primary to-emerald-600 text-white font-black text-sm shadow-xl shadow-primary/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2 group"
          >
            Vamos Começar!
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
