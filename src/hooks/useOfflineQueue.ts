import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getQueue,
  dequeueOperation,
  incrementRetries,
  getQueueCount,
  type QueuedOperation,
} from "@/lib/offlineQueue";
import { mutationRegistry } from "@/lib/mutationRegistry";

const MAX_RETRIES = 3;

/**
 * Hook central da fila offline.
 * - Conta operações pendentes (badge no header)
 * - Processa a fila automaticamente quando o `online` event dispara
 * - Expõe `syncNow()` para forçar sincronização manual
 * - Escuta mensagens do Service Worker (Background Sync - Android Chrome)
 */
export function useOfflineQueue() {
  const qc = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const processingRef = useRef(false);

  // Atualiza a contagem de pendentes
  const refreshCount = useCallback(async () => {
    const count = await getQueueCount();
    setPendingCount(count);
  }, []);

  // Processa todas as operações pendentes
  const processQueue = useCallback(async () => {
    if (processingRef.current || !navigator.onLine) return;
    processingRef.current = true;

    const queue = await getQueue();
    if (queue.length === 0) {
      processingRef.current = false;
      return;
    }

    setIsSyncing(true);
    toast.loading(`Sincronizando ${queue.length} registro(s)...`, {
      id: "sync-queue",
      duration: Infinity,
    });

    let successCount = 0;
    let failCount = 0;

    for (const op of queue) {
      const fn = mutationRegistry[op.type];
      if (!fn) {
        // Tipo desconhecido: remove da fila para evitar bloqueio
        await dequeueOperation(op.id);
        continue;
      }

      try {
        await fn(op.args);
        await dequeueOperation(op.id);
        successCount++;

        // Invalida as queries relacionadas para refletir os dados do servidor
        for (const queryKey of op.queryKeysToInvalidate) {
          qc.invalidateQueries({ queryKey });
        }
      } catch (err) {
        console.error(`[OfflineQueue] Falha ao processar op ${op.type}:`, err);
        if (op.retries >= MAX_RETRIES) {
          // Desiste após MAX_RETRIES tentativas
          await dequeueOperation(op.id);
          failCount++;
        } else {
          await incrementRetries(op);
        }
      }
    }

    processingRef.current = false;
    setIsSyncing(false);
    await refreshCount();

    if (successCount > 0 && failCount === 0) {
      toast.success(`✓ ${successCount} registro(s) sincronizado(s) com sucesso!`, {
        id: "sync-queue",
        duration: 4000,
      });
    } else if (failCount > 0) {
      toast.warning(`${successCount} sincronizado(s), ${failCount} falhou(aram) após 3 tentativas.`, {
        id: "sync-queue",
        duration: 6000,
      });
    } else {
      toast.dismiss("sync-queue");
    }
  }, [qc, refreshCount]);

  useEffect(() => {
    // Conta inicial
    refreshCount();

    // Processa ao recuperar conexão
    const handleOnline = () => {
      setTimeout(() => processQueue(), 1000); // Pequeno delay para garantir conexão estável
    };

    window.addEventListener("online", handleOnline);

    // Escuta mensagens do Service Worker (Fase 4 - Background Sync)
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_MUTATIONS") {
        processQueue();
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    // Processa se já estava online com itens na fila (ex: após reload)
    if (navigator.onLine) {
      processQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, [processQueue, refreshCount]);

  return {
    pendingCount,
    isSyncing,
    syncNow: processQueue,
    refreshCount,
  };
}
