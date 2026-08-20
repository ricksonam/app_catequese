import { RefreshCw, CloudOff } from "lucide-react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { cn } from "@/lib/utils";

/**
 * Badge no header que mostra operações offline pendentes.
 * Clicando força uma sincronização imediata.
 */
export function SyncStatus() {
  const { pendingCount, isSyncing, syncNow } = useOfflineQueue();

  if (pendingCount === 0 && !isSyncing) return null;

  return (
    <button
      onClick={syncNow}
      title={`${pendingCount} operação(ões) aguardando sincronização. Toque para sincronizar agora.`}
      className={cn(
        "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95",
        isSyncing
          ? "bg-blue-100 text-blue-700 border border-blue-300 animate-pulse"
          : "bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-200"
      )}
    >
      {isSyncing ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
          <span className="hidden sm:inline">Sincronizando…</span>
        </>
      ) : (
        <>
          <CloudOff className="h-3 w-3 shrink-0" />
          <span>{pendingCount}</span>
          <span className="hidden sm:inline">pendente{pendingCount !== 1 ? "s" : ""}</span>
        </>
      )}
    </button>
  );
}
