import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key,
  CheckCircle2, ChevronRight,
  ArrowLeft, HelpCircle, Sparkles, User, Phone, Mail,
  X, Loader2, MapPin, GraduationCap, Pencil, Plus, LogIn, Lock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCatequistaMutation,
  useParoquiaMutation,
  useComunidadeMutation,
  useTurmaMutation,
  useCatequistas,
  useParoquias,
  useComunidades,
} from "@/hooks/useSupabaseData";
import { NOMES_TURMA, DIAS_SEMANA } from "@/lib/store";
import { toast } from "sonner";
import { mascaraTelefone } from "@/lib/utils";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { JoinTurmaModal } from "@/components/JoinTurmaModal";

export const ONBOARDING_KEY = "ivc_onboarding_completed";

// ── Cálculo de idade sem problema de fuso horário ──
function calcAge(birth: string): number | null {
  if (!birth) return null;
  const dateStr = birth.includes("T") ? birth : birth + "T12:00:00";
  const b = new Date(dateStr);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  )
    age--;
  return age;
}

// ─────────────────────────────────────────────────
//  Sub-componente: Card de etapa
// ─────────────────────────────────────────────────
interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  subtitle?: string;
  done: boolean;
  expanded: boolean;
  locked?: boolean;
  onAdd: () => void;
  onCollapse: () => void;
  children?: React.ReactNode;
  themeColor: "sky" | "amber" | "emerald";
  footerActions?: React.ReactNode;
}

function StepCard({
  icon, title, description, subtitle, done, expanded, locked, onAdd, onCollapse,
  children, themeColor, footerActions,
}: StepCardProps) {
  const themes = {
    sky: {
      border: "border-sky-200",
      bgOpen: "bg-white",
      bgClosed: "bg-sky-50",
      bgDone: "bg-sky-50/50",
      iconBg: "bg-sky-100",
      iconText: "text-sky-600",
      shadow: "shadow-sky-500/10",
      button: "bg-sky-500 hover:bg-sky-600 text-white shadow-sky-500/25"
    },
    amber: {
      border: "border-amber-200",
      bgOpen: "bg-white",
      bgClosed: "bg-amber-50",
      bgDone: "bg-amber-50/50",
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      shadow: "shadow-amber-500/10",
      button: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25"
    },
    emerald: {
      border: "border-emerald-200",
      bgOpen: "bg-white",
      bgClosed: "bg-emerald-50",
      bgDone: "bg-emerald-50/50",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      shadow: "shadow-emerald-500/10",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25"
    }
  };

  const t = themes[themeColor];
  const baseCardStyle = "rounded-3xl border-2 transition-all duration-300 overflow-hidden";
  
  let cardStateStyle = "";
  if (locked) {
    cardStateStyle = "opacity-60 grayscale-[40%] border-zinc-200 bg-zinc-50 pointer-events-none";
  } else if (done && !expanded) {
    cardStateStyle = `${t.border} ${t.bgDone}`;
  } else if (expanded) {
    cardStateStyle = `${t.border} ${t.bgOpen} shadow-xl ${t.shadow}`;
  } else {
    cardStateStyle = `${t.border} ${t.bgClosed}`;
  }

  return (
    <div className={`${baseCardStyle} ${cardStateStyle}`}>
      <div 
        className={`px-5 py-3.5 ${!expanded && !locked ? "cursor-pointer hover:brightness-[0.98]" : ""}`}
        onClick={(!expanded && !locked) ? onAdd : undefined}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              locked ? "bg-zinc-200 text-zinc-400" : (done && !expanded ? "bg-emerald-100 text-emerald-600" : `${t.iconBg} ${t.iconText}`)
            }`}
          >
            {locked ? <Lock className="w-5 h-5" /> : icon}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground uppercase tracking-wide leading-tight">
              {title}
            </p>
            {/* Se concluído, mostra o subtitle ou "Concluído" */}
            {done && !expanded && (
              <p className="text-[11px] text-emerald-600 mt-0.5 leading-snug font-semibold">
                {subtitle || "Concluído"}
              </p>
            )}
            {/* Descrição super curta se não estiver concluído, nem expandido, nem travado */}
            {!done && !expanded && !locked && description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">
                {description}
              </p>
            )}
            {locked && (
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight font-semibold">
                Complete a etapa anterior
              </p>
            )}
          </div>

          <div className="shrink-0 ml-2">
            {done && !expanded ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : expanded ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCollapse();
                }}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : !locked ? (
              <ChevronRight className={`w-5 h-5 ${t.iconText} opacity-70`} />
            ) : null}
          </div>
        </div>

        {/* Rodapé customizado quando não expandido */}
        {!done && !expanded && !locked && footerActions && (
          <div className="mt-3 ml-[58px] flex items-center gap-2">
            {footerActions}
          </div>
        )}
      </div>

      {expanded && children && (
        <div className="px-5 pb-5 pt-0 border-t border-zinc-100/50 animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Estado para a tela de boas vindas e modal de info
  const [showWelcome, setShowWelcome] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // ── Dados do Supabase ──
  const { data: catequistas = [], refetch: refetchCats } = useCatequistas();
  const { data: paroquias = [], refetch: refetchParoquias } = useParoquias();
  const { data: comunidades = [], refetch: refetchComunidades } = useComunidades();

  // ── Mutations ──
  const catMut = useCatequistaMutation();
  const parMut = useParoquiaMutation();
  const comMut = useComunidadeMutation();
  const turmaMut = useTurmaMutation();

  // ── Qual card está expandido ──
  type CardKey = "catequista" | "paroquia" | "turma" | null;
  const [expanded, setExpanded] = useState<CardKey>(null);

  // ── Status de conclusão ──
  const doneCatequista = catequistas.some((c) => c.id === user?.id);
  const doneParoquia = paroquias.length > 0;
  const doneTurma = false; // controlled via local state after creation
  const [turmaCreatedOrJoined, setTurmaCreatedOrJoined] = useState(false);

  // ── Quando tudo estiver pronto (turma é opcional para prosseguir) ──
  const isAllDone = doneCatequista && doneParoquia;

  // ── Auto-expandir ao entrar ──
  useEffect(() => {
    if (!doneCatequista) setExpanded("catequista");
    else if (!doneParoquia) setExpanded("paroquia");
    else if (!turmaCreatedOrJoined) setExpanded("turma");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    navigate("/", { replace: true });
  };

  // ─────────────────────────────────────
  //  FORMULÁRIO: Catequista
  // ─────────────────────────────────────
  const [catForm, setCatForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    dataNascimento: "",
  });

  useEffect(() => {
    if (catequistas.length > 0 && user) {
      const myCat = catequistas.find((c) => c.id === user.id);
      if (myCat) {
        setCatForm({
          nome: myCat.nome || "",
          telefone: myCat.telefone || "",
          email: myCat.email || "",
          dataNascimento: myCat.dataNascimento || "",
        });
      }
    }
  }, [catequistas, user]);

  const fillFromUser = useCallback(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    setCatForm({
      nome: meta.full_name || meta.nome || meta.name || user.email?.split("@")[0] || "",
      telefone: mascaraTelefone(meta.telefone || meta.phone || ""),
      email: user.email || "",
      dataNascimento: meta.data_nascimento || "",
    });
    toast.success("Dados preenchidos automaticamente!");
  }, [user]);

  const saveCatequista = async () => {
    if (!catForm.nome.trim()) {
      toast.error("O nome é obrigatório");
      return;
    }
    try {
      await catMut.mutateAsync({
        id: user!.id,
        nome: catForm.nome.trim(),
        telefone: catForm.telefone,
        email: catForm.email,
        dataNascimento: catForm.dataNascimento,
        endereco: "",
        numero: "",
        bairro: "",
        complemento: "",
        profissao: "",
        formacao: "",
        anosExperiencia: "0",
        comunidadeId: "",
        status: "ativo",
      });
      await refetchCats();
      toast.success("Dados do catequista salvos!");
      setExpanded("paroquia"); // Auto-avança para paróquia
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // ─────────────────────────────────────
  //  FORMULÁRIO: Paróquia + Comunidade
  // ─────────────────────────────────────
  const [parForm, setParForm] = useState({
    paroquiaId: "",
    paroquiaNome: "",
    comunidadeId: "",
    comunidadeNome: "",
  });

  useEffect(() => {
    if (paroquias.length > 0) {
      const p = paroquias[0];
      const c = comunidades.find((com) => com.paroquiaId === p.id);
      setParForm({
        paroquiaId: p.id,
        paroquiaNome: p.nome || "",
        comunidadeId: c?.id || "",
        comunidadeNome: c?.nome || "",
      });
    }
  }, [paroquias, comunidades]);

  const saveParoquia = async () => {
    const nomePar =
      parForm.paroquiaNome.trim() ||
      paroquias.find((p) => p.id === parForm.paroquiaId)?.nome ||
      "";
    if (!nomePar) {
      toast.error("Informe o nome da paróquia");
      return;
    }
    try {
      let parId =
        parForm.paroquiaId && parForm.paroquiaId !== "NEW"
          ? parForm.paroquiaId
          : "";
      if (!parId) {
        const existing = paroquias.find(
          (p) => p.nome.toLowerCase() === nomePar.toLowerCase()
        );
        parId = existing ? existing.id : crypto.randomUUID();
        if (!existing) {
          await parMut.mutateAsync({
            id: parId,
            nome: nomePar,
            endereco: "",
            telefone: "",
            email: "",
            responsavel: "",
          });
        }
      }

      const nomeCom =
        parForm.comunidadeNome.trim() ||
        comunidades.find((c) => c.id === parForm.comunidadeId)?.nome ||
        "";
      if (nomeCom) {
        const existingCom = comunidades.find(
          (c) =>
            c.nome.toLowerCase() === nomeCom.toLowerCase() &&
            c.paroquiaId === parId
        );
        if (!existingCom) {
          await comMut.mutateAsync({
            id: crypto.randomUUID(),
            nome: nomeCom,
            paroquiaId: parId,
            endereco: "",
            responsavel: "",
            telefone: "",
          });
        }
      }

      await Promise.all([refetchParoquias(), refetchComunidades()]);
      toast.success("Paróquia/Comunidade salva!");
      setExpanded("turma"); // Auto-avança para turma
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // ─────────────────────────────────────
  //  FORMULÁRIO: Turma
  // ─────────────────────────────────────
  const [turmaForm, setTurmaForm] = useState({
    nomeTurma: "",
    diaCatequese: "",
    horario: "",
  });
  const [joinTurmaOpen, setJoinTurmaOpen] = useState(false);
  const [turmaMode, setTurmaMode] = useState<"choose" | "criar" | null>(null);

  const saveTurma = async () => {
    if (!turmaForm.nomeTurma || !turmaForm.diaCatequese || !turmaForm.horario) {
      toast.error("Preencha nome da turma, dia e horário");
      return;
    }
    try {
      // Resolve comunidade e paróquia a partir dos dados já cadastrados
      const paroquia = paroquias[0];
      const comunidade = comunidades.find(c => c.paroquiaId === paroquia?.id);

      await turmaMut.mutateAsync({
        id: crypto.randomUUID(),
        nome: turmaForm.nomeTurma,
        ano: "1° Ano",
        diaCatequese: turmaForm.diaCatequese,
        horario: turmaForm.horario,
        local: paroquia?.nome || "",
        etapa: "",
        outrosDados: "",
        comunidadeId: comunidade?.id || "",
        catequistasIds: user ? [user.id] : [],
        coordenadores: [],
        codigoAcesso: Math.random().toString(36).substring(2, 10).toUpperCase(),
        criadoEm: new Date().toISOString(),
      });
      toast.success("✅ Turma criada e vinculada com sucesso!");
      setTurmaCreatedOrJoined(true);
      setExpanded(null);
      setTurmaMode(null);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // (Turma removida do onboarding — o usuário cria turma pelo Dashboard)

  // ─────────────────────────────────────
  //  TELA DE BOAS-VINDAS (transição)
  // ─────────────────────────────────────
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
          <GraduationCap className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tighter leading-tight mb-4">
          Bem-vindo ao <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">
            iCatequese
          </span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm mb-12">
          Estamos muito felizes em ter você aqui. Para começarmos, precisamos
          apenas de algumas informações básicas para configurar seu perfil e sua
          turma.
        </p>
        <button
          onClick={() => setShowWelcome(false)}
          className="w-full max-w-xs h-14 rounded-2xl bg-gradient-to-r from-primary to-violet-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Vamos Começar <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────
  //  PÁGINA DE ONBOARDING
  // ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col animate-in slide-in-from-bottom-8 fade-in duration-500">
      {/* Barra litúrgica */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-amber-400 to-violet-600" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        {/* Voltar para a tela de login */}
        <button
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
          className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowInfoModal(true)}
          className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors shrink-0"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Modal de Ajuda */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">
              Cadastros Básicos
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Os cadastros desta tela são essenciais para o funcionamento do
              sistema — como criar sua turma e vinculá-la à comunidade.
              <br />
              <br />
              Fique tranquilo! Dados mais detalhados (endereço, formação,
              histórico) podem ser preenchidos depois diretamente no painel.
            </p>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full h-12 rounded-2xl bg-zinc-100 text-zinc-700 font-black text-sm uppercase tracking-wider hover:bg-zinc-200 active:scale-[0.98] transition-all"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Título mais compacto para economizar espaço */}
      <div className="px-6 pt-3 pb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Passo a Passo
        </p>
        <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">
          Configure seu <span className="text-primary">perfil</span>
        </h1>
      </div>

      {/* Cards - Sequência */}
      <div className="flex-1 px-5 pb-6 space-y-2.5 overflow-y-auto">

        {/* ── CARD 1: Catequista ── */}
        <StepCard
          icon={<Key className="w-5 h-5" />}
          themeColor="sky"
          title="Dados Pessoais"
          description="Seu nome, telefone e nascimento."
          subtitle={catForm.nome}
          done={doneCatequista}
          expanded={expanded === "catequista"}
          onAdd={() => setExpanded("catequista")}
          onCollapse={() => setExpanded(null)}
        >
          <div className="space-y-3 pt-2">
            {/* Botão importar dados */}
            <button
              onClick={fillFromUser}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/8 border-2 border-primary/20 text-primary text-xs font-black uppercase tracking-wider hover:bg-primary/15 active:scale-[0.98] transition-all"
            >
              <User className="w-3.5 h-3.5" />
              Usar meus dados de cadastro
            </button>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={catForm.nome}
                  onChange={(e) =>
                    setCatForm((f) => ({ ...f, nome: e.target.value }))
                  }
                  placeholder="Ex: Maria das Graças"
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <CustomDatePicker
                  label="Data de nascimento"
                  value={catForm.dataNascimento}
                  onChange={(v) =>
                    setCatForm((f) => ({ ...f, dataNascimento: v }))
                  }
                />
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                    Idade
                  </label>
                  <div className="form-input flex items-center text-muted-foreground text-sm">
                    {catForm.dataNascimento
                      ? `${calcAge(catForm.dataNascimento)} anos`
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone
                  </label>
                  <input
                    type="tel"
                    value={catForm.telefone}
                    onChange={(e) =>
                      setCatForm((f) => ({
                        ...f,
                        telefone: mascaraTelefone(e.target.value),
                      }))
                    }
                    placeholder="(00) 00000-0000"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block flex items-center gap-1">
                    <Mail className="w-3 h-3" /> E-mail
                  </label>
                  <input
                    type="email"
                    value={catForm.email}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="email@exemplo.com"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveCatequista}
              disabled={catMut.isPending}
              className="w-full action-btn h-12 mt-1"
            >
              {catMut.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </span>
              ) : (
                "Salvar e continuar"
              )}
            </button>
          </div>
        </StepCard>

        {/* ── CARD 2: Paróquia / Comunidade ── */}
        <StepCard
          icon={<MapPin className="w-5 h-5" />}
          themeColor="amber"
          title="Paróquia e Comunidade"
          description="Onde você atua como catequista."
          subtitle={paroquias[0]?.nome}
          done={doneParoquia}
          locked={!doneCatequista}
          expanded={expanded === "paroquia"}
          onAdd={() => setExpanded("paroquia")}
          onCollapse={() => setExpanded(null)}
        >
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                Paróquia / Área Missionária <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list="paroquias-list"
                value={parForm.paroquiaNome}
                onChange={(e) => {
                  const val = e.target.value;
                  const existing = paroquias.find(p => p.nome.toLowerCase() === val.toLowerCase());
                  setParForm(f => ({
                    ...f,
                    paroquiaNome: val,
                    paroquiaId: existing ? existing.id : "NEW",
                    comunidadeId: "",
                    comunidadeNome: ""
                  }));
                }}
                placeholder="Ex: Paróquia Nossa Senhora..."
                className="form-input"
              />
              <datalist id="paroquias-list">
                {paroquias.map((p) => (
                  <option key={p.id} value={p.nome} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                Comunidade / Núcleo{" "}
                <span className="text-zinc-400 font-normal normal-case">
                  (opcional)
                </span>
              </label>
              <input
                type="text"
                list="comunidades-list"
                value={parForm.comunidadeNome}
                onChange={(e) => {
                  const val = e.target.value;
                  const existing = comunidades.find(c => c.nome.toLowerCase() === val.toLowerCase());
                  setParForm(f => ({
                    ...f,
                    comunidadeNome: val,
                    comunidadeId: existing ? existing.id : "NEW"
                  }));
                }}
                placeholder="Ex: Comunidade São João..."
                className="form-input"
              />
              <datalist id="comunidades-list">
                {comunidades
                  .filter(
                    (c) =>
                      !parForm.paroquiaId ||
                      parForm.paroquiaId === "NEW" ||
                      c.paroquiaId === parForm.paroquiaId
                  )
                  .map((c) => (
                    <option key={c.id} value={c.nome} />
                  ))}
              </datalist>
            </div>

            <button
              onClick={saveParoquia}
              disabled={parMut.isPending || comMut.isPending}
              className="w-full action-btn h-12 mt-1"
            >
              {parMut.isPending || comMut.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </span>
              ) : (
                "Salvar e continuar"
              )}
            </button>
          </div>
        </StepCard>

        {/* ── CARD 3: Turma ── */}
        <StepCard
          icon={<GraduationCap className="w-5 h-5" />}
          themeColor="emerald"
          title="Sua Turma de Catequese"
          description="Crie ou entre em uma turma existente."
          subtitle={turmaCreatedOrJoined ? "Turma vinculada!" : undefined}
          done={turmaCreatedOrJoined}
          locked={!doneCatequista || !doneParoquia}
          expanded={expanded === "turma"}
          onAdd={() => { setTurmaMode(null); setExpanded("turma"); }}
          onCollapse={() => { setExpanded(null); setTurmaMode(null); }}
          footerActions={
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setTurmaMode(null); setExpanded("turma"); }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 shadow-sm hover:brightness-95 active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Criar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setJoinTurmaOpen(true); }}
                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
              >
                <LogIn className="w-3 h-3" /> Entrar
              </button>
            </>
          }
        >
          <div className="space-y-3 pt-2">
            {/* Escolha de ação */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTurmaMode("criar")}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-bold text-xs transition-all active:scale-95 border-2 ${
                  turmaMode === "criar"
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                    : "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                Criar Turma
              </button>
              <button
                onClick={() => { setJoinTurmaOpen(true); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-xs border-2 border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <LogIn className="h-5 w-5" />
                </div>
                Entrar na Turma
              </button>
            </div>

            {/* Formulário de criar turma */}
            {turmaMode === "criar" && (
              <div className="space-y-3 pt-2 border-t border-zinc-100 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                    Nome da Turma <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={turmaForm.nomeTurma}
                    onChange={(e) => setTurmaForm(f => ({ ...f, nomeTurma: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">Selecione...</option>
                    {NOMES_TURMA.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                      Dia da Catequese <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={turmaForm.diaCatequese}
                      onChange={(e) => setTurmaForm(f => ({ ...f, diaCatequese: e.target.value }))}
                      className="form-input"
                    >
                      <option value="">Selecione...</option>
                      {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                      Horário <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={turmaForm.horario}
                      onChange={(e) => setTurmaForm(f => ({ ...f, horario: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Preview da vinculação */}
                {(paroquias[0] || comunidades[0]) && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1.5">Será vinculada a:</p>
                    <div className="space-y-0.5">
                      {user && <p className="text-xs font-semibold text-foreground">👤 {catequistas.find(c => c.id === user.id)?.nome || "Você"}</p>}
                      {paroquias[0] && <p className="text-xs text-muted-foreground">⛪ {paroquias[0].nome}</p>}
                      {(() => { const com = comunidades.find(c => c.paroquiaId === paroquias[0]?.id); return com ? <p className="text-xs text-muted-foreground">🏘️ {com.nome}</p> : null; })()}
                    </div>
                  </div>
                )}

                <button
                  onClick={saveTurma}
                  disabled={turmaMut.isPending}
                  className="w-full action-btn h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                  {turmaMut.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                    </span>
                  ) : (
                    "✅ Criar e Vincular Turma"
                  )}
                </button>
              </div>
            )}
          </div>
        </StepCard>


        {/* ── SEPARADOR ── */}
        <div className="pt-2 pb-1">
          <div className="h-px bg-zinc-100" />
        </div>

        {/* ── BOTÃO FINALIZAR ou PULAR ── */}
        {isAllDone ? (
          <button
            onClick={handleFinish}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-500"
          >
            <CheckCircle2 className="w-5 h-5" />
            Começar minha jornada!
          </button>
        ) : (
          <button
            onClick={() => {
              localStorage.setItem(ONBOARDING_KEY, "true");
              navigate("/", { replace: true });
            }}
            className="w-full py-3.5 rounded-2xl text-muted-foreground text-sm font-semibold hover:bg-zinc-50 transition-colors"
          >
            Pular por agora
          </button>
        )}

        {/* Indicador de progresso — agora 3 etapas */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-2">
          {[doneCatequista, doneParoquia, turmaCreatedOrJoined].map((done, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                done ? "w-8 bg-emerald-500" : "w-4 bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Modal: Entrar na Turma (por código / QR) */}
      <JoinTurmaModal
        open={joinTurmaOpen}
        onClose={() => setJoinTurmaOpen(false)}
        onSuccess={() => {
          setTurmaCreatedOrJoined(true);
          setJoinTurmaOpen(false);
          setExpanded(null);
        }}
      />
    </div>
  );
}
