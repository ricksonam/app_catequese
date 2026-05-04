import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Mail,
  Share2,
  ArrowLeft,
  X as XIcon,
  ChevronRight,
  Check,
} from "lucide-react";
import { ConsentModal } from "@/components/Onboarding/ConsentModal";
import { getAppUrl } from "@/lib/utils";

/* ─── tipos de view ─── */
type View = "login" | "signup" | "forgot";

const SAVED_EMAIL_KEY = "ivc_saved_email";



/* ──────────────────────────────────────────────
   AUTH PAGE PRINCIPAL
────────────────────────────────────────────── */
export default function AuthPage() {
  const { session, isReady } = useAuth();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>((searchParams.get("view") as View) || "login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) setSavedEmail(saved);
  }, []);

  // Redirect if already logged in
  if (isReady && session) return <Navigate to="/" replace />;

  /* ── handlers ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Check if configuration is missing
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
      toast({ 
        title: "Erro de Configuração", 
        description: "As chaves do Supabase não foram encontradas. Verifique as variáveis de ambiente no Vercel.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    const loginEmail = savedEmail || email;
    
    try {
      // Teste rápido de conectividade antes de tentar o auth pesado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, { 
          method: 'GET', 
          signal: controller.signal 
        }).catch(() => { /* ignora erro de rest, só queremos saber se o domínio responde */ });
      } finally {
        clearTimeout(timeoutId);
      }

      const { error } = await supabase.auth.signInWithPassword({ 
        email: loginEmail, 
        password 
      });

      if (error) {
        let msg = error.message;
        if (msg === "Failed to fetch") {
          msg = "O servidor do iCatequese não respondeu. Verifique se seu firewall ou antivírus não está bloqueando o domínio do Supabase.";
        } else if (msg.includes("Invalid login credentials") || msg.includes("Invalid credentials")) {
          msg = "Não conseguimos localizar seus dados em nosso sistema. Por favor, verifique se o e-mail e a senha estão corretos ou, se ainda não tem uma conta, convidamos você a realizar o seu cadastro.";
        }
        
        toast({ 
          title: "Não foi possível entrar", 
          description: msg, 
          variant: "destructive" 
        });
        setLoading(false);
      } else {
        localStorage.setItem(SAVED_EMAIL_KEY, loginEmail);
        // Successful login will be handled by the session listener in AuthContext
      }
    } catch (err: any) {
      console.error("[iCatequese] Login exception:", err);
      const isTimeout = err.name === "AbortError";
      const isNetworkError = err.message === "Failed to fetch" || err.name === "TypeError";
      
      toast({ 
        title: "Erro de Conexão", 
        description: isTimeout 
          ? "A conexão demorou demais. Sua internet pode estar muito lenta no momento."
          : (isNetworkError 
              ? "Falha total na rede. O navegador não conseguiu alcançar o servidor do banco de dados."
              : "Ocorreu um erro inesperado ao tentar entrar."),
        variant: "destructive" 
      });
      setLoading(false);
    }
  };

  const handleClearSavedEmail = () => {
    localStorage.removeItem(SAVED_EMAIL_KEY);
    setSavedEmail(null);
    setEmail("");
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setShowConsentModal(true);
  };

  const handleSignupConfirm = async () => {
    setShowConsentModal(false);
    setLoading(true);
    localStorage.removeItem("ivc_onboarding_completed");
    localStorage.removeItem("ivc_terms_accepted");
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: getAppUrl(),
        data: { full_name: signupName, terms_accepted: true },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastro realizado! 🎉", description: "Verifique seu email para confirmar a conta." });
      setView("login");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast({ title: "Erro", description: "Digite seu email", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${getAppUrl()}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setView("login");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "iCatequese",
          text: "Conheça o iCatequese – o sistema completo de gestão para a catequese!",
          url: getAppUrl(),
        });
      } catch {
        // ignored
      }
    } else {
      navigator.clipboard.writeText(getAppUrl());
      toast({ title: "Link copiado!", description: "Compartilhe com seus colegas catequistas." });
    }
  };



  /* ──────────────────────────────────────────────
     LOGIN VIEW
  ────────────────────────────────────────────── */
  if (view === "login") {
    return (
      <div className="min-h-screen flex flex-col bg-sky-50 relative overflow-hidden">
        {/* Fundo suave */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-sky-50 to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Back */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-primary text-sm font-bold mb-8 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar à Home
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white mx-auto mb-4 shadow-xl shadow-primary/10 border border-primary/20">
                <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Bem-vindo de volta!</h2>
              <p className="text-slate-500 text-sm font-medium">Entre com sua conta para continuar</p>
            </div>

            {/* Email salvo chip */}
            {savedEmail && (
              <div className="mb-4 p-3 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-primary/70 font-black uppercase tracking-wide">Conta salva</p>
                  <p className="text-sm text-slate-800 font-bold truncate">{savedEmail}</p>
                </div>
                <button
                  onClick={handleClearSavedEmail}
                  className="text-slate-300 hover:text-slate-500 transition-colors"
                  title="Usar outra conta"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email – só mostra se não tiver salvo */}
              {!savedEmail && (
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-sm font-bold ml-1">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-bold ml-1">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setView("forgot")}
                className="text-primary text-xs font-bold hover:underline transition-colors w-full text-right"
              >
                Esqueci minha senha
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Entrar
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <span className="text-slate-400 text-sm font-medium">Não tem conta? </span>
              <button
                onClick={() => setView("signup")}
                className="text-primary font-bold text-sm hover:underline transition-colors"
              >
                Cadastre-se
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     SIGNUP VIEW
  ────────────────────────────────────────────── */
  if (view === "signup") {
    return (
      <div className="min-h-screen flex flex-col bg-sky-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-sky-50 to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <ConsentModal
          open={showConsentModal}
          onAccept={handleSignupConfirm}
          onCancel={() => setShowConsentModal(false)}
          isSignup
        />

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Back */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-primary text-sm font-bold mb-8 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar à Home
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white mx-auto mb-4 shadow-xl shadow-primary/10 border border-primary/20">
                <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Criar sua conta</h2>
              <p className="text-slate-500 text-sm font-medium">Junte-se à comunidade iCatequese</p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-bold ml-1">Nome Completo</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-bold ml-1">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-bold ml-1">Senha</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    required
                    className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-bold ml-1">Confirmar Senha</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm"
                />
              </div>

              <p className="text-slate-400 text-xs text-center px-2 font-medium">
                Ao cadastrar, você será solicitado a aceitar nossos <span className="text-primary font-bold">Termos de Uso</span>.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Cadastrar
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <span className="text-slate-400 text-sm font-medium">Já tem conta? </span>
              <button
                onClick={() => setView("login")}
                className="text-primary font-bold text-sm hover:underline transition-colors"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     FORGOT PASSWORD VIEW
  ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-sky-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-sky-50 to-white pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-10">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setView("login")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-primary text-sm font-bold mb-8 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao login
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">Recuperar Senha</h2>
            <p className="text-slate-500 text-sm font-medium">Enviaremos um link para o seu email</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-slate-600 text-sm font-bold ml-1">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Enviar Link de Recuperação"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
