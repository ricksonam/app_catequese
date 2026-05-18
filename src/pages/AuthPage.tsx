import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
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
  User,
  Lock,
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
  const navigate = useNavigate();
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
  const [signupConfirmEmail, setSignupConfirmEmail] = useState("");
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
    if (signupEmail !== signupConfirmEmail) {
      toast({ title: "Erro de digitação", description: "Os e-mails informados não coincidem. Por favor, verifique-os.", variant: "destructive" });
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast({ title: "Erro de segurança", description: "As senhas digitadas não coincidem. Certifique-se de que são iguais.", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: "Senha fraca", description: "A senha deve ter pelo menos 6 caracteres para sua proteção.", variant: "destructive" });
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAppUrl(),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ 
        title: "Erro ao entrar com Google", 
        description: err.message, 
        variant: "destructive" 
      });
      setLoading(false);
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

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-13 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Entrar com Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-sky-50 px-2 text-slate-400 font-bold tracking-widest">Ou use seu e-mail</span>
              </div>
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

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-13 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Cadastrar com Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-sky-50 px-2 text-slate-400 font-bold tracking-widest">Ou use seu e-mail</span>
              </div>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-6">
              
              {/* Seção 1: Identificação */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-100/40 dark:shadow-none space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                    <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Seus Dados Pessoais</h3>
                </div>

                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs font-bold ml-1">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 h-4 w-4" />
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Ex: Maria de Souza"
                      required
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary pl-12 h-12 rounded-2xl shadow-sm text-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs font-bold ml-1">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 h-4 w-4" />
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary pl-12 h-12 rounded-2xl shadow-sm text-sm"
                    />
                  </div>
                </div>

                {/* Confirmar Email */}
                <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs font-bold ml-1 flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} /> Confirmar E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 h-4 w-4" />
                    <Input
                      id="signup-confirm-email"
                      type="email"
                      value={signupConfirmEmail}
                      onChange={(e) => setSignupConfirmEmail(e.target.value)}
                      placeholder="Repita o seu e-mail"
                      required
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary pl-12 h-12 rounded-2xl shadow-sm text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Dados de Acesso */}
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-100/40 dark:shadow-none space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Senha & Segurança</h3>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs font-bold ml-1">Senha de Acesso</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 h-4 w-4" />
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary pl-12 pr-12 h-12 rounded-2xl shadow-sm text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Label className="text-slate-600 dark:text-slate-400 text-xs font-bold ml-1 flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} /> Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 h-4 w-4" />
                    <Input
                      id="signup-confirm"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Repita a sua senha"
                      required
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary pl-12 pr-12 h-12 rounded-2xl shadow-sm text-sm"
                    />
                  </div>
                </div>
              </div>

              <p className="text-slate-400 dark:text-slate-500 text-xs text-center px-4 font-bold uppercase tracking-wider">
                Ao cadastrar, você aceita nossos <span className="text-primary font-black underline cursor-pointer" onClick={() => setShowConsentModal(true)}>Termos de Uso</span>.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" strokeWidth={3} /> Criar Minha Conta
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
