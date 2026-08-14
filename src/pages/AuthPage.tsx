import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/passwordValidation";
import { ConsentModal } from "@/components/Onboarding/ConsentModal";
import {
  Eye,
  EyeOff,
  LogIn,
  Mail,
  ArrowLeft,
  X as XIcon,
  ChevronRight,
  Check,
  ChevronLeft,
  AlertTriangle,
  Info,
  FileText,
  ShieldCheck
} from "lucide-react";
import { getAppUrl } from "@/lib/utils";

/* ─── tipos de view ─── */
type View = "login" | "signup" | "forgot";

const SAVED_EMAIL_KEY = "ivc_saved_email";

interface IBGECity {
  id: number;
  nome: string;
}

/* Lista estática de estados brasileiros */
const ESTADOS_BR: { sigla: string; nome: string }[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];



const isValidDate = (d: string) => {
  return d.length === 10;
};

const InputLine = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  valid = false,
  maxLength
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  valid?: boolean;
  maxLength?: number;
}) => (
  <div className="mb-6 relative">
    <label className="block text-[#f7931a] text-lg font-bold mb-2">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-transparent border-b-2 border-slate-200 text-slate-800 text-base py-2 px-0 focus:outline-none focus:border-[#f7931a] transition-colors placeholder:text-slate-400"
      />
      {valid && (
        <Check className="absolute right-0 top-1/2 -translate-y-1/2 text-green-500 h-5 w-5" />
      )}
    </div>
  </div>
);

const SelectLine = ({
  label,
  value,
  onChange,
  options,
  valid = false,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: {value: string; label: string}[];
  valid?: boolean;
  disabled?: boolean;
}) => (
  <div className="mb-6 relative flex-1">
    <label className="block text-[#f7931a] text-lg font-bold mb-2">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-transparent border-b-2 border-slate-200 text-slate-800 text-base py-3 pl-0 pr-10 min-h-[48px] focus:outline-none focus:border-[#f7931a] transition-colors appearance-none disabled:opacity-50"
      >
        <option value="" className="bg-white text-slate-400">Selecione...</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-white text-slate-800">
            {o.label}
          </option>
        ))}
      </select>
      {valid ? (
        <Check className="absolute right-0 top-1/2 -translate-y-1/2 text-green-500 h-5 w-5 pointer-events-none" />
      ) : (
        <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-[#f7931a] h-4 w-4 pointer-events-none rotate-90" />
      )}
    </div>
  </div>
);

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

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");

  // Signup states
  const [signupStep, setSignupStep] = useState<1 | 2 | 3 | 4>(1);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupDob, setSignupDob] = useState("");
  const [signupState, setSignupState] = useState("");
  const [signupCity, setSignupCity] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Location
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Verificar bloqueio global de inscrições
  const { data: inscricoesBloqueadas, isLoading: checkingBloqueio } = useQuery({
    queryKey: ["app_settings", "inscricoes_bloqueadas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "inscricoes_bloqueadas")
        .maybeSingle();
      return data?.value === "true";
    },
    staleTime: 30000,
    enabled: view === "signup",
  });

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_EMAIL_KEY);
    if (saved) setSavedEmail(saved);
  }, []);

  useEffect(() => {
    if (signupState) {
      const uf = ESTADOS_BR.find(s => s.nome === signupState)?.sigla;
      if (uf) {
        setLoadingCities(true);
        setCities([]);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
          .then(res => res.json())
          .then(data => { setCities(data); setLoadingCities(false); })
          .catch(() => { setLoadingCities(false); });
      } else {
        setCities([]);
      }
    } else {
      setCities([]);
      setLoadingCities(false);
    }
  }, [signupState]);

  // Redirect if already logged in
  if (isReady && session) return <Navigate to="/" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const loginEmail = savedEmail || email;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      });

      if (error) {
        let title = "Não foi possível entrar";
        let msg = error.message;
        if (msg === "Failed to fetch") {
          msg = "Servidor não respondeu. Verifique sua conexão.";
        } else if (msg.includes("Invalid login credentials") || msg.includes("Invalid credentials")) {
          msg = "E-mail não encontrado ou senha incorreta. Se você excluiu sua conta anteriormente, este e-mail não existe mais na base de dados. Crie uma nova conta ou verifique o e-mail digitado.";
          title = "E-mail ou senha incorretos";
        } else if (msg.includes("Email not confirmed")) {
          msg = "E-mail não confirmado. Verifique sua caixa de entrada.";
        }
        toast({ title, description: msg, variant: "destructive" });
        setLoading(false);
      } else {
        localStorage.setItem(SAVED_EMAIL_KEY, loginEmail);
      }
    } catch (err: any) {
      toast({ title: "Erro de Conexão", description: "Ocorreu um erro inesperado.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleClearSavedEmail = () => {
    localStorage.removeItem(SAVED_EMAIL_KEY);
    setSavedEmail(null);
    setEmail("");
  };

  const handleSignupNextStep1 = () => {
    if (!signupName || !signupEmail || !signupDob || !signupState || !signupCity) {
      toast({ title: "Dados incompletos", description: "Preencha todos os campos obrigatórios para avançar.", variant: "destructive" });
      return;
    }
    setSignupStep(2);
  };

  const handleSignupNextStep2 = () => {
    const validation = validatePassword(signupPassword);
    if (!validation.isValid) {
      toast({
        title: "Senha não atende aos requisitos",
        description: `A senha precisa ter: ${validation.errors.join(", ")}.`,
        variant: "destructive"
      });
      return;
    }
    if (signupPassword !== signupConfirm) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    // Step 3 = Terms of Use screen
    setSignupStep(3);
  };

  const handleSignupNextStep3 = () => {
    // Terms were accepted in step 3, go to confirmation
    if (!termsAccepted) {
      toast({ title: "Atenção", description: "Você precisa aceitar os termos de uso para continuar.", variant: "destructive" });
      return;
    }
    setSignupStep(4);
  };

  const handleSignupConfirm = async () => {
    // termsAccepted already validated in step 3
    if (!termsAccepted) {
      toast({ title: "Atenção", description: "Você precisa aceitar os termos de uso para concluir o cadastro.", variant: "destructive" });
      return;
    }

    setLoading(true);
    localStorage.removeItem("ivc_onboarding_completed");
    localStorage.removeItem("ivc_terms_accepted");

    let isoDob = signupDob;
    if (signupDob.length === 10 && signupDob.includes("/")) {
      const parts = signupDob.split("/");
      if (parts.length === 3) isoDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: getAppUrl(),
        data: {
          full_name: signupName,
          data_nascimento: isoDob,
          estado: signupState,
          cidade: signupCity,
          terms_accepted: true,
          role: 'catequista'
        },
      },
    });
    setLoading(false);

    if (error) {
      let title = "Erro ao cadastrar";
      let msg = error.message;
      if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("User already registered")) {
        title = "E-mail já cadastrado";
        msg = "Este e-mail já está em uso. Se esqueceu sua senha, volte à tela de login e clique em 'Esqueci minha senha' para redefini-la.";
      } else if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
        title = "E-mail já cadastrado";
        msg = "Este e-mail já existe na base de dados. Use a opção 'Esqueci minha senha' para recuperar o acesso.";
      }
      toast({ title, description: msg, variant: "destructive" });
    } else {
      setShowVerificationNotice(true);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${getAppUrl()}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
      setView("login");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: getAppUrl() },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Erro ao entrar com Google", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  /* ──────────────────────────────────────────────
     LOGIN VIEW
  ────────────────────────────────────────────── */
  if (view === "login") {
    return (
      <div className="min-h-screen flex flex-col bg-sky-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-sky-50 to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 py-10">
          <div className="w-full max-w-sm">
            <button
              onClick={() => navigate("/")}
              className="back-btn mb-8"
            >
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white mx-auto mb-4 shadow-xl shadow-primary/10 border border-primary/20 flex items-center justify-center p-2">
                <img src="/Logo_sem_fundo.png" alt="Logo" className="w-[85%] h-[85%] object-contain" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Bem-vindo de volta!</h2>
              <p className="text-slate-500 text-sm font-medium">Entre com sua conta para continuar</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-13 flex items-center justify-center gap-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 mb-6 py-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Entrar com Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-sky-50 px-2 text-slate-400 font-bold tracking-widest">Ou use seu e-mail</span></div>
            </div>

            {savedEmail && (
              <div className="mb-4 p-3 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-primary/70 font-black uppercase tracking-wide">Conta salva</p>
                  <p className="text-sm text-slate-800 font-bold truncate">{savedEmail}</p>
                </div>
                <button onClick={handleClearSavedEmail} className="text-slate-300 hover:text-slate-500 transition-colors">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {!savedEmail && (
                <div className="space-y-1.5">
                  <Label className="text-slate-600 text-sm font-bold ml-1">Email</Label>
                  <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm" />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-bold ml-1">Senha</Label>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-white border-2 border-slate-100 text-slate-800 placeholder:text-slate-300 focus:border-primary h-12 rounded-xl shadow-sm pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="button" onClick={() => setView("forgot")} className="text-primary text-xs font-bold hover:underline transition-colors w-full text-right">Esqueci minha senha</button>

              <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-blue-600 text-white font-bold text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-60 mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn className="h-4 w-4" /> Entrar</>}
              </button>
            </form>

            <div className="text-center mt-6">
              <span className="text-slate-400 text-sm font-medium">Não tem conta? </span>
              <button onClick={() => { setView("signup"); setSignupStep(1); }} className="text-primary font-bold text-sm hover:underline transition-colors">Cadastre-se</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────
     SIGNUP VIEW - DARK MODE ELEGANTE (MULTI-STEP)
  ────────────────────────────────────────────── */
  if (view === "signup") {
    // Mostrar loading enquanto verifica o bloqueio
    if (checkingBloqueio) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    // Tela de inscrições suspensas
    if (inscricoesBloqueadas) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-sm w-full">
            {/* Ícone */}
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle className="w-12 h-12 text-amber-400" />
            </div>

            {/* Logo */}
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 mx-auto mb-6 flex items-center justify-center p-2">
              <img src="/Logo_sem_fundo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            <h1 className="text-2xl font-black text-white mb-3 leading-tight">
              Cadastros Temporariamente Suspensos
            </h1>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              O sistema de cadastros do <strong className="text-white">iCatequese</strong> está
              temporariamente suspenso. Em breve as inscrições serão reabertas.
            </p>

            {/* Card de contato */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-2">Entre em contato</p>
              <a
                href="mailto:icatequese2026@gmail.com"
                className="text-primary font-bold text-base hover:text-primary/80 transition-colors break-all"
              >
                icatequese2026@gmail.com
              </a>
            </div>

            <button
              onClick={() => setView("login")}
              className="w-full py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Login
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col relative overflow-hidden">

        
        <div className="relative z-10 flex-1 flex flex-col">
        {showVerificationNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-100 shadow-2xl rounded-[32px] p-8 max-w-md w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-9 w-9 text-emerald-500 animate-bounce" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Verifique seu E-mail! ✉️</h3>
              <p className="text-slate-500 text-sm font-semibold mb-2">Enviamos um link de confirmação para:</p>
              <div className="bg-slate-50 border border-slate-100 py-3 px-4 rounded-2xl font-mono text-xs text-emerald-600 font-bold break-all mb-5">
                {signupEmail}
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Acesse sua caixa de entrada e clique no link para ativar sua conta e acessar o iCatequese.
              </p>
              <Button
                onClick={() => {
                  setShowVerificationNotice(false);
                  setView("login");
                }}
                className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-500/20"
              >
                Entendido, ir para o Login
              </Button>
            </div>
          </div>
        )}

        {/* Header Simples */}
        <div className="px-6 py-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (signupStep > 1) setSignupStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
              else setView("login");
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="text-slate-600 h-6 w-6" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === signupStep
                    ? "w-6 bg-[#f7931a]"
                    : step < signupStep
                    ? "w-2 bg-teal-500"
                    : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="w-10 h-10" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-12">
          {signupStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Criar Conta</h2>
              <p className="text-slate-500 text-sm mb-8">Preencha com atenção. Os campos confirmados ficam com ✓ verde.</p>

              <InputLine
                label="Nome completo"
                value={signupName}
                onChange={setSignupName}
                valid={signupName.trim().length > 2}
                placeholder="Ex: Maria de Souza"
              />
              <InputLine
                label="E-mail"
                value={signupEmail}
                onChange={setSignupEmail}
                valid={signupEmail.includes("@") && signupEmail.includes(".")}
                type="email"
                placeholder="seu@email.com"
              />

              <InputLine
                label="Data de nascimento"
                value={signupDob}
                onChange={(v) => {
                  let val = v.replace(/\D/g, "");
                  if (val.length > 2) val = val.substring(0, 2) + "/" + val.substring(2);
                  if (val.length > 5) val = val.substring(0, 5) + "/" + val.substring(5, 9);
                  setSignupDob(val);
                }}
                valid={isValidDate(signupDob)}
                placeholder="DD/MM/AAAA"
                maxLength={10}
              />

              <SelectLine
                label="Estado"
                value={signupState}
                onChange={(v) => { setSignupState(v); setSignupCity(""); }}
                options={ESTADOS_BR.map(s => ({ value: s.nome, label: s.nome }))}
                valid={!!signupState}
              />

              <SelectLine
                label="Cidade"
                value={signupCity}
                onChange={setSignupCity}
                options={cities.map(c => ({ value: c.nome, label: c.nome }))}
                disabled={!signupState || loadingCities}
                valid={!!signupCity}
              />

              {signupState && loadingCities && (
                <p className="text-slate-500 text-xs mb-4 -mt-4 animate-pulse">Carregando cidades...</p>
              )}

              <div className="flex items-start gap-2 -mt-2 mb-4 bg-muted/30 p-3 rounded-xl border border-border/50">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground italic leading-snug">
                  <strong className="font-semibold not-italic">Observação:</strong> O estado e a cidade informados devem ser de onde você atualmente reside.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignupNextStep1}
                className="w-full mt-6 bg-[#f7931a] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:bg-[#ffaa40] transition-colors active:scale-[0.98]"
              >
                Próximo passo →
              </button>
            </div>
          )}

          {signupStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Sua senha</h2>
              <p className="text-slate-500 mb-8 text-sm">Crie uma senha com no mínimo 6 caracteres e pelo menos 1 caractere especial (!@#$%^&*).</p>

              <InputLine
                label="Senha"
                value={signupPassword}
                onChange={setSignupPassword}
                valid={validatePassword(signupPassword).isValid}
                type="password"
                placeholder="••••••••"
              />

              {signupPassword.length > 0 && (() => {
                const v = validatePassword(signupPassword);
                return (
                  <div className="mb-4 -mt-2 space-y-2">
                    {/* Barra de força */}
                    <div className="flex gap-1.5">
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i < v.strength
                              ? v.strength === 1 ? "bg-yellow-500" : "bg-green-500"
                              : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    {/* Checklist de requisitos */}
                    <div className="grid grid-cols-1 gap-0.5">
                      {PASSWORD_REQUIREMENTS.map(req => (
                        <div key={req.key} className={`flex items-center gap-1.5 text-xs transition-colors ${
                          v.checks[req.key] ? "text-green-600" : "text-slate-400"
                        }`}>
                          <span>{v.checks[req.key] ? "✓" : "○"}</span>
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <InputLine
                label="Confirme a senha"
                value={signupConfirm}
                onChange={setSignupConfirm}
                valid={signupConfirm === signupPassword && validatePassword(signupPassword).isValid}
                type="password"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={handleSignupNextStep2}
                className="w-full mt-6 bg-[#f7931a] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:bg-[#ffaa40] transition-colors active:scale-[0.98]"
              >
                Avançar →
              </button>
            </div>
          )}

          {/* ── STEP 3: TERMOS DE USO ── */}
          {signupStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#f7931a]/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#f7931a]" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-800 leading-tight">Termos de Uso</h2>
                </div>
              </div>
              <p className="text-slate-500 text-sm mb-6">Leia com atenção antes de criar sua conta no iCatequese.</p>

              {/* Termos scrolláveis */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden mb-6">
                {/* Header dos termos */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-white">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#f7931a]/20 bg-white shadow-sm shrink-0 flex items-center justify-center p-1">
                    <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">iCatequese</p>
                    <p className="text-[10px] font-bold text-[#f7931a] uppercase tracking-widest">Privacidade &amp; Termos</p>
                  </div>
                </div>

                {/* Corpo scrollável */}
                <div className="max-h-[42vh] overflow-y-auto px-5 py-4 space-y-4 text-sm text-slate-700 leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Bem-vindo ao iCatequese.<br />
                    Este Termo de Uso e Política de Privacidade estabelece as condições para utilização da plataforma, bem como as diretrizes relacionadas à proteção de dados pessoais, segurança digital e uso ético do sistema.<br /><br />
                    Ao utilizar o sistema, o usuário declara que leu, compreendeu e concorda integralmente com os termos abaixo.
                  </p>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">1. SOBRE O SISTEMA</h4>
                    <p>O iCatequese é uma plataforma digital destinada à gestão pastoral da catequese, permitindo o gerenciamento de turmas, catequizandos, catequistas, encontros, atividades, comunicação com famílias, agenda catequética e recursos de evangelização. A plataforma possui finalidade exclusivamente pastoral, educativa e evangelizadora.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">2. USO EXCLUSIVAMENTE PASTORAL</h4>
                    <p>O uso do iCatequese é restrito às atividades pastorais, religiosas, educativas e administrativas relacionadas à catequese. É expressamente proibido utilizar a plataforma para campanhas políticas, fake news, discurso de ódio, conteúdo discriminatório ou atividades ilícitas.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">3. CADASTRO E RESPONSABILIDADE</h4>
                    <p>O usuário compromete-se a fornecer informações verdadeiras, manter a confidencialidade de sua senha e garantir que possui autorização para cadastrar dados de terceiros. O usuário é integralmente responsável pelas atividades realizadas em sua conta.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">4. PROTEÇÃO DE DADOS — LGPD</h4>
                    <p>O iCatequese compromete-se a cumprir integralmente a Lei Geral de Proteção de Dados Pessoais (LGPD). Os dados serão utilizados exclusivamente para organização pastoral, gestão catequética e melhorias no sistema. O titular poderá solicitar acesso, correção, exclusão ou revogação do consentimento a qualquer momento.</p>
                  </div>

                  <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      5. ECA DIGITAL — Lei nº 15.211/2025
                    </h4>
                    <p className="text-amber-800">
                      O iCatequese reconhece e adota integralmente os princípios da <strong>Lei nº 15.211/2025 — ECA Digital</strong>, que assegura a proteção integral de crianças e adolescentes no ambiente digital.
                    </p>
                    <p className="text-amber-800">
                      Em conformidade com esta lei, a plataforma garante:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-amber-800">
                      <li><strong>Respeito à dignidade</strong> de crianças e adolescentes em todos os recursos digitais;</li>
                      <li><strong>Proteção contra exposição indevida</strong> — é terminantemente proibido publicar, compartilhar ou divulgar fotos, vídeos ou qualquer imagem de menores sem o <em>consentimento expresso e documentado</em> dos responsáveis legais;</li>
                      <li><strong>Minimização de dados</strong> — coleta apenas o necessário para fins pastorais;</li>
                      <li><strong>Não comercialização</strong> de informações de menores em nenhuma hipótese;</li>
                      <li>Denúncia obrigatória às autoridades competentes em caso de violações identificadas.</li>
                    </ul>
                    <p className="text-amber-800 text-xs font-semibold mt-1">
                      Violações a esta cláusula resultarão em suspensão imediata da conta e comunicação às autoridades.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">6. CONSENTIMENTO DOS RESPONSÁVEIS</h4>
                    <p>Ao cadastrar crianças ou adolescentes, o catequista declara possuir autorização legítima dos responsáveis legais para cadastro, comunicação e uso de imagens (quando autorizado).</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">7. SEGURANÇA DA INFORMAÇÃO</h4>
                    <p>Adotamos controle de acesso, criptografia, monitoramento e backups para proteção dos dados. Apesar disso, nenhum sistema é completamente imune a riscos digitais.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">8. PROPRIEDADE INTELECTUAL</h4>
                    <p>Todos os direitos do sistema pertencem ao iCatequese. É proibida a reprodução sem autorização.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">9. ALTERAÇÕES DOS TERMOS</h4>
                    <p>Este Termo poderá ser atualizado periodicamente. A continuidade do uso da plataforma após alterações será interpretada como concordância com os novos termos.</p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">10. FORO</h4>
                    <p>Fica eleito o foro da comarca de Manaus, Estado do Amazonas para resolução de quaisquer conflitos, com renúncia a qualquer outro foro.</p>
                  </div>

                  <p className="text-center text-xs text-slate-400 font-black uppercase tracking-[0.3em] pt-2">Ad Maiorem Dei Gloriam</p>
                </div>
              </div>

              {/* Aceitar */}
              <label className="flex items-start gap-4 mb-6 cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-md bg-white checked:bg-[#f7931a] checked:border-[#f7931a] transition-all cursor-pointer"
                  />
                  <Check className="absolute text-white w-4 h-4 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                </div>
                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                  Li e concordo com os <strong className="text-slate-700">Termos de Uso</strong>, a <strong className="text-slate-700">Política de Privacidade</strong> e as disposições da <strong className="text-slate-700">Lei nº 15.211/2025 (ECA Digital)</strong> do iCatequese.
                </p>
              </label>

              <button
                type="button"
                onClick={handleSignupNextStep3}
                disabled={!termsAccepted}
                className="w-full bg-[#f7931a] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:bg-[#ffaa40] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                Aceitar e Continuar →
              </button>
            </div>
          )}

          {/* ── STEP 4: CONFIRMAÇÃO DE DADOS ── */}
          {signupStep === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Confirmar dados</h2>
              <p className="text-slate-500 text-sm mb-6">Verifique suas informações antes de finalizar.</p>

              <div className="bg-white border-2 border-slate-100 shadow-sm rounded-2xl p-6 mb-6 space-y-3">
                <h3 className="text-[#f7931a] font-bold uppercase text-xs tracking-widest mb-4">Resumo do Cadastro</h3>
                <div className="space-y-2.5 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nome</span>
                    <span className="font-semibold text-right">{signupName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">E-mail</span>
                    <span className="font-semibold text-right break-all">{signupEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nascimento</span>
                    <span className="font-semibold">{signupDob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Localização</span>
                    <span className="font-semibold">{signupCity} - {ESTADOS_BR.find(s => s.nome === signupState)?.sigla}</span>
                  </div>
                </div>
              </div>

              {/* Confirmação - termos já aceitos no passo anterior */}
              <div
                onClick={() => setTermsAccepted((v) => !v)}
                className="flex items-start gap-4 mb-8 cursor-pointer group"
              >
                <div className="relative flex items-center justify-center w-6 h-6 mt-0.5 shrink-0">
                  <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all ${
                    termsAccepted ? "bg-[#f7931a] border-[#f7931a]" : "border-slate-300 bg-white"
                  }`}>
                    <Check className={`text-white w-4 h-4 transition-opacity ${termsAccepted ? "opacity-100" : "opacity-0"}`} strokeWidth={3} />
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                  Eu confirmo que os dados estão corretos e concordo com os{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowTermsModal(true); }}
                    className="text-[#f7931a] font-bold underline hover:text-[#e0821a] transition-colors"
                  >
                    Termos de Uso
                  </button>{" "}
                  e a Política de Privacidade do iCatequese.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSignupConfirm}
                disabled={loading || !termsAccepted}
                className="w-full bg-[#f7931a] text-black font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(247,147,26,0.3)] hover:bg-[#ffaa40] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  "✓ Finalizar Cadastro"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Modal de Termos - abre ao clicar em "Termos de Uso" na tela de confirmação */}
      <ConsentModal
        open={showTermsModal}
        onAccept={() => { setTermsAccepted(true); setShowTermsModal(false); }}
        onCancel={() => setShowTermsModal(false)}
        isSignup={true}
      />
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
            className="back-btn mb-8"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
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
