import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CHECKOUT_URL = "https://checkout.infinitepay.io/ricksonam/2VEWnyvl5h";

export function usePremium() {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("is_premium, premium_expires_at")
        .eq("id", session.user.id)
        .maybeSingle();

      const currentlyPremium = data?.is_premium && 
        (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());

      setIsPremium(!!currentlyPremium);
      setLoading(false);
    };

    fetchStatus();

    // Listen for real-time premium activation
    const channel = supabase
      .channel(`premium-check-${session.user.id}`)
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
            }
          } else {
            setIsPremium(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  const redirectToPayment = () => {
    window.open(CHECKOUT_URL, "_blank");
  };

  return { isPremium, loading, redirectToPayment };
}
