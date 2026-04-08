import { useNavigate } from "react-router-dom";
import { Church, Users, UserCheck, Image, BookOpen, FileText, Library, CalendarDays, Dices, ChevronRight, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MenuContentProps {
  onClose: () => void;
}

const cadastros = [
  { label: "Paróquia e Comunidade", icon: Church, path: "/cadastros/paroquia-comunidade", color: "bg-primary/10 text-primary" },
  { label: "Catequistas", icon: UserCheck, path: "/cadastros/catequistas", color: "bg-success/10 text-success" },
];

const modulosGlobais = [
  { label: "Jogos", icon: Dices, path: "/jogos", color: "bg-gold/15 text-gold" },
  { label: "Calendário Litúrgico", icon: CalendarDays, path: "/modulos/calendario", color: "bg-destructive/10 text-destructive" },
  { label: "Mural de Fotos", icon: Image, path: "/modulos/mural", color: "bg-success/10 text-success" },
  { label: "Bíblia", icon: BookOpen, path: "/modulos/biblia", color: "bg-primary/10 text-primary" },
  { label: "Material de Apoio", icon: FileText, path: "/modulos/material", color: "bg-liturgical/10 text-liturgical" },
  { label: "Biblioteca de Modelos", icon: Library, path: "/modulos/biblioteca", color: "bg-success/10 text-success" },
];

export function MenuContent({ onClose }: MenuContentProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Senha alterada com sucesso." });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 pb-4">
        <h2 className="text-lg font-bold text-foreground">Menu</h2>
        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        <div>
          <p className="section-title">Cadastros Obrigatórios</p>
          <div className="space-y-2">
            {cadastros.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full float-card flex items-center gap-3 px-4 py-3.5 text-left animate-float-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`icon-box ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="section-title">Módulos Globais</p>
          <div className="space-y-2">
            {modulosGlobais.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className="w-full float-card flex items-center gap-3 px-4 py-3.5 text-left animate-float-up"
                  style={{ animationDelay: `${(i + 3) * 60}ms` }}
                >
                  <div className={`icon-box ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="section-title">Conta</p>
          <div className="space-y-2">
            <button
              onClick={() => setShowPasswordDialog(true)}
              className="w-full float-card flex items-center gap-3 px-4 py-3.5 text-left animate-float-up"
            >
              <div className="icon-box bg-primary/10 text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">Alterar Senha</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleSignOut}
              className="w-full float-card flex items-center gap-3 px-4 py-3.5 text-left animate-float-up"
            >
              <div className="icon-box bg-destructive/10 text-destructive">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="flex-1 text-sm font-medium text-destructive">Sair</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button onClick={handleChangePassword} className="w-full" disabled={savingPassword}>
              {savingPassword ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
