import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, UserX, MessageSquare, Settings, Search, MapPin, 
  ShieldAlert, ShieldCheck, Trash2, ArrowLeft, TrendingUp, 
  Calendar, CheckCircle2, XCircle, ChevronRight, Lock, Unlock, Mail, Phone,
  BarChart3, PieChart, Activity, ExternalLink, Star, Sparkles, CircleDollarSign, Filter,
  BookOpen, Upload, FileText, Image, Eye, Download, X, Plus, Loader2, Tag, Gift,
  CreditCard, Crown, BadgeCheck, Hash, RefreshCw, CalendarCheck, HeadphonesIcon, FileUp,
  User, UserCheck
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
  created_at: string;
  cidade?: string;
  estado?: string;
  nome?: string;
  telefone?: string;
  paroquia?: string;
  diocese?: string;
  data_nascimento?: string;
  motivo_bloqueio?: string | null;
  role?: string;
  sub_admin_status?: string;
  sub_admin_created_by?: string;
  is_premium?: boolean;
  premium_since?: string | null;
  premium_expires_at?: string | null;
  premium_set_by?: string | null;
  premium_transaction_nsu?: string | null;
}

interface PaymentOrder {
  id: string;
  user_id: string | null;
  order_nsu: string;
  status: string;
  amount: number;
  created_at: string;
  paid_at: string | null;
  user_email: string | null;
  webhook_payload: any | null;
}

const BLOCK_REASONS = [
  "Usuário violou os termos de uso",
  "Uso do sistema para fins comerciais",
  "Usuário violou as regras de LGPD"
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

interface Atendimento {
  id: string;
  protocolo: string;
  usuario_id: string;
  email: string;
  telefone: string;
  tipo: string;
  mensagem: string;
  anexo_url: string | null;
  status: string;
  created_at: string;
  profiles?: {
    nome: string | null;
  } | null;
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
  const { signOut, isSuperAdmin, user } = useAuth();
  const qc = useQueryClient();

  const { data: currentAdminProfile } = useQuery({
    queryKey: ["currentAdminProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("profiles").select("nome, email").eq("id", user.id).single();
      return data;
    },
    enabled: !!user?.id
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [userToBlock, setUserToBlock] = useState<Profile | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  const DELETE_REASONS = [
    "Usuário teste",
    "Usuário solicitou a exclusão",
    "Usuário descumpriu os termos",
    "Usuário a mais de 1 ano inativo",
    "Usuário excluído por ordem judicial"
  ];

  // User Detail Panel state
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [userDetailId, setUserDetailId] = useState<string | null>(null);

  // Advanced Filters state
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterMes, setFilterMes] = useState("Todos");
  const [filterCidade, setFilterCidade] = useState("Todos");
  const [filterIdade, setFilterIdade] = useState("Todos");
  const [filterInatividade, setFilterInatividade] = useState("Todos");
  const [showFilters, setShowFilters] = useState(false);
  
  // Sub-admin states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isSubAdminLoading, setIsSubAdminLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Subscription management states
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<"all" | "premium" | "basic">("all");
  const [isPremiumDialogOpen, setIsPremiumDialogOpen] = useState(false);
  const [userToSetPremium, setUserToSetPremium] = useState<Profile | null>(null);
  const [premiumDuration, setPremiumDuration] = useState("1year");
  const [isSettingPremium, setIsSettingPremium] = useState(false);

  const [financeFilters, setFinanceFilters] = useState({
    estado: "Todos",
    cidade: "Todas",
    mes: "Todos",
    dia: "Todos"
  });

  const [selectedPayload, setSelectedPayload] = useState<any | null>(null);
  const [isPayloadDialogOpen, setIsPayloadDialogOpen] = useState(false);

  // Catalog states
  const [catalogMateriais, setCatalogMateriais] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogUploading, setCatalogUploading] = useState(false);
  const [catalogForm, setCatalogForm] = useState<{ titulo: string; descricao: string; categoria: string; preco: number; gratuito: boolean; destaque: boolean; tags: string; paginas: number | "" }>({ titulo: "", descricao: "", categoria: "", preco: 0, gratuito: false, destaque: false, tags: "", paginas: "" });
  const [catalogFile, setCatalogFile] = useState<File | null>(null);
  const [catalogGalleryFiles, setCatalogGalleryFiles] = useState<File[]>([]);

  const [atendimentoSearch, setAtendimentoSearch] = useState("");
  const catalogFileRef = useRef<HTMLInputElement>(null);
  const catalogGalleryInputRef = useRef<HTMLInputElement>(null);

  const fetchCatalogMateriais = async () => {
    setCatalogLoading(true);
    try {
      const { data, error } = await supabase
        .from("material_apoio")
        .select("*")
        .order("publicado_em", { ascending: false });
      if (!error) setCatalogMateriais(data || []);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleCatalogUpload = async () => {
    if (!catalogForm.titulo.trim()) { toast.error("Informe o nome do material."); return; }
    if (!catalogFile) { toast.error("Selecione um arquivo principal (PDF ou imagem)."); return; }
    setCatalogUploading(true);
    try {
      const ext = catalogFile.name.split(".").pop()?.toLowerCase() || "pdf";
      const tipo = ["jpg","jpeg","png","webp","gif"].includes(ext) ? "image" : "pdf";
      const sanitizedName = catalogFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.\-]/g, "_")
        .replace(/_+/g, "_");
      const fileName = `${Date.now()}_${sanitizedName}`;
      const { error: upErr } = await supabase.storage
        .from("materiais-apoio")
        .upload(fileName, catalogFile, { contentType: catalogFile.type, upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("materiais-apoio").getPublicUrl(fileName);
      const arquivo_url = urlData.publicUrl;

      let gallery_urls: string[] = [];
      if (catalogGalleryFiles.length > 0) {
        for (let i = 0; i < catalogGalleryFiles.length; i++) {
          const gFile = catalogGalleryFiles[i];
          const gSanitized = gFile.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.\-]/g, "_").replace(/_+/g, "_");
          const gFileName = `gallery_${Date.now()}_${i}_${gSanitized}`;
          const { error: gErr } = await supabase.storage
            .from("materiais-apoio")
            .upload(gFileName, gFile, { contentType: gFile.type, upsert: false });
          if (!gErr) {
            const { data: gUrl } = supabase.storage.from("materiais-apoio").getPublicUrl(gFileName);
            gallery_urls.push(gUrl.publicUrl);
          }
        }
      }

      const { error: dbErr } = await supabase.from("material_apoio").insert({
        titulo: catalogForm.titulo.trim(),
        descricao: catalogForm.descricao.trim() || null,
        categoria: catalogForm.categoria.trim() || null,
        preco: catalogForm.gratuito ? 0 : catalogForm.preco,
        gratuito: catalogForm.gratuito,
        destaque: catalogForm.destaque,
        tags: catalogForm.tags ? catalogForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        paginas: catalogForm.paginas === "" ? null : Number(catalogForm.paginas),
        gallery_urls: gallery_urls.length > 0 ? gallery_urls : null,
        arquivo_url,
        arquivo_tipo: tipo,
        tamanho_bytes: catalogFile.size,
        publicado_em: new Date().toISOString(),
        ativo: true,
        tipo: "link",
        url: arquivo_url,
        icone: tipo === "pdf" ? "FileText" : "Image",
        cor: tipo === "pdf" ? "bg-red-100 text-red-600" : "bg-violet-100 text-violet-600",
        ordem: 999
      });
      if (dbErr) throw dbErr;
      toast.success("Material publicado com sucesso!");
      setCatalogForm({ titulo: "", descricao: "", categoria: "", preco: 0, gratuito: false, destaque: false, tags: "", paginas: "" });
      setCatalogFile(null);
      setCatalogGalleryFiles([]);
      if (catalogFileRef.current) catalogFileRef.current.value = "";
      if (catalogGalleryInputRef.current) catalogGalleryInputRef.current.value = "";
      fetchCatalogMateriais();
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload.");
    } finally {
      setCatalogUploading(false);
    }
  };

  const handleDeleteMaterial = async (id: string, arquivo_url: string | null) => {
    if (!confirm("Deseja excluir este material permanentemente?")) return;
    try {
      if (arquivo_url) {
        const path = arquivo_url.split("/materiais-apoio/")[1];
        if (path) await supabase.storage.from("materiais-apoio").remove([path]);
      }
      await supabase.from("material_apoio").delete().eq("id", id);
      toast.success("Material excluído.");
      fetchCatalogMateriais();
    } catch (err: any) {
      toast.error("Erro ao excluir material.");
    }
  };

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

  // Query: payment orders
  const { data: paymentOrders = [], isLoading: loadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ["admin_payment_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as PaymentOrder[];
    },
    enabled: activeTab === "subscriptions"
  });

  // Query para buscar Atendimentos ao Cliente
  const { data: atendimentos = [], isLoading: loadingAtendimentos } = useQuery({
    queryKey: ["admin_atendimentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atendimentos")
        .select(`*, profiles(nome)`)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.warn("Erro ou tabela não encontrada:", error);
        return [];
      }
      return data as Atendimento[];
    },
    enabled: isSuperAdmin,
    staleTime: 1000 * 60 * 5,
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

  // Query: bloqueio global de inscrições
  const { data: inscricoesBloqueadas = false, isLoading: loadingBloqueio, refetch: refetchBloqueio } = useQuery({
    queryKey: ["admin_inscricoes_bloqueadas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "inscricoes_bloqueadas")
        .single();
      if (error) return false;
      return data?.value === "true";
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

  const toggleInscricoesBloqueadasMutation = useMutation({
    mutationFn: async (bloquear: boolean) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value: bloquear ? "true" : "false", updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq("key", "inscricoes_bloqueadas");
      if (error) throw error;
    },
    onSuccess: (_, bloquear) => {
      refetchBloqueio();
      toast.success(bloquear ? "⛔ Inscrições bloqueadas para todo o sistema!" : "✅ Inscrições liberadas!");
    },
    onError: () => {
      toast.error("Erro ao alterar status das inscrições. Tente novamente.");
    }
  });

  // User Detail Query
  const { data: userDetail, isLoading: loadingUserDetail } = useQuery({
    queryKey: ["admin_user_detail", userDetailId],
    queryFn: async () => {
      if (!userDetailId) return null;
      // Fetch turmas
      const { data: turmasData } = await supabase
        .from("turmas")
        .select("*")
        .eq("user_id", userDetailId)
        .order("criado_em", { ascending: false });
      
      // Fetch catequizandos
      const { data: catequizandosData } = await supabase
        .from("catequizandos")
        .select("id, nome, turma_id, data_nascimento, responsavel, telefone")
        .eq("user_id", userDetailId);
      
      // Fetch catequistas
      const { data: catequistasData } = await supabase
        .from("catequistas")
        .select("id, nome, telefone, email")
        .eq("user_id", userDetailId);
      
      // Fetch turma_catequistas junction
      const turmaIds = turmasData?.map(t => t.id) || [];
      let turmaCtqLinks: any[] = [];
      if (turmaIds.length > 0) {
        const { data } = await supabase
          .from("turma_catequistas")
          .select("turma_id, catequista_id")
          .in("turma_id", turmaIds);
        turmaCtqLinks = data || [];
      }

      // Fetch paroquias
      const { data: paroquiasData } = await supabase
        .from("paroquias")
        .select("*")
        .eq("user_id", userDetailId);
      
      return {
        turmas: turmasData || [],
        catequizandos: catequizandosData || [],
        catequistas: catequistasData || [],
        turmaCtqLinks,
        paroquias: paroquiasData || []
      };
    },
    enabled: !!userDetailId
  });

  // Derived Data
  const filterOptions = useMemo(() => {
    const estados = [...new Set(profiles.map(p => p.estado).filter(Boolean))].sort();
    const cidades = [...new Set(profiles.map(p => p.cidade).filter(Boolean))].sort();
    const anos = [...new Set(profiles.map(p => new Date(p.created_at).getFullYear()).filter(Boolean))].sort((a, b) => b - a);
    return { estados, cidades, anos };
  }, [profiles]);

  const filteredProfiles = useMemo(() => {
    const now = new Date();
    return profiles.filter(p => {
      // Exclude deleted
      if (p.is_blocked && p.motivo_bloqueio?.startsWith("EXCLUIDO:")) return false;
      
      // Search term
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        if (!((p.email?.toLowerCase() || "").includes(lower) ||
              (p.cidade?.toLowerCase() || "").includes(lower) ||
              (p.estado?.toLowerCase() || "").includes(lower) ||
              (p.nome?.toLowerCase() || "").includes(lower) ||
              (p.paroquia?.toLowerCase() || "").includes(lower)))
          return false;
      }
      
      // Estado filter
      if (filterEstado !== "Todos" && p.estado !== filterEstado) return false;
      
      // Ano filter
      if (filterAno !== "Todos" && new Date(p.created_at).getFullYear() !== parseInt(filterAno)) return false;
      
      // Mês filter
      if (filterMes !== "Todos" && (new Date(p.created_at).getMonth() + 1) !== parseInt(filterMes)) return false;
      
      // Cidade filter
      if (filterCidade !== "Todos" && p.cidade !== filterCidade) return false;
      
      // Idade filter
      if (filterIdade !== "Todos" && p.data_nascimento) {
        const birth = new Date(p.data_nascimento);
        const age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const [min, max] = filterIdade === "56+" ? [56, 999] : filterIdade.split("-").map(Number);
        if (age < min || age > max) return false;
      } else if (filterIdade !== "Todos" && !p.data_nascimento) {
        return false;
      }
      
      // Inatividade filter
      if (filterInatividade !== "Todos") {
        const lastLogin = p.last_login ? new Date(p.last_login) : null;
        const monthsMap: Record<string, number> = {
          "1 mês": 1,
          "3 meses": 3,
          "6 meses": 6,
          "Mais de 1 ano": 12
        };
        const months = monthsMap[filterInatividade];
        if (months) {
          const cutoff = new Date(now);
          cutoff.setMonth(cutoff.getMonth() - months);
          if (lastLogin && lastLogin > cutoff) return false;
          if (!lastLogin) return true; // Never logged in counts as inactive
        }
      }
      
      return true;
    });
  }, [profiles, searchTerm, filterEstado, filterAno, filterMes, filterCidade, filterIdade, filterInatividade]);

  const deletedProfiles = useMemo(() => {
    return profiles.filter(p => p.is_blocked && p.motivo_bloqueio?.startsWith("EXCLUIDO:"));
  }, [profiles]);

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



  const filteredFeedbackList = useMemo(() => {
    if (!atendimentoSearch) return atendimentos;
    const lowerSearch = atendimentoSearch.toLowerCase();
    return atendimentos.filter((atendimento: any) => 
      atendimento.protocolo?.toLowerCase().includes(lowerSearch) ||
      atendimento.email?.toLowerCase().includes(lowerSearch) ||
      atendimento.profiles?.nome?.toLowerCase().includes(lowerSearch)
    );
  }, [atendimentos, atendimentoSearch]);

  const churnList = sugestoes.filter(s => s.tipo === 'exclusao');

  if (loadingProfiles || loadingSugestoes || loadingSafety || loadingAtendimentos) {

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
          <div className="flex items-center gap-4">
            {currentAdminProfile && (
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-foreground">{currentAdminProfile.nome || 'Administrador'}</span>
                <span className="text-[10px] text-muted-foreground">{currentAdminProfile.email}</span>
              </div>
            )}
            <button onClick={() => navigate("/")} className="back-btn">
              <ArrowLeft className="h-5 w-5 text-black" />
            </button>
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
            title="Assinantes Premium" 
            value={stats.premium} 
            icon={Crown} 
            color="amber" 
            description={`R$ ${(stats.premium * 9.9).toFixed(2).replace('.', ',')} estimado`}
            onClick={() => setActiveTab("subscriptions")}
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
            <TabButton active={activeTab === "subscriptions"} onClick={() => setActiveTab("subscriptions")} icon={Crown} label="Assinaturas" />
            <TabButton active={activeTab === "catalog"} onClick={() => { setActiveTab("catalog"); fetchCatalogMateriais(); }} icon={BookOpen} label="Loja" />
            <TabButton active={activeTab === "safety"} onClick={() => setActiveTab("safety")} icon={ShieldAlert} label="Segurança" />
            <TabButton active={activeTab === "lixeira"} onClick={() => setActiveTab("lixeira")} icon={Trash2} label="Lixeira" />
            <TabButton active={activeTab === "churn"} onClick={() => setActiveTab("churn")} icon={UserX} label="Deserção" />
            <TabButton active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")} icon={HeadphonesIcon} label="Atendimento" />
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

                {/* Filter toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "rounded-xl text-xs font-bold gap-1.5",
                      [filterEstado, filterAno, filterMes, filterCidade, filterIdade, filterInatividade].filter(v => v !== "Todos").length > 0 && "border-primary text-primary"
                    )}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filtros
                    {[filterEstado, filterAno, filterMes, filterCidade, filterIdade, filterInatividade].filter(v => v !== "Todos").length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-black">
                        {[filterEstado, filterAno, filterMes, filterCidade, filterIdade, filterInatividade].filter(v => v !== "Todos").length}
                      </span>
                    )}
                  </Button>
                  {[filterEstado, filterAno, filterMes, filterCidade, filterIdade, filterInatividade].filter(v => v !== "Todos").length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterEstado("Todos");
                        setFilterAno("Todos");
                        setFilterMes("Todos");
                        setFilterCidade("Todos");
                        setFilterIdade("Todos");
                        setFilterInatividade("Todos");
                      }}
                      className="rounded-xl text-xs font-bold text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3 mr-1" /> Limpar
                    </Button>
                  )}
                </div>

                {/* Filter bar */}
                {showFilters && (
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {/* Estado */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Estado</label>
                        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="w-full h-9 rounded-xl border border-border/50 bg-white text-xs font-bold px-2">
                          <option value="Todos">Todos</option>
                          {filterOptions.estados.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      {/* Ano */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Ano Cadastro</label>
                        <select value={filterAno} onChange={(e) => setFilterAno(e.target.value)} className="w-full h-9 rounded-xl border border-border/50 bg-white text-xs font-bold px-2">
                          <option value="Todos">Todos</option>
                          {filterOptions.anos.map(a => <option key={a} value={String(a)}>{a}</option>)}
                        </select>
                      </div>
                      {/* Mês */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Mês Cadastro</label>
                        <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className="w-full h-9 rounded-xl border border-border/50 bg-white text-xs font-bold px-2">
                          <option value="Todos">Todos</option>
                          {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                            <option key={i+1} value={String(i+1)}>{m}</option>
                          ))}
                        </select>
                      </div>
                      {/* Cidade */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Cidade</label>
                        <select value={filterCidade} onChange={(e) => setFilterCidade(e.target.value)} className="w-full h-9 rounded-xl border border-border/50 bg-white text-xs font-bold px-2">
                          <option value="Todos">Todas</option>
                          {filterOptions.cidades.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {/* Idade */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Faixa Etária</label>
                        <select value={filterIdade} onChange={(e) => setFilterIdade(e.target.value)} className="w-full h-9 rounded-xl border border-border/50 bg-white text-xs font-bold px-2">
                          <option value="Todos">Todas</option>
                          <option value="18-25">18-25 anos</option>
                          <option value="26-35">26-35 anos</option>
                          <option value="36-45">36-45 anos</option>
                          <option value="46-55">46-55 anos</option>
                          <option value="56+">56+ anos</option>
                        </select>
                      </div>
                      {/* Inatividade */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Inatividade</label>
                        <select value={filterInatividade} onChange={(e) => setFilterInatividade(e.target.value)} className="w-full h-9 rounded-xl border border-border/50 bg-white text-xs font-bold px-2">
                          <option value="Todos">Todos</option>
                          <option value="1 mês">+1 mês</option>
                          <option value="3 meses">+3 meses</option>
                          <option value="6 meses">+6 meses</option>
                          <option value="Mais de 1 ano">+1 ano</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredProfiles.map((p) => (
                    <UserCard
                      key={p.id}
                      profile={p}
                      onClick={() => {
                        setUserDetailId(p.id);
                        setUserDetailOpen(true);
                      }}
                      onBlock={() => {
                        if (p.is_blocked) {
                          toggleBlockMutation.mutate({ id: p.id, is_blocked: false });
                        } else {
                          setUserToBlock(p);
                          setIsBlockDialogOpen(true);
                        }
                      }}
                      onDelete={() => {
                        setUserToDelete(p);
                        setIsDeleteDialogOpen(true);
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

            {/* ═══════════ SUBSCRIPTIONS TAB ═══════════ */}
            {activeTab === "subscriptions" && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Controle de Assinaturas</h2>
                    <p className="text-sm text-muted-foreground">
                      Gerencie os planos dos usuários — Básico e Premium
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      {(["all", "premium", "basic"] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => setSubscriptionFilter(f)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            subscriptionFilter === f
                              ? "bg-white shadow-sm text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {f === "all" ? "Todos" : f === "premium" ? "⭐ Premium" : "Básico"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-amber-700">{stats.premium}</div>
                    <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-1">Premium</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-slate-700">{stats.total - stats.premium}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Básico</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-black text-emerald-700">R$ {(stats.premium * 9.9).toFixed(2).replace('.', ',')}</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Receita Est.</div>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por e-mail..."
                    className="pl-9 rounded-xl border-border/50 h-10"
                    value={subscriptionSearch}
                    onChange={(e) => setSubscriptionSearch(e.target.value)}
                  />
                </div>

                {/* Users list */}
                <div className="space-y-2">
                  {profiles
                    .filter(p => {
                      const matchSearch = (p.email?.toLowerCase() || "").includes(subscriptionSearch.toLowerCase());
                      const matchFilter = subscriptionFilter === "all" ? true
                        : subscriptionFilter === "premium" ? p.is_premium
                        : !p.is_premium;
                      return matchSearch && matchFilter;
                    })
                    .map(p => (
                      <div key={p.id} className="bg-white border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-sm transition-all">
                        {/* Avatar */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0",
                          p.is_premium ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {p.is_premium ? <Crown className="w-5 h-5" /> : p.email.slice(0,2).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-foreground truncate">{p.email}</span>
                            {p.is_premium ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">
                                <Star className="w-2.5 h-2.5" /> Premium
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase">
                                Básico
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                            {p.is_premium && p.premium_since && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <CalendarCheck className="w-3 h-3" />
                                Premium desde {new Date(p.premium_since).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            {p.is_premium && p.premium_expires_at && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Expira {new Date(p.premium_expires_at).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                            {p.is_premium && p.premium_set_by && (
                              <span className="text-[11px] text-muted-foreground">
                                Via: {p.premium_set_by === "admin" ? "✋ Admin" : "🔗 Webhook"}
                              </span>
                            )}
                            {p.is_premium && p.premium_transaction_nsu && (
                              <span className="text-[10px] font-mono text-muted-foreground/70 flex items-center gap-1">
                                <Hash className="w-3 h-3" />{p.premium_transaction_nsu}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 shrink-0">
                          {p.is_premium ? (
                            <button
                              onClick={async () => {
                                if (!confirm(`Revogar premium de ${p.email}?`)) return;
                                const { error } = await supabase.from("profiles").update({
                                  is_premium: false,
                                  premium_since: null,
                                  premium_expires_at: null,
                                  premium_set_by: null,
                                }).eq("id", p.id);
                                if (!error) {
                                  qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                                  toast.success(`Premium de ${p.email} revogado.`);
                                } else {
                                  toast.error("Erro ao revogar premium.");
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold hover:bg-destructive/20 transition-all active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Revogar
                            </button>
                          ) : (
                            <button
                              onClick={() => { setUserToSetPremium(p); setIsPremiumDialogOpen(true); }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-200 transition-all active:scale-95"
                            >
                              <Crown className="w-3.5 h-3.5" /> Marcar Premium
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  }
                  {profiles.filter(p => {
                    const matchSearch = (p.email?.toLowerCase() || "").includes(subscriptionSearch.toLowerCase());
                    const matchFilter = subscriptionFilter === "all" ? true : subscriptionFilter === "premium" ? p.is_premium : !p.is_premium;
                    return matchSearch && matchFilter;
                  }).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Crown className="h-12 w-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold">Nenhum usuário encontrado</p>
                    </div>
                  )}
                </div>

                {/* Payment Orders History */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-wider">Histórico de Pedidos (NSU)</h3>
                    <button onClick={() => refetchOrders()} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Atualizar
                    </button>
                  </div>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : paymentOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      <CreditCard className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs font-bold">Nenhum pedido registrado ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paymentOrders.map(order => (
                        <div key={order.id} className="bg-white border border-border/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            order.status === "paid" ? "bg-emerald-100 text-emerald-600" :
                            order.status === "failed" ? "bg-destructive/10 text-destructive" :
                            "bg-amber-100 text-amber-600"
                          )}>
                            {order.status === "paid" ? <CheckCircle2 className="w-4 h-4" /> :
                             order.status === "failed" ? <XCircle className="w-4 h-4" /> :
                             <Loader2 className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono font-bold text-foreground truncate">{order.order_nsu}</span>
                              <span className={cn(
                                "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full",
                                order.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                                order.status === "failed" ? "bg-destructive/10 text-destructive" :
                                "bg-amber-100 text-amber-700"
                              )}>{order.status === "paid" ? "Pago" : order.status === "failed" ? "Falhou" : "Pendente"}</span>
                              
                              {!order.user_id && order.status === "paid" && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                  ⚠️ Vínculo Pendente (Órfão)
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {order.user_email ? order.user_email : order.user_id ? "Usuário ID: " + order.user_id : "Aguardando redirecionamento do usuário..."}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                              <p className="text-xs font-bold text-foreground">R$ {Number(order.amount || 9.9).toFixed(2).replace('.', ',')}</p>
                              <p className="text-[9px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                            {order.webhook_payload && (
                              <button
                                onClick={() => {
                                  setSelectedPayload(order.webhook_payload);
                                  setIsPayloadDialogOpen(true);
                                }}
                                className="p-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-1 font-bold"
                              >
                                <Eye className="w-3.5 h-3.5" /> Payload
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Dialog open={isPayloadDialogOpen} onOpenChange={setIsPayloadDialogOpen}>
                  <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                      <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        Dados Brutos do Webhook
                      </DialogTitle>
                      <DialogDescription>
                        Payload completo recebido via Webhook
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 p-6 pt-2">
                      <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[10px] overflow-x-auto font-mono whitespace-pre-wrap">
                        {selectedPayload ? JSON.stringify(selectedPayload, null, 2) : "Nenhum dado"}
                      </pre>
                    </ScrollArea>
                    <div className="p-4 border-t border-border/50 bg-slate-50 flex justify-end">
                      <Button variant="outline" onClick={() => setIsPayloadDialogOpen(false)}>Fechar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Atendimentos ao Cliente</h2>
                    <p className="text-sm text-muted-foreground">Gerencie as solicitações, dúvidas e reclamações</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por protocolo, email ou nome..."
                      value={atendimentoSearch}
                      onChange={(e) => setAtendimentoSearch(e.target.value)}
                      className="pl-9 bg-white dark:bg-zinc-900 border-2 rounded-xl w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFeedbackList.map((atendimento: any) => (
                    <div key={atendimento.id} className="p-5 rounded-2xl border-2 bg-card hover:border-primary/30 transition-all flex flex-col gap-3 group relative overflow-hidden">
                      <div className="flex justify-between items-start gap-2">
                        <div className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
                          atendimento.tipo === 'Fazer reclamação' || atendimento.tipo === 'Denúncia' ? "bg-destructive/10 text-destructive" :
                          atendimento.tipo === 'Fazer um elogio' ? "bg-emerald-100 text-emerald-700" :
                          "bg-primary/10 text-primary"
                        )}>
                          {atendimento.tipo}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(atendimento.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{atendimento.protocolo}</p>
                        <p className="text-sm font-bold truncate">
                          {atendimento.profiles?.nome ? `${atendimento.profiles.nome} (${atendimento.email})` : atendimento.email}
                        </p>
                        {atendimento.telefone && <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {atendimento.telefone}</p>}
                      </div>

                      <div className="p-3 rounded-xl bg-muted/30 text-sm flex-1 break-words">
                        {atendimento.mensagem}
                      </div>

                      {atendimento.anexo_url && (
                        <a 
                          href={atendimento.anexo_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 transition-colors"
                        >
                          <FileUp className="w-4 h-4" />
                          Ver Anexo
                        </a>
                      )}

                      <div className="flex justify-between items-center mt-2 pt-3 border-t">
                        <div className={cn(
                          "text-[10px] font-black uppercase px-2 py-1 rounded-full",
                          atendimento.status === 'Resolvido' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {atendimento.status}
                        </div>
                        {atendimento.status !== 'Resolvido' && (
                          <button 
                            onClick={async () => {
                              await supabase.from('atendimentos').update({ status: 'Resolvido' }).eq('id', atendimento.id);
                              toast.success("Atendimento marcado como resolvido!");
                              qc.invalidateQueries({ queryKey: ["admin_atendimentos"] });
                            }}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Marcar Resolvido
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredFeedbackList.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground">
                      <HeadphonesIcon className="w-12 h-12 mb-3 opacity-20" />
                      <p className="font-medium text-sm">Nenhum atendimento registrado.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "admins" && isSuperAdmin && (
              <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Gestão de Administradores</h2>
                    <p className="text-sm text-muted-foreground">Crie e gerencie o acesso de sub-administradores da plataforma</p>
                  </div>
                  <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl self-start sm:self-auto">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">
                      {profiles.filter(p => p.role === "sub_admin").length} Sub-Admins Ativos
                    </span>
                  </div>
                </div>

                {/* Hero Creation Card */}
                <div className="relative overflow-hidden rounded-[32px] shadow-2xl shadow-sky-500/25">
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-blue-500 to-sky-700" />
                  {/* Decorative orbs */}
                  <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-300/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
                  {/* Grid pattern */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

                  <div className="relative z-10 p-8">
                    {/* Card header */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                        <ShieldCheck className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Novo Sub-Administrador</h3>
                        <p className="text-sky-100 text-sm mt-0.5">Conceda acesso ao painel de controle iCatequese</p>
                      </div>
                      <div className="ml-auto hidden md:flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Sistema Online</span>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-sky-100 uppercase tracking-[0.15em]">Email do Administrador</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-200 z-10" />
                          <input
                            type="email"
                            placeholder="admin@icatequese.com"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-sky-200/50 text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-sky-100 uppercase tracking-[0.15em]">Senha Provisória</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-200 z-10" />
                          <input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-sky-200/50 text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all"
                          />
                        </div>
                        {adminPassword.length > 0 && adminPassword.length < 6 && (
                          <p className="text-[10px] text-orange-300 font-bold flex items-center gap-1">⚠ Mínimo 6 caracteres</p>
                        )}
                      </div>
                    </div>

                    {/* Info notice */}
                    <div className="mt-5 p-4 bg-white/10 border border-white/15 rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-[11px] text-sky-100/90 leading-relaxed">
                        <span className="font-bold text-white">Permissões do Sub-Admin:</span> Acesso completo ao painel exceto criação de outros admins e configurações do sistema.
                      </p>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={async () => {
                        if (!adminEmail || !adminPassword) { toast.error("Por favor, informe email e senha."); return; }
                        if (adminPassword.length < 6) { toast.error("A senha deve conter no mínimo 6 caracteres."); return; }
                        setIsSubAdminLoading(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("update-platform-access", {
                            body: { action: "create", email: adminEmail, password: adminPassword, adminSecret: "icatequese-admin-2026" }
                          });
                          if (error) { toast.error(error.message || "Erro ao criar sub-administrador."); return; }
                          if (data?.error) { toast.error(data.error); return; }
                          setCreatedCredentials({ email: adminEmail, password: adminPassword });
                          setAdminEmail(""); setAdminPassword("");
                          qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                          toast.success(data?.promoted ? "Usuário promovido a Sub-Admin!" : "Sub-admin criado com sucesso!");
                        } catch (err: any) {
                          console.error("[iCatequese] Erro:", err);
                          toast.error(err.message || "Erro ao criar sub-administrador.");
                        } finally {
                          setIsSubAdminLoading(false);
                        }
                      }}
                      disabled={isSubAdminLoading || !adminEmail || adminPassword.length < 6}
                      className="mt-6 w-full h-14 rounded-2xl bg-white text-indigo-700 font-black text-sm uppercase tracking-widest hover:bg-indigo-50 active:scale-[0.98] transition-all shadow-xl shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isSubAdminLoading ? (
                        <><div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-700 rounded-full animate-spin" /> Criando Administrador...</>
                      ) : (
                        <><Plus className="h-5 w-5" /> Criar Administrador</>
                      )}
                    </button>
                  </div>
                </div>

                {/* List separator */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Administradores Cadastrados</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>


                {profiles.filter(p => p.role === "sub_admin").length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-slate-200 rounded-[28px] bg-slate-50/50">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                      <ShieldCheck className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="text-sm font-bold">Nenhum sub-administrador cadastrado ainda</p>
                    <p className="text-xs text-muted-foreground mt-1">Use o formulário acima para criar o primeiro</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profiles.filter(p => p.role === "sub_admin").map((admin) => (
                      <div key={admin.id} className={cn(
                        "relative overflow-hidden rounded-[24px] border bg-white hover:shadow-lg transition-all duration-300",
                        admin.sub_admin_status === "active" ? "border-emerald-200/60 hover:border-emerald-300" :
                        admin.sub_admin_status === "paused" ? "border-amber-200/60 hover:border-amber-300" :
                        "border-destructive/20 opacity-70"
                      )}>
                        <div className={cn("h-1.5 w-full",
                          admin.sub_admin_status === "active" ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
                          admin.sub_admin_status === "paused" ? "bg-gradient-to-r from-amber-400 to-orange-400" :
                          "bg-gradient-to-r from-red-400/50 to-red-300/30"
                        )} />
                        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 border",
                            admin.sub_admin_status === "active" ? "bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200" :
                            admin.sub_admin_status === "paused" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-100 text-slate-400 border-slate-200"
                          )}>
                            {admin.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-sm font-black text-foreground truncate">{admin.email}</p>
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                admin.sub_admin_status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                admin.sub_admin_status === "paused" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-red-50 text-red-600 border-red-200"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full",
                                  admin.sub_admin_status === "active" ? "bg-emerald-500 animate-pulse" :
                                  admin.sub_admin_status === "paused" ? "bg-amber-500" : "bg-red-500"
                                )} />
                                {admin.sub_admin_status === "active" ? "Ativo" : admin.sub_admin_status === "paused" ? "Pausado" : "Revogado"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 shrink-0" /> Sub-Administrador
                              {admin.sub_admin_created_by && ` · Criado por: ${admin.sub_admin_created_by}`}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            {admin.sub_admin_status === "active" ? (
                              <button onClick={async () => {
                                const { error } = await supabase.from("profiles").update({ sub_admin_status: "paused" }).eq("id", admin.id);
                                if (!error) { qc.invalidateQueries({ queryKey: ["admin_profiles"] }); toast.success("Acesso pausado."); }
                                else toast.error("Erro ao pausar acesso.");
                              }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors active:scale-95">
                                <Lock className="h-3.5 w-3.5" /> Pausar
                              </button>
                            ) : (
                              <button onClick={async () => {
                                const { error } = await supabase.from("profiles").update({ sub_admin_status: "active" }).eq("id", admin.id);
                                if (!error) { qc.invalidateQueries({ queryKey: ["admin_profiles"] }); toast.success("Acesso reativado."); }
                                else toast.error("Erro ao ativar acesso.");
                              }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors active:scale-95">
                                <Unlock className="h-3.5 w-3.5" /> Reativar
                              </button>
                            )}
                            {admin.sub_admin_status !== "revoked" && (
                              <button onClick={async () => {
                                const { error } = await supabase.from("profiles").update({ sub_admin_status: "revoked" }).eq("id", admin.id);
                                if (!error) { qc.invalidateQueries({ queryKey: ["admin_profiles"] }); toast.success("Acesso revogado."); }
                                else toast.error("Erro ao revogar acesso.");
                              }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors active:scale-95">
                                <XCircle className="h-3.5 w-3.5" /> Revogar
                              </button>
                            )}
                            <button onClick={async () => {
                              if (!confirm(`Excluir permanentemente ${admin.email}?`)) return;
                              setIsSubAdminLoading(true);
                              try {
                                const { data, error } = await supabase.functions.invoke("update-platform-access", {
                                  body: { action: "delete", userId: admin.id, adminSecret: "icatequese-admin-2026" }
                                });
                                if (error || data?.error) { toast.error((error?.message || data?.error) || "Erro ao excluir."); return; }
                                qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                                toast.success("Sub-admin excluído com sucesso!");
                              } catch (err: any) {
                                toast.error(err.message || "Erro ao excluir.");
                              } finally {
                                setIsSubAdminLoading(false);
                              }
                            }} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-muted-foreground hover:bg-destructive hover:border-destructive hover:text-white transition-all active:scale-95">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {activeTab === "catalog" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Loja de Materiais</h2>
                    <p className="text-sm text-muted-foreground">Publique PDFs e imagens para os usuários</p>
                  </div>
                </div>

                {/* Upload Card */}
                <Card className="rounded-[24px] border-2 border-dashed border-primary/30 bg-primary/2 shadow-none">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm">Novo Material</h3>
                        <p className="text-xs text-muted-foreground">PDF ou imagem (máx. 50MB)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome *</label>
                        <Input
                          placeholder="Ex: Hinário da Quaresma 2025"
                          value={catalogForm.titulo}
                          onChange={(e) => setCatalogForm(prev => ({ ...prev, titulo: e.target.value }))}
                          className="rounded-xl h-10 border-border/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</label>
                        <Input
                          placeholder="Ex: Hinários, Liturgia, Formação..."
                          value={catalogForm.categoria}
                          onChange={(e) => setCatalogForm(prev => ({ ...prev, categoria: e.target.value }))}
                          className="rounded-xl h-10 border-border/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descrição (opcional)</label>
                      <Input
                        placeholder="Breve descrição do conteúdo..."
                        value={catalogForm.descricao}
                        onChange={(e) => setCatalogForm(prev => ({ ...prev, descricao: e.target.value }))}
                        className="rounded-xl h-10 border-border/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preço (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 19.90"
                          value={catalogForm.preco}
                          onChange={(e) => setCatalogForm(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
                          disabled={catalogForm.gratuito}
                          className="rounded-xl h-10 border-border/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</label>
                        <Input
                          placeholder="Ex: quaresma, infantil, jogos..."
                          value={catalogForm.tags}
                          onChange={(e) => setCatalogForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="rounded-xl h-10 border-border/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Páginas (opcional)</label>
                        <Input
                          type="number"
                          placeholder="Ex: 45"
                          value={catalogForm.paginas}
                          onChange={(e) => setCatalogForm(prev => ({ ...prev, paginas: e.target.value === "" ? "" : Number(e.target.value) }))}
                          className="rounded-xl h-10 border-border/50"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4 p-3 bg-muted/30 rounded-xl border border-border/50">
                      <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={catalogForm.gratuito} 
                          onChange={(e) => setCatalogForm(prev => ({ ...prev, gratuito: e.target.checked }))} 
                          className="w-4 h-4 rounded border-border"
                        /> Gratuito
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={catalogForm.destaque} 
                          onChange={(e) => setCatalogForm(prev => ({ ...prev, destaque: e.target.checked }))} 
                          className="w-4 h-4 rounded border-border text-amber-500"
                        /> Destaque na Loja
                      </label>
                    </div>

                    {/* File Picker */}
                    <div
                      onClick={() => catalogFileRef.current?.click()}
                      className="relative border-2 border-dashed border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/3 transition-all group"
                    >
                      <input
                        ref={catalogFileRef}
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => setCatalogFile(e.target.files?.[0] || null)}
                      />
                      {catalogFile ? (
                        <>
                          <div className="flex items-center gap-3">
                            {["jpg","jpeg","png","webp","gif"].includes(catalogFile.name.split(".").pop()?.toLowerCase() || "") ? (
                              <Image className="h-8 w-8 text-violet-500" />
                            ) : (
                              <FileText className="h-8 w-8 text-red-500" />
                            )}
                            <div>
                              <p className="text-sm font-bold text-foreground">{catalogFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(catalogFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCatalogFile(null); if (catalogFileRef.current) catalogFileRef.current.value = ""; }}
                            className="text-[10px] font-bold text-destructive hover:text-destructive/80 flex items-center gap-1 mt-1"
                          >
                            <X className="h-3 w-3" /> Remover arquivo
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-bold text-foreground">Clique para selecionar o arquivo</p>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP ou GIF</p>
                        </>
                      )}
                    </div>

                    {/* Multiple Gallery Images Picker */}
                    <div
                      onClick={() => catalogGalleryInputRef.current?.click()}
                      className="relative border-2 border-dashed border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/3 transition-all group"
                    >
                      <input
                        ref={catalogGalleryInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => setCatalogGalleryFiles(Array.from(e.target.files || []))}
                      />
                      {catalogGalleryFiles.length > 0 ? (
                        <>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {catalogGalleryFiles.map((file, i) => (
                              <div key={i} className="flex items-center gap-2 bg-muted p-2 rounded-xl">
                                <Image className="h-5 w-5 text-violet-500 shrink-0" />
                                <span className="text-xs font-bold truncate max-w-[100px]">{file.name}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setCatalogGalleryFiles([]); if (catalogGalleryInputRef.current) catalogGalleryInputRef.current.value = ""; }}
                            className="text-[10px] font-bold text-destructive hover:text-destructive/80 flex items-center gap-1 mt-2"
                          >
                            <X className="h-3 w-3" /> Limpar galeria
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Image className="h-6 w-6 text-violet-500" />
                          </div>
                          <p className="text-sm font-bold text-foreground">Imagens de Galeria / Demonstração (Opcional)</p>
                          <p className="text-xs text-muted-foreground">Adicione múltiplas imagens do produto</p>
                        </>
                      )}
                    </div>

                    <Button
                      onClick={handleCatalogUpload}
                      disabled={catalogUploading || !catalogFile || !catalogForm.titulo.trim()}
                      className="w-full rounded-xl h-11 font-bold gap-2"
                    >
                      {catalogUploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                      ) : (
                        <><Plus className="h-4 w-4" /> Publicar Material</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Materials Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground text-sm">Materiais Publicados</h3>
                    <Badge className="bg-primary/10 text-primary border-none text-xs font-bold px-3 py-1">
                      {catalogMateriais.filter(m => m.ativo !== false).length} ativos
                    </Badge>
                  </div>

                  {catalogLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  ) : catalogMateriais.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      <BookOpen className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm font-bold">Nenhum material publicado ainda</p>
                      <p className="text-xs mt-1">Use o formulário acima para adicionar o primeiro</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catalogMateriais.map((mat) => {
                        const isPdf = mat.arquivo_tipo === "pdf" || (mat.arquivo_url && mat.arquivo_url.includes(".pdf"));
                        const fileUrl = mat.arquivo_url || mat.url;
                        const isNew = mat.publicado_em && (Date.now() - new Date(mat.publicado_em).getTime() < 7 * 24 * 60 * 60 * 1000);
                        return (
                          <div key={mat.id} className={cn(
                            "rounded-2xl border bg-white p-4 flex flex-col gap-3 hover:shadow-md transition-all",
                            !mat.ativo && "opacity-50 border-dashed"
                          )}>
                            {/* Preview */}
                            <div className="w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center relative">
                              {isPdf ? (
                                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center gap-1">
                                  <FileText className="h-10 w-10 text-white" strokeWidth={1.5} />
                                  <span className="text-[10px] font-black text-white tracking-widest bg-red-900/40 px-2 py-0.5 rounded">PDF</span>
                                </div>
                              ) : mat.arquivo_url ? (
                                <img src={mat.arquivo_url} alt={mat.titulo} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                                  <Image className="h-10 w-10 text-white" strokeWidth={1.5} />
                                </div>
                              )}
                              {isNew && (
                                <span className="absolute top-2 left-2 text-[9px] font-black bg-amber-400 text-white px-2 py-0.5 rounded-full">NOVO</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              {mat.categoria && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">{mat.categoria}</span>
                              )}
                              <p className="text-sm font-bold text-foreground mt-1 line-clamp-2">{mat.titulo}</p>
                              {mat.descricao && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mat.descricao}</p>
                              )}
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/40">
                                <span className={cn("text-xs font-black", mat.gratuito || mat.preco === 0 ? "text-blue-600" : "text-primary")}>
                                  {mat.gratuito || mat.preco === 0 ? "Grátis" : mat.preco?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                                <div className="flex gap-2">
                                  {mat.tamanho_bytes && (
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {mat.tamanho_bytes > 1024*1024 ? `${(mat.tamanho_bytes/1024/1024).toFixed(1)} MB` : `${Math.round(mat.tamanho_bytes/1024)} KB`}
                                    </span>
                                  )}
                                  {mat.publicado_em && (
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {new Date(mat.publicado_em).toLocaleDateString("pt-BR")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              {fileUrl && (
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Ver
                                </a>
                              )}
                              <button
                                onClick={async () => {
                                  const newAtivo = !mat.ativo;
                                  await supabase.from("material_apoio").update({ ativo: newAtivo }).eq("id", mat.id);
                                  toast.success(newAtivo ? "Material ativado." : "Material ocultado.");
                                  fetchCatalogMateriais();
                                }}
                                className={cn(
                                  "flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition-colors",
                                  mat.ativo
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                )}
                              >
                                {mat.ativo ? "Ocultar" : "Ativar"}
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(mat.id, mat.arquivo_url)}
                                className="w-9 flex items-center justify-center rounded-xl bg-destructive/8 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 hover:border-destructive transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "lixeira" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Lixeira (Usuários Excluídos)</h2>
                    <p className="text-sm text-muted-foreground">{deletedProfiles.length} usuários na lixeira</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {deletedProfiles.map((p) => (
                    <UserCard
                      key={p.id}
                      profile={p}
                      onBlock={() => {}}
                      onDelete={() => {
                        // Restaurar usuário
                        toggleBlockMutation.mutate({ id: p.id, is_blocked: false });
                        toast.success("Usuário restaurado com sucesso!");
                      }}
                    />
                  ))}
                  {deletedProfiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Trash2 className="h-12 w-12 mb-3 opacity-20" />
                      <p className="text-sm font-bold">Lixeira vazia</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Configurações do Sistema</h2>
                  <p className="text-sm text-muted-foreground">Gerencie o acesso administrativo, inscrições e segurança</p>
                </div>

                {/* ── Bloqueio Global de Inscrições ── */}
                <Card className={cn(
                  "rounded-[24px] border-2 shadow-sm overflow-hidden transition-all duration-300",
                  inscricoesBloqueadas
                    ? "border-destructive/40 shadow-destructive/10"
                    : "border-emerald-400/40 shadow-emerald-500/10"
                )}>
                  <div className={cn(
                    "p-6 border-b flex items-center gap-4 transition-colors duration-300",
                    inscricoesBloqueadas ? "bg-destructive/5 border-destructive/20" : "bg-emerald-50 border-emerald-200/60"
                  )}>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
                      inscricoesBloqueadas ? "bg-destructive/15 text-destructive" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {inscricoesBloqueadas ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-black text-base uppercase tracking-wide transition-colors duration-300",
                        inscricoesBloqueadas ? "text-destructive" : "text-emerald-700"
                      )}>
                        {inscricoesBloqueadas ? "Inscrições Bloqueadas" : "Inscrições Abertas"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {inscricoesBloqueadas
                          ? "Nenhum novo aluno consegue se inscrever pelo app"
                          : "Alunos podem se inscrever normalmente pelo link da turma"}
                      </p>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      id="toggle-inscricoes-bloqueadas"
                      onClick={() => toggleInscricoesBloqueadasMutation.mutate(!inscricoesBloqueadas)}
                      disabled={toggleInscricoesBloqueadasMutation.isPending || loadingBloqueio}
                      className={cn(
                        "relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
                        inscricoesBloqueadas
                          ? "bg-destructive focus:ring-destructive"
                          : "bg-emerald-500 focus:ring-emerald-500"
                      )}
                      aria-label="Bloquear ou liberar inscrições"
                    >
                      <span className={cn(
                        "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300",
                        inscricoesBloqueadas ? "translate-x-7" : "translate-x-0"
                      )} />
                    </button>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    {inscricoesBloqueadas ? (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/5 border border-destructive/15">
                        <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-black text-destructive uppercase tracking-wide">Sistema de inscrições suspenso</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Quando um usuário tentar se cadastrar, verá uma tela informando que o sistema está temporariamente suspenso
                            e o redirecionará para o e-mail de contato.
                          </p>
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-destructive/10">
                            <Mail className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-xs font-bold text-destructive">icatequese2026@gmail.com</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-black text-emerald-700 uppercase tracking-wide">Sistema funcionando normalmente</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Alunos podem acessar o link da turma e realizar inscrições. Ative o bloqueio para
                            suspender temporariamente todas as novas inscrições do sistema.
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => toggleInscricoesBloqueadasMutation.mutate(!inscricoesBloqueadas)}
                      disabled={toggleInscricoesBloqueadasMutation.isPending || loadingBloqueio}
                      className={cn(
                        "w-full rounded-xl font-bold h-12 gap-2 transition-all",
                        inscricoesBloqueadas
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-destructive hover:bg-destructive/90 text-white"
                      )}
                    >
                      {toggleInscricoesBloqueadasMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                      ) : inscricoesBloqueadas ? (
                        <><Unlock className="h-4 w-4" /> Liberar Inscrições
                        </>
                      ) : (
                        <><Lock className="h-4 w-4" /> Bloquear Inscrições
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* ── Segurança Administrativa ── */}
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

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center text-destructive">Excluir Usuário</DialogTitle>
            <DialogDescription className="text-center">
              Atenção! Esta ação enviará <strong>{userToDelete?.email}</strong> para a Lixeira e revogará seu acesso.
              Selecione o motivo da exclusão:
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            {DELETE_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setDeleteReason(reason)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center gap-4",
                  deleteReason === reason 
                    ? "border-destructive bg-destructive/5 text-destructive shadow-md scale-[1.01]" 
                    : "border-border/40 hover:border-destructive/30 hover:bg-slate-50 text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                  deleteReason === reason ? "border-destructive bg-destructive" : "border-muted-foreground/30"
                )}>
                  {deleteReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white animate-in zoom-in-50" />}
                </div>
                {reason}
              </button>
            ))}
            
            {deleteReason && (
              <div className="mt-4 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold flex gap-2 items-start">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>Tem certeza que deseja excluir este usuário? Você poderá restaurá-lo na lixeira caso precise.</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeleteReason("");
              setUserToDelete(null);
            }} className="rounded-xl h-12 border-2 flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (userToDelete) {
                  toggleBlockMutation.mutate({ id: userToDelete.id, is_blocked: true, reason: "EXCLUIDO: " + deleteReason });
                  setIsDeleteDialogOpen(false);
                  setUserToDelete(null);
                  setDeleteReason("");
                }
              }} 
              disabled={!deleteReason || toggleBlockMutation.isPending}
              className="flex-1 rounded-xl h-12 font-bold bg-destructive hover:bg-destructive/90"
            >
              {toggleBlockMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
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

      {/* Set Premium Dialog */}
      <Dialog open={isPremiumDialogOpen} onOpenChange={setIsPremiumDialogOpen}>
        <DialogContent className="rounded-[32px] border-none shadow-2xl p-8 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center flex items-center justify-center gap-2">
              <Crown className="h-6 w-6 text-amber-500" />
              Ativar Premium
            </DialogTitle>
            <DialogDescription className="text-center">
              Marcar <strong>{userToSetPremium?.email}</strong> como assinante Premium manualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Duração da assinatura:</p>
              <div className="space-y-2">
                {[
                  { value: "1year", label: "1 Ano", desc: "Expira em " + new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString("pt-BR") },
                  { value: "6months", label: "6 Meses", desc: "Expira em " + new Date(Date.now() + 180*24*60*60*1000).toLocaleDateString("pt-BR") },
                  { value: "lifetime", label: "Vitalício", desc: "Sem data de expiração" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPremiumDuration(opt.value)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                      premiumDuration === opt.value
                        ? "border-amber-400 bg-amber-50"
                        : "border-border/40 hover:border-amber-200"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      premiumDuration === opt.value ? "border-amber-500 bg-amber-500" : "border-muted-foreground/30"
                    )}>
                      {premiumDuration === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPremiumDialogOpen(false)} className="rounded-xl h-12 border-2">Cancelar</Button>
            <Button
              disabled={isSettingPremium}
              onClick={async () => {
                if (!userToSetPremium) return;
                setIsSettingPremium(true);
                try {
                  let expiresAt: string | null = null;
                  if (premiumDuration === "1year") {
                    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                    expiresAt = d.toISOString();
                  } else if (premiumDuration === "6months") {
                    const d = new Date(); d.setMonth(d.getMonth() + 6);
                    expiresAt = d.toISOString();
                  }
                  const { error } = await supabase.from("profiles").update({
                    is_premium: true,
                    premium_since: new Date().toISOString(),
                    premium_expires_at: expiresAt,
                    premium_set_by: "admin",
                  }).eq("id", userToSetPremium.id);
                  if (error) throw error;
                  qc.invalidateQueries({ queryKey: ["admin_profiles"] });
                  toast.success(`✅ ${userToSetPremium.email} agora é Premium!`);
                  setIsPremiumDialogOpen(false);
                  setUserToSetPremium(null);
                } catch (err: any) {
                  toast.error(err.message || "Erro ao ativar premium.");
                } finally {
                  setIsSettingPremium(false);
                }
              }}
              className="flex-1 rounded-xl h-12 font-bold bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSettingPremium ? "Ativando..." : "⭐ Confirmar Premium"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* User Detail Panel */}
      <Dialog open={userDetailOpen} onOpenChange={(open) => { setUserDetailOpen(open); if (!open) setUserDetailId(null); }}>
        <DialogContent className="w-[95%] max-w-[700px] max-h-[85vh] rounded-[32px] p-0 bg-white border-2 border-border/50 shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-sky-500/10 p-6 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center font-black text-lg text-primary">
                {profiles.find(p => p.id === userDetailId)?.email?.slice(0,2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-black text-foreground">{profiles.find(p => p.id === userDetailId)?.nome || profiles.find(p => p.id === userDetailId)?.email}</h2>
                <p className="text-sm text-muted-foreground">{profiles.find(p => p.id === userDetailId)?.email}</p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="max-h-[calc(85vh-120px)]">
            <div className="p-6 space-y-6">
              {loadingUserDetail ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                </div>
              ) : (
                <>
                  {/* Ficha Cadastral */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Ficha Cadastral
                    </h3>
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                      {(() => {
                        const u = profiles.find(p => p.id === userDetailId);
                        if (!u) return null;
                        const fields = [
                          { label: "Nome", value: u.nome },
                          { label: "Email", value: u.email },
                          { label: "Telefone", value: u.telefone },
                          { label: "Paróquia", value: u.paroquia },
                          { label: "Diocese", value: u.diocese },
                          { label: "Estado", value: u.estado },
                          { label: "Cidade", value: u.cidade },
                          { label: "Nascimento", value: u.data_nascimento },
                          { label: "Cadastro", value: u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—" },
                          { label: "Último Login", value: u.last_login ? new Date(u.last_login).toLocaleString("pt-BR") : "Nunca logou" },
                        ];
                        return fields.map((f, i) => (
                          <div key={i} className="flex justify-between py-1.5 border-b border-black/5 last:border-0">
                            <span className="text-xs font-bold text-muted-foreground uppercase">{f.label}</span>
                            <span className="text-sm font-semibold text-foreground">{f.value || "—"}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Turmas Criadas */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Turmas Criadas ({userDetail?.turmas.length || 0})
                    </h3>
                    {userDetail?.turmas.length === 0 ? (
                      <p className="text-sm text-muted-foreground bg-slate-50 rounded-2xl p-4 text-center">Nenhuma turma criada</p>
                    ) : (
                      <div className="space-y-3">
                        {userDetail?.turmas.map((turma: any) => {
                          const ctqLinks = userDetail.turmaCtqLinks.filter((l: any) => l.turma_id === turma.id);
                          const catequistasInTurma = userDetail.catequistas.filter((c: any) => 
                            ctqLinks.some((l: any) => l.catequista_id === c.id)
                          );
                          const catequizandosInTurma = userDetail.catequizandos.filter((c: any) => c.turma_id === turma.id);
                          
                          return (
                            <div key={turma.id} className="bg-slate-50 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-black text-foreground">{turma.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {turma.etapa && <Badge variant="secondary" className="mr-1 text-[9px] font-bold">{turma.etapa}</Badge>}
                                    {turma.ano && <span className="mr-2">Ano: {turma.ano}</span>}
                                    {turma.dia_catequese && <span className="mr-2">{turma.dia_catequese}</span>}
                                    {turma.horario && <span>{turma.horario}</span>}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                                    {catequizandosInTurma.length} catequizandos
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Catequistas */}
                              {catequistasInTurma.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Catequistas</p>
                                  <div className="flex flex-wrap gap-1">
                                    {catequistasInTurma.map((c: any) => (
                                      <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                        <UserCheck className="h-2.5 w-2.5" /> {c.nome}{c.funcao ? ` (${c.funcao})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Resumo Geral */}
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Resumo Geral
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-primary/5 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-primary">{userDetail?.turmas.length || 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Turmas</p>
                      </div>
                      <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-emerald-600">{userDetail?.catequistas.length || 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Catequistas</p>
                      </div>
                      <div className="bg-sky-50 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-sky-600">{userDetail?.catequizandos.length || 0}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Catequizandos</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ─── UserCard Component ───────────────────────────────────────────────────────
function UserCard({
  profile: p,
  onBlock,
  onDelete,
  onClick,
}: {
  profile: Profile;
  onBlock: () => void;
  onDelete: () => void;
  onClick: () => void;
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
      {/* Clickable area for details */}
      <div 
        className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer min-w-0 group"
        onClick={onClick}
      >
        {/* Avatar */}
        <div className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-transform group-hover:scale-105",
          avatarColors[colorIdx]
        )}>
          {initials}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-sm font-black text-foreground truncate">{p.email}</span>
          {p.is_blocked && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-black uppercase tracking-wider">
              <Lock className="h-2.5 w-2.5" /> Bloqueado
            </span>
          )}
          {!p.is_blocked && (
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

          {p.is_blocked && p.motivo_bloqueio && (
            <span className="text-[11px] text-destructive font-bold">
              Razão: {p.motivo_bloqueio}
            </span>
          )}
        </div>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono">ID: {p.id}</p>
      </div>

      <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 hidden sm:block group-hover:text-primary transition-colors cursor-pointer" />
      </div>

      {/* Action chips */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {p.is_blocked && p.motivo_bloqueio?.startsWith("EXCLUIDO:") ? (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95"
          >
            <RefreshCw className="h-3 w-3" /> Restaurar
          </button>
        ) : (
          <>
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
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95"
            >
              <Trash2 className="h-3 w-3" /> Excluir
            </button>
          </>
        )}
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
