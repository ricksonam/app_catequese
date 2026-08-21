import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const VAPID_PUBLIC_KEY = "BPiPtI4VumC6sx8V_y_T1N98aamBxtXm3SJBxJN1-8GAY_6sj5p59h6KnBxaUNZpuqpRJH3yX95OtudoEkWWI48";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [loading, setLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== "granted") {
        throw new Error("Permissão de notificação negada");
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Limpar assinatura antiga se houver
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();
      
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Formato de assinatura inválido");
      }

      // Ler preferências salvas localmente
      const preferences = {
        birthdays: localStorage.getItem("ivc_birthdays_enabled") !== "false",
        meetings: localStorage.getItem("ivc_meetings_enabled") !== "false",
        reunioes: localStorage.getItem("ivc_reunioes_enabled") !== "false",
      };

      // Salvar/atualizar no Supabase usando upsert por endpoint
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          preferences,
        },
        { onConflict: "endpoint" }
      );

      if (error) throw error;

      toast({
        title: "Notificações ativadas! 🎉",
        description: "Você receberá lembretes de encontros e aniversários no celular.",
      });
    } catch (error: any) {
      console.error("Erro ao assinar notificações:", error);
      toast({
        title: "Erro ao ativar notificações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza as preferências de notificação no Supabase sem refazer toda a assinatura.
   */
  const updatePreferences = async (prefs: {
    birthdays?: boolean;
    meetings?: boolean;
    reunioes?: boolean;
  }) => {
    if (!user) return;
    try {
      const registration = await navigator.serviceWorker?.ready;
      const existingSubscription = await registration?.pushManager?.getSubscription();
      if (!existingSubscription) return;

      await supabase
        .from("push_subscriptions")
        .update({ preferences: prefs })
        .eq("endpoint", existingSubscription.endpoint)
        .eq("user_id", user.id);
    } catch (err) {
      console.warn("[usePushNotifications] Erro ao atualizar preferências:", err);
    }
  };

  return {
    permission,
    subscribe,
    updatePreferences,
    loading,
  };
}
