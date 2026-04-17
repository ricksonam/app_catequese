import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isReady: false,
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

  const resolve = (s: Session | null) => {
    if (resolved.current) return; // Evita dupla resolução
    resolved.current = true;
    setSession(s);
    setLoading(false);
    setIsReady(true);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Timeout de segurança: força loading=false após AUTH_TIMEOUT_MS
    const safetyTimeout = setTimeout(() => {
      if (!resolved.current) {
        console.warn("[iCatequese] Auth timeout atingido. Liberando app sem sessão.");
        resolve(null);
      }
    }, AUTH_TIMEOUT_MS);

    // Set up listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        resolve(session);
      }
    );

    // Then restore session from storage
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        resolve(session);
      })
      .catch((err) => {
        console.error("[iCatequese] Erro ao recuperar sessão:", err);
        resolve(null);
      });

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isReady, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
