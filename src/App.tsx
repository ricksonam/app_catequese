import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import BibliaPage from "@/pages/BibliaPage";
import MaterialApoio from "@/pages/MaterialApoio";
import ParoquiaComunidadeCadastro from "@/pages/ParoquiaComunidadeCadastro";
import CatequistasCadastro from "@/pages/CatequistasCadastro";
import CalendarioLiturgico from "@/pages/CalendarioLiturgico";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
          <span className="text-xs font-black text-primary-foreground">IVC</span>
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
      <Route path="/turmas/:id" element={<TurmaDetail />} />
      <Route path="/turmas/:id/encontros" element={<EncontrosList />} />
      <Route path="/turmas/:id/encontros/novo" element={<EncontroForm />} />
      <Route path="/turmas/:id/encontros/:encontroId" element={<EncontroDetail />} />
      <Route path="/turmas/:id/encontros/:encontroId/editar" element={<EncontroForm />} />
      <Route path="/turmas/:id/encontros/:encontroId/apresentacao" element={<EncontroPresentation />} />
      <Route path="/turmas/:id/catequizandos" element={<CatequizandosList />} />
      <Route path="/turmas/:id/atividades" element={<AtividadesList />} />
      <Route path="/turmas/:id/plano" element={<PlanoTurma />} />
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
      <Route path="/cadastros/paroquia-comunidade" element={<ParoquiaComunidadeCadastro />} />
      <Route path="/cadastros/catequistas" element={<CatequistasCadastro />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
