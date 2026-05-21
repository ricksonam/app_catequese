import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CHECKOUT_URL = "https://checkout.infinitepay.io/ricksonam/ZxTPX7T4in";

export function usePremium() {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const activationAttempted = useRef(false);

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
      
      // Get user name from auth metadata
      let resolvedName = session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name || 
                         "";

      // If not in metadata, fetch from catequistas table
      if (!resolvedName) {
        try {
          const { data: catequista } = await supabase
            .from("catequistas")
            .select("nome")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (catequista?.nome) {
            resolvedName = catequista.nome;
          }
        } catch {
          // Silent catch
        }
      }

      setUserName(resolvedName || null);

      const { data } = await supabase
        .from("profiles")
        .select("is_premium, premium_expires_at")
        .eq("id", session.user.id)
        .maybeSingle();

      const currentlyPremium =
        data?.is_premium &&
        (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());

      if (currentlyPremium) {
        setIsPremium(true);
        setPremiumExpiresAt(data?.premium_expires_at || null);
        setLoading(false);
        return;
      }

      // Not premium yet — silently try to activate via any pending payment
      // This covers cases where the InfinitePay redirect didn't happen
      if (!activationAttempted.current && session.access_token) {
        activationAttempted.current = true;
        try {
          const result = await supabase.functions.invoke("activate-premium", {
            body: { token: session.access_token },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const resData = result.data as {
            success?: boolean;
            no_payment?: boolean;
            expires_at?: string;
          } | null;

          if (resData?.success) {
            setIsPremium(true);
            setPremiumExpiresAt(resData.expires_at || null);
            setLoading(false);
            return;
          }
        } catch {
          // Activation attempt failed silently — no-op
        }
      }

      setIsPremium(false);
      setPremiumExpiresAt(null);
      setLoading(false);
    };

    fetchStatus();

    // Listen for real-time premium activation (e.g. manual admin activation)
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

  const redirectToPayment = async () => {
    if (!session?.user) {
      window.open(CHECKOUT_URL, "_blank");
      return;
    }

    // ✅ CRITICAL: Register payment intent timestamp BEFORE opening checkout.
    // InfinitePay PIX webhooks don't include customer email or redirect the user,
    // so the webhook uses this timestamp to find who just clicked "pay".
    try {
      await supabase
        .from("profiles")
        .update({ pending_premium_at: new Date().toISOString() })
        .eq("id", session.user.id);
    } catch {
      // Non-blocking — still open checkout even if this fails
    }

    const email = session.user.email || "";
    const name = userName || "";

    const emailParam = email ? `&email=${encodeURIComponent(email)}&customer_email=${encodeURIComponent(email)}&buyer_email=${encodeURIComponent(email)}` : "";
    const nameParam = name ? `&name=${encodeURIComponent(name)}&customer_name=${encodeURIComponent(name)}&buyer_name=${encodeURIComponent(name)}` : "";
    
    // Construct final payment URL with robust prefilled query parameters
    const finalUrl = `${CHECKOUT_URL}?utm_source=app${emailParam}${nameParam}`;
    window.open(finalUrl, "_blank");
  };

  return { isPremium, premiumExpiresAt, userName, loading, redirectToPayment };
}
