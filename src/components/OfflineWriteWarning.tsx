import { useState, useEffect } from "react";
import { WifiOff, AlertTriangle, X } from "lucide-react";

const SESSION_KEY = "icatequese_offline_write_warned";

/**
 * Balão de aviso exibido UMA VEZ por sessão quando o catequista
 * tenta registrar dados sem internet.
 *
 * Lembra ao catequista que, para evitar conflitos, idealmente
 * apenas UM catequista deve registrar dados offline por turma.
 */
export function OfflineWriteWarning() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Escuta o evento customizado disparado pelas mutations offline
    const handleOfflineWrite = () => {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setVisible(true);
      }
    };
    window.addEventListener("icatequese:offline-write", handleOfflineWrite);
    return () => window.removeEventListener("icatequese:offline-write", handleOfflineWrite);
  }, []);

  if (!visible) return null;

  const handleClose = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9998] animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm mx-auto">
      <div className="bg-white border-2 border-amber-400 rounded-2xl shadow-xl shadow-amber-100 p-4">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground leading-tight">
              Registro offline detectado
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Corpo do aviso */}
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2">
            <WifiOff className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você está <span className="font-bold text-amber-600">sem internet</span>. 
              Seus registros serão salvos localmente e sincronizados automaticamente quando a conexão voltar.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-800 leading-relaxed">
              ⚠️ Para evitar conflitos, certifique-se de que{" "}
              <span className="underline">apenas um catequista</span> registre dados 
              para esta turma enquanto estiver offline.
            </p>
          </div>
        </div>

        {/* Botão de confirmação */}
        <button
          onClick={handleClose}
          className="mt-3 w-full py-2 rounded-xl bg-amber-500 text-white text-xs font-black uppercase tracking-wider hover:bg-amber-600 transition-colors active:scale-[0.98]"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

/**
 * Função utilitária para disparar o aviso de escrita offline.
 * Chamada pelas mutations quando detectam que o dispositivo está offline.
 */
export function triggerOfflineWriteWarning() {
  window.dispatchEvent(new CustomEvent("icatequese:offline-write"));
}
