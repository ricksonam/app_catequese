import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { session, isAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect directly
  if (session && isAdmin) {
    navigate("/admin", { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (error) {
        toast.error(error.message === "Invalid login credentials" 
          ? "Credenciais de administrador incorretas." 
          : error.message);
        setLoading(false);
        return;
      }

      // Check if user is actually an admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, sub_admin_status")
        .eq("id", data.user.id)
        .maybeSingle();

      const isSuperAdmin = data.user.email === "icatequese2026@gmail.com";
      const isSubAdmin = profile?.role === "sub_admin" && profile?.sub_admin_status === "active";

      if (!isSuperAdmin && !isSubAdmin) {
        toast.error("Acesso negado: Este usuário não possui privilégios de administrador.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      toast.success("Acesso autorizado! Carregando painel...");
      // A navegação acontecerá automaticamente pelo useEffect/if no topo do componente
      // assim que o AuthContext atualizar o estado isAdmin para true.
      // Mantemos loading=true para evitar múltiplos cliques.
    } catch (err: any) {
      console.error("[iCatequese] Erro no login administrativo:", err);
      toast.error("Ocorreu um erro ao tentar fazer login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-950/30 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Back Button */}
        <button
          className="back-btn mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-amber-500" />
          
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
              Painel Administrativo
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              iCatequese • Acesso Restrito
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="admin@icatequese.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-950/40 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-950/40 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-6 rounded-xl mt-6 transition duration-200 border-t border-indigo-400/20 shadow-lg shadow-indigo-600/20 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando acesso...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Entrar no Painel
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
