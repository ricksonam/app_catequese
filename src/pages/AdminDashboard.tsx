import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, UserX, MessageSquare, Settings, Search, MapPin, 
  ShieldAlert, ShieldCheck, Trash2, ArrowLeft, TrendingUp, 
  Calendar, CheckCircle2, XCircle, ChevronRight, Lock, Unlock, Mail, Phone,
  BarChart3, PieChart, Activity, ExternalLink, Star, Sparkles, CircleDollarSign, Filter
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
import { AlertTriangle, ShieldAlert as ShieldAlertIcon } from "lucide-react";

// Keywords for safety monitoring
const SAFETY_KEYWORDS = [
  "sexual", "nude", "pornografico", "pornografia", "sexo", "novinha", "novinho",
  "dinheiro", "contribuição", "pix", "transferência", "pagar", "pagamento",
  "ameaça", "ameaçando", "matar", "violência", "bater", "agredir", "safado", "safada"
];


// Types
interface Profile {
  id: string;
  email: string;
  last_login: string | null;
  is_blocked: boolean;
  is_premium: boolean;
  premium_since: string | null;
  created_at: string;
  cidade?: string;
  estado?: string;
  motivo_bloqueio?: string | null;
  role?: string;
  sub_admin_status?: string;
  sub_admin_created_by?: string;
}

const BLOCK_REASONS = [
  "Usuário violou os termos de uso",
  "Uso do sistema para fins comerciais",
  "Usuário violou as regras de LGPD",
  "Usuário não renovou a assinatura"
];

interface Sugestao {
  id: string;
  usuario_id: string;
  email_usuario: string;
  texto: string;
  tipo: 'sugestao' | 'exclusao' | 'critica';
  motivo_exclusao: string | null;
  created_at: string;
}

interface SafetyAlert {
  id: string;
  module: "Conecta Família" | "Missões em Família";
  type: "Formulário" | "Resposta" | "Missão";
  content: string;
  flaggedWord: string;
  author: string;
  userId?: string;
  createdAt: string;
}


export default function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut, isSuperAdmin } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [userToBlock, setUserToBlock] = useState<Profile | null>(null);
  
  // Sub-admin states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isSubAdminLoading, setIsSubAdminLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  const [financeFilters, setFinanceFilters] = useState({
    estado: "Todos",
    cidade: "Todas",
    mes: "Todos",
    dia: "Todos"
  });

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
  
  const { data: safetyAlerts = [], isLoading: loadingSafety } = useQuery({
    queryKey: ["admin_safety_alerts"],
    queryFn: async () => {
      const alerts: SafetyAlert[] = [];

      // 1. Check comunicacao_forms
      const { data: forms } = await supabase
        .from("comunicacao_forms")
        .select("*, profiles(email)");
      
      forms?.forEach(f => {
        const textToSearch = `${f.titulo} ${f.descricao} ${JSON.stringify(f.campos)}`.toLowerCase();
        const foundWord = SAFETY_KEYWORDS.find(word => textToSearch.includes(word));
        if (foundWord) {
          alerts.push({
            id: f.id,
            module: "Conecta Família",
            type: "Formulário",
            content: `${f.titulo}: ${f.descricao}`,
            flaggedWord: foundWord,
            author: (f.profiles as any)?.email || "Usuário desconhecido",
            userId: f.user_id,
            createdAt: f.criado_em
          });
        }
      });

      // 2. Check comunicacao_respostas
      const { data: responses } = await supabase
        .from("comunicacao_respostas")
        .select("*");
      
      responses?.forEach(r => {
        const textToSearch = `${r.nome_respondente} ${JSON.stringify(r.respostas)}`.toLowerCase();
        const foundWord = SAFETY_KEYWORDS.find(word => textToSearch.includes(word));
        if (foundWord) {
          alerts.push({
            id: r.id,
            module: "Conecta Família",
            type: "Resposta",
            content: `Resposta de ${r.nome_respondente}: ${JSON.stringify(r.respostas)}`,
            flaggedWord: foundWord,
            author: `${r.nome_respondente} (${r.telefone || 'Sem tel'})`,
            createdAt: r.criado_em
          });
        }
      });

      // 3. Check missoes_familia
      const { data: missoes } = await supabase
        .from("missoes_familia")
        .select("*, profiles:criado_por(email)");
      
      missoes?.forEach(m => {
        const textToSearch = `${m.titulo} ${m.descricao}`.toLowerCase();
        const foundWord = SAFETY_KEYWORDS.find(word => textToSearch.includes(word));
        if (foundWord) {
          alerts.push({
            id: m.id,
            module: "Missões em Família",
            type: "Missão",
            content: `${m.titulo}: ${m.descricao}`,
            flaggedWord: foundWord,
            author: (m.profiles as any)?.email || "Usuário desconhecido",
            userId: m.criado_por,
            createdAt: m.criado_em
          });
        }
      });

      return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ["admin_payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Mutations
  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, is_blocked, reason }: { id: string; is_blocked: boolean; reason?: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_blocked: is_blocked,
          motivo_bloqueio: is_blocked ? reason : null
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_profiles"] });
      toast.success("Status do usuário atualizado!");
      setIsBlockDialogOpen(false);
      setBlockReason("");
      setUserToBlock(null);
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
    const premium = profiles.filter(p => p.is_premium).length;
    const activeToday = profiles.filter(p => {
      if (!p.last_login) return false;
      const date = new Date(p.last_login);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length;
    const deletedReasons = sugestoes.filter(s => s.tipo === 'exclusao').length;
    const safetyAlertsCount = safetyAlerts.length;

    return { total, blocked, activeToday, deletedReasons, safetyAlertsCount, premium };
  }, [profiles, sugestoes, safetyAlerts]);

  const processedPayments = useMemo(() => {
    return payments.map(pay => {
      // Find profile by activated_user_id or premium_transaction_nsu
      let profile = profiles.find(p => p.id === pay.activated_user_id);
      if (!profile) {
        const payload = pay.payload || {};
        const nsu = payload.transaction_nsu;
        const slug = payload.invoice_slug;
        profile = profiles.find(p => 
          (nsu && p.premium_transaction_nsu === nsu) ||
          (slug && p.premium_transaction_nsu === slug) ||
          (p.premium_transaction_nsu === pay.id)
        );
      }
      const amount = (pay.payload as any)?.paid_amount || (pay.payload as any)?.amount || 0;
      const date = new Date(pay.created_at);
      return {
        ...pay,
        valor: amount / 100, // Assuming cents
        cidade: profile?.cidade || "Não informado",
        estado: profile?.estado || "—",
        email: profile?.email || "Pendente de Ativação (Pix)",
        data: date,
        mes: (date.getMonth() + 1).toString().padStart(2, '0'),
        dia: date.getDate().toString().padStart(2, '0'),
        ano: date.getFullYear().toString(),
      };
    });
  }, [payments, profiles]);

  const filteredPayments = useMemo(() => {
    return processedPayments.filter(p => {
      if (financeFilters.estado !== "Todos" && p.estado !== financeFilters.estado) return false;
      if (financeFilters.cidade !== "Todas" && p.cidade !== financeFilters.cidade) return false;
      if (financeFilters.mes !== "Todos" && p.mes !== financeFilters.mes) return false;
      if (financeFilters.dia !== "Todos" && p.dia !== financeFilters.dia) return false;
      return true;
    });
  }, [processedPayments, financeFilters]);

  const totalRevenue = filteredPayments.reduce((acc, curr) => acc + curr.valor, 0);

  // Lists for filters
  const estadosList = ["Todos", ...Array.from(new Set(processedPayments.map(p => p.estado).filter(Boolean)))];
  const cidadesList = ["Todas", ...Array.from(new Set(processedPayments.filter(p => financeFilters.estado === "Todos" || p.estado === financeFilters.estado).map(p => p.cidade).filter(Boolean)))];
  const mesesList = ["Todos", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const diasList = ["Todos", ...Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))];


  const feedbackList = sugestoes.filter(s => s.tipo !== 'exclusao');
  const churnList = sugestoes.filter(s => s.tipo === 'exclusao');

  if (loadingProfiles || loadingSugestoes || loadingSafety || loadingPayments) {

    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        
        {/* Stats Cards — single horizontal row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatsCard 
            title="Total de Usuários" 
            value={stats.total} 
            icon={Users} 
            color="primary" 
            description="Base total cadastrada"
            onClick={() => setActiveTab("users")}
          />
          <StatsCard 
            title="Ativos Hoje" 
            value={stats.activeToday} 
            icon={Activity} 
            color="success" 
            description="Sessões hoje"
            onClick={() => setActiveTab("users")}
          />
          <StatsCard 
            title="Premium" 
            value={stats.premium} 
            icon={Star} 
            color="amber" 
            description="Assinaturas ativas"
            onClick={() => setActiveTab("users")}
          />
          <StatsCard 
            title="Bloqueados" 
            value={stats.blocked} 
            icon={UserX} 
            color="destructive" 
            description="Acesso restrito"
            onClick={() => setActiveTab("users")}
          />
          <StatsCard 
            title="Alertas" 
            value={stats.safetyAlertsCount} 
            icon={ShieldAlert} 
            color="destructive" 
            description="Conteúdo sinalizado"
            onClick={() => setActiveTab("safety")}
          />
        </div>


        {/* Main Content Area */}
        <div className="bg-white rounded-[32px] border border-border/50 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 border-r border-border/50 bg-slate-50/50 p-6 space-y-2">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-2">Navegação</p>
            <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={Users} label="Usuários" />
            <TabButton active={activeTab === "finance"} onClick={() => setActiveTab("finance")} icon={CircleDollarSign} label="Financeiro" />
            <TabButton active={activeTab === "safety"} onClick={() => setActiveTab("safety")} icon={ShieldAlert} label="Segurança" />
            <TabButton active={activeTab === "churn"} onClick={() => setActiveTab("churn")} icon={UserX} label="Excluídos" />
            <TabButton active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} icon={MessageSquare} label="Sugestões" />
            {isSuperAdmin && (
              <TabButton active={activeTab === "admins"} onClick={() => setActiveTab("admins")} icon={ShieldCheck} label="Administradores" />
            )}
            <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={Settings} label="Configurações" />
          </aside>

          {/* Tab Content */}
          <div className="flex-1 p-8">
            {activeTab === "users" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Gestão de Usuários</h2>
                    <p className="text-sm text-muted-foreground">{filteredProfiles.length} usuários encontrados</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por email, cidade..." 
                      className="pl-9 rounded-xl border-border/50 h-10" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredProfiles.map((p) => (
                    <UserCard
                      key={p.id}
                      profile={p}
                      onBlock={() => {
                        if (p.is_blocked) {
                          toggleBlockMutation.mutate({ id: p.id, is_blocked: false });
                        } else {
                          setUserToBlock(p);
                          setIsBlockDialogOpen(true);
                        }
                      }}
                      onTogglePremium={async () => {
                        const newVal = !p.is_premium;
                        const expiresAt = new Date();
                        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                        await supabase.from('profiles').update({ 
                          is_premium: newVal,
                          premium_since: newVal ? new Date().toISOString() : null,
                          premium_expires_at: newVal ? expiresAt.toISOString() : null
                        }).eq('id', p.id);
                        qc.invalidateQueries({ queryKey: ['admin_profiles'] });
                        toast.success(newVal ? 'Premium ativado por 1 ano!' : 'Premium removido.');
                      }}
                    />
                  ))}
                  {filteredProfiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Users className="h-12 w-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold">Nenhum usuário encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "safety" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Monitoramento de Segurança</h2>
                    <p className="text-sm text-muted-foreground">Conteúdo sinalizado por termos impróprios ou suspeitos</p>
                  </div>
                  <Badge variant="destructive" className="rounded-full px-4 py-1 font-black text-xs">
                    {safetyAlerts.length} ALERTAS
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {safetyAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/50 rounded-[32px] border-2 border-dashed border-border/50">
                      <ShieldCheck className="h-12 w-12 mb-4 text-emerald-500 opacity-50" />
                      <p className="text-sm font-bold uppercase tracking-widest">Nenhum conteúdo suspeito detectado</p>
                      <p className="text-xs">O sistema está monitorando em tempo real.</p>
                    </div>
                  ) : (
                    safetyAlerts.map((alert) => (
                      <Card key={alert.id} className="rounded-2xl border-destructive/20 shadow-sm hover:shadow-md transition-all overflow-hidden bg-white group">
                        <div className="h-1 w-full bg-destructive/50" />
                        <CardContent className="p-5 flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/20">
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest border-destructive/30 text-destructive bg-destructive/5">
                                  {alert.module}
                                </Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">• {alert.type}</span>
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {new Date(alert.createdAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-bold text-foreground mb-1">Autor: {alert.author}</h4>
                            
                            <div className="p-3 rounded-xl bg-slate-50 border border-border/40 text-sm text-foreground mb-3 font-medium leading-relaxed line-clamp-3">
                              {alert.content}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/5 border border-destructive/10">
                                <span className="text-[9px] font-black text-destructive uppercase tracking-widest">Termo Flagged:</span>
                                <span className="text-xs font-black text-destructive">{alert.flaggedWord}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                {alert.userId && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => {
                                      const profile = profiles.find(p => p.id === alert.userId);
                                      if (profile) {
                                        setUserToBlock(profile);
                                        setBlockReason(`Conteúdo impróprio detectado: "${alert.flaggedWord}"`);
                                        setIsBlockDialogOpen(true);
                                      }
                                    }}
                                    className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest"
                                  >
                                    <Lock className="h-3 w-3 mr-1" /> Bloquear Usuário
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="rounded-lg h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-slate-100"
                                >
                                  Ignorar Alerta
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "finance" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Gestão Financeira</h2>
                    <p className="text-sm text-muted-foreground">Monitore o faturamento do Premium</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border shadow-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</label>
                    <select 
                      value={financeFilters.estado}
                      onChange={(e) => setFinanceFilters(prev => ({ ...prev, estado: e.target.value, cidade: "Todas" }))}
                      className="w-full h-10 rounded-xl border-border bg-slate-50 text-sm font-medium focus:ring-primary focus:border-primary px-3"
                    >
                      {estadosList.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cidade</label>
                    <select 
                      value={financeFilters.cidade}
                      onChange={(e) => setFinanceFilters(prev => ({ ...prev, cidade: e.target.value }))}
                      className="w-full h-10 rounded-xl border-border bg-slate-50 text-sm font-medium focus:ring-primary focus:border-primary px-3"
                    >
                      {cidadesList.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mês</label>
                    <select 
                      value={financeFilters.mes}
                      onChange={(e) => setFinanceFilters(prev => ({ ...prev, mes: e.target.value }))}
                      className="w-full h-10 rounded-xl border-border bg-slate-50 text-sm font-medium focus:ring-primary focus:border-primary px-3"
                    >
                      {mesesList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dia</label>
                    <select 
                      value={financeFilters.dia}
                      onChange={(e) => setFinanceFilters(prev => ({ ...prev, dia: e.target.value }))}
                      className="w-full h-10 rounded-xl border-border bg-slate-50 text-sm font-medium focus:ring-primary focus:border-primary px-3"
                    >
                      {diasList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Faturamento Card */}
                  <Card className="col-span-1 md:col-span-1 rounded-[32px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 border-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                    <CardContent className="p-8 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                        <CircleDollarSign className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-sm font-bold text-emerald-50 uppercase tracking-widest mb-1">
                        Faturamento Filtrado
                      </p>
                      <h3 className="text-4xl font-black tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
                      </h3>
                      <p className="text-xs text-emerald-100 mt-4 font-medium opacity-80">
                        {filteredPayments.length} {filteredPayments.length === 1 ? 'assinatura' : 'assinaturas'} encontradas
                      </p>
                    </CardContent>
                  </Card>

                  {/* Lista de Pagamentos */}
                  <Card className="col-span-1 md:col-span-2 rounded-[32px] border-border shadow-sm bg-white overflow-hidden flex flex-col">
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-lg font-bold">Histórico de Transações</CardTitle>
                      <CardDescription>Visualização detalhada baseada nos filtros acima</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 relative">
                      <ScrollArea className="h-[280px] w-full border-t">
                        {filteredPayments.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground">
                            <CircleDollarSign className="h-10 w-10 mb-3 opacity-20" />
                            <p className="text-sm font-bold">Nenhum pagamento encontrado</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/50">
                            {filteredPayments.map(pay => (
                              <div key={pay.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                                    pay.processed 
                                      ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                      : "bg-amber-50 border-amber-100 text-amber-600"
                                  )}>
                                    <Star className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-foreground">{pay.email}</p>
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.25",
                                          pay.processed 
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                                            : "border-amber-200 bg-amber-50 text-amber-700 animate-pulse"
                                        )}
                                      >
                                        {pay.processed ? "Ativo" : "Pendente"}
                                      </Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                      {pay.cidade}, {pay.estado} • {pay.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                  <p className="text-sm font-black text-emerald-600">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pay.valor)}
                                  </p>
                                  <span className="text-[9px] text-muted-foreground font-mono">
                                    NSU: {(pay.payload as any)?.transaction_nsu || (pay.payload as any)?.invoice_slug || "—"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
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

            {activeTab === "admins" && isSuperAdmin && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Gestão de Sub-Administradores</h2>
                  <p className="text-sm text-muted-foreground">Crie e controle o acesso de outros administradores para a plataforma.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Formulário de Criação */}
                  <Card className="rounded-[24px] border-border/50 shadow-sm p-6 space-y-4 lg:col-span-1 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">Novo Sub-Admin</h3>
                        <p className="text-xs text-muted-foreground">Criar credenciais de acesso</p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email do Administrador</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="admin2@icatequese.com"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="pl-10 rounded-xl h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Senha Provisória</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="pl-10 rounded-xl h-11 border-2 focus:border-primary"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={async () => {
                          if (!adminEmail || !adminPassword) {
                            toast.error("Por favor, informe email e senha.");
                            return;
                          }
                          if (adminPassword.length < 6) {
                            toast.error("A senha deve conter no mínimo 6 caracteres.");
                            return;
                          }

                          setIsSubAdminLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("manage-sub-admin", {
                              body: { action: "create", email: adminEmail, password: adminPassword }
                            });

                            if (error) {
                              toast.error(error.message || "Erro ao criar sub-administrador.");
                              return;
                            }

                            setCreatedCredentials({ email: adminEmail, password: adminPassword });
                            setAdminEmail("");
                            setAdminPassword("");
                            qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                            toast.success("Sub-admin criado com sucesso!");
                          } catch (err: any) {
                            console.error("[iCatequese] Erro ao criar sub-admin:", err);
                            toast.error(err.message || "Erro ao criar sub-administrador.");
                          } finally {
                            setIsSubAdminLoading(false);
                          }
                        }}
                        disabled={isSubAdminLoading || !adminEmail || !adminPassword}
                        className="w-full rounded-xl h-11 font-bold gap-2 mt-2"
                      >
                        {isSubAdminLoading ? "Criando..." : "Criar Administrador"}
                      </Button>
                    </div>
                  </Card>

                  {/* Lista de Administradores */}
                  <Card className="rounded-[24px] border-border/50 shadow-sm p-6 lg:col-span-2 space-y-4 bg-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-foreground text-sm">Administradores Ativos</h3>
                        <p className="text-xs text-muted-foreground">Total de administradores gerenciáveis</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-3 py-1">
                        {profiles.filter(p => p.role === "sub_admin").length} Sub-Admins
                      </Badge>
                    </div>

                    <div className="space-y-3 pt-2">
                      {profiles.filter(p => p.role === "sub_admin").length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                          <ShieldCheck className="h-10 w-10 mb-2 opacity-20" />
                          <p className="text-sm font-medium">Nenhum sub-administrador cadastrado</p>
                        </div>
                      ) : (
                        profiles.filter(p => p.role === "sub_admin").map((admin) => (
                          <div key={admin.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border/50 rounded-2xl hover:bg-slate-50 transition-colors gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 shrink-0">
                                {admin.email.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-bold text-foreground">{admin.email}</p>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5",
                                      admin.sub_admin_status === "active" && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                      admin.sub_admin_status === "paused" && "border-amber-200 bg-amber-50 text-amber-700",
                                      admin.sub_admin_status === "revoked" && "border-destructive bg-destructive/5 text-destructive"
                                    )}
                                  >
                                    {admin.sub_admin_status === "active" ? "Ativo" : admin.sub_admin_status === "paused" ? "Pausado" : "Revogado"}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Criado por: {admin.sub_admin_created_by || "Sistema"}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {admin.sub_admin_status === "active" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from("profiles")
                                        .update({ sub_admin_status: "paused" })
                                        .eq("id", admin.id);
                                      if (error) throw error;
                                      qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                                      toast.success("Acesso pausado temporariamente.");
                                    } catch (err: any) {
                                      toast.error("Erro ao pausar acesso.");
                                    }
                                  }}
                                  className="rounded-xl text-xs font-bold border-2 gap-1.5 h-9"
                                >
                                  <Lock className="w-3.5 h-3.5" /> Pausar
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from("profiles")
                                        .update({ sub_admin_status: "active" })
                                        .eq("id", admin.id);
                                      if (error) throw error;
                                      qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                                      toast.success("Acesso reativado.");
                                    } catch (err: any) {
                                      toast.error("Erro ao ativar acesso.");
                                    }
                                  }}
                                  className="rounded-xl text-xs font-bold border-2 gap-1.5 h-9"
                                >
                                  <Unlock className="w-3.5 h-3.5" /> Reativar
                                </Button>
                              )}

                              {admin.sub_admin_status !== "revoked" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from("profiles")
                                        .update({ sub_admin_status: "revoked" })
                                        .eq("id", admin.id);
                                      if (error) throw error;
                                      qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                                      toast.success("Acesso revogado com sucesso.");
                                    } catch (err: any) {
                                      toast.error("Erro ao revogar acesso.");
                                    }
                                  }}
                                  className="rounded-xl text-xs font-bold border-2 text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 gap-1.5 h-9"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Revogar
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm(`Tem certeza que deseja excluir permanentemente o sub-admin ${admin.email}?`)) return;
                                  setIsSubAdminLoading(true);
                                  try {
                                    const { data, error } = await supabase.functions.invoke("manage-sub-admin", {
                                      body: { action: "delete", userId: admin.id }
                                    });
                                    if (error) {
                                      toast.error(error.message || "Erro ao excluir sub-admin.");
                                      return;
                                    }
                                    qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                                    toast.success("Sub-admin excluído com sucesso!");
                                  } catch (err: any) {
                                    toast.error(err.message || "Erro ao excluir sub-admin.");
                                  } finally {
                                    setIsSubAdminLoading(false);
                                  }
                                }}
                                className="rounded-xl text-xs font-bold border-2 hover:bg-destructive hover:text-white border-destructive/30 hover:border-destructive text-destructive gap-1.5 h-9"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
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

      {/* Block User Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center text-destructive">Bloquear Usuário</DialogTitle>
            <DialogDescription className="text-center">
              Selecione o motivo do bloqueio para <strong>{userToBlock?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Motivos predefinidos:</p>
            {BLOCK_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setBlockReason(reason)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center gap-4",
                  blockReason === reason 
                    ? "border-destructive bg-destructive/5 text-destructive shadow-md scale-[1.01]" 
                    : "border-border/40 hover:border-destructive/30 hover:bg-slate-50 text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  blockReason === reason ? "border-destructive bg-destructive" : "border-muted-foreground/30"
                )}>
                  {blockReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50" />}
                </div>
                {reason}
              </button>
            ))}

          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => {
              setIsBlockDialogOpen(false);
              setBlockReason("");
            }} className="rounded-xl h-12 border-2 flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={() => userToBlock && toggleBlockMutation.mutate({ id: userToBlock.id, is_blocked: true, reason: blockReason })} 
              disabled={!blockReason || toggleBlockMutation.isPending}
              className="flex-1 rounded-xl h-12 font-bold bg-destructive hover:bg-destructive/90"
            >
              {toggleBlockMutation.isPending ? "Bloqueando..." : "Confirmar Bloqueio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Admin Credentials Dialog */}
      <Dialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-indigo-600 animate-bounce" />
              Sub-Admin Criado!
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Copie as credenciais abaixo para enviar ao novo administrador. Por segurança, elas não serão exibidas novamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border font-mono text-sm relative">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Email</p>
              <p className="text-slate-800 break-all select-all font-bold">{createdCredentials?.email}</p>
            </div>
            
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border font-mono text-sm relative">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Senha</p>
              <p className="text-slate-800 break-all select-all font-bold">{createdCredentials?.password}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`Acesso Administrativo iCatequese\n\nURL: ${window.location.origin}/admin/login\nEmail: ${createdCredentials?.email}\nSenha: ${createdCredentials?.password}`);
                toast.success("Credenciais copiadas!");
                setCreatedCredentials(null);
              }}
              className="w-full rounded-xl h-12 font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Copiar Credenciais & Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ─── UserCard Component ───────────────────────────────────────────────────────
function UserCard({
  profile: p,
  onBlock,
  onTogglePremium,
}: {
  profile: Profile;
  onBlock: () => void;
  onTogglePremium: () => void;
}) {
  const initials = p.email.slice(0, 2).toUpperCase();
  const avatarColors = [
    "bg-primary/10 text-primary",
    "bg-emerald-100 text-emerald-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-amber-100 text-amber-700",
  ];
  const colorIdx = p.email.charCodeAt(0) % avatarColors.length;

  return (
    <div className={cn(
      "rounded-2xl border bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all",
      p.is_blocked ? "border-destructive/30 bg-destructive/5" : "border-border/50"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0",
        avatarColors[colorIdx]
      )}>
        {initials}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-black text-foreground truncate">{p.email}</span>
          {/* Status chips */}
          {p.is_premium && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
              <Star className="h-2.5 w-2.5" /> Premium
            </span>
          )}
          {p.is_blocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-black uppercase tracking-wider">
              <Lock className="h-2.5 w-2.5" /> Bloqueado
            </span>
          )}
          {!p.is_premium && !p.is_blocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
              Ativo
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {p.cidade || "—"}, {p.estado || "—"}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {p.last_login ? new Date(p.last_login).toLocaleString("pt-BR") : "Nunca logou"}
          </span>
          {p.premium_since && (
            <span className="text-[11px] text-amber-600 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Premium desde {new Date(p.premium_since).toLocaleDateString("pt-BR")}
            </span>
          )}
          {p.is_blocked && p.motivo_bloqueio && (
            <span className="text-[11px] text-destructive font-bold">
              Razão: {p.motivo_bloqueio}
            </span>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">ID: {p.id}</p>
      </div>

      {/* Action chips */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {/* Block/Unblock chip */}
        <button
          onClick={onBlock}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95",
            p.is_blocked
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-destructive/8 text-destructive border-destructive/30 hover:bg-destructive/15"
          )}
        >
          {p.is_blocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {p.is_blocked ? "Desbloquear" : "Bloquear"}
        </button>

        {/* Premium chip */}
        <button
          onClick={onTogglePremium}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all active:scale-95",
            p.is_premium
              ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
              : "bg-amber-50/50 text-amber-600 border-amber-200 hover:bg-amber-100"
          )}
        >
          <Star className="h-3 w-3" />
          {p.is_premium ? "Remover Premium" : "Dar Premium"}
        </button>
      </div>
    </div>
  );
}

// ─── StatsCard Component ──────────────────────────────────────────────────────
function StatsCard({ title, value, icon: Icon, color, description, onClick }: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string; 
  description: string;
  onClick?: () => void;
}) {
  const colorStyles = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-50 text-emerald-600 border-emerald-200",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "rounded-[28px] border-border/50 shadow-sm hover:shadow-md transition-all group overflow-hidden",
        onClick && "cursor-pointer hover:border-primary/30 hover:shadow-primary/5 active:scale-95"
      )}
    >
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
