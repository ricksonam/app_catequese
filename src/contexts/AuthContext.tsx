import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isReady: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isReady: false,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Timeout de segurança: se a auth não responder em 8s, libera o app
const AUTH_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const initialized = useRef(false);
  const resolved = useRef(false);

  const handleSession = async (s: Session | null) => {
    if (s?.user) {
      try {
        // Verificar se o usuário está bloqueado
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_blocked, motivo_bloqueio")
          .eq("id", s.user.id)
          .maybeSingle();

        if (error) {
          console.error("[iCatequese] Erro ao verificar status do perfil:", error);
        } else if (profile?.is_blocked) {
          console.warn("[iCatequese] Usuário bloqueado tentou acessar:", s.user.email);
          
          // Mostrar mensagem de erro
          toast.error("Acesso Negado", {
            description: profile.motivo_bloqueio || "Sua conta foi suspensa por violação dos termos de uso.",
            duration: 6000,
          });
          
          // Desloga imediatamente no servidor e localmente
          await supabase.auth.signOut();
          setSession(null);
          
          // Resolve o estado de loading para não travar a tela
          if (!resolved.current) {
            resolved.current = true;
            setLoading(false);
            setIsReady(true);
          }
          return;
        }
      } catch (err) {
        console.error("[iCatequese] Exceção ao verificar status do perfil:", err);
      }
    }

    setSession(s);
    if (!resolved.current) {
      resolved.current = true;
      setLoading(false);
      setIsReady(true);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Timeout de segurança: força loading=false após AUTH_TIMEOUT_MS
    const safetyTimeout = setTimeout(() => {
      if (!resolved.current) {
        console.warn("[iCatequese] Auth timeout atingido. Liberando app sem sessão.");
        handleSession(null);
      }
    }, AUTH_TIMEOUT_MS);

    // Set up listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    // Then restore session from storage
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        handleSession(session);
      })
      .catch((err) => {
        console.error("[iCatequese] Erro ao recuperar sessão:", err);
        logError("auth_error", err instanceof Error ? err : new Error(String(err)));
        handleSession(null);
      });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Tenta deslogar no servidor
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[iCatequese] Erro ao deslogar no servidor:", err);
    } finally {
      // SEMPRE limpa o estado local para não travar o usuário
      setSession(null);
      // Opcional: Limpar localStorage manualmente se o supabase.auth não o fizer
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("ivc_saved_email");
      localStorage.removeItem("ivc_onboarding_completed");
      localStorage.removeItem("ivc_terms_accepted");
    }
  };

  const isAdmin = session?.user?.email === "icatequese2026@gmail.com";

  // Subscription para monitorar bloqueio em tempo real
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`profile-block-check-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${session.user.id}`
        },
        (payload) => {
          console.log("[iCatequese] Mudança de perfil detectada via Realtime:", payload);
          if (payload.new.is_blocked) {
            console.warn("[iCatequese] Usuário bloqueado em tempo real!");
            
            // Mostrar toast e deslogar
            toast.error("Sua conta foi suspensa", {
              description: `${payload.new.motivo_bloqueio || "Acesso negado pela administração."} Para suporte, entre em contato: ricksonam@hotmail.com`,
              duration: 10000,
            });
            
            // Força deslogar
            signOut();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isReady, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
