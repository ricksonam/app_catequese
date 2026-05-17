import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CHECKOUT_URL = "https://checkout.infinitepay.io/ricksonam/TmDHBX1ASB";

export function usePremium() {
  const { session } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const activationAttempted = useRef(false);

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

      const currentlyPremium =
        data?.is_premium &&
        (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());

      if (currentlyPremium) {
        setIsPremium(true);
        setLoading(false);
        return;
      }

      // Not premium yet — silently try to activate via any pending payment
      // This covers cases where the InfinitePay redirect didn't happen
      if (!activationAttempted.current && session.access_token) {
        activationAttempted.current = true;
        try {
          const result = await supabase.functions.invoke("activate-premium", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const resData = result.data as {
            success?: boolean;
            no_payment?: boolean;
          } | null;

          if (resData?.success) {
            setIsPremium(true);
            setLoading(false);
            return;
          }
        } catch {
          // Activation attempt failed silently — no-op
        }
      }

      setIsPremium(false);
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
  }, [session?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const redirectToPayment = () => {
    window.open(CHECKOUT_URL, "_blank");
  };

  return { isPremium, loading, redirectToPayment };
}
