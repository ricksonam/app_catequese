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

      return data as (DiarioEspiritual & { encontros: { id: string; tema: string } | null })[];
    },
    enabled: !!turmaId && !!session,
  });

  const criarDiario = useMutation({
    mutationFn: async (novoDiario: Omit<DiarioEspiritual, "id" | "user_id" | "criado_em">) => {
      const { data, error } = await supabase
        .from("diario_espiritual")
        .insert([{ ...novoDiario, user_id: session?.user.id }])
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
      const { data, error } = await supabase
        .from("diario_espiritual")
        .update(updates)
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
