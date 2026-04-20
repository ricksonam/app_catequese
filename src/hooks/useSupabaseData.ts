import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTurmas, upsertTurma, removeTurma, joinTurmaByCode, leaveTurma,
  fetchTurmaMembros, removeTurmaMembro,
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
  fetchBingoModelos, fetchMissoesFamilia,
  fetchComunicacaoForms, fetchPublicComunicacaoForm, upsertComunicacaoForm, removeComunicacaoForm,
  fetchComunicacaoRespostas, insertComunicacaoResposta
} from "@/lib/supabaseStore";
import type { Turma, Catequizando, Encontro, Atividade, Paroquia, Comunidade, CatequistaCadastro, RegistroOcorrencia, MuralFoto, CitacaoBiblica, HistoricoSorteioCitacao, BingoModelo, MissaoFamilia, ComunicacaoForm, ComunicacaoResposta } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";

// ===== TURMAS =====
export function useTurmas() {
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["turmas", user?.id], 
    queryFn: () => fetchTurmas(user?.id),
    enabled: !!user
  });
}
export function useTurmaMutation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: upsertTurma, onSuccess: () => { qc.invalidateQueries({ queryKey: ["turmas"] }); } });
}
export function useDeleteTurma() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: removeTurma, onSuccess: () => { qc.invalidateQueries({ queryKey: ["turmas"] }); } });
}
export function useJoinTurma() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: joinTurmaByCode, onSuccess: () => { qc.invalidateQueries({ queryKey: ["turmas"] }); } });
}
export function useLeaveTurma() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: leaveTurma, onSuccess: () => { qc.invalidateQueries({ queryKey: ["turmas"] }); } });
}
export function useTurmaMembros(turmaId: string) {
  return useQuery({ queryKey: ["turma_membros", turmaId], queryFn: () => fetchTurmaMembros(turmaId), enabled: !!turmaId });
}
export function useRemoveTurmaMembro() {
  const qc = useQueryClient();
  return useMutation({ 
    mutationFn: ({ turmaId, userId }: { turmaId: string, userId: string }) => removeTurmaMembro(turmaId, userId), 
    onSuccess: (_, variables) => { qc.invalidateQueries({ queryKey: ["turma_membros", variables.turmaId] }); } 
  });
}

// ===== CATEQUIZANDOS =====
export function useCatequizandos(turmaId?: string) {
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["catequizandos", user?.id, turmaId], 
    queryFn: () => fetchCatequizandos(turmaId),
    enabled: !!user 
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["encontros", user?.id, turmaId], 
    queryFn: () => fetchEncontros(turmaId),
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["atividades", user?.id, turmaId], 
    queryFn: () => fetchAtividades(turmaId),
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["paroquias", user?.id], 
    queryFn: fetchParoquias,
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["comunidades", user?.id], 
    queryFn: fetchComunidades,
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["catequistas", user?.id], 
    queryFn: fetchCatequistas,
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["ocorrencias", user?.id, turmaId], 
    queryFn: () => fetchOcorrencias(turmaId),
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["calendario_notas", user?.id], 
    queryFn: fetchCalendarioNotas,
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["mural_fotos", user?.id], 
    queryFn: fetchMuralFotos,
    enabled: !!user
  });
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
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["citacoes_biblicas", user?.id], 
    queryFn: fetchCitacoes,
    enabled: !!user
  });
}

export function useHistoricoCitacoes(turmaId?: string) {
  const { user } = useAuth();
  return useQuery({ 
    queryKey: ["sorteios_historico", user?.id, turmaId], 
    queryFn: () => fetchHistoricoCitacoes(turmaId),
    enabled: !!user
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

export function useMissoesFamilia(turmaId?: string) {
  return useQuery({
    queryKey: ["missoesFamilia", turmaId],
    queryFn: () => fetchMissoesFamilia(turmaId),
  });
}

// ===== COMUNICAÇÃO =====
export function useComunicacaoForms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["comunicacao_forms", user?.id],
    queryFn: () => fetchComunicacaoForms(),
    enabled: !!user
  });
}

export function usePublicComunicacaoForm(codigoAcesso: string) {
  return useQuery({
    queryKey: ["public_comunicacao_form", codigoAcesso],
    queryFn: () => fetchPublicComunicacaoForm(codigoAcesso),
    enabled: !!codigoAcesso
  });
}

export function useComunicacaoFormMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: upsertComunicacaoForm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comunicacao_forms", user?.id] })
  });
}

export function useDeleteComunicacaoForm() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: removeComunicacaoForm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comunicacao_forms", user?.id] })
  });
}

export function useComunicacaoRespostas(formId: string) {
  return useQuery({
    queryKey: ["comunicacao_respostas", formId],
    queryFn: () => fetchComunicacaoRespostas(formId),
    enabled: !!formId
  });
}

export function useComunicacaoRespostaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: insertComunicacaoResposta,
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ["comunicacao_respostas", variables.form_id] })
  });
}

