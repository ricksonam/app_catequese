import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { enqueueOperation } from "@/lib/offlineQueue";
import { triggerOfflineWriteWarning } from "@/components/OfflineWriteWarning";

const OFFLINE_QUEUED = { _queued: true } as const;

export type DiarioEspiritual = {
  id: string;
  user_id: string;
  turma_id: string;
  tipo_registro: "encontro" | "evento" | "evolucao" | "reuniao";
  encontro_id: string | null;
  evento_id: string | null;
  data_registro: string;
  como_foi: string;
  pontos_positivos: string;
  pontos_negativos: string;
  observacoes_catequizandos: string;
  evolucao_espiritual: string;
  avaliacoes_catequizandos?: any;
  evolucao_catequizandos?: any;
  participantes_reuniao?: string;
  reuniao_id?: string | null;
  criado_em: string;
};

// Serializa arrays JSON dentro das colunas de texto existentes
function serializePayload(raw: any): any {
  const payload = { ...raw };

  // Garante que tipo_registro seja salvo
  if (!payload.tipo_registro) payload.tipo_registro = "encontro";

  // Serializa avaliacoes e participantes_reuniao dentro de observacoes_catequizandos
  if (payload.avaliacoes_catequizandos !== undefined || payload.participantes_reuniao !== undefined || payload.reuniao_id !== undefined) {
    const avaliacoes = payload.avaliacoes_catequizandos;
    const participantes = payload.participantes_reuniao;
    const reuniaoId = payload.reuniao_id;
    const text = typeof payload.observacoes_catequizandos === "string" &&
      !payload.observacoes_catequizandos.startsWith("{")
      ? payload.observacoes_catequizandos
      : "";

    if ((Array.isArray(avaliacoes) && avaliacoes.length > 0) || participantes || reuniaoId) {
      payload.observacoes_catequizandos = JSON.stringify({ text, avaliacoes, participantes, reuniaoId });
    } else {
      payload.observacoes_catequizandos = text;
    }
    delete payload.avaliacoes_catequizandos;
    delete payload.participantes_reuniao;
    delete payload.reuniao_id;
  }

  // Serializa evolucoes dentro de evolucao_espiritual
  if (payload.evolucao_catequizandos !== undefined) {
    const evolucoes = payload.evolucao_catequizandos;
    const text = typeof payload.evolucao_espiritual === "string" &&
      !payload.evolucao_espiritual.startsWith("{")
      ? payload.evolucao_espiritual
      : "";

    if (Array.isArray(evolucoes) && evolucoes.length > 0) {
      payload.evolucao_espiritual = JSON.stringify({ text, evolucoes });
    } else {
      payload.evolucao_espiritual = text;
    }
    delete payload.evolucao_catequizandos;
  }

  // Serializa evento_id dentro do campo encontro_id se não existir a coluna ainda
  // (caso o SQL não tenha sido aplicado, armazena no campo extra)
  // Se existir evento_id como coluna, mantém. Senão serializa no como_foi via JSON também.
  // Vamos sempre tentar salvar evento_id diretamente.

  return payload;
}

// Desserializa os dados vindos do banco
function deserializeItem(item: any): any {
  const parsed = { ...item };

  // Extrai tipo_registro (pode ser texto direto ou default encontro)
  if (!parsed.tipo_registro) parsed.tipo_registro = "encontro";

  // Extrai avaliacoes, participantes e texto de observacoes_catequizandos
  try {
    if (parsed.observacoes_catequizandos && parsed.observacoes_catequizandos.startsWith("{")) {
      const obs = JSON.parse(parsed.observacoes_catequizandos);
      if (obs.avaliacoes) {
        parsed.avaliacoes_catequizandos = obs.avaliacoes;
      }
      if (obs.participantes) {
        parsed.participantes_reuniao = obs.participantes;
      }
      if (obs.reuniaoId) {
        parsed.reuniao_id = obs.reuniaoId;
      }
      parsed.observacoes_catequizandos = obs.text || "";
    }
  } catch (_) {}

  // Extrai evolucoes e texto de evolucao_espiritual
  try {
    if (parsed.evolucao_espiritual && parsed.evolucao_espiritual.startsWith("{")) {
      const ev = JSON.parse(parsed.evolucao_espiritual);
      if (ev.evolucoes) {
        parsed.evolucao_catequizandos = ev.evolucoes;
        parsed.evolucao_espiritual = ev.text || "";
      }
    }
  } catch (_) {}

  return parsed;
}

export function useDiarioEspiritual(turmaId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: diarios, isLoading } = useQuery({
    queryKey: ["diario_espiritual", turmaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diario_espiritual")
        .select(`
          *,
          encontros (
            id,
            tema
          )
        `)
        .eq("turma_id", turmaId)
        .order("criado_em", { ascending: false });

      if (error) {
        console.error("Erro ao buscar diários:", error);
        throw error;
      }

      return data.map(deserializeItem) as (DiarioEspiritual & {
        encontros: { id: string; tema: string } | null;
      })[];
    },
    enabled: !!turmaId && !!session,
  });

  const criarDiario = useMutation({
    mutationFn: async (novoDiario: Omit<DiarioEspiritual, "id" | "user_id" | "criado_em">) => {
      const payload = serializePayload({ ...novoDiario, user_id: session?.user.id });

      if (!navigator.onLine) {
        triggerOfflineWriteWarning();
        const id = crypto.randomUUID();
        const fullPayload = { ...payload, id, criado_em: new Date().toISOString() };
        await enqueueOperation({ type: "createDiario", args: payload, queryKeysToInvalidate: [["diario_espiritual", turmaId]] });
        
        // Optimistic update
        queryClient.setQueriesData({ queryKey: ["diario_espiritual", turmaId] }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return [fullPayload, ...old];
        });
        return OFFLINE_QUEUED;
      }

      const { data, error } = await supabase
        .from("diario_espiritual")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data !== OFFLINE_QUEUED) {
        queryClient.invalidateQueries({ queryKey: ["diario_espiritual", turmaId] });
        toast.success("Registro adicionado ao diário com sucesso!");
      }
    },
    onError: (error) => {
      console.error("Erro ao criar diário:", error);
      toast.error("Erro ao adicionar registro ao diário.");
    },
  });

  const atualizarDiario = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<DiarioEspiritual, "id" | "user_id" | "criado_em">> }) => {
      const payload = serializePayload({ ...updates });

      if (!navigator.onLine) {
        triggerOfflineWriteWarning();
        await enqueueOperation({ type: "updateDiario", args: { id, updates: payload }, queryKeysToInvalidate: [["diario_espiritual", turmaId]] });
        
        queryClient.setQueriesData({ queryKey: ["diario_espiritual", turmaId] }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map(item => item.id === id ? { ...item, ...payload } : item);
        });
        return OFFLINE_QUEUED;
      }

      const { data, error } = await supabase
        .from("diario_espiritual")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data !== OFFLINE_QUEUED) {
        queryClient.invalidateQueries({ queryKey: ["diario_espiritual", turmaId] });
        toast.success("Registro atualizado com sucesso!");
      }
    },
    onError: (error) => {
      console.error("Erro ao atualizar diário:", error);
      toast.error("Erro ao atualizar o registro.");
    },
  });

  const excluirDiario = useMutation({
    mutationFn: async (id: string) => {
      if (!navigator.onLine) {
        triggerOfflineWriteWarning();
        await enqueueOperation({ type: "deleteDiario", args: id, queryKeysToInvalidate: [["diario_espiritual", turmaId]] });
        queryClient.setQueriesData({ queryKey: ["diario_espiritual", turmaId] }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter(item => item.id !== id);
        });
        return OFFLINE_QUEUED;
      }

      const { error } = await supabase.from("diario_espiritual").delete().eq("id", id);
      if (error) throw error;
      return null;
    },
    onSuccess: (data) => {
      if (data !== OFFLINE_QUEUED) {
        queryClient.invalidateQueries({ queryKey: ["diario_espiritual", turmaId] });
        toast.success("Registro removido com sucesso!");
      }
    },
    onError: (error) => {
      console.error("Erro ao excluir diário:", error);
      toast.error("Erro ao remover o registro.");
    },
  });

  return {
    diarios,
    isLoading,
    criarDiario,
    atualizarDiario,
    excluirDiario,
  };
}
