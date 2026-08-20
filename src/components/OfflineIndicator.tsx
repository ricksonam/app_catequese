import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

/**
 * Banner discreto exibido quando o dispositivo está sem internet.
 * Aparece na parte superior da tela e some quando a conexão é restaurada.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setVisible(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      // Mantém visível por 2s para o usuário ver que voltou
      setTimeout(() => setVisible(false), 2000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-500 ${
        isOffline
          ? "bg-amber-500 text-white"
          : "bg-emerald-500 text-white"
      }`}
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      {isOffline
        ? "Sem conexão — exibindo dados salvos"
        : "✓ Conexão restaurada"}
    </div>
  );
}
