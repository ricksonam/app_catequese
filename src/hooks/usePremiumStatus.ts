import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function usePremiumStatus() {
  const { user } = useAuth();

  const { data: premiumData, isLoading } = useQuery({
    queryKey: ["premium_status", user?.id],
    queryFn: async () => {
      if (!user) return { isPremium: false };

      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium, premium_expires_at, is_super_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) return { isPremium: false };

      // Super admins always have premium access
      if (data.is_super_admin) return { isPremium: true };

      // Manual override premium flag
      if (data.is_premium && !data.premium_expires_at) return { isPremium: true };

      // Check if premium hasn't expired yet
      if (data.is_premium && data.premium_expires_at) {
        const expiresAt = new Date(data.premium_expires_at);
        const now = new Date();
        if (expiresAt > now) {
          return { isPremium: true, expiresAt };
        } else {
          // Expirado! Podemos inclusive atualizar o banco aqui para is_premium: false 
          // no futuro, mas por hora o frontend já vai negar.
          return { isPremium: false, expired: true };
        }
      }

      return { isPremium: false };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  return {
    isPremium: premiumData?.isPremium ?? false,
    isLoading,
    expiresAt: premiumData?.expiresAt,
    isExpired: premiumData?.expired ?? false,
  };
}
