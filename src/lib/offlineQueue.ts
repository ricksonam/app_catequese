import { get, set, del, keys } from "idb-keyval";

/**
 * Fila de operações offline — armazena mutações que falharam por falta de internet
 * e as reenvia automaticamente quando a conexão for restabelecida.
 */

export interface QueuedOperation {
  id: string;
  type: string;
  args: any;
  timestamp: number;
  retries: number;
  queryKeysToInvalidate: string[][];
}

const PREFIX = "icatequese-queue-";

/** Adiciona uma operação à fila */
export async function enqueueOperation(
  op: Omit<QueuedOperation, "id" | "timestamp" | "retries">
): Promise<string> {
  const id = crypto.randomUUID();
  const entry: QueuedOperation = { ...op, id, timestamp: Date.now(), retries: 0 };
  await set(`${PREFIX}${id}`, entry);
  return id;
}

/** Retorna todas as operações pendentes ordenadas por timestamp */
export async function getQueue(): Promise<QueuedOperation[]> {
  const allKeys = (await keys()).map(String);
  const queueKeys = allKeys.filter((k) => k.startsWith(PREFIX));
  const ops = await Promise.all(queueKeys.map((k) => get<QueuedOperation>(k)));
  return (ops.filter(Boolean) as QueuedOperation[]).sort(
    (a, b) => a.timestamp - b.timestamp
  );
}

/** Remove uma operação da fila após sucesso */
export async function dequeueOperation(id: string): Promise<void> {
  await del(`${PREFIX}${id}`);
}

/** Incrementa o contador de tentativas */
export async function incrementRetries(op: QueuedOperation): Promise<void> {
  await set(`${PREFIX}${op.id}`, { ...op, retries: op.retries + 1 });
}

/** Retorna o número de operações pendentes */
export async function getQueueCount(): Promise<number> {
  const allKeys = (await keys()).map(String);
  return allKeys.filter((k) => k.startsWith(PREFIX)).length;
}
