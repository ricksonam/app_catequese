import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
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
import BibliotecaModelos from "@/pages/BibliotecaModelos";
import ModulosGlobais from "@/pages/ModulosGlobais";
import MuralFotos from "@/pages/MuralFotos";
import BibliaPage from "@/pages/BibliaPage";
import MaterialApoio from "@/pages/MaterialApoio";
import ParoquiaCadastro from "@/pages/ParoquiaCadastro";
import ComunidadesCadastro from "@/pages/ComunidadesCadastro";
import CatequistasCadastro from "@/pages/CatequistasCadastro";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
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
            <Route path="/turmas/:id/biblioteca" element={<BibliotecaModelos />} />
            <Route path="/modulos" element={<ModulosGlobais />} />
            <Route path="/modulos/mural" element={<MuralFotos />} />
            <Route path="/modulos/biblia" element={<BibliaPage />} />
            <Route path="/modulos/material" element={<MaterialApoio />} />
            <Route path="/modulos/biblioteca" element={<BibliotecaModelos />} />
            <Route path="/modulos/*" element={<PlaceholderPage />} />
            <Route path="/cadastros/paroquia" element={<ParoquiaCadastro />} />
            <Route path="/cadastros/comunidades" element={<ComunidadesCadastro />} />
            <Route path="/cadastros/catequistas" element={<CatequistasCadastro />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
