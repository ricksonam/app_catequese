import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, UserCheck, CheckCircle2, Dove, ChevronRight } from "lucide-react";

const WELCOME_SEEN_KEY = "ivc_welcome_seen";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const navigate = useNavigate();
  const [doNotShow, setDoNotShow] = useState(false);

  // Sync checkbox with what's already saved
  useEffect(() => {
    if (open) {
      setDoNotShow(false);
    }
  }, [open]);

  function handleClose(dismissed = false) {
    if (dismissed && doNotShow) {
      localStorage.setItem(WELCOME_SEEN_KEY, "true");
    }
    onClose();
  }

  function handleGoTo(path: string) {
    handleClose(true);
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

        {/* Conteúdo */}
        <div className="flex flex-col items-center text-center px-7 pt-8 pb-7">

          {/* Ícone do app + ornamento */}
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-[28px] overflow-hidden bg-white shadow-xl shadow-primary/15 border-2 border-primary/10 flex items-center justify-center">
              <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
            </div>
            {/* Pombinha animada */}
            <div className="absolute -top-2 -right-3 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/50 border-2 border-white dark:border-gray-900 flex items-center justify-center shadow-md animate-bounce">
              <span className="text-base">🕊️</span>
            </div>
          </div>

          {/* Saudação */}
          <div className="mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1 animate-pulse">✦ Bem-vindo ao ✦</p>
            <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-violet-600 via-primary to-indigo-600 bg-clip-text text-transparent leading-tight animate-in fade-in zoom-in duration-700">
              iCatequese
            </h1>
          </div>

          <p className="text-lg font-bold text-foreground mt-2 mb-2 animate-in slide-in-from-bottom duration-500 delay-150">
            Olá, Catequista! 🙏
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-xs animate-in slide-in-from-bottom duration-500 delay-300">
            Antes de ter o acesso completo primeiro faça os <strong>cadastros básicos</strong> da paróquia e catequistas para poder criar sua turma. Se foi convidado por um colega, você pode <strong>acessar uma Turma Compartilhada</strong> com o código no menu de turmas!
          </p>

          <p className="text-[11px] text-primary/70 font-medium mb-4 animate-in fade-in duration-700 delay-500">
            O acesso aos cadastros básicos estão no botão menu ou você pode usar os acessos rápidos abaixo:
          </p>

          {/* Cadastros necessários */}
          <div className="w-full bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-700/20 rounded-3xl p-5 mb-6 text-left shadow-sm animate-in zoom-in-95 duration-700 delay-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              📋 Cadastros prioritários
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleGoTo("/cadastros/paroquia-comunidade")}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-amber-100 dark:border-amber-900/30 shadow-sm hover:shadow-md hover:border-amber-300 transition-all active:scale-[0.98] group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-black text-foreground">1. Paróquia / Comunidade</p>
                  <p className="text-[11px] text-muted-foreground">Configurações iniciais</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>

              <button
                onClick={() => handleGoTo("/cadastros/catequistas")}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-sky-100 dark:border-sky-900/30 shadow-sm hover:shadow-md hover:border-sky-300 transition-all active:scale-[0.98] group"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-black text-foreground">2. Catequistas</p>
                  <p className="text-[11px] text-muted-foreground">Equipe de catequese</p>
                </div>
                <ChevronRight className="w-4 h-4 text-sky-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            </div>
          </div>

          {/* Checkbox "não mostrar mais" */}
          <label className="flex items-center gap-3 cursor-pointer mb-6 self-start group">
            <button
              type="button"
              onClick={() => setDoNotShow((v) => !v)}
              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                doNotShow ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/20" : "border-gray-200 dark:border-gray-700 group-hover:border-primary/50"
              }`}
            >
              {doNotShow && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            </button>
            <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Não mostrar este aviso novamente</span>
          </label>

          {/* Ações */}
          <div className="flex gap-3 w-full">
            <button
              onClick={() => handleClose(true)}
              className="flex-1 py-3.5 rounded-2xl bg-muted/60 dark:bg-white/5 text-foreground font-bold text-sm active:scale-[0.97] transition-all hover:bg-muted/80"
            >
              Depois
            </button>
            <button
              onClick={() => handleClose(true)}
              className="flex-[1.5] py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-xl shadow-violet-500/25 active:scale-[0.97] transition-all hover:brightness-110 flex items-center justify-center gap-2"
            >
              Vamos lá!
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <style>{`
          @keyframes modal-slide-up {
            from { opacity: 0; transform: translateY(60px) scale(0.9); }
            to   { opacity: 1; transform: translateY(0)    scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}

