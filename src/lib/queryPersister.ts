import { get, set, del } from "idb-keyval";


/**
 * Persister do React Query usando IndexedDB via idb-keyval.
 *
 * Salva todo o cache do React Query no IndexedDB do celular/browser,
 * permitindo que os dados (turmas, catequizandos, encontros, etc.)
 * estejam disponíveis mesmo sem internet.
 *
 * Tempo de retenção: 24 horas (gcTime compatível com o QueryClient)
 */
const IDB_KEY = "icatequese-query-cache";


export function createIdbPersister() {
  return {
    persistClient: async (client: string) => {
      await set(IDB_KEY, client);
    },
    restoreClient: async () => {
      return await get<string>(IDB_KEY);
    },
    removeClient: async () => {
      await del(IDB_KEY);
    },
  };
}
