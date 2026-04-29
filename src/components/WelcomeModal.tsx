import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, UserCheck, CheckCircle2, ChevronRight, Sparkles, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

const WELCOME_SEEN_KEY = "ivc_welcome_seen";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  hasParoquia?: boolean;
  hasCatequista?: boolean;
}

export default function WelcomeModal({ open, onClose, hasParoquia = false, hasCatequista = false }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [doNotShow, setDoNotShow] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isFinished = hasParoquia && hasCatequista;

  useEffect(() => {
    if (open) {
      setDoNotShow(false);
      // Se já terminou tudo ao abrir, ou acabou de terminar, mostra sucesso
      if (isFinished) {
        const timer = setTimeout(() => setShowSuccess(true), 400);
        return () => clearTimeout(timer);
      } else {
        setShowSuccess(false);
      }
    }
  }, [open, isFinished]);

  function handleClose(dismissed = false) {
    if (dismissed && (doNotShow || isFinished)) {
      localStorage.setItem(WELCOME_SEEN_KEY, "true");
    }
    onClose();
  }

  function handleGoTo(path: string) {
    handleClose(false); // Fecha sem marcar como visto permanentemente se não terminou
    navigate(path);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => handleClose(false)}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-black/10 dark:border-white/10" style={{ animation: "modal-slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>

        {/* Faixa litúrgica no topo */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-amber-400 to-violet-600" />

        {/* Botão fechar */}
        <button
          onClick={() => handleClose(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-muted-foreground hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {showSuccess ? (
          /* ── TELA DE BOAS VINDAS (SUCESSO) ── */
          <div className="flex flex-col items-center text-center px-7 pt-10 pb-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 border-2 border-emerald-500/20 animate-bounce-subtle">
              <PartyPopper className="h-12 w-12 text-emerald-600" />
            </div>
            
            <h2 className="text-3xl font-black text-foreground tracking-tighter mb-3">Tudo Pronto! 🎉</h2>
            <p className="text-base font-bold text-emerald-600 mb-4 uppercase tracking-widest">Seja bem-vindo, Catequista!</p>
            
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Você concluiu os cadastros obrigatórios com sucesso. Agora o <strong>iCatequese</strong> está totalmente liberado para você criar e gerir suas turmas.
            </p>

            <button
              onClick={() => {
                localStorage.setItem(WELCOME_SEEN_KEY, "true");
                handleClose(true);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2"
            >
              Começar minha jornada
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ── TELA DE CADASTROS OBRIGATÓRIOS ── */
          <div className="flex flex-col items-center text-center px-7 pt-8 pb-7">

            {/* Ícone do app + ornamento */}
            <div className="relative mb-5">
              <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-white shadow-xl shadow-primary/15 border-2 border-primary/10 flex items-center justify-center">
                <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
              </div>
              <div className="absolute -top-2 -right-3 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/50 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-md animate-bounce">
                <span className="text-base">🕊️</span>
              </div>
            </div>

            {/* Título */}
            <div className="mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Passos Iniciais</p>
              <h1 className="text-3xl font-black tracking-tighter text-foreground leading-tight">
                Quase lá!
              </h1>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Antes de ter o acesso completo, primeiro faça os <strong>cadastros obrigatórios</strong> da paróquia e catequista. Você também pode entrar em uma turma através do compartilhamento inserindo o código ou lendo o QR code da turma, ou compartilhar a sua turma com outros catequistas fornecendo o código da sua turma.
            </p>

            {/* Cadastros necessários */}
            <div className="w-full bg-slate-50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 rounded-3xl p-5 mb-6 text-left shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Cadastros Obrigatórios
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => handleGoTo("/cadastros/paroquia-comunidade")}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border-2 transition-all active:scale-[0.98] group",
                    hasParoquia ? "border-emerald-500/30 bg-emerald-50/10" : "border-slate-100 hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                    hasParoquia ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-black text-foreground">1. Paróquia / Comunidade</p>
                    <p className={cn("text-[10px] font-bold uppercase", hasParoquia ? "text-emerald-500" : "text-muted-foreground")}>
                      {hasParoquia ? "Concluído" : "Configurações iniciais"}
                    </p>
                  </div>
                  {hasParoquia ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  )}
                </button>

                <button
                  onClick={() => handleGoTo("/cadastros/catequistas")}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border-2 transition-all active:scale-[0.98] group",
                    hasCatequista ? "border-emerald-500/30 bg-emerald-50/10" : "border-slate-100 hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                    hasCatequista ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                  )}>
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-black text-foreground">2. Catequistas</p>
                    <p className={cn("text-[10px] font-bold uppercase", hasCatequista ? "text-emerald-500" : "text-muted-foreground")}>
                      {hasCatequista ? "Concluído" : "Sua equipe"}
                    </p>
                  </div>
                  {hasCatequista ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  )}
                </button>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => handleClose(true)}
                className="flex-1 py-3.5 rounded-2xl bg-muted/60 dark:bg-white/5 text-foreground font-bold text-sm active:scale-[0.97] transition-all hover:bg-muted/80"
              >
                Pular
              </button>
              <button
                onClick={() => {
                  if (hasParoquia && !hasCatequista) navigate("/cadastros/catequistas");
                  else if (!hasParoquia) navigate("/cadastros/paroquia-comunidade");
                  else handleClose(true);
                }}
                className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-violet-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2"
              >
                Continuar
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes modal-slide-up {
            from { opacity: 0; transform: translateY(60px) scale(0.9); }
            to   { opacity: 1; transform: translateY(0)    scale(1); }
          }
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-subtle {
            animation: bounce-subtle 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
