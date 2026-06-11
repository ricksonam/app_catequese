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

  const resolveAuth = (s: Session | null) => {
    if (!resolved.current) {
      resolved.current = true;
      setLoading(false);
      setIsReady(true);
    }
    setSession(s);
  };

  const handleSession = async (s: Session | null) => {
    if (!s?.user) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsSubAdmin(false);
      resolveAuth(null);
      return;
    }

    try {
      // Verificar perfil completo: bloqueio + role via RPC server-side
      // get_my_role() usa SECURITY DEFINER — nenhum dado sensível exposto no bundle
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("is_blocked, motivo_bloqueio")
          .eq("id", s.user.id)
          .maybeSingle(),
        supabase.rpc("get_my_role" as any),
      ]);

      // Verificar bloqueio
      if (profileResult.data?.is_blocked) {
        console.warn("[iCatequese] Usuário bloqueado tentou acessar:", s.user.email);
        setBlockedReason(profileResult.data.motivo_bloqueio || "Violação dos termos de uso da plataforma.");
        setIsBlockedModalOpen(true);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsSubAdmin(false);
        resolveAuth(null);
        return;
      }

      // Extrair roles do servidor — sem e-mail hard-coded
      const roleData = roleResult.data as {
        role: string;
        is_super_admin: boolean;
        is_admin: boolean;
        sub_admin_status: string | null;
      } | null;

      const superAdmin = roleData?.is_super_admin ?? false;
      const subAdminStatus = roleData?.sub_admin_status ?? null;
      const subAdminActive = roleData?.role === "sub_admin" && subAdminStatus === "active";
      const subAdminPaused = roleData?.role === "sub_admin" && subAdminStatus === "paused";
      const subAdminRevoked = roleData?.role === "sub_admin" && subAdminStatus === "revoked";

      if (subAdminPaused) {
        toast.error("Seu acesso como administrador está pausado temporariamente.");
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsSubAdmin(false);
        resolveAuth(null);
        setTimeout(() => supabase.auth.signOut(), 500);
        return;
      }

      if (subAdminRevoked) {
        toast.error("Seu acesso como administrador foi revogado pelo super-admin.");
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsSubAdmin(false);
        resolveAuth(null);
        setTimeout(() => supabase.auth.signOut(), 500);
        return;
      }

      setIsSuperAdmin(superAdmin);
      setIsSubAdmin(subAdminActive);
      setIsAdmin(superAdmin || subAdminActive);
      resolveAuth(s);
    } catch (err) {
      console.error("[iCatequese] Erro ao verificar sessão:", err);
      logError("auth_error", err instanceof Error ? err : new Error(String(err)));
      // Em caso de erro, libera o app sem admin
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setIsSubAdmin(false);
      resolveAuth(s);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Timeout de segurança: força loading=false após AUTH_TIMEOUT_MS
    const safetyTimeout = setTimeout(() => {
      if (!resolved.current) {
        console.warn("[iCatequese] Auth timeout atingido. Liberando app sem sessão.");
        resolveAuth(null);
      }
    }, AUTH_TIMEOUT_MS);

    // Configurar listener PRIMEIRO (antes do getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        handleSession(s);
      }
    );

    // Restaurar sessão do storage
    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        handleSession(s);
      })
      .catch((err) => {
        console.error("[iCatequese] Erro ao recuperar sessão:", err);
        logError("auth_error", err instanceof Error ? err : new Error(String(err)));
        resolveAuth(null);
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

  // Realtime: monitorar bloqueio e mudança de status do sub_admin
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`profile-block-check-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${session.user.id}`,
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
