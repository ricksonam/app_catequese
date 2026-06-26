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
const ResetPasswordPage       = lazy(() => import("@/pages/ResetPasswordPage"));
const Dashboard               = lazy(() => import("@/pages/Dashboard"));
const TurmasList              = lazy(() => import("@/pages/TurmasList"));
const TurmaForm               = lazy(() => import("@/pages/TurmaForm"));
const TurmaDetail             = lazy(() => import("@/pages/TurmaDetail"));
const EncontrosList           = lazy(() => import("@/pages/EncontrosList"));
const EncontroForm            = lazy(() => import("@/pages/EncontroForm"));
const EncontroDetail          = lazy(() => import("@/pages/EncontroDetail"));
const EncontroPresentation    = lazy(() => import("@/pages/EncontroPresentation"));
const CatequizandosList       = lazy(() => import("@/pages/CatequizandosList"));
const EventosList             = lazy(() => import("@/pages/EventosList"));
const ReunioesList            = lazy(() => import("@/pages/ReunioesList"));
const ReuniaoPresentation     = lazy(() => import("@/pages/ReuniaoPresentation"));
const PlanoTurma              = lazy(() => import("@/pages/PlanoTurma"));
const RelatoriosTurma         = lazy(() => import("@/pages/RelatoriosTurma"));
const TrilhaSacramental       = lazy(() => import("@/pages/TrilhaSacramental"));
const DiarioEspiritualList    = lazy(() => import("@/pages/DiarioEspiritualList"));
const DiarioEspiritualForm    = lazy(() => import("@/pages/DiarioEspiritualForm"));
const BibliotecaModelos       = lazy(() => import("@/pages/BibliotecaModelos"));
const OracoesList             = lazy(() => import("@/pages/OracoesList"));
const OracaoView              = lazy(() => import("@/pages/OracaoView"));
const ModulosGlobais          = lazy(() => import("@/pages/ModulosGlobais"));
const MuralFotos              = lazy(() => import("@/pages/MuralFotos"));
const JogosHub                = lazy(() => import("@/pages/JogosHub"));
const SorteioNomes            = lazy(() => import("@/pages/SorteioNomes"));
const QuizBiblico             = lazy(() => import("@/pages/QuizBiblico"));
const QuemSouBiblico          = lazy(() => import("@/pages/QuemSouBiblico"));
const PerguntasRespostas      = lazy(() => import("@/pages/PerguntasRespostas"));
const CitacaoSorteio          = lazy(() => import("@/pages/CitacaoSorteio"));
const SorteioGrupos           = lazy(() => import("@/pages/SorteioGrupos"));
const Mimica                  = lazy(() => import("@/pages/Mimica"));
const PacienciaBiblica        = lazy(() => import("@/pages/PacienciaBiblica"));
const BibliaPage              = lazy(() => import("@/pages/BibliaPage"));
const MaterialApoio           = lazy(() => import("@/pages/MaterialApoio"));
const ParoquiaComunidadeCadastro = lazy(() => import("@/pages/ParoquiaComunidadeCadastro"));
const CatequistasCadastro     = lazy(() => import("@/pages/CatequistasCadastro"));
const CalendarioLiturgico     = lazy(() => import("@/pages/CalendarioLiturgico"));
const LiturgiaDiaria          = lazy(() => import("@/pages/LiturgiaDiaria"));
const AdminDashboard          = lazy(() => import("@/pages/AdminDashboard"));
const AdminLogin              = lazy(() => import("@/pages/AdminLogin"));
const PremiumCheckout         = lazy(() => import("@/pages/PremiumCheckout"));
const PlaceholderPage         = lazy(() => import("@/pages/PlaceholderPage"));
const PublicPlano             = lazy(() => import("@/pages/PublicPlano"));
const PublicRitoSacramental   = lazy(() => import("@/pages/PublicRitoSacramental"));
const PublicInscricao         = lazy(() => import("@/pages/PublicInscricao"));
const MapaPanoramico          = lazy(() => import("@/pages/MapaPanoramico"));
const MinhaAssinatura         = lazy(() => import("@/pages/MinhaAssinatura"));
const NotFound                = lazy(() => import("@/pages/NotFound"));
const LandingPage             = lazy(() => import("@/pages/LandingPage"));
const OnboardingPage          = lazy(() => import("@/pages/OnboardingPage"));

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
        <Route path="/turmas/:id/diario" element={<DiarioEspiritualList />} />
        <Route path="/turmas/:id/diario/novo" element={<DiarioEspiritualForm />} />
        <Route path="/turmas/:id/diario/:diarioId/editar" element={<DiarioEspiritualForm />} />
        <Route path="/turmas/:id/relatorios" element={<RelatoriosTurma />} />
        <Route path="/turmas/:id/biblioteca" element={<BibliotecaModelos />} />
        <Route path="/modulos" element={<ModulosGlobais />} />
        <Route path="/modulos/mural" element={<MuralFotos />} />
        <Route path="/modulos/biblia" element={<BibliaPage />} />
        <Route path="/modulos/material" element={<MaterialApoio />} />
        <Route path="/modulos/biblioteca" element={<BibliotecaModelos />} />
        <Route path="/modulos/oracoes" element={<OracoesList />} />
        <Route path="/modulos/oracoes/:id" element={<OracaoView />} />
        <Route path="/modulos/calendario" element={<CalendarioLiturgico />} />
        <Route path="/modulos/liturgia" element={<LiturgiaDiaria />} />
        <Route path="/modulos/*" element={<PlaceholderPage />} />
        <Route path="/jogos" element={<JogosHub />} />
        <Route path="/jogos/sorteio" element={<SorteioNomes />} />
        <Route path="/jogos/quiz" element={<QuizBiblico />} />
        <Route path="/jogos/quem-sou" element={<QuemSouBiblico />} />
        <Route path="/jogos/perguntas" element={<PerguntasRespostas />} />
        <Route path="/jogos/citacao" element={<CitacaoSorteio />} />
        <Route path="/jogos/grupos" element={<SorteioGrupos />} />
        <Route path="/jogos/mimica" element={<Mimica />} />
        <Route path="/jogos/paciencia" element={<PacienciaBiblica />} />
        <Route path="/cadastros/paroquia-comunidade" element={<ParoquiaComunidadeCadastro />} />
        <Route path="/cadastros/catequistas" element={<CatequistasCadastro />} />
        <Route path="/mapa-panoramico" element={<MapaPanoramico />} />
        <Route path="/premium" element={<PremiumCheckout />} />
        <Route path="/minha-assinatura" element={<MinhaAssinatura />} />
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

    // Tempo mínimo de 1200ms para a splash
    const timer = setTimeout(() => {
      minTimeRef.current = true;
      tryHideSplash();
    }, 1200);

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
