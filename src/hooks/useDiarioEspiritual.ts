import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type DiarioEspiritual = {
  id: string;
  user_id: string;
  turma_id: string;
  encontro_id: string | null;
  data_registro: string;
  como_foi: string;
  pontos_positivos: string;
  pontos_negativos: string;
  observacoes_catequizandos: string;
  evolucao_espiritual: string;
  avaliacoes_catequizandos?: any;
  evolucao_catequizandos?: any;
  criado_em: string;
};

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

      const parsedData = data.map(item => {
        let parsed = { ...item };
        try {
          if (parsed.observacoes_catequizandos && parsed.observacoes_catequizandos.startsWith('{')) {
            const obs = JSON.parse(parsed.observacoes_catequizandos);
            if (obs.avaliacoes) {
              parsed.observacoes_catequizandos = obs.text || "";
              parsed.avaliacoes_catequizandos = obs.avaliacoes;
            }
          }
        } catch(e) {}
        
        try {
          if (parsed.evolucao_espiritual && parsed.evolucao_espiritual.startsWith('{')) {
            const ev = JSON.parse(parsed.evolucao_espiritual);
            if (ev.evolucoes) {
              parsed.evolucao_espiritual = ev.text || "";
              parsed.evolucao_catequizandos = ev.evolucoes;
            }
          }
        } catch(e) {}
        
        return parsed;
      });

      return parsedData as (DiarioEspiritual & { encontros: { id: string; tema: string } | null })[];
    },
    enabled: !!turmaId && !!session,
  });

  const criarDiario = useMutation({
    mutationFn: async (novoDiario: Omit<DiarioEspiritual, "id" | "user_id" | "criado_em">) => {
      const payload = { ...novoDiario, user_id: session?.user.id } as any;
      
      if (payload.avaliacoes_catequizandos !== undefined) {
        payload.observacoes_catequizandos = JSON.stringify({
          text: payload.observacoes_catequizandos || "",
          avaliacoes: payload.avaliacoes_catequizandos
        });
        delete payload.avaliacoes_catequizandos;
      }
      
      if (payload.evolucao_catequizandos !== undefined) {
        payload.evolucao_espiritual = JSON.stringify({
          text: payload.evolucao_espiritual || "",
          evolucoes: payload.evolucao_catequizandos
        });
        delete payload.evolucao_catequizandos;
      }

      const { data, error } = await supabase
        .from("diario_espiritual")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_espiritual", turmaId] });
      toast.success("Registro adicionado ao diário com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar diário:", error);
      toast.error("Erro ao adicionar registro ao diário.");
    },
  });

  const atualizarDiario = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<DiarioEspiritual, "id" | "user_id" | "criado_em">> }) => {
      const payload = { ...updates } as any;
      
      if (payload.avaliacoes_catequizandos !== undefined) {
        payload.observacoes_catequizandos = JSON.stringify({
          text: payload.observacoes_catequizandos || "",
          avaliacoes: payload.avaliacoes_catequizandos
        });
        delete payload.avaliacoes_catequizandos;
      }
      
      if (payload.evolucao_catequizandos !== undefined) {
        payload.evolucao_espiritual = JSON.stringify({
          text: payload.evolucao_espiritual || "",
          evolucoes: payload.evolucao_catequizandos
        });
        delete payload.evolucao_catequizandos;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_espiritual", turmaId] });
      toast.success("Registro atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar diário:", error);
      toast.error("Erro ao atualizar o registro.");
    },
  });

  const excluirDiario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("diario_espiritual").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario_espiritual", turmaId] });
      toast.success("Registro removido com sucesso!");
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
