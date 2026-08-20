import {
  upsertCatequizando, removeCatequizando,
  upsertEncontro, removeEncontro,
  upsertAtividade, removeAtividade,
  upsertReuniao, removeReuniao,
  insertOcorrencia, removeOcorrencia,
  upsertCalendarioNota, removeCalendarioNota,
} from "./supabaseStore";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registro de operações por tipo.
 * Cada entrada mapeia uma string de tipo → função assíncrona do Supabase.
 * As entradas da fila (QueuedOperation) armazenam apenas o tipo e os argumentos,
 * e este registro resolve de volta para a função real na hora de sincronizar.
 */
export const mutationRegistry: Record<string, (args: any) => Promise<any>> = {
  // ─── Catequizandos ───────────────────────────────────────────────────────
  upsertCatequizando,
  removeCatequizando: ({ id, motivo }: { id: string; motivo?: string }) =>
    removeCatequizando(id, motivo),

  // ─── Encontros ───────────────────────────────────────────────────────────
  upsertEncontro,
  removeEncontro,

  // ─── Atividades ──────────────────────────────────────────────────────────
  upsertAtividade,
  removeAtividade,

  // ─── Reuniões ────────────────────────────────────────────────────────────
  upsertReuniao,
  removeReuniao,

  // ─── Ocorrências ─────────────────────────────────────────────────────────
  insertOcorrencia,
  removeOcorrencia,

  // ─── Calendário / Notas ──────────────────────────────────────────────────
  upsertCalendarioNota,
  removeCalendarioNota,

  // ─── Diário Espiritual ───────────────────────────────────────────────────
  createDiario: async (args: any) => {
    const { data, error } = await supabase
      .from("diario_espiritual")
      .insert([args])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  updateDiario: async ({ id, updates }: { id: string; updates: any }) => {
    const { data, error } = await supabase
      .from("diario_espiritual")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  deleteDiario: async (id: string) => {
    const { error } = await supabase
      .from("diario_espiritual")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
