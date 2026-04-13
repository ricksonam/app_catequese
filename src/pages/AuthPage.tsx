import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, Mail } from "lucide-react";

export default function AuthPage() {
  const { session, isReady } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isReady && session) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      setLoading(false);
    }
    // Don't setLoading(false) on success — the redirect will happen via AuthContext
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastro realizado!", description: "Verifique seu email para confirmar a conta." });
      setIsLogin(true);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erro", description: "Digite seu email", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setIsForgotPassword(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm border-border/60 shadow-xl animate-float-up">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-2">
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">Recuperar Senha</CardTitle>
            <CardDescription>Digite seu email para receber o link de recuperação</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsForgotPassword(false)}
              >
                Voltar ao login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border/60 shadow-xl animate-float-up">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-24 h-24 rounded-3xl overflow-hidden bg-white/80 border border-border/40 shadow-xl shadow-primary/5 mb-2">
            <img src="/app-icon.png" alt="Logo" className="w-full h-full object-contain p-2" />
          </div>
          <CardTitle className="text-2xl font-black">
            {isLogin ? "Entrar" : "Criar Conta"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "Acesse sua conta no iCatequese" : "Cadastre-se para começar no iCatequese"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                "Carregando..."
              ) : isLogin ? (
                <>
                  <LogIn className="h-4 w-4" /> Entrar
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Cadastrar
                </>
              )}
            </Button>
            {isLogin && (
              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setIsForgotPassword(true)}
              >
                Esqueci minha senha
              </Button>
            )}
            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-medium hover:underline"
              >
                {isLogin ? "Cadastre-se" : "Entrar"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
