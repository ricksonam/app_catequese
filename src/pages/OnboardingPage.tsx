import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ArrowLeft,
  User,
  MapPin,
  GraduationCap,
  CheckCircle2,
  Loader2,
  Plus,
  LogIn,
  Link2,
  Camera,
  X as XIcon,
  Sparkles,
  Heart,
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
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { useJoinTurma } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";

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

// ── Tipos de etapas ──
type Step =
  | "welcome"
  | "cat_usedata"       // Pergunta se usa dados do cadastro
  | "cat_form"          // Preenche nome + nascimento
  | "cat_saving"
  | "cat_done"
  | "par_form"          // Preenche paróquia + comunidade
  | "par_saving"
  | "par_done"
  | "turma_choose"      // Criar ou entrar numa turma
  | "turma_criar_form"  // Formulário de criar turma
  | "turma_criar_saving"
  | "turma_entrar_form" // Formulário de entrar via código
  | "turma_entrar_saving"
  | "all_done";

// ── Componente de card de pergunta animado ──
function QuestionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Componente assistente bubble ──
function AssistantBubble({ text, emoji }: { text: string; emoji?: string }) {
  return (
    <QuestionCard className="flex items-start gap-3 mb-6">
      {/* Avatar do assistente */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/30 text-lg">
        {emoji || "🕊️"}
      </div>
      <div className="flex-1 bg-violet-50 border border-violet-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <p className="text-sm text-zinc-800 leading-relaxed font-medium">{text}</p>
      </div>
    </QuestionCard>
  );
}

// ── Componente de step indicator ──
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-500",
            i < current
              ? "w-6 bg-violet-500"
              : i === current
              ? "w-8 bg-violet-500 opacity-80"
              : "w-3 bg-zinc-200"
          )}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Estado geral
  const [step, setStep] = useState<Step>("welcome");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Dados do Supabase
  const { data: catequistas = [], refetch: refetchCats } = useCatequistas();
  const { data: paroquias = [], refetch: refetchParoquias } = useParoquias();
  const { data: comunidades = [], refetch: refetchComunidades } = useComunidades();

  // Mutations
  const catMut = useCatequistaMutation();
  const parMut = useParoquiaMutation();
  const comMut = useComunidadeMutation();
  const turmaMut = useTurmaMutation();
  const joinMut = useJoinTurma();

  // ── Formulário: Catequista ──
  const [catForm, setCatForm] = useState({
    nome: "",
    dataNascimento: "",
  });

  // ── Formulário: Paróquia ──
  const [parForm, setParForm] = useState({
    paroquiaNome: "",
    comunidadeNome: "",
  });

  // ── Formulário: Turma ──
  const [turmaForm, setTurmaForm] = useState({
    nomeTurma: "",
    diaCatequese: "",
    horario: "",
  });

  // ── Entrar na turma via código ──
  const [joinCode, setJoinCode] = useState("");

  // Scroll automático para o final quando a etapa muda
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [step]);

  const handleFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    navigate("/", { replace: true });
  };

  // ── Ações de salvar ──
  const saveCatequista = useCallback(
    async (nome: string, dataNascimento: string) => {
      setStep("cat_saving");
      try {
        await catMut.mutateAsync({
          id: user!.id,
          nome: nome.trim(),
          dataNascimento,
          telefone: "",
          email: user?.email || "",
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
        setStep("cat_done");
        setTimeout(() => setStep("par_form"), 1200);
      } catch (err: any) {
        toast.error("Erro: " + err.message);
        setStep("cat_form");
      }
    },
    [catMut, user, refetchCats]
  );

  const saveParoquia = useCallback(async () => {
    const nomePar = parForm.paroquiaNome.trim();
    if (!nomePar) {
      toast.error("Informe o nome da paróquia");
      return;
    }
    setStep("par_saving");
    try {
      const existing = paroquias.find(
        (p) => p.nome.toLowerCase() === nomePar.toLowerCase()
      );
      const parId = existing ? existing.id : crypto.randomUUID();
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
      const nomeCom = parForm.comunidadeNome.trim();
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
      setStep("par_done");
      setTimeout(() => setStep("turma_choose"), 1200);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
      setStep("par_form");
    }
  }, [parForm, paroquias, comunidades, parMut, comMut, refetchParoquias, refetchComunidades]);

  const createTurma = useCallback(async () => {
    if (!turmaForm.nomeTurma || !turmaForm.diaCatequese || !turmaForm.horario) {
      toast.error("Preencha nome da turma, dia e horário");
      return;
    }
    setStep("turma_criar_saving");
    try {
      const paroquia = paroquias[0];
      const comunidade = comunidades.find((c) => c.paroquiaId === paroquia?.id);
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
      toast.success("Turma criada com sucesso!");
      setStep("all_done");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
      setStep("turma_criar_form");
    }
  }, [turmaForm, paroquias, comunidades, turmaMut, user]);

  const joinTurma = useCallback(async () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length < 8) {
      toast.error("O código deve ter 8 caracteres.");
      return;
    }
    setStep("turma_entrar_saving");
    try {
      const result = await joinMut.mutateAsync(trimmed);
      if (result.status === "pending") {
        toast.success(`Solicitação enviada para "${result.nome}"! Aguarde aprovação.`);
      } else {
        toast.success(`Bem-vindo à turma "${result.nome}"!`);
      }
      setStep("all_done");
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar na turma.");
      setStep("turma_entrar_form");
    }
  }, [joinCode, joinMut]);

  // ── Preencher dados do usuário ──
  const fillFromUser = useCallback(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    const nome =
      meta.full_name || meta.nome || meta.name || user.email?.split("@")[0] || "";
    const dataNascimento = meta.data_nascimento || "";
    setCatForm({ nome, dataNascimento });
    toast.success("Dados preenchidos automaticamente!");
    setStep("cat_form");
  }, [user]);

  // ── Qual é o passo numérico atual para o indicador ──
  const stepNumber = (() => {
    if (step === "welcome") return 0;
    if (["cat_usedata", "cat_form", "cat_saving", "cat_done"].includes(step)) return 1;
    if (["par_form", "par_saving", "par_done"].includes(step)) return 2;
    return 3;
  })();

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto relative">
      {/* Barra litúrgica topo */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-amber-400 to-violet-600 shrink-0" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <button
          onClick={async () => {
            await signOut();
            navigate("/auth", { replace: true });
          }}
          className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-500">
            Configuração Inicial
          </p>
          {step !== "welcome" && step !== "all_done" && (
            <StepIndicator current={stepNumber - 1} total={3} />
          )}
        </div>

        {/* Pular */}
        <button
          onClick={() => {
            localStorage.setItem(ONBOARDING_KEY, "true");
            navigate("/", { replace: true });
          }}
          className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-zinc-600 transition-colors px-2 py-1"
        >
          Pular
        </button>
      </div>

      {/* Área de scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-1">

        {/* ══ TELA DE BOAS-VINDAS ══ */}
        {step === "welcome" && (
          <QuestionCard className="flex flex-col items-center text-center pt-8">
            <div className="w-20 h-20 rounded-[28px] overflow-hidden bg-white shadow-2xl shadow-violet-500/20 border-2 border-violet-100 flex items-center justify-center mb-6">
              <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
            </div>
            <div className="mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-500 mb-2 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Bem-vindo
                <Sparkles className="w-3 h-3 text-amber-500" />
              </p>
              <h1 className="text-3xl font-black tracking-tighter text-zinc-900 leading-tight mb-3">
                Olá, catequista! 👋
              </h1>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed mb-10 max-w-xs">
              Vou te guiar por <strong className="text-zinc-700">3 perguntas rápidas</strong> para configurar seu perfil e sua turma. Leva menos de 2 minutos!
            </p>
            <button
              onClick={() => setStep("cat_usedata")}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-violet-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Vamos Começar <ChevronRight className="w-5 h-5" />
            </button>
          </QuestionCard>
        )}

        {/* ══ ETAPA 1: Catequista ══ */}

        {/* 1a. Pergunta sobre usar dados do usuário */}
        {step === "cat_usedata" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-xs font-black text-violet-600">1</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-violet-500">Dados pessoais</span>
            </div>

            <AssistantBubble
              emoji="🕊️"
              text="Olá! Primeiro, vamos criar seu perfil de catequista. Posso usar seus dados de cadastro para preencher automaticamente?"
            />

            <QuestionCard className="space-y-3 ml-12">
              <button
                onClick={fillFromUser}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-violet-600 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black leading-tight">Sim, usar meus dados</p>
                  <p className="text-[10px] text-violet-200 font-medium">Preenche nome e data automaticamente</p>
                </div>
              </button>

              <button
                onClick={() => setStep("cat_form")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-200 text-zinc-700 font-black text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black leading-tight">Não, prefiro digitar</p>
                  <p className="text-[10px] text-zinc-400 font-medium">Preencho eu mesmo</p>
                </div>
              </button>
            </QuestionCard>
          </div>
        )}

        {/* 1b. Formulário do catequista */}
        {(step === "cat_form" || step === "cat_saving") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-xs font-black text-violet-600">1</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-violet-500">Dados pessoais</span>
            </div>

            <AssistantBubble
              emoji="🕊️"
              text="Perfeito! Preciso apenas do seu nome completo e data de nascimento."
            />

            <QuestionCard className="ml-0 space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={catForm.nome}
                  onChange={(e) => setCatForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Maria das Graças Silva"
                  className="form-input h-12 text-base font-bold"
                  autoFocus
                />
              </div>

              {/* Data de nascimento */}
              <div className="grid grid-cols-2 gap-3">
                <CustomDatePicker
                  label="Data de nascimento"
                  value={catForm.dataNascimento}
                  onChange={(v) => setCatForm((f) => ({ ...f, dataNascimento: v }))}
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                    Idade
                  </label>
                  <div className="form-input h-12 flex items-center text-muted-foreground text-sm font-semibold">
                    {catForm.dataNascimento
                      ? `${calcAge(catForm.dataNascimento)} anos`
                      : "—"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => saveCatequista(catForm.nome, catForm.dataNascimento)}
                disabled={!catForm.nome.trim() || step === "cat_saving"}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-violet-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === "cat_saving" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                ) : (
                  <>Continuar <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </QuestionCard>
          </div>
        )}

        {/* 1c. Catequista salvo com sucesso */}
        {step === "cat_done" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Perfil criado!</span>
            </div>
            <AssistantBubble
              emoji="✅"
              text={`Ótimo, ${catForm.nome.split(" ")[0]}! Seu perfil foi criado. Agora me conta sobre sua paróquia...`}
            />
          </div>
        )}

        {/* ══ ETAPA 2: Paróquia ══ */}
        {(step === "par_form" || step === "par_saving") && (
          <div className="space-y-4">
            {/* Catequista concluído - badge */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-black text-emerald-700">{catForm.nome}</p>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-xs font-black text-amber-600">2</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-600">Paróquia e comunidade</span>
            </div>

            <AssistantBubble
              emoji="⛪"
              text="Onde você realiza a catequese? Me informe o nome da sua paróquia e, se quiser, da comunidade."
            />

            <QuestionCard className="space-y-4">
              {/* Nome da Paróquia */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  Nome da Paróquia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="paroquias-list"
                  value={parForm.paroquiaNome}
                  onChange={(e) => setParForm((f) => ({ ...f, paroquiaNome: e.target.value }))}
                  placeholder="Ex: Paróquia Nossa Senhora da Paz"
                  className="form-input h-12 text-base font-bold"
                  autoFocus
                />
                <datalist id="paroquias-list">
                  {paroquias.map((p) => (
                    <option key={p.id} value={p.nome} />
                  ))}
                </datalist>
              </div>

              {/* Nome da Comunidade */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Heart className="w-3 h-3" />
                  Comunidade{" "}
                  <span className="text-zinc-400 font-normal normal-case text-[9px]">(opcional)</span>
                </label>
                <input
                  type="text"
                  list="comunidades-list"
                  value={parForm.comunidadeNome}
                  onChange={(e) => setParForm((f) => ({ ...f, comunidadeNome: e.target.value }))}
                  placeholder="Ex: Comunidade São João Batista"
                  className="form-input h-12 text-base font-bold"
                />
                <datalist id="comunidades-list">
                  {comunidades.map((c) => (
                    <option key={c.id} value={c.nome} />
                  ))}
                </datalist>
              </div>

              <button
                onClick={saveParoquia}
                disabled={!parForm.paroquiaNome.trim() || step === "par_saving"}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === "par_saving" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                ) : (
                  <>Continuar <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </QuestionCard>
          </div>
        )}

        {/* 2c. Paróquia salva com sucesso */}
        {step === "par_done" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-black text-emerald-700">{catForm.nome}</p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-black text-emerald-700">{parForm.paroquiaNome}</p>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Paróquia salva!</span>
            </div>
            <AssistantBubble
              emoji="✅"
              text="Perfeito! Agora a última etapa: sua turma de catequese."
            />
          </div>
        )}

        {/* ══ ETAPA 3: Turma ══ */}

        {/* 3a. Escolher entre criar ou entrar */}
        {step === "turma_choose" && (
          <div className="space-y-4">
            {/* Badges de progresso */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-black text-emerald-700">{catForm.nome} · {parForm.paroquiaNome}</p>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-xs font-black text-emerald-600">3</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Sua turma</span>
            </div>

            <AssistantBubble
              emoji="📚"
              text="Quase lá! Você quer criar uma nova turma de catequese ou entrar em uma turma já existente de outro catequista?"
            />

            <QuestionCard className="space-y-3">
              <button
                onClick={() => setStep("turma_criar_form")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black leading-tight">Criar nova turma</p>
                  <p className="text-[10px] text-emerald-200 font-medium">Serei o responsável da turma</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto opacity-70" />
              </button>

              <button
                onClick={() => setStep("turma_entrar_form")}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 border-2 border-zinc-200 text-zinc-700 font-black text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-200 flex items-center justify-center shrink-0">
                  <LogIn className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-zinc-800 leading-tight">Entrar em turma existente</p>
                  <p className="text-[10px] text-zinc-400 font-medium">Usar código de acesso</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
              </button>

              {/* Pular turma */}
              <button
                onClick={handleFinish}
                className="w-full py-3 text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Farei isso depois →
              </button>
            </QuestionCard>
          </div>
        )}

        {/* 3b. Criar turma - formulário */}
        {(step === "turma_criar_form" || step === "turma_criar_saving") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-black text-emerald-700">{catForm.nome} · {parForm.paroquiaNome}</p>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setStep("turma_choose")}
                className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-3 h-3 text-zinc-500" />
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Nova turma</span>
            </div>

            <AssistantBubble
              emoji="📚"
              text="Ótimo! Me diga o nome da turma, o dia da semana e o horário dos encontros."
            />

            <QuestionCard className="space-y-4">
              {/* Nome da turma */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Nome da Turma <span className="text-red-500">*</span>
                </label>
                <select
                  value={turmaForm.nomeTurma}
                  onChange={(e) => setTurmaForm((f) => ({ ...f, nomeTurma: e.target.value }))}
                  className="form-input h-12 font-bold"
                  autoFocus
                >
                  <option value="">Selecione...</option>
                  {NOMES_TURMA.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dia + Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Dia <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={turmaForm.diaCatequese}
                    onChange={(e) => setTurmaForm((f) => ({ ...f, diaCatequese: e.target.value }))}
                    className="form-input h-12 font-bold"
                  >
                    <option value="">Selecione...</option>
                    {DIAS_SEMANA.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Horário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={turmaForm.horario}
                    onChange={(e) => setTurmaForm((f) => ({ ...f, horario: e.target.value }))}
                    className="form-input h-12 font-bold"
                  />
                </div>
              </div>

              <button
                onClick={createTurma}
                disabled={
                  !turmaForm.nomeTurma ||
                  !turmaForm.diaCatequese ||
                  !turmaForm.horario ||
                  step === "turma_criar_saving"
                }
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === "turma_criar_saving" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Criando turma...</>
                ) : (
                  <>✅ Criar Turma</>
                )}
              </button>
            </QuestionCard>
          </div>
        )}

        {/* 3c. Entrar em turma - formulário de código */}
        {(step === "turma_entrar_form" || step === "turma_entrar_saving") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-black text-emerald-700">{catForm.nome} · {parForm.paroquiaNome}</p>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setStep("turma_choose")}
                className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-3 h-3 text-zinc-500" />
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Entrar na turma</span>
            </div>

            <AssistantBubble
              emoji="🔑"
              text="Peça ao catequista responsável o código de acesso da turma e digite abaixo."
            />

            <QuestionCard className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                  <Link2 className="w-3 h-3" />
                  Código de acesso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                    )
                  }
                  onKeyDown={(e) => e.key === "Enter" && joinTurma()}
                  placeholder="Ex: TP847293"
                  maxLength={8}
                  autoFocus
                  className="w-full px-4 py-4 rounded-2xl border-2 border-zinc-200 bg-white text-zinc-900 text-center text-2xl font-black tracking-[0.35em] uppercase placeholder:tracking-normal placeholder:text-base focus:outline-none focus:border-emerald-500 transition-colors h-16"
                />
                <p className="text-[10px] text-zinc-400 text-center font-medium">
                  O código tem 8 caracteres (ex: TP847293)
                </p>
              </div>

              <button
                onClick={joinTurma}
                disabled={joinCode.trim().length < 8 || step === "turma_entrar_saving"}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {step === "turma_entrar_saving" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Entrar na Turma</>
                )}
              </button>

              {/* Pular */}
              <button
                onClick={handleFinish}
                className="w-full py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                Farei isso depois →
              </button>
            </QuestionCard>
          </div>
        )}

        {/* ══ TELA FINAL: Tudo pronto! ══ */}
        {step === "all_done" && (
          <QuestionCard className="flex flex-col items-center text-center pt-6">
            {/* Animação de sucesso */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center shadow-xl shadow-emerald-500/20 border-4 border-emerald-200">
                <span className="text-5xl animate-bounce" style={{ animationDuration: "2s" }}>🎉</span>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center border-2 border-white">
                <Sparkles className="w-4 h-4 text-violet-500" />
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600 mb-2">
              Configuração concluída!
            </p>
            <h2 className="text-3xl font-black tracking-tighter text-zinc-900 mb-3">
              Tudo pronto! 🙌
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed mb-8 max-w-xs">
              Seu perfil e sua turma foram configurados com sucesso. Agora o <strong className="text-zinc-700">iCatequese</strong> está pronto para você!
            </p>

            {/* Resumo */}
            <div className="w-full bg-zinc-50 rounded-2xl p-4 mb-8 text-left space-y-2.5">
              {catForm.nome && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center text-sm">👤</div>
                  <p className="text-sm font-bold text-zinc-700">{catForm.nome}</p>
                </div>
              )}
              {parForm.paroquiaNome && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-sm">⛪</div>
                  <p className="text-sm font-bold text-zinc-700">{parForm.paroquiaNome}</p>
                </div>
              )}
              {parForm.comunidadeNome && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-100 flex items-center justify-center text-sm">🏘️</div>
                  <p className="text-sm font-bold text-zinc-700">{parForm.comunidadeNome}</p>
                </div>
              )}
              {turmaForm.nomeTurma && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-sm">📚</div>
                  <p className="text-sm font-bold text-zinc-700">{turmaForm.nomeTurma}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <GraduationCap className="w-5 h-5" />
              Começar minha jornada!
            </button>
          </QuestionCard>
        )}

      </div>
    </div>
  );
}
