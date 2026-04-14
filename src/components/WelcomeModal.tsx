import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, UserCheck, CheckCircle2, Dove } from "lucide-react";

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
          <div className="mb-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">✦ Bem-vindo ao ✦</p>
            <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-violet-600 via-primary to-indigo-600 bg-clip-text text-transparent leading-tight">
              iCatequese
            </h1>
          </div>

          <p className="text-base font-semibold text-foreground mt-2 mb-1">
            Que bom ter você aqui! 🙏
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
            Antes de começar, é necessário cadastrar alguns dados básicos para que o sistema funcione corretamente.
          </p>

          {/* Cadastros necessários */}
          <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 mb-6 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-3">
              📋 Cadastros necessários
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => handleGoTo("/cadastros/paroquia-comunidade")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700/30 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-foreground">Paróquia / Comunidade</p>
                  <p className="text-[11px] text-muted-foreground">Dados da sua paróquia</p>
                </div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">1°</span>
              </button>

              <button
                onClick={() => handleGoTo("/cadastros/catequistas")}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700/30 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                  <UserCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-foreground">Catequistas</p>
                  <p className="text-[11px] text-muted-foreground">Cadastre os catequistas ativos</p>
                </div>
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 px-2 py-0.5 rounded-full">2°</span>
              </button>
            </div>
          </div>

          {/* Checkbox "não mostrar mais" */}
          <label className="flex items-center gap-2.5 cursor-pointer mb-5 self-start">
            <button
              type="button"
              onClick={() => setDoNotShow((v) => !v)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                doNotShow ? "bg-primary border-primary" : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {doNotShow && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            </button>
            <span className="text-xs text-muted-foreground">Não mostrar este aviso novamente</span>
          </label>

          {/* Ações */}
          <div className="flex gap-2.5 w-full">
            <button
              onClick={() => handleClose(true)}
              className="flex-1 py-3 rounded-2xl bg-muted/60 dark:bg-white/10 text-foreground font-semibold text-sm active:scale-[0.97] transition-all"
            >
              Sair
            </button>
            <button
              onClick={() => handleClose(true)}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-500/25 active:scale-[0.97] transition-all"
            >
              Entendi, vamos lá!
            </button>
          </div>
        </div>

        <style>{`
          @keyframes modal-slide-up {
            from { opacity: 0; transform: translateY(40px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0)    scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
