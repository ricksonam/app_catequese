import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { logError, initGlobalErrorCapture } from "@/lib/errorLogger";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import Dashboard from "@/pages/Dashboard";
import TurmasList from "@/pages/TurmasList";
import TurmaForm from "@/pages/TurmaForm";
import TurmaDetail from "@/pages/TurmaDetail";
import EncontrosList from "@/pages/EncontrosList";
import EncontroForm from "@/pages/EncontroForm";
import EncontroDetail from "@/pages/EncontroDetail";
import EncontroPresentation from "@/pages/EncontroPresentation";
import CatequizandosList from "@/pages/CatequizandosList";
import AtividadesList from "@/pages/AtividadesList";
import PlanoTurma from "@/pages/PlanoTurma";
import RelatoriosTurma from "@/pages/RelatoriosTurma";
import MissoesFamilia from "@/pages/MissoesFamilia";
import PublicMissao from "@/pages/PublicMissao";
import BibliotecaModelos from "@/pages/BibliotecaModelos";
import ModulosGlobais from "@/pages/ModulosGlobais";
import MuralFotos from "@/pages/MuralFotos";
import JogosHub from "@/pages/JogosHub";
import SorteioNomes from "@/pages/SorteioNomes";
import QuizBiblico from "@/pages/QuizBiblico";
import QuemSouBiblico from "@/pages/QuemSouBiblico";
import PerguntasRespostas from "@/pages/PerguntasRespostas";
import CitacaoSorteio from "@/pages/CitacaoSorteio";
import BingoBiblico from "@/pages/BingoBiblico";
import SorteioGrupos from "@/pages/SorteioGrupos";
import Mimica from "@/pages/Mimica";
import BibliaPage from "@/pages/BibliaPage";
import MaterialApoio from "@/pages/MaterialApoio";
import ParoquiaComunidadeCadastro from "@/pages/ParoquiaComunidadeCadastro";
import CatequistasCadastro from "@/pages/CatequistasCadastro";
import CalendarioLiturgico from "@/pages/CalendarioLiturgico";
import PlaceholderPage from "@/pages/PlaceholderPage";
import PublicPlano from "@/pages/PublicPlano";
import ComunicacaoHub from "@/pages/ComunicacaoHub";
import ComunicacaoBuilder from "@/pages/ComunicacaoBuilder";
import ComunicacaoDetail from "@/pages/ComunicacaoDetail";
import PublicFormResponder from "@/pages/PublicFormResponder";
import PublicInscricao from "@/pages/PublicInscricao";
import NotFound from "@/pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "@/components/SplashScreen";
import { useState, useEffect } from "react";

// QueryClient com configuração de resiliência
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
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-32 h-32 rounded-3xl overflow-hidden animate-float transform-gpu">
            <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Conectando...</p>
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/plano-pais/:codigo" element={<PublicPlano />} />
    <Route path="/plano-da-turma/:codigo" element={<PublicPlano />} />
    <Route path="/missao/:codigo" element={<PublicMissao />} />
    <Route path="/f/:codigo" element={<PublicFormResponder />} />
    <Route path="/inscricao-catequizando/:codigo" element={<PublicInscricao />} />
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Dashboard />} />
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
      <Route path="/turmas/:id/atividades" element={<AtividadesList />} />
      <Route path="/turmas/:id/plano" element={<PlanoTurma />} />
      <Route path="/turmas/:id/familia" element={<MissoesFamilia />} />
      <Route path="/turmas/:id/relatorios" element={<RelatoriosTurma />} />
      <Route path="/turmas/:id/biblioteca" element={<BibliotecaModelos />} />
      <Route path="/modulos" element={<ModulosGlobais />} />
      <Route path="/modulos/mural" element={<MuralFotos />} />
      <Route path="/modulos/biblia" element={<BibliaPage />} />
      <Route path="/modulos/material" element={<MaterialApoio />} />
      <Route path="/modulos/biblioteca" element={<BibliotecaModelos />} />
      <Route path="/modulos/calendario" element={<CalendarioLiturgico />} />
      <Route path="/modulos/*" element={<PlaceholderPage />} />
      <Route path="/jogos" element={<JogosHub />} />
      <Route path="/jogos/sorteio" element={<SorteioNomes />} />
      <Route path="/jogos/quiz" element={<QuizBiblico />} />
      <Route path="/jogos/quem-sou" element={<QuemSouBiblico />} />
      <Route path="/jogos/perguntas" element={<PerguntasRespostas />} />
      <Route path="/jogos/citacao" element={<CitacaoSorteio />} />
      <Route path="/jogos/bingo" element={<BingoBiblico />} />
      <Route path="/jogos/grupos" element={<SorteioGrupos />} />
      <Route path="/jogos/mimica" element={<Mimica />} />
      <Route path="/cadastros/paroquia-comunidade" element={<ParoquiaComunidadeCadastro />} />
      <Route path="/cadastros/catequistas" element={<CatequistasCadastro />} />
      <Route path="/comunicacao" element={<ComunicacaoHub />} />
      <Route path="/comunicacao/novo" element={<ComunicacaoBuilder />} />
      <Route path="/comunicacao/:id/editar" element={<ComunicacaoBuilder />} />
      <Route path="/comunicacao/:id" element={<ComunicacaoDetail />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    initGlobalErrorCapture(); // Captura global de erros JS
    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {showSplash && <SplashScreen />}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
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
