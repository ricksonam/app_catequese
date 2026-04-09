import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTurmas, upsertTurma, removeTurma,
  fetchCatequizandos, upsertCatequizando, removeCatequizando,
  fetchEncontros, upsertEncontro, removeEncontro,
  fetchAtividades, upsertAtividade, removeAtividade,
  fetchParoquias, upsertParoquia, removeParoquia,
  fetchComunidades, upsertComunidade, removeComunidade,
  fetchCatequistas, upsertCatequista, removeCatequista,
  fetchOcorrencias, insertOcorrencia, removeOcorrencia,
  fetchCalendarioNotas, upsertCalendarioNota, removeCalendarioNota,
  fetchMuralFotos, upsertMuralFoto, removeMuralFoto,
  fetchCitacoes, fetchHistoricoCitacoes, saveSorteioHistorico,
  fetchBingoModelos,
} from "@/lib/supabaseStore";
import type { Turma, Catequizando, Encontro, Atividade, Paroquia, Comunidade, CatequistaCadastro, RegistroOcorrencia, MuralFoto, CitacaoBiblica, HistoricoSorteioCitacao, BingoModelo } from "@/lib/store";

// ===== TURMAS =====
export function useTurmas() {
  return useQuery({ queryKey: ["turmas"], queryFn: fetchTurmas });
}
export function useTurmaMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertTurma, onSuccess: () => { qc.invalidateQueries({ queryKey: ["turmas"] }); } });
}
export function useDeleteTurma() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeTurma, onSuccess: () => { qc.invalidateQueries({ queryKey: ["turmas"] }); } });
}

// ===== CATEQUIZANDOS =====
export function useCatequizandos(turmaId?: string) {
  return useQuery({ queryKey: ["catequizandos", turmaId], queryFn: () => fetchCatequizandos(turmaId) });
}
export function useCatequizandoMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertCatequizando, onSuccess: () => { qc.invalidateQueries({ queryKey: ["catequizandos"] }); } });
}
export function useDeleteCatequizando() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeCatequizando, onSuccess: () => { qc.invalidateQueries({ queryKey: ["catequizandos"] }); } });
}

// ===== ENCONTROS =====
export function useEncontros(turmaId?: string) {
  return useQuery({ queryKey: ["encontros", turmaId], queryFn: () => fetchEncontros(turmaId) });
}
export function useEncontroMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertEncontro, onSuccess: () => { qc.invalidateQueries({ queryKey: ["encontros"] }); } });
}
export function useDeleteEncontro() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeEncontro, onSuccess: () => { qc.invalidateQueries({ queryKey: ["encontros"] }); } });
}

// ===== ATIVIDADES =====
export function useAtividades(turmaId?: string) {
  return useQuery({ queryKey: ["atividades", turmaId], queryFn: () => fetchAtividades(turmaId) });
}
export function useAtividadeMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertAtividade, onSuccess: () => { qc.invalidateQueries({ queryKey: ["atividades"] }); } });
}
export function useDeleteAtividade() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeAtividade, onSuccess: () => { qc.invalidateQueries({ queryKey: ["atividades"] }); } });
}

// ===== PAROQUIAS =====
export function useParoquias() {
  return useQuery({ queryKey: ["paroquias"], queryFn: fetchParoquias });
}
export function useParoquiaMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertParoquia, onSuccess: () => { qc.invalidateQueries({ queryKey: ["paroquias"] }); } });
}
export function useDeleteParoquia() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeParoquia, onSuccess: () => { qc.invalidateQueries({ queryKey: ["paroquias"] }); } });
}

// ===== COMUNIDADES =====
export function useComunidades() {
  return useQuery({ queryKey: ["comunidades"], queryFn: fetchComunidades });
}
export function useComunidadeMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertComunidade, onSuccess: () => { qc.invalidateQueries({ queryKey: ["comunidades"] }); } });
}
export function useDeleteComunidade() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeComunidade, onSuccess: () => { qc.invalidateQueries({ queryKey: ["comunidades"] }); } });
}

// ===== CATEQUISTAS =====
export function useCatequistas() {
  return useQuery({ queryKey: ["catequistas"], queryFn: fetchCatequistas });
}
export function useCatequistaMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertCatequista, onSuccess: () => { qc.invalidateQueries({ queryKey: ["catequistas"] }); } });
}
export function useDeleteCatequista() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeCatequista, onSuccess: () => { qc.invalidateQueries({ queryKey: ["catequistas"] }); } });
}

// ===== OCORRENCIAS =====
export function useOcorrencias(turmaId?: string) {
  return useQuery({ queryKey: ["ocorrencias", turmaId], queryFn: () => fetchOcorrencias(turmaId) });
}
export function useOcorrenciaMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: insertOcorrencia, onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); } });
}
export function useDeleteOcorrencia() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeOcorrencia, onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); } });
}

// ===== CALENDARIO NOTAS =====
export function useCalendarioNotas() {
  return useQuery({ queryKey: ["calendario_notas"], queryFn: fetchCalendarioNotas });
}
export function useCalendarioNotaMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertCalendarioNota, onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendario_notas"] }); } });
}
export function useDeleteCalendarioNota() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeCalendarioNota, onSuccess: () => { qc.invalidateQueries({ queryKey: ["calendario_notas"] }); } });
}

// ===== MURAL FOTOS =====
export function useMuralFotos() {
  return useQuery({ queryKey: ["mural_fotos"], queryFn: fetchMuralFotos });
}
export function useMuralFotoMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertMuralFoto, onSuccess: () => { qc.invalidateQueries({ queryKey: ["mural_fotos"] }); } });
}
export function useDeleteMuralFoto() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeMuralFoto, onSuccess: () => { qc.invalidateQueries({ queryKey: ["mural_fotos"] }); } });
}

// ===== CITACOES BIBLICAS =====
export function useCitacoes() {
  return useQuery({ queryKey: ["citacoes_biblicas"], queryFn: fetchCitacoes });
}

export function useHistoricoCitacoes(turmaId?: string) {
  return useQuery({ 
    queryKey: ["sorteios_historico", turmaId], 
    queryFn: () => fetchHistoricoCitacoes(turmaId) 
  });
}

export function useSaveHistoricoCitacao() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: saveSorteioHistorico, 
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sorteios_historico"] }); } 
  });
}

// ===== BINGO BÍBLICO =====
export function useBingoModelos() {
  return useQuery({ queryKey: ["bingo_modelos"], queryFn: fetchBingoModelos });
}
