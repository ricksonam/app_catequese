import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key, Building2, CheckCircle2, ChevronRight,
  ArrowLeft, HelpCircle, Sparkles, User, Phone, Mail,
  X, Loader2, MapPin, Clock, Star, GraduationCap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCatequistaMutation,
  useParoquiaMutation,
  useComunidadeMutation,
  useTurmaMutation,
  useJoinTurma,
  useCatequistas,
  useParoquias,
  useComunidades,
  useTurmas,
} from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { mascaraTelefone } from "@/lib/utils";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { NOMES_TURMA, DIAS_SEMANA } from "@/lib/store";

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
  description?: string;          // texto descritivo abaixo do título
  subtitle?: string;             // mostrado quando done=true
  done: boolean;
  expanded: boolean;
  onAdd: () => void;
  onCollapse: () => void;
  children?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  isPremium?: boolean;
  footerActions?: React.ReactNode; // botões custom no rodapé do card fechado
}

function StepCard({
  icon, title, description, subtitle, done, expanded, onAdd, onCollapse,
  children, iconBg = "bg-zinc-100", iconColor = "text-zinc-400",
  isPremium = false, footerActions,
}: StepCardProps) {
  const baseCardStyle = "rounded-3xl border-2 transition-all duration-300 overflow-hidden";
  let cardStateStyle = "";
  if (done) {
    cardStateStyle = "border-emerald-200 bg-emerald-50/40";
  } else if (expanded) {
    cardStateStyle = isPremium
      ? "border-violet-300 bg-white shadow-xl shadow-violet-500/10"
      : "border-primary/30 bg-white shadow-lg shadow-primary/5";
  } else {
    cardStateStyle = isPremium
      ? "border-violet-100 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50"
      : "border-zinc-100 bg-white";
  }

  return (
    <div className={`${baseCardStyle} ${cardStateStyle}`}>
      {/* Layout em 3 linhas */}
      <div className="px-5 pt-4 pb-4">

        {/* Linha 1: ícone + título + status/fechar */}
        <div className="flex items-center gap-3.5">
          {/* Ícone */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
              done
                ? "bg-emerald-100 text-emerald-600"
                : expanded
                ? (isPremium ? "bg-violet-100 text-violet-600" : "bg-primary/10 text-primary")
                : `${iconBg} ${iconColor}`
            }`}
          >
            {icon}
          </div>

          {/* Título */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-foreground uppercase tracking-wide leading-tight truncate">
              {title}
            </p>
            {/* Subtítulo quando concluído */}
            {done && subtitle && (
              <p className="text-[11px] text-emerald-600 mt-0.5 leading-snug truncate font-semibold">
                {subtitle}
              </p>
            )}
          </div>

          {/* Status / Fechar — sempre no canto direito */}
          <div className="shrink-0 ml-2">
            {done ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            ) : expanded ? (
              <button
                onClick={onCollapse}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Linha 2: descrição (visível apenas quando não concluído) */}
        {!done && description && (
          <p className="text-xs text-muted-foreground mt-2 ml-[58px] leading-relaxed">
            {description}
          </p>
        )}

        {/* Linha 3: ações do rodapé (somente fechado e não concluído) */}
        {!done && !expanded && (
          <div className="mt-3 ml-[58px] flex items-center justify-end gap-2">
            {footerActions ? footerActions : (
              <button
                onClick={onAdd}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:brightness-110 active:scale-95 transition-all ${
                  isPremium
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-violet-500/25"
                    : "bg-primary text-white shadow-primary/20"
                }`}
              >
                Adicionar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo expandível */}
      {expanded && children && (
        <div className="px-5 pb-5 pt-1 border-t border-zinc-100/50 animate-in fade-in slide-in-from-top-2 duration-200">
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
  const { user } = useAuth();

  // Estado para a tela de boas vindas e modal de info
  const [showWelcome, setShowWelcome] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // ── Dados do Supabase ──
  const { data: catequistas = [], refetch: refetchCats } = useCatequistas();
  const { data: paroquias = [], refetch: refetchParoquias } = useParoquias();
  const { data: comunidades = [], refetch: refetchComunidades } = useComunidades();
  const { data: turmas = [], refetch: refetchTurmas } = useTurmas();

  // ── Mutations ──
  const catMut = useCatequistaMutation();
  const parMut = useParoquiaMutation();
  const comMut = useComunidadeMutation();
  const turmaMut = useTurmaMutation();
  const joinMut = useJoinTurma();

  // ── Qual card está expandido ──
  type CardKey = "catequista" | "paroquia" | "turma" | null;
  const [expanded, setExpanded] = useState<CardKey>(null);

  // ── Modo do card de turma: criar ou entrar ──
  const [turmaMode, setTurmaMode] = useState<"criar" | "entrar">("criar");

  // ── Status de conclusão ──
  const doneCatequista = catequistas.some((c) => c.id === user?.id);
  const doneParoquia = paroquias.length > 0;
  const doneTurma = turmas.length > 0;

  // ── Quando tudo estiver pronto ──
  const isAllDone = doneCatequista && doneParoquia && doneTurma;

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
      setExpanded(doneParoquia ? (doneTurma ? null : "turma") : "paroquia");
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
      setExpanded(doneTurma ? null : "turma");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // ─────────────────────────────────────
  //  FORMULÁRIO: Turma
  // ─────────────────────────────────────
  const [turmaForm, setTurmaForm] = useState({
    nome: "",
    ano: "1° Ano",
    diaCatequese: "",
    horario: "",
    comunidadeId: "",
  });

  const saveTurma = async () => {
    if (!turmaForm.nome || !turmaForm.diaCatequese || !turmaForm.horario) {
      toast.error("Preencha nome, dia e horário da turma");
      return;
    }
    try {
      const comId = turmaForm.comunidadeId || comunidades[0]?.id || "";
      await turmaMut.mutateAsync({
        id: crypto.randomUUID(),
        nome: turmaForm.nome,
        ano: turmaForm.ano,
        diaCatequese: turmaForm.diaCatequese,
        horario: turmaForm.horario,
        local: "",
        etapa: "",
        outrosDados: "",
        comunidadeId: comId,
        catequistasIds: user ? [user.id] : [],
        coordenadores: [],
        criadoEm: new Date().toISOString(),
        codigoAcesso: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
      await refetchTurmas();
      toast.success("Turma criada com sucesso!");
      setExpanded(null);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // ─────────────────────────────────────
  //  FORMULÁRIO: Entrar em turma
  // ─────────────────────────────────────
  const [codigoTurma, setCodigoTurma] = useState("");

  const joinTurma = async () => {
    if (!codigoTurma.trim()) {
      toast.error("Digite o código da turma");
      return;
    }
    try {
      await joinMut.mutateAsync(codigoTurma.trim().toUpperCase());
      await refetchTurmas();
      toast.success("Solicitação enviada! Aguarde a aprovação do responsável.");
      setExpanded(null);
    } catch (err: any) {
      toast.error("Código inválido ou turma não encontrada.");
    }
  };

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
          onClick={() => navigate("/auth", { replace: true })}
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

      {/* Título */}
      <div className="px-6 pt-3 pb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Cadastros Iniciais
        </p>
        <h1 className="text-3xl font-black text-foreground tracking-tighter leading-tight">
          Preencha os dados<br />
          para criar sua{" "}
          <span className="text-primary">turma</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Complete as etapas abaixo para ter acesso a todas as funcionalidades.
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 px-5 pb-8 space-y-3 overflow-y-auto">

        {/* ── CARD 1: Catequista ── */}
        <StepCard
          icon={<Key className="w-5 h-5" />}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
          title="Dados do Catequista"
          description="Informe seus dados pessoais para identificação no sistema. O nome é obrigatório; os demais dados podem ser completados depois."
          subtitle="Perfil configurado"
          done={doneCatequista}
          expanded={expanded === "catequista"}
          onAdd={() => setExpanded("catequista")}
          onCollapse={() => setExpanded(null)}
        >
          <div className="space-y-3 pt-3">
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
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          title="Paróquia / Área Missionária"
          description="Vincule seu perfil à paróquia ou área missionária onde você atua como catequista."
          subtitle={paroquias[0]?.nome}
          done={doneParoquia}
          expanded={expanded === "paroquia"}
          onAdd={() => setExpanded("paroquia")}
          onCollapse={() => setExpanded(null)}
        >
          <div className="space-y-3 pt-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                Paróquia / Área Pastoral <span className="text-red-500">*</span>
              </label>
              {paroquias.length > 0 ? (
                <select
                  value={parForm.paroquiaId}
                  onChange={(e) => {
                    setParForm((f) => ({
                      ...f,
                      paroquiaId: e.target.value,
                      paroquiaNome:
                        e.target.value === "NEW" ? f.paroquiaNome : "",
                      comunidadeId: "",
                      comunidadeNome: "",
                    }));
                  }}
                  className="form-input"
                >
                  <option value="">Selecione...</option>
                  {paroquias.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                  <option value="NEW">+ Cadastrar nova...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={parForm.paroquiaNome}
                  onChange={(e) =>
                    setParForm((f) => ({ ...f, paroquiaNome: e.target.value }))
                  }
                  placeholder="Ex: Paróquia Nossa Senhora..."
                  className="form-input"
                />
              )}
              {parForm.paroquiaId === "NEW" && (
                <input
                  type="text"
                  value={parForm.paroquiaNome}
                  onChange={(e) =>
                    setParForm((f) => ({ ...f, paroquiaNome: e.target.value }))
                  }
                  placeholder="Nome da nova paróquia..."
                  className="form-input mt-2 animate-in fade-in zoom-in-95"
                />
              )}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                Comunidade / Núcleo{" "}
                <span className="text-zinc-400 font-normal normal-case">
                  (opcional)
                </span>
              </label>
              {comunidades.filter(
                (c) =>
                  !parForm.paroquiaId ||
                  parForm.paroquiaId === "NEW" ||
                  c.paroquiaId === parForm.paroquiaId
              ).length > 0 ? (
                <select
                  value={parForm.comunidadeId}
                  onChange={(e) => {
                    setParForm((f) => ({
                      ...f,
                      comunidadeId: e.target.value,
                      comunidadeNome:
                        e.target.value === "NEW" ? f.comunidadeNome : "",
                    }));
                  }}
                  className="form-input"
                >
                  <option value="">Selecione...</option>
                  {comunidades
                    .filter(
                      (c) =>
                        !parForm.paroquiaId ||
                        parForm.paroquiaId === "NEW" ||
                        c.paroquiaId === parForm.paroquiaId
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  <option value="NEW">+ Cadastrar nova...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={parForm.comunidadeNome}
                  onChange={(e) =>
                    setParForm((f) => ({
                      ...f,
                      comunidadeNome: e.target.value,
                    }))
                  }
                  placeholder="Ex: Comunidade São José (opcional)"
                  className="form-input"
                />
              )}
              {parForm.comunidadeId === "NEW" && (
                <input
                  type="text"
                  value={parForm.comunidadeNome}
                  onChange={(e) =>
                    setParForm((f) => ({
                      ...f,
                      comunidadeNome: e.target.value,
                    }))
                  }
                  placeholder="Nome da nova comunidade..."
                  className="form-input mt-2 animate-in fade-in zoom-in-95"
                />
              )}
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

        {/* ── CARD 3: Turma (Criar ou Entrar) ── */}
        <StepCard
          icon={<Building2 className="w-5 h-5" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          title="Turma"
          description="Crie uma nova turma de catequese ou entre em uma turma já existente com o código de acesso."
          subtitle={turmas[0]?.nome}
          done={doneTurma}
          expanded={expanded === "turma"}
          onAdd={() => {
            setTurmaMode("criar");
            setExpanded("turma");
          }}
          onCollapse={() => setExpanded(null)}
          footerActions={
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTurmaMode("entrar");
                  setExpanded("turma");
                }}
                className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 border-violet-300 text-violet-600 hover:bg-violet-50 active:scale-95 transition-all"
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setTurmaMode("criar");
                  setExpanded("turma");
                }}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-white shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Criar Turma
              </button>
            </div>
          }
        >
          <div className="space-y-3 pt-3">
            {/* Indicador de modo + link para trocar */}
            <div className="flex items-center justify-between">
              <p
                className={`text-xs font-black uppercase tracking-widest ${
                  turmaMode === "criar" ? "text-primary" : "text-violet-600"
                }`}
              >
                {turmaMode === "criar"
                  ? "✏️  Criando nova turma"
                  : "🔗  Entrando em turma existente"}
              </p>
              <button
                onClick={() =>
                  setTurmaMode(turmaMode === "criar" ? "entrar" : "criar")
                }
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                {turmaMode === "criar" ? "Entrar em turma" : "Criar turma"}
              </button>
            </div>

            {/* ── MODO: CRIAR ── */}
            {turmaMode === "criar" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                    Nome da Turma <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={turmaForm.nome}
                    onChange={(e) =>
                      setTurmaForm((f) => ({ ...f, nome: e.target.value }))
                    }
                    className="form-input"
                  >
                    <option value="">Selecione...</option>
                    {NOMES_TURMA.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                      Ano/Ciclo <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={turmaForm.ano}
                      onChange={(e) =>
                        setTurmaForm((f) => ({ ...f, ano: e.target.value }))
                      }
                      className="form-input"
                    >
                      {[
                        "1° Ano",
                        "2° Ano",
                        "3° Ano",
                        "Ciclo 1",
                        "Ciclo 2",
                        "Ciclo 3",
                      ].map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                      Dia do Encontro <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={turmaForm.diaCatequese}
                      onChange={(e) =>
                        setTurmaForm((f) => ({
                          ...f,
                          diaCatequese: e.target.value,
                        }))
                      }
                      className="form-input"
                    >
                      <option value="">Selecione...</option>
                      {DIAS_SEMANA.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Horário{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={turmaForm.horario}
                    onChange={(e) =>
                      setTurmaForm((f) => ({ ...f, horario: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>

                {comunidades.length > 0 && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block">
                      Comunidade
                    </label>
                    <select
                      value={turmaForm.comunidadeId}
                      onChange={(e) =>
                        setTurmaForm((f) => ({
                          ...f,
                          comunidadeId: e.target.value,
                        }))
                      }
                      className="form-input"
                    >
                      <option value="">Selecione (opcional)...</option>
                      {comunidades.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={saveTurma}
                  disabled={turmaMut.isPending}
                  className="w-full action-btn h-12 mt-1"
                >
                  {turmaMut.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                    </span>
                  ) : (
                    "Criar Turma e Continuar"
                  )}
                </button>
              </div>
            )}

            {/* ── MODO: ENTRAR ── */}
            {turmaMode === "entrar" && (
              <div className="space-y-3">
                <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100">
                  <p className="text-xs text-violet-900 leading-relaxed text-center">
                    Peça o <strong>código de acesso</strong> ao catequista
                    responsável da turma que deseja ingressar.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1 block text-center">
                    Código da Turma
                  </label>
                  <input
                    type="text"
                    value={codigoTurma}
                    onChange={(e) =>
                      setCodigoTurma(e.target.value.toUpperCase())
                    }
                    placeholder="Ex: ABC123"
                    maxLength={8}
                    className="w-full h-14 bg-zinc-50 border-2 border-zinc-200 rounded-2xl outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 transition-all uppercase tracking-[0.3em] font-black text-center text-xl text-foreground placeholder:text-zinc-300 placeholder:tracking-normal placeholder:font-medium"
                  />
                </div>

                <button
                  onClick={joinTurma}
                  disabled={joinMut.isPending || !codigoTurma.trim()}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-violet-500/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 mt-1"
                >
                  {joinMut.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                    </span>
                  ) : (
                    "Solicitar Acesso"
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

        {/* Indicador de progresso */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-2">
          {[doneCatequista, doneParoquia, doneTurma].map((done, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                done ? "w-8 bg-emerald-500" : "w-4 bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
