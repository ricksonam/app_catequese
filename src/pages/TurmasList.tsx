import { useTurmas, useEncontros, useCatequizandos, useJoinTurma } from "@/hooks/useSupabaseData";
import { ETAPAS_CATEQUESE } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, CalendarDays, Users, Link2, X as XIcon, Loader2, Camera } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export default function TurmasList() {
  const { data: turmas = [], isLoading } = useTurmas();
  const { data: encontros = [] } = useEncontros();
  const { data: catequizandos = [] } = useCatequizandos();
  const navigate = useNavigate();
  const joinMutation = useJoinTurma();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [tab, setTab] = useState<"codigo" | "camera">("codigo");
  const [scanning, setScanning] = useState(false);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);

  useEffect(() => {
    if (turmas.length > 0 && !selectedTurmaId) {
      const saved = localStorage.getItem("ivc_selected_turma");
      if (saved && turmas.some(t => t.id === saved)) {
        setSelectedTurmaId(saved);
      } else {
        setSelectedTurmaId(turmas[0].id);
        localStorage.setItem("ivc_selected_turma", turmas[0].id);
      }
    }
  }, [turmas, selectedTurmaId]);

  const handleSelectSecondary = (id: string) => {
    setSelectedTurmaId(id);
    localStorage.setItem("ivc_selected_turma", id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mainTurma = turmas.find(t => t.id === selectedTurmaId) || turmas[0];
  const secondaryTurmas = turmas.filter(t => t.id !== mainTurma?.id);

  const html5QrRef = useRef<any>(null);
  const SCANNER_DIV_ID = "qr-scanner-div";

  // Esconde navbar quando modal está aberto
  useEffect(() => {
    const nav = document.getElementById("bottom-nav-bar");
    if (!nav) return;
    nav.style.display = joinModalOpen ? "none" : "";
    return () => { nav.style.display = ""; };
  }, [joinModalOpen]);

  // Para o scanner de forma segura
  const stopScanner = useCallback(async () => {
    if (!html5QrRef.current) return;
    try {
      const state = html5QrRef.current.getState?.();
      // Estado 2 = SCANNING
      if (state === 2) {
        await html5QrRef.current.stop();
      }
      html5QrRef.current.clear?.();
    } catch (_) {
      // ignora erros de cleanup
    } finally {
      html5QrRef.current = null;
      setScanning(false);
    }
  }, []);

  // Inicia o scanner quando entra na aba câmera
  useEffect(() => {
    if (tab !== "camera" || !joinModalOpen) return;

    let cancelled = false;

    const startScanner = async () => {
      // Aguarda o DOM criar o div
      await new Promise(r => setTimeout(r, 200));
      if (cancelled) return;

      const el = document.getElementById(SCANNER_DIV_ID);
      if (!el) return;

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(SCANNER_DIV_ID);
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },           // câmera traseira
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded: string) => {
            // Sucesso — preenche o código e volta para a aba de texto
            const cleaned = decoded.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
            setCode(cleaned);
            setTab("codigo");
            toast.success("QR Code lido com sucesso!");
          },
          () => {} // erros de frame ignorados
        );

        if (!cancelled) setScanning(true);
      } catch (err: any) {
        if (!cancelled) {
          toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
          setTab("codigo");
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [tab, joinModalOpen, stopScanner]);

  // Ao fechar o modal, para o scanner
  const closeModal = useCallback(async () => {
    await stopScanner();
    setTab("codigo");
    setJoinModalOpen(false);
    setCode("");
  }, [stopScanner]);

  // Ao trocar de aba, para o scanner se estava na câmera
  const switchTab = useCallback(async (next: "codigo" | "camera") => {
    if (tab === "camera" && next === "codigo") {
      await stopScanner();
    }
    setTab(next);
  }, [tab, stopScanner]);

  const handleJoin = async () => {
    if (code.trim().length < 8) { toast.error("O código deve ter 8 caracteres."); return; }
    try {
      const result = await joinMutation.mutateAsync(code.trim());
      toast.success(`Acesso concedido à turma "${result.nome}"!`);
      closeModal();
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar na turma.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 animate-bounce-subtle">
          <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-xs font-black text-primary/60 uppercase tracking-widest animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">Turmas</h1>
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-95"
          >
            <Link2 className="h-3.5 w-3.5" /> Entrar com Código
          </button>
          <button onClick={() => navigate("/turmas/nova")} className="action-btn-sm">
            <Plus className="h-4 w-4" /> Nova
          </button>
        </div>
      </div>

      {turmas.length === 0 ? (
        <div className="empty-state animate-float-up">
          <div className="icon-box bg-primary/10 text-primary mx-auto mb-3"><BookOpen className="h-6 w-6" /></div>
          <h3 className="font-bold text-foreground mb-1">Nenhuma turma cadastrada</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie sua primeira turma ou entre com um código compartilhado.</p>
          <button
            onClick={() => setJoinModalOpen(true)}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-black bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all active:scale-95"
          >
            <Link2 className="h-4 w-4" /> Entrar com Código
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* MAIN TURMA CARD */}
          {mainTurma && (() => {
            const tEncontros = encontros.filter(e => e.turmaId === mainTurma.id);
            const tCatequizandos = catequizandos.filter(c => c.turmaId === mainTurma.id);
            const etapa = ETAPAS_CATEQUESE.find(e => e.id === mainTurma.etapa);
            return (
              <div
                onClick={() => navigate(`/turmas/${mainTurma.id}`)}
                className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))]/60 via-[hsl(var(--liturgical))]/40 to-primary/40 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.12)] animate-float-up transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group"
              >
                <div className="absolute inset-[3px] rounded-xl border border-white/50 dark:border-white/10 z-20 pointer-events-none opacity-60 mix-blend-overlay" />
                <div className="relative flex flex-col p-4 rounded-[14px] bg-card w-full h-full overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                    <BookOpen className="w-32 h-32 text-primary" />
                  </div>
                  {mainTurma.isShared && (
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                      <Link2 className="h-2.5 w-2.5" /> Compartilhada
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center mb-5 relative z-30 text-center mt-2">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-md mb-4 group-hover:scale-110 transition-transform duration-500">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary mb-2 shadow-sm border border-primary/10">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Turma Principal</span>
                      </div>
                      <h3 className="text-xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {mainTurma.nome} <span className="opacity-40 font-bold ml-1">— {mainTurma.ano}</span>
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">{mainTurma.diaCatequese} • {mainTurma.horario} • {mainTurma.local}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap relative z-30">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/10 shadow-sm">
                      <CalendarDays className="h-3.5 w-3.5" /><span>{tEncontros.length} encontros</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/10 shadow-sm">
                      <Users className="h-3.5 w-3.5" /><span>{tCatequizandos.length} catequizandos</span>
                    </div>
                    {etapa && <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/10 shadow-sm">{etapa.label}</span>}
                  </div>
                  <div className="mt-5 w-full bg-primary/10 hover:bg-primary/20 text-primary py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center z-30 relative shadow-sm border border-primary/10">
                     Acessar Painel da Turma
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECONDARY TURMAS */}
          {secondaryTurmas.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/50">
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest pl-2">
                 Outras Turmas
               </h3>
               <div className="grid grid-cols-2 gap-3">
                 {secondaryTurmas.map((turma, i) => {
                   const etapa = ETAPAS_CATEQUESE.find(e => e.id === turma.etapa);
                   return (
                     <div
                       key={turma.id}
                       onClick={() => handleSelectSecondary(turma.id)}
                       className="relative p-3 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 active:scale-95 cursor-pointer flex flex-col justify-between animate-fade-in group"
                       style={{ animationDelay: `${i * 50}ms` }}
                     >
                        <div className="absolute top-2 right-2 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                           <BookOpen className="w-12 h-12" />
                        </div>
                        <div className="space-y-1 relative z-10">
                           <h4 className="text-sm font-black text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                             {turma.nome}
                           </h4>
                           <p className="text-[10px] text-muted-foreground font-medium truncate">
                             {turma.diaCatequese} • {turma.horario}
                           </p>
                        </div>
                        <div className="mt-4 relative z-10">
                           <span className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest">
                             Tornar Principal
                           </span>
                        </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Entrar com Código / QR ── */}
      {joinModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-sm bg-card rounded-[32px] shadow-2xl overflow-hidden animate-float-up">
            {/* Barra colorida */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-foreground">Entrar na Turma</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tab === "codigo" ? "Digite o código de 8 caracteres" : "Aponte a câmera para o QR Code"}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95 shrink-0"
                >
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-muted/40 rounded-2xl">
                <button
                  onClick={() => switchTab("codigo")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${tab === "codigo" ? "bg-white dark:bg-zinc-800 shadow text-emerald-700" : "text-muted-foreground"}`}
                >
                  <Link2 className="h-3.5 w-3.5" /> Código
                </button>
                <button
                  onClick={() => switchTab("camera")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${tab === "camera" ? "bg-white dark:bg-zinc-800 shadow text-emerald-700" : "text-muted-foreground"}`}
                >
                  <Camera className="h-3.5 w-3.5" /> Câmera QR
                </button>
              </div>

              {/* Aba: Código Manual */}
              {tab === "codigo" && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    onKeyDown={e => e.key === "Enter" && handleJoin()}
                    placeholder="Ex: TP847293"
                    maxLength={8}
                    autoFocus
                    className="w-full px-4 py-4 rounded-2xl border-2 border-border bg-background text-foreground text-center text-2xl font-black tracking-[0.35em] uppercase placeholder:text-muted-foreground/30 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[10px] text-center text-muted-foreground">
                    Código fornecido pelo catequista responsável pela turma
                  </p>
                  <button
                    onClick={handleJoin}
                    disabled={joinMutation.isPending || code.trim().length < 8}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-wider hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 mt-1"
                  >
                    {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    {joinMutation.isPending ? "Verificando..." : "Entrar na Turma"}
                  </button>
                </div>
              )}

              {/* Aba: Scanner QR */}
              {tab === "camera" && (
                <div className="space-y-2">
                  {/* O html5-qrcode injeta o vídeo aqui */}
                  <div
                    id={SCANNER_DIV_ID}
                    className="w-full rounded-2xl overflow-hidden border-2 border-emerald-500/30"
                    style={{ minHeight: 260 }}
                  />
                  {!scanning && (
                    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
                      <span className="text-xs font-bold">Iniciando câmera traseira...</span>
                    </div>
                  )}
                  <p className="text-[10px] text-center text-muted-foreground">
                    Centralize o QR Code da turma para leitura automática
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
