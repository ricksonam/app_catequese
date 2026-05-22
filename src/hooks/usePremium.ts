import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CHECKOUT_URL = "https://checkout.infinitepay.io/ricksonam/slM0QzodpZ";

export function usePremium() {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsPremium(false);
      setPremiumExpiresAt(null);
      setUserName(null);
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);

      // Busca nome do usuário
      let resolvedName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        "";

      if (!resolvedName) {
        try {
          const { data: catequista } = await supabase
            .from("catequistas")
            .select("nome")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (catequista?.nome) resolvedName = catequista.nome;
        } catch {
          // silencioso
        }
      }

      setUserName(resolvedName || null);

      // Busca status premium do perfil
      const { data } = await supabase
        .from("profiles")
        .select("is_premium, premium_expires_at")
        .eq("id", session.user.id)
        .maybeSingle();

      const currentlyPremium =
        data?.is_premium &&
        (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());

      setIsPremium(!!currentlyPremium);
      setPremiumExpiresAt(data?.premium_expires_at || null);
      setLoading(false);
    };

    fetchStatus();

    // Listener em tempo real — premium ativado pelo webhook ou admin
    const channelName = `premium-check-${session.user.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          if (payload.new.is_premium) {
            const exp = payload.new.premium_expires_at;
            if (!exp || new Date(exp) > new Date()) {
              setIsPremium(true);
              setPremiumExpiresAt(exp || null);
            }
          } else {
            setIsPremium(false);
            setPremiumExpiresAt(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const redirectToPayment = () => {
    const email = session?.user?.email || "";
    const name = userName || "";

    const emailParam = email
      ? `&email=${encodeURIComponent(email)}&customer_email=${encodeURIComponent(email)}`
      : "";
    const nameParam = name
      ? `&name=${encodeURIComponent(name)}&customer_name=${encodeURIComponent(name)}`
      : "";

    const finalUrl = `${CHECKOUT_URL}?utm_source=app${emailParam}${nameParam}`;
    window.open(finalUrl, "_blank");
  };

  const redeemPromoCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!session?.access_token) {
      return { success: false, error: "Você precisa estar logado para usar um código promocional." };
    }

    try {
      const result = await supabase.functions.invoke("redeem-promo-code", {
        body: { code },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (result.error) {
        return { success: false, error: result.error.message || "Erro ao resgatar código." };
      }

      const data = result.data as { success?: boolean; error?: string; expires_at?: string };

      if (data?.error) {
        return { success: false, error: data.error };
      }

      if (data?.success) {
        setIsPremium(true);
        if (data.expires_at) setPremiumExpiresAt(data.expires_at);
        return { success: true };
      }

      return { success: false, error: "Resposta inesperada do servidor." };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro ao conectar ao servidor." };
    }
  };

  return { isPremium, premiumExpiresAt, userName, loading, redirectToPayment, redeemPromoCode };
}
