import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Ícone discreto exibido quando o dispositivo está sem internet.
 * Aparece no header como um pequeno ícone com tooltip — não bloqueia o layout.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 border border-amber-300 shrink-0">
          <WifiOff className="h-4 w-4 text-amber-600" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs font-semibold">
        Sem conexão — exibindo dados salvos
      </TooltipContent>
    </Tooltip>
  );
}

