import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
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
  Cross,
  ChevronRight,
  X,
  Check,
} from "lucide-react";

/* ─── tipos de view ─── */
type View = "landing" | "login" | "signup" | "forgot";

const SAVED_EMAIL_KEY = "ivc_saved_email";

/* ──────────────────────────────────────────────
   CONSENT MODAL
────────────────────────────────────────────── */
function ConsentModal({
  open,
  onAccept,
  onCancel,
}: {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-white/20 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-lg font-black text-foreground">Termos de Uso</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Body scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-primary/20 bg-white shadow-md shrink-0">
              <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <p className="text-base font-black text-foreground">iCatequese</p>
              <p className="text-xs text-muted-foreground">Termos e Privacidade</p>
            </div>
          </div>

          <p>
            Bem-vindo ao <strong className="text-foreground">iCatequese</strong>. Ao criar sua conta, você concorda com os termos abaixo:
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
              <p className="font-bold text-foreground text-xs uppercase tracking-wide mb-1">📋 Uso dos Dados</p>
              <p>Seus dados são utilizados exclusivamente para a gestão pastoral da catequese. Não compartilhamos suas informações com terceiros.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <p className="font-bold text-foreground text-xs uppercase tracking-wide mb-1">🔒 Privacidade</p>
              <p>As informações dos catequizandos são tratadas com total sigilo e respeito, em conformidade com a LGPD (Lei nº 13.709/2018).</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <p className="font-bold text-foreground text-xs uppercase tracking-wide mb-1">✝️ Finalidade Pastoral</p>
              <p>O sistema destina-se ao uso pastoral e educativo da catequese. É proibido utilizar os dados para fins comerciais ou não autorizados.</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <p className="font-bold text-foreground text-xs uppercase tracking-wide mb-1">📧 Comunicações</p>
              <p>Podemos enviar notificações relacionadas ao funcionamento do sistema. Você pode desativar isso nas configurações da conta.</p>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground/70 pt-2">
            Desenvolvido por Rickson Amazonas • Versão 1.0.0
          </p>
        </div>
        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
          <label className="flex items-center gap-4 cursor-pointer bg-primary/5 p-4 rounded-xl border border-primary/20 hover:bg-primary/10 transition-colors">
            <button
              type="button"
              onClick={() => setAgreed((v) => !v)}
              className={`w-7 h-7 rounded-lg border-[3px] flex items-center justify-center shrink-0 transition-all ${
                agreed ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/30" : "border-gray-400 bg-white dark:border-gray-500"
              }`}
            >
              <Check className={`h-5 w-5 text-white transition-opacity ${agreed ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
            </button>
            <span className="text-sm text-foreground leading-snug font-medium">
              Li e concordo com os <strong className="text-primary">Termos de Uso</strong> e <strong className="text-primary">Privacidade</strong>.
            </span>
          </label>
          <Button
            onClick={onAccept}
            disabled={!agreed}
            className="w-full rounded-2xl h-12 font-bold text-sm"
          >
            Confirmar Cadastro
          </Button>
          <button onClick={onCancel} className="w-full text-sm text-muted-foreground py-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   AUTH PAGE PRINCIPAL
────────────────────────────────────────────── */
export default function AuthPage() {
  const { session, isReady } = useAuth();
  const [view, setView] = useState<View>("landing");

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
    setLoading(true);
    const loginEmail = savedEmail || email;
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      setLoading(false);
    } else {
      localStorage.setItem(SAVED_EMAIL_KEY, loginEmail);
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
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: signupName },
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
      redirectTo: `${window.location.origin}/reset-password`,
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
          url: window.location.origin,
        });
      } catch {
        // ignored
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast({ title: "Link copiado!", description: "Compartilhe com seus colegas catequistas." });
    }
  };

  /* ──────────────────────────────────────────────
     LANDING VIEW
  ────────────────────────────────────────────── */
  if (view === "landing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between overflow-hidden relative bg-sky-50">
        {/* ── Background Litúrgico Animado ── */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-sky-50 to-white" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />

          {/* Partículas litúrgicas flutuantes */}
          {[
            { symbol: "✦", top: "8%", left: "12%", size: "text-2xl", delay: "0s", dur: "6s" },
            { symbol: "✝", top: "15%", right: "10%", size: "text-3xl", delay: "1s", dur: "8s" },
            { symbol: "☩", top: "72%", left: "8%", size: "text-xl", delay: "2s", dur: "7s" },
            { symbol: "✦", top: "80%", right: "14%", size: "text-lg", delay: "0.5s", dur: "9s" },
            { symbol: "✝", top: "45%", left: "5%", size: "text-base", delay: "3s", dur: "6s" },
            { symbol: "✦", top: "30%", right: "6%", size: "text-sm", delay: "1.5s", dur: "10s" },
          ].map((p, i) => (
            <div
              key={i}
              className="absolute text-primary/10 font-serif select-none"
              style={{
                top: p.top,
                left: (p as any).left,
                right: (p as any).right,
                animation: `float-particle ${p.dur} ease-in-out infinite`,
                animationDelay: p.delay,
              }}
            >
              <span className={`${p.size} opacity-40`}>{p.symbol}</span>
            </div>
          ))}
        </div>

        {/* Botão compartilhar icônico e animado no canto superior direito */}
        <button
          id="btn-compartilhar"
          onClick={handleShare}
          className="fixed top-8 right-8 z-[100] w-12 h-12 rounded-full bg-white/70 backdrop-blur-md border border-primary/20 text-primary shadow-2xl shadow-primary/20 flex items-center justify-center active:scale-90 transition-all hover:bg-white hover:border-primary/40 animate-glow-pulse shimmer-effect group"
          title="Compartilhar iCatequese"
        >
          <Share2 className="h-5 w-5 transition-transform group-hover:rotate-12 group-active:scale-110" />
        </button>

        {/* ── Conteúdo ── */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-sm mx-auto px-6 text-center py-10">
          {/* Logo com halo */}
          <div className="relative mb-8">
            <div className="absolute inset-0 scale-125 rounded-[40px] bg-primary/10 blur-2xl animate-pulse" />
            <div
              className="relative w-32 h-32 rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-primary/10 border-2 border-white/40"
              style={{ animation: "logo-breathe 4s ease-in-out infinite" }}
            >
              <img src="/app-logo.png" alt="iCatequese" className="w-full h-full object-contain p-2" />
            </div>
            {/* Estrelinhas orbitando */}
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/40 animate-bounce">
              <span className="text-white text-sm">✦</span>
            </div>
          </div>

          {/* Nome + Slogan */}
          <h1 className="text-5xl font-black tracking-tighter mb-3 bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent drop-shadow-sm">
            iCatequese
          </h1>
          <p className="text-slate-600 font-medium text-base leading-relaxed mb-2 max-w-xs">
            Organize, acompanhe e inspire<br />sua catequese
          </p>
          <div className="flex items-center gap-2 mb-10 w-full px-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/20" />
            <span className="text-primary/40 text-[10px] font-black tracking-[0.2em] uppercase">✝ Ad maiorem Dei gloriam ✝</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/20" />
          </div>

          {/* Botões */}
          <div className="w-full space-y-4">
            <button
              id="btn-entrar"
              onClick={() => setView("login")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-base shadow-lg shadow-primary/30 flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all hover:shadow-primary/40 hover:shadow-xl group"
            >
              <LogIn className="h-5 w-5" />
              Entrar
              <ChevronRight className="h-4 w-4 ml-1 opacity-60 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-2">
              <button
                id="btn-cadastro"
                onClick={() => setView("signup")}
                className="w-full h-12 rounded-2xl bg-white border-2 border-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all hover:bg-primary/5 hover:border-primary/40"
              >
                <UserPlus className="h-4 w-4" />
                Cadastre-se
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="relative z-10 pb-6 text-center">
          <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Versão 1.0.0 · Rickson Amazonas</p>
        </div>

        <style>{`
          @keyframes float-particle {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-18px) rotate(5deg); }
            66% { transform: translateY(-8px) rotate(-3deg); }
          }
          @keyframes logo-breathe {
            0%, 100% { transform: scale(1); box-shadow: 0 0 30px 8px rgba(37,99,235,0.1); }
            50% { transform: scale(1.03); box-shadow: 0 0 50px 15px rgba(37,99,235,0.2); }
          }
        `}</style>
      </div>
    );
  }


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
              onClick={() => setView("landing")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-primary text-sm font-bold mb-8 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
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
                  <X className="h-4 w-4" />
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
        />

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Back */}
            <button
              onClick={() => setView("landing")}
              className="flex items-center gap-1.5 text-slate-400 hover:text-primary text-sm font-bold mb-8 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
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
