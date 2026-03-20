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
import CatequizandosList from "@/pages/CatequizandosList";
import ModulosGlobais from "@/pages/ModulosGlobais";
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
            <Route path="/turmas/:id/catequizandos" element={<CatequizandosList />} />
            <Route path="/turmas/:id/atividades" element={<PlaceholderPage />} />
            <Route path="/turmas/:id/plano" element={<PlaceholderPage />} />
            <Route path="/modulos" element={<ModulosGlobais />} />
            <Route path="/modulos/*" element={<PlaceholderPage />} />
            <Route path="/cadastros/*" element={<PlaceholderPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
