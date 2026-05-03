import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, UserX, MessageSquare, Settings, Search, MapPin, 
  ShieldAlert, ShieldCheck, Trash2, ArrowLeft, TrendingUp, 
  Calendar, CheckCircle2, XCircle, ChevronRight, Lock, Unlock, Mail, Phone,
  BarChart3, PieChart, Activity, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Types
interface Profile {
  id: string;
  email: string;
  last_login: string | null;
  is_blocked: boolean;
  created_at: string;
  cidade?: string;
  estado?: string;
}

interface Sugestao {
  id: string;
  usuario_id: string;
  email_usuario: string;
  texto: string;
  tipo: 'sugestao' | 'exclusao' | 'critica';
  motivo_exclusao: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Queries
  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw profilesError;

      // Fetch all paroquias to get city/state (admin view)
      const { data: paroquiasData, error: paroquiasError } = await supabase
        .from("paroquias")
        .select("user_id, cidade, estado");
      
      if (paroquiasError) throw paroquiasError;

      // Map city/state to profiles
      return profilesData.map((p: any) => {
        const paroquia = paroquiasData.find(pa => pa.user_id === p.id);
        return {
          ...p,
          cidade: paroquia?.cidade || "Não informado",
          estado: paroquia?.estado || "—"
        };
      });
    }
  });

  const { data: sugestoes = [], isLoading: loadingSugestoes } = useQuery({
    queryKey: ["admin_sugestoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sugestoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Sugestao[];
    }
  });

  // Mutations
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, is_blocked }: { id: string; is_blocked: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: !is_blocked })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_profiles"] });
      toast.success("Status do usuário atualizado!");
    }
  });

  const updateAdminPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha do administrador atualizada!");
      setIsPasswordDialogOpen(false);
      setNewPassword("");
    }
  });

  // Derived Data
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => 
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.estado?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  const stats = useMemo(() => {
    const total = profiles.length;
    const blocked = profiles.filter(p => p.is_blocked).length;
    const activeToday = profiles.filter(p => {
      if (!p.last_login) return false;
      const date = new Date(p.last_login);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length;
    const deletedReasons = sugestoes.filter(s => s.tipo === 'exclusao').length;

    return { total, blocked, activeToday, deletedReasons };
  }, [profiles, sugestoes]);

  const feedbackList = sugestoes.filter(s => s.tipo !== 'exclusao');
  const churnList = sugestoes.filter(s => s.tipo === 'exclusao');

  if (loadingProfiles || loadingSugestoes) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-border/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground tracking-tight">Painel iCatequese Intelligence</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Monitoramento em Tempo Real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="rounded-xl border-2 font-bold text-xs">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao App
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              signOut();
              navigate("/auth");
            }} className="rounded-xl font-bold text-xs text-destructive hover:bg-destructive/10">
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-700">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total de Usuários" 
            value={stats.total} 
            icon={Users} 
            color="primary" 
            description="Base total cadastrada"
          />
          <StatsCard 
            title="Ativos Hoje" 
            value={stats.activeToday} 
            icon={Activity} 
            color="success" 
            description="Sessões iniciadas hoje"
          />
          <StatsCard 
            title="Usuários Bloqueados" 
            value={stats.blocked} 
            icon={UserX} 
            color="destructive" 
            description="Contas com acesso restrito"
          />
          <StatsCard 
            title="Taxa de Churn" 
            value={stats.deletedReasons} 
            icon={TrendingUp} 
            color="amber" 
            description="Usuários que excluiram conta"
          />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[32px] border border-border/50 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 border-r border-border/50 bg-slate-50/50 p-6 space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-2">Navegação</p>
            <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={Users} label="Usuários" />
            <TabButton active={activeTab === "churn"} onClick={() => setActiveTab("churn")} icon={UserX} label="Excluídos" />
            <TabButton active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} icon={MessageSquare} label="Sugestões" />
            <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={Settings} label="Configurações" />
          </aside>

          {/* Tab Content */}
          <div className="flex-1 p-8">
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Gestão de Usuários</h2>
                    <p className="text-sm text-muted-foreground">Monitore e controle o acesso à plataforma</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por email, cidade..." 
                      className="pl-9 rounded-xl border-border/50" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-border/50 rounded-2xl overflow-hidden shadow-inner bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Usuário</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Localização</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Último Acesso</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                        <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfiles.map((p) => (
                        <TableRow key={p.id} className="group transition-colors hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">{p.email}</span>
                              <span className="text-[10px] text-muted-foreground">ID: {p.id.slice(0, 8)}...</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                              <MapPin className="h-3 w-3 text-primary/60" />
                              {p.cidade}, {p.estado}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {p.last_login ? new Date(p.last_login).toLocaleString("pt-BR") : "Nunca logou"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.is_blocked ? "destructive" : "outline"} className={cn(
                              "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              !p.is_blocked && "text-emerald-600 border-emerald-200 bg-emerald-50"
                            )}>
                              {p.is_blocked ? "Bloqueado" : "Ativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => toggleBlockMutation.mutate(p)}
                              className={cn(
                                "rounded-xl h-9 px-3",
                                p.is_blocked ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" : "text-destructive hover:text-destructive hover:bg-destructive/10"
                              )}
                            >
                              {p.is_blocked ? <Unlock className="h-4 w-4 mr-1.5" /> : <Lock className="h-4 w-4 mr-1.5" />}
                              {p.is_blocked ? "Desbloquear" : "Bloquear"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === "churn" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Motivos de Deserção (Churn)</h2>
                  <p className="text-sm text-muted-foreground">Entenda por que os usuários estão saindo do app</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {churnList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm font-medium">Nenhum dado de exclusão registrado</p>
                    </div>
                  ) : (
                    churnList.map((s) => (
                      <Card key={s.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                            <UserX className="h-5 w-5 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-bold text-foreground truncate">{s.email_usuario}</h4>
                              <span className="text-[10px] font-medium text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <p className="text-sm text-foreground bg-slate-50 p-3 rounded-xl border border-border/30 font-medium italic">
                              "{s.motivo_exclusao || "Não especificado"}"
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "feedback" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Sugestões e Críticas</h2>
                  <p className="text-sm text-muted-foreground">O que os usuários estão dizendo sobre o iCatequese</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {feedbackList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm font-medium">Ainda não recebemos feedbacks</p>
                    </div>
                  ) : (
                    feedbackList.map((s) => (
                      <Card key={s.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5 flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            s.tipo === 'sugestao' ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-600"
                          )}>
                            {s.tipo === 'sugestao' ? <TrendingUp className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-foreground truncate">{s.email_usuario}</h4>
                                <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">
                                  {s.tipo}
                                </Badge>
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {s.texto}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6 max-w-md">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Configurações do Sistema</h2>
                  <p className="text-sm text-muted-foreground">Gerencie o acesso administrativo e segurança</p>
                </div>

                <Card className="rounded-[24px] border-border/50 shadow-sm overflow-hidden">
                  <div className="bg-primary/5 p-6 border-b border-border/50 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Lock className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Segurança Administrativa</h4>
                      <p className="text-xs text-muted-foreground">Mantenha sua senha segura e atualizada</p>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email de Admin</p>
                      <p className="text-sm font-bold text-foreground">icatequese2026@gmail.com</p>
                    </div>
                    <Button onClick={() => setIsPasswordDialogOpen(true)} className="w-full rounded-xl font-bold h-12 gap-2">
                      <Unlock className="h-4 w-4" /> Alterar Senha de Admin
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center">Nova Senha Admin</DialogTitle>
            <DialogDescription className="text-center">Defina uma senha segura para o acesso ao painel inteligente.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nova Senha</label>
              <Input 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                className="rounded-xl h-12 border-2 focus:border-primary"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)} className="rounded-xl h-12 border-2">Cancelar</Button>
            <Button 
              onClick={() => updateAdminPasswordMutation.mutate(newPassword)} 
              disabled={newPassword.length < 4 || updateAdminPasswordMutation.isPending}
              className="flex-1 rounded-xl h-12 font-bold"
            >
              {updateAdminPasswordMutation.isPending ? "Salvando..." : "Atualizar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, description }: { title: string; value: number; icon: any; color: string; description: string }) {
  const colorStyles = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-50 text-emerald-600 border-emerald-200",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <Card className="rounded-[28px] border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110", colorStyles[color as keyof typeof colorStyles])}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-2xl font-black text-foreground tracking-tight">{value}</h3>
          </div>
        </div>
        <p className="text-[10px] font-medium text-muted-foreground mt-4 border-t border-border/50 pt-3">{description}</p>
      </CardContent>
    </Card>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
        active 
          ? "bg-white text-primary shadow-sm border border-border/50" 
          : "text-muted-foreground hover:bg-white/50 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
      {label}
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  );
}
