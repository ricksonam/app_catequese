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
  Mail,
  ArrowLeft,
  X as XIcon,
  ChevronRight,
  Check,
  ChevronLeft
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

/* Formata CPF: 000.000.000-00 */
const formatCPF = (val: string) => {
  return val
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

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
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [signupName, setSignupName] = useState("");
  const [signupCpf, setSignupCpf] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupGender, setSignupGender] = useState("");
  const [signupDob, setSignupDob] = useState("");
  const [signupState, setSignupState] = useState("");
  const [signupCity, setSignupCity] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Location
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

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
        let msg = error.message;
        if (msg === "Failed to fetch") {
          msg = "Servidor não respondeu.";
        } else if (msg.includes("Invalid login credentials") || msg.includes("Invalid credentials")) {
          msg = "Credenciais inválidas. Verifique seu e-mail e senha.";
        } else if (msg.includes("Email not confirmed")) {
          msg = "E-mail não confirmado. Verifique sua caixa de entrada.";
        }
        toast({ title: "Não foi possível entrar", description: msg, variant: "destructive" });
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
    if (!signupName || !signupEmail || !signupGender || !signupDob || !signupState || !signupCity) {
      toast({ title: "Dados incompletos", description: "Preencha todos os campos obrigatórios para avançar.", variant: "destructive" });
      return;
    }
    if (signupCpf && signupCpf.length < 14) {
      toast({ title: "CPF inválido", description: "Digite o CPF completo ou deixe em branco.", variant: "destructive" });
      return;
    }
    setSignupStep(2);
  };

  const handleSignupNextStep2 = () => {
    if (signupPassword !== signupConfirm) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: "Senha fraca", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setSignupStep(3);
  };

  const handleSignupConfirm = async () => {
    if (!termsAccepted) {
      toast({ title: "Atenção", description: "Você precisa aceitar os termos de uso para concluir o cadastro.", variant: "destructive" });
      return;
    }

    setLoading(true);
    localStorage.removeItem("ivc_onboarding_completed");
    localStorage.removeItem("ivc_terms_accepted");

    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: getAppUrl(),
        data: {
          full_name: signupName,
          cpf: signupCpf,
          genero: signupGender,
          data_nascimento: signupDob,
          estado: signupState,
          cidade: signupCity,
          terms_accepted: true,
          role: 'catequista'
        },
      },
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
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
              if (signupStep > 1) setSignupStep((prev) => (prev - 1) as 1 | 2 | 3);
              else setView("login");
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="text-slate-600 h-6 w-6" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(step => (
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
                label="CPF (opcional)"
                value={signupCpf}
                onChange={(v) => setSignupCpf(formatCPF(v))}
                valid={signupCpf.length === 14}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <InputLine
                label="E-mail"
                value={signupEmail}
                onChange={setSignupEmail}
                valid={signupEmail.includes("@") && signupEmail.includes(".")}
                type="email"
                placeholder="seu@email.com"
              />

              <div className="flex gap-4">
                <SelectLine
                  label="Gênero"
                  value={signupGender}
                  onChange={setSignupGender}
                  options={[
                    { value: "Masculino", label: "Masculino" },
                    { value: "Feminino", label: "Feminino" },
                    { value: "Outro", label: "Outro" }
                  ]}
                  valid={!!signupGender}
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
              </div>

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
              <p className="text-slate-500 mb-8 text-sm">Crie uma senha forte para proteger sua conta. Mínimo de 6 caracteres.</p>

              <InputLine
                label="Senha"
                value={signupPassword}
                onChange={setSignupPassword}
                valid={signupPassword.length >= 6}
                type="password"
                placeholder="••••••••"
              />

              {signupPassword.length > 0 && (
                <div className="mb-4 -mt-2 flex gap-1.5">
                  {[...Array(4)].map((_, i) => {
                    const strength = Math.min(Math.floor(signupPassword.length / 2), 4);
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < strength
                            ? strength <= 1 ? "bg-red-500"
                              : strength <= 2 ? "bg-yellow-500"
                              : strength <= 3 ? "bg-blue-500"
                              : "bg-green-500"
                            : "bg-slate-200"
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              <InputLine
                label="Confirme a senha"
                value={signupConfirm}
                onChange={setSignupConfirm}
                valid={signupConfirm === signupPassword && signupConfirm.length >= 6}
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

          {signupStep === 3 && (
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
                    <span className="text-slate-400">CPF</span>
                    <span className="font-semibold">{signupCpf}</span>
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

              <label className="flex items-start gap-4 mb-8 cursor-pointer group">
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
                  Eu confirmo que os dados estão corretos e concordo com os{" "}
                  <a
                    href="#"
                    className="text-[#f7931a] font-bold underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    Termos de Uso
                  </a>{" "}
                  e a Política de Privacidade do iCatequese.
                </p>
              </label>

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
