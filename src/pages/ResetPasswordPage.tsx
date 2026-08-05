import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/passwordValidation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast({ title: "Link inválido", description: "Use o link enviado por email.", variant: "destructive" });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast({
        title: "Senha não atende aos requisitos",
        description: `A senha precisa ter: ${validation.errors.join(", ")}.`,
        variant: "destructive"
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada!", description: "Sua senha foi alterada com sucesso." });
      navigate("/");
    }
  };

  const validation = validatePassword(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border/60 shadow-xl animate-float-up">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-2">
            <KeyRound className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Nova Senha</CardTitle>
          <CardDescription>
            Mínimo 6 caracteres e pelo menos 1 caractere especial (!@#$%^&*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {/* Indicador de força */}
              {password.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-1.5">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i < validation.strength
                            ? validation.strength === 1 ? "bg-yellow-500" : "bg-green-500"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  {/* Checklist */}
                  <div className="grid grid-cols-1 gap-0.5">
                    {PASSWORD_REQUIREMENTS.map(req => (
                      <div
                        key={req.key}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          validation.checks[req.key] ? "text-green-600" : "text-slate-400"
                        }`}
                      >
                        <span>{validation.checks[req.key] ? "✓" : "○"}</span>
                        <span>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="text-xs text-red-500">As senhas não coincidem</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !validation.isValid}>
              {loading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
