import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/errorLogger";
import { toast } from "sonner";
import { BlockedUserModal } from "@/components/Onboarding/BlockedUserModal";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isReady: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSubAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isReady: false,
  isAdmin: false,
  isSuperAdmin: false,
  isSubAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Timeout de segurança: se a auth não responder em 8s, libera o app
const AUTH_TIMEOUT_MS = 8000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const initialized = useRef(false);
  const resolved = useRef(false);

  const handleSession = async (s: Session | null) => {
    let subAdminActive = false;
    let subAdminPaused = false;
    let subAdminRevoked = false;

    if (s?.user) {
      try {
        // Verificar se o usuário está bloqueado ou é sub-admin
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("is_blocked, motivo_bloqueio, role, sub_admin_status")
          .eq("id", s.user.id)
          .maybeSingle();

        if (error) {
          console.error("[iCatequese] Erro ao verificar status do perfil:", error);
        } else if (profile) {
          if (profile.is_blocked) {
            console.warn("[iCatequese] Usuário bloqueado tentou acessar:", s.user.email);
            
            setBlockedReason(profile.motivo_bloqueio || "Violação dos termos de uso da plataforma.");
            setIsBlockedModalOpen(true);
            
            if (!resolved.current) {
              resolved.current = true;
              setLoading(false);
              setIsReady(true);
            }
            return;
          }

          if (profile.role === "sub_admin") {
            if (profile.sub_admin_status === "paused") {
              subAdminPaused = true;
            } else if (profile.sub_admin_status === "revoked") {
              subAdminRevoked = true;
            } else if (profile.sub_admin_status === "active") {
              subAdminActive = true;
            }
          }
        }
      } catch (err) {
        console.error("[iCatequese] Exceção ao verificar status do perfil:", err);
      }
    }

    if (subAdminPaused) {
      toast.error("Seu acesso como administrador está pausado temporariamente.");
      setSession(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsSubAdmin(false);
      setTimeout(() => supabase.auth.signOut(), 500);
      if (!resolved.current) {
        resolved.current = true;
        setLoading(false);
        setIsReady(true);
      }
      return;
    }

    if (subAdminRevoked) {
      toast.error("Seu acesso como administrador foi revogado pelo super-admin.");
      setSession(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsSubAdmin(false);
      setTimeout(() => supabase.auth.signOut(), 500);
      if (!resolved.current) {
        resolved.current = true;
        setLoading(false);
        setIsReady(true);
      }
      return;
    }

    const superAdmin = s?.user?.email === "icatequese2026@gmail.com";
    
    setIsSuperAdmin(superAdmin);
    setIsSubAdmin(subAdminActive);
    setIsAdmin(superAdmin || subAdminActive);
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
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[iCatequese] Erro ao deslogar no servidor:", err);
    } finally {
      setSession(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsSubAdmin(false);
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("ivc_saved_email");
      localStorage.removeItem("ivc_onboarding_completed");
      localStorage.removeItem("ivc_terms_accepted");
    }
  };

  // Subscription para monitorar bloqueio e status do sub_admin em tempo real
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
            setBlockedReason(payload.new.motivo_bloqueio || "Acesso negado pela administração.");
            setIsBlockedModalOpen(true);
          }
          
          if (payload.new.role === "sub_admin") {
            if (payload.new.sub_admin_status === "paused") {
              toast.error("Seu acesso como administrador foi pausado.");
              signOut();
            } else if (payload.new.sub_admin_status === "revoked") {
              toast.error("Seu acesso como administrador foi revogado.");
              signOut();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isReady, isAdmin, isSuperAdmin, isSubAdmin, signOut }}>
      {children}
      <BlockedUserModal 
        open={isBlockedModalOpen} 
        reason={blockedReason}
        onClose={() => {
          setIsBlockedModalOpen(false);
          signOut();
        }}
      />
    </AuthContext.Provider>
  );
}
