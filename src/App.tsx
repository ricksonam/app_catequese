import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { logError, initGlobalErrorCapture } from "@/lib/errorLogger";
import ScrollToTop from "./components/ScrollToTop";
import { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// ===== IMPORTS ESTÁTICOS (usados no carregamento inicial) =====
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import SplashScreen from "@/components/SplashScreen";


// ===== LAZY IMPORTS (carregados apenas quando a rota é acessada) =====
// Helper para recarregar automaticamente a página se o chunk falhar (ex: nova versão deployada)
const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    const reloaded = sessionStorage.getItem("ivc_chunk_reload");
    try {
      const component = await componentImport();
      sessionStorage.removeItem("ivc_chunk_reload");
      return component;
    } catch (error: any) {
      if (!reloaded && (error?.message?.includes("Failed to fetch dynamically imported module") || error?.message?.includes("Importing a module script failed") || error?.name === "ChunkLoadError")) {
        sessionStorage.setItem("ivc_chunk_reload", "true");
        window.location.reload();
        // Retorna uma promise que nunca resolve para evitar erro na tela enquanto a página recarrega
        return new Promise<any>(() => {});
      }
      throw error;
    }
  });
};

const OnboardingPage          = lazyWithRetry(() => import("@/pages/OnboardingPage"));
const ResetPasswordPage       = lazyWithRetry(() => import("@/pages/ResetPasswordPage"));
const Dashboard               = lazyWithRetry(() => import("@/pages/Dashboard"));
const TurmasList              = lazyWithRetry(() => import("@/pages/TurmasList"));
const TurmaForm               = lazyWithRetry(() => import("@/pages/TurmaForm"));
const TurmaDetail             = lazyWithRetry(() => import("@/pages/TurmaDetail"));
const EncontrosList           = lazyWithRetry(() => import("@/pages/EncontrosList"));
const EncontroForm            = lazyWithRetry(() => import("@/pages/EncontroForm"));
const EncontroDetail          = lazyWithRetry(() => import("@/pages/EncontroDetail"));
const EncontroPresentation    = lazyWithRetry(() => import("@/pages/EncontroPresentation"));
const CatequizandosList       = lazyWithRetry(() => import("@/pages/CatequizandosList"));
const EventosList             = lazyWithRetry(() => import("@/pages/EventosList"));
const ReunioesList            = lazyWithRetry(() => import("@/pages/ReunioesList"));
const ReuniaoPresentation     = lazyWithRetry(() => import("@/pages/ReuniaoPresentation"));
const PlanoTurma              = lazyWithRetry(() => import("@/pages/PlanoTurma"));
const RelatoriosTurma         = lazyWithRetry(() => import("@/pages/RelatoriosTurma"));
const TrilhaSacramental       = lazyWithRetry(() => import("@/pages/TrilhaSacramental"));
const PainelIVC               = lazyWithRetry(() => import("@/pages/PainelIVC"));
const PublicPainelIVC         = lazyWithRetry(() => import("@/pages/PublicPainelIVC"));
const DiarioEspiritualList    = lazyWithRetry(() => import("@/pages/DiarioEspiritualList"));
const DiarioEspiritualForm    = lazyWithRetry(() => import("@/pages/DiarioEspiritualForm"));
const BibliotecaModelos       = lazyWithRetry(() => import("@/pages/BibliotecaModelos"));
const OracoesList             = lazyWithRetry(() => import("@/pages/OracoesList"));
const OracaoView              = lazyWithRetry(() => import("@/pages/OracaoView"));
const ModulosGlobais          = lazyWithRetry(() => import("@/pages/ModulosGlobais"));
const MuralFotos              = lazyWithRetry(() => import("@/pages/MuralFotos"));
const JogosHub                = lazyWithRetry(() => import("@/pages/JogosHub"));
const SorteioNomes            = lazyWithRetry(() => import("@/pages/SorteioNomes"));
const QuizBiblico             = lazyWithRetry(() => import("@/pages/QuizBiblico"));
const QuemSouBiblico          = lazyWithRetry(() => import("@/pages/QuemSouBiblico"));
const PerguntasRespostas      = lazyWithRetry(() => import("@/pages/PerguntasRespostas"));
const CitacaoSorteio          = lazyWithRetry(() => import("@/pages/CitacaoSorteio"));
const SorteioGrupos           = lazyWithRetry(() => import("@/pages/SorteioGrupos"));
const Mimica                  = lazyWithRetry(() => import("@/pages/Mimica"));
const SorteioDado             = lazyWithRetry(() => import("@/pages/SorteioDado"));
const BibliaPage              = lazyWithRetry(() => import("@/pages/BibliaPage"));
const MaterialApoio           = lazyWithRetry(() => import("@/pages/MaterialApoio"));
const ParoquiaComunidadeCadastro = lazyWithRetry(() => import("@/pages/ParoquiaComunidadeCadastro"));
const CatequistasCadastro     = lazyWithRetry(() => import("@/pages/CatequistasCadastro"));
const CalendarioLiturgico     = lazyWithRetry(() => import("@/pages/CalendarioLiturgico"));
const LiturgiaDiaria          = lazyWithRetry(() => import("@/pages/LiturgiaDiaria"));
const AdminDashboard          = lazyWithRetry(() => import("@/pages/AdminDashboard"));
const AdminLogin              = lazyWithRetry(() => import("@/pages/AdminLogin"));
const PlaceholderPage         = lazyWithRetry(() => import("@/pages/PlaceholderPage"));
const PublicPlano             = lazyWithRetry(() => import("@/pages/PublicPlano"));
const PublicRitoSacramental   = lazyWithRetry(() => import("@/pages/PublicRitoSacramental"));
const PublicInscricao         = lazyWithRetry(() => import("@/pages/PublicInscricao"));
const MapaPanoramico          = lazyWithRetry(() => import("@/pages/MapaPanoramico"));
const NotFound                = lazyWithRetry(() => import("@/pages/NotFound"));
const LandingPage             = lazyWithRetry(() => import("@/pages/LandingPage"));
const PublicFormResponder     = lazyWithRetry(() => import("@/pages/PublicFormResponder"));
const StoreCheckoutSuccess    = lazyWithRetry(() => import("@/pages/StoreCheckoutSuccess"));
const StoreCheckoutPending    = lazyWithRetry(() => import("@/pages/StoreCheckoutPending"));
const PublicAgendaVisita      = lazyWithRetry(() => import("@/pages/PublicAgendaVisita"));
const PainelVisitaFamilia     = lazyWithRetry(() => import("@/pages/PainelVisitaFamilia").then(m => ({ default: m.PainelVisitaFamilia })));

// ===== FALLBACK DE LOADING =====
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg overflow-hidden animate-pulse p-2 flex items-center justify-center">
          <img src="/Logo_sem_fundo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest">Carregando...</p>
      </div>
    </div>
  );
}

// ===== QUERY CLIENT com configuração de resiliência =====
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        logError("api_error", error instanceof Error ? error : new Error(String(error)));
      },
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null; // Splash já cobre o carregamento inicial
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

const ONBOARDING_KEY = "ivc_onboarding_completed";

const HomeOrLanding = () => {
  const { session, loading, isAdmin } = useAuth();
  const [checkingData, setCheckingData] = useState(false);
  const [dataChecked, setDataChecked] = useState(false);

  useEffect(() => {
    if (!session?.user || loading || isAdmin) return;

    const onboardingCompleted = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (onboardingCompleted) {
      setDataChecked(true);
      return;
    }

    // Para usuários sem flag no localStorage, verifica se já têm dados no banco
    // Isso evita redirecionar usuários existentes para o onboarding
    setCheckingData(true);
    Promise.all([
      supabase.from("catequistas").select("id", { count: "exact", head: true }).eq("id", session.user.id),
      supabase.from("paroquias").select("id", { count: "exact", head: true }),
    ]).then(([catResult, parResult]) => {
      const hasCatequista = (catResult.count ?? 0) > 0;
      const hasParoquia = (parResult.count ?? 0) > 0;
      // Se já tem dados completos, marca onboarding como concluído
      if (hasCatequista && hasParoquia) {
        localStorage.setItem(ONBOARDING_KEY, "true");
      }
      setCheckingData(false);
      setDataChecked(true);
    }).catch(() => {
      setCheckingData(false);
      setDataChecked(true);
    });
  }, [session, loading, isAdmin]);

  if (loading) return null;
  if (session) {
    if (isAdmin) return <Navigate to="/admin" replace />;

    // Enquanto verifica dados, mostra loading
    if (checkingData || !dataChecked) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg overflow-hidden animate-pulse p-2 flex items-center justify-center">
              <img src="/Logo_sem_fundo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs font-black text-primary/60 uppercase tracking-widest">Carregando...</p>
          </div>
        </div>
      );
    }

    // Redireciona para onboarding apenas se não completou e não tem dados
    const onboardingCompleted = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (!onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return (
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Dashboard />
        </Suspense>
      </AppLayout>
    );
  }
  return (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
    </Suspense>
  );
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<HomeOrLanding />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {/* Onboarding: página standalone (sem AppLayout) mas protegida */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OnboardingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="/plano-pais/:codigo" element={<PublicPlano />} />
      <Route path="/plano-da-turma/:codigo" element={<PublicPlano />} />
      <Route path="/rito-sacramental/:codigo/:sacramento" element={<PublicRitoSacramental />} />
      <Route path="/inscricao-catequizando/:codigo" element={<PublicInscricao />} />
      <Route path="/painel-ivc/:codigo" element={<PublicPainelIVC />} />
      <Route path="/visita-familia/:token" element={<PublicAgendaVisita />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/turmas" element={<TurmasList />} />
        <Route path="/turmas/nova" element={<TurmaForm />} />
        <Route path="/turmas/:id/editar" element={<TurmaForm />} />
        <Route path="/turmas/:id" element={<TurmaDetail />} />
        <Route path="/turmas/:id/encontros" element={<EncontrosList />} />
        <Route path="/turmas/:id/encontros/novo" element={<EncontroForm />} />
        <Route path="/turmas/:id/encontros/:encontroId" element={<EncontroDetail />} />
        <Route path="/turmas/:id/encontros/:encontroId/editar" element={<EncontroForm />} />
        <Route path="/turmas/:id/encontros/:encontroId/apresentacao" element={<EncontroPresentation />} />
        <Route path="/turmas/:id/catequizandos" element={<CatequizandosList />} />
        <Route path="/turmas/:id/eventos" element={<EventosList />} />
        <Route path="/turmas/:id/reunioes" element={<ReunioesList />} />
        <Route path="/turmas/:id/reunioes/:reuniaoId/apresentacao" element={<ReuniaoPresentation />} />
        <Route path="/turmas/:id/plano" element={<PlanoTurma />} />
        <Route path="/turmas/:id/trilha-sacramental" element={<TrilhaSacramental />} />
        <Route path="/turmas/:id/painel-ivc" element={<PainelIVC />} />
        <Route path="/turmas/:id/diario" element={<DiarioEspiritualList />} />
        <Route path="/turmas/:id/diario/novo" element={<DiarioEspiritualForm />} />
        <Route path="/turmas/:id/diario/:diarioId/editar" element={<DiarioEspiritualForm />} />
        <Route path="/turmas/:id/relatorios" element={<RelatoriosTurma />} />
        <Route path="/turmas/:id/biblioteca" element={<BibliotecaModelos />} />
        <Route path="/modulos" element={<ModulosGlobais />} />
        <Route path="/modulos/mural" element={<MuralFotos />} />
        <Route path="/modulos/biblia" element={<BibliaPage />} />
        <Route path="/modulos/loja" element={<MaterialApoio />} />
        <Route path="/modulos/loja/sucesso" element={<StoreCheckoutSuccess />} />
        <Route path="/modulos/loja/pendente" element={<StoreCheckoutPending />} />
        <Route path="/modulos/material/sucesso" element={<StoreCheckoutSuccess />} />
        <Route path="/modulos/material/pendente" element={<StoreCheckoutPending />} />
        <Route path="/modulos/biblioteca" element={<BibliotecaModelos />} />
        <Route path="/modulos/oracoes" element={<OracoesList />} />
        <Route path="/modulos/oracoes/:id" element={<OracaoView />} />
        <Route path="/modulos/calendario" element={<CalendarioLiturgico />} />
        <Route path="/modulos/liturgia" element={<LiturgiaDiaria />} />
        <Route path="/modulos/visitas" element={<PainelVisitaFamilia />} />
        <Route path="/modulos/*" element={<PlaceholderPage />} />
        <Route path="/jogos" element={<JogosHub />} />
        <Route path="/jogos/sorteio" element={<SorteioNomes />} />
        <Route path="/jogos/quiz" element={<QuizBiblico />} />
        <Route path="/jogos/quem-sou" element={<QuemSouBiblico />} />
        <Route path="/jogos/perguntas" element={<PerguntasRespostas />} />
        <Route path="/jogos/citacao" element={<CitacaoSorteio />} />
        <Route path="/jogos/grupos" element={<SorteioGrupos />} />
        <Route path="/jogos/mimica" element={<Mimica />} />
        <Route path="/jogos/dado" element={<SorteioDado />} />
        <Route path="/cadastros/paroquia-comunidade" element={<ParoquiaComunidadeCadastro />} />
        <Route path="/cadastros/catequistas" element={<CatequistasCadastro />} />
        <Route path="/mapa-panoramico" element={<MapaPanoramico />} />
      </Route>
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const minTimeRef = useRef(false);

  // Splash some quando: (1) tempo mínimo passou E (2) auth já foi verificado
  const tryHideSplash = useCallback(() => {
    if (minTimeRef.current && authReady) {
      setShowSplash(false);
    }
  }, [authReady]);

  useEffect(() => {
    initGlobalErrorCapture();

    // Tempo mínimo de 2000ms para a splash, conforme solicitado para a splash demorar mais
    const timer = setTimeout(() => {
      minTimeRef.current = true;
      tryHideSplash();
    }, 2000);

    // Detectar fluxo de recuperação de senha via evento do Supabase Auth
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      window.history.replaceState(null, "", "/reset-password" + hash);
    }

    return () => clearTimeout(timer);
  }, [tryHideSplash]);

  // Quando auth ficar pronto, tenta esconder a splash
  useEffect(() => {
    if (authReady) tryHideSplash();
  }, [authReady, tryHideSplash]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {showSplash && <SplashScreen />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider onAuthReady={() => setAuthReady(true)}>
              <ScrollToTop />
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
