// Premium removido: todos os usuários têm acesso total
export function usePremiumStatus() {
  return {
    isPremium: true,
    isLoading: false,
    expiresAt: undefined,
    isExpired: false,
    refetch: () => {},
  };
}
