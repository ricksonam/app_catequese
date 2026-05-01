import { useState, useEffect, useCallback, useRef } from "react";
import { Link2, Camera, X as XIcon, Loader2 } from "lucide-react";
import { useJoinTurma } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JoinTurmaModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (turma: any) => void;
}

const SCANNER_DIV_ID = "onboarding-qr-reader";

export function JoinTurmaModal({ open, onClose, onSuccess }: JoinTurmaModalProps) {
  const [tab, setTab] = useState<"codigo" | "camera">("codigo");
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const html5QrRef = useRef<any>(null);
  const joinMutation = useJoinTurma();

  // Para o scanner de forma segura
  const stopScanner = useCallback(async () => {
    if (!html5QrRef.current) return;
    try {
      const state = html5QrRef.current.getState?.();
      if (state === 2) { // 2 = SCANNING
        await html5QrRef.current.stop();
      }
      html5QrRef.current.clear?.();
    } catch (_) {
      // ignore
    } finally {
      html5QrRef.current = null;
      setScanning(false);
    }
  }, []);

  const handleClose = useCallback(async () => {
    await stopScanner();
    setTab("codigo");
    setCode("");
    onClose();
  }, [stopScanner, onClose]);

  const switchTab = useCallback(async (next: "codigo" | "camera") => {
    if (tab === "camera" && next === "codigo") {
      await stopScanner();
    }
    setTab(next);
  }, [tab, stopScanner]);

  // Efeito para o Scanner
  useEffect(() => {
    if (!open || tab !== "camera") return;

    let cancelled = false;
    const startScanner = async () => {
      await new Promise(r => setTimeout(r, 300));
      if (cancelled) return;

      const el = document.getElementById(SCANNER_DIV_ID);
      if (!el) return;

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode(SCANNER_DIV_ID);
        html5QrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decoded: string) => {
            const cleaned = decoded.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
            setCode(cleaned);
            setTab("codigo");
            toast.success("QR Code lido com sucesso!");
          },
          () => {}
        );
        if (!cancelled) setScanning(true);
      } catch (err) {
        if (!cancelled) {
          toast.error("Não foi possível acessar a câmera.");
          setTab("codigo");
        }
      }
    };

    startScanner();
    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [open, tab, stopScanner]);

  const handleJoin = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 8) {
      toast.error("O código deve ter 8 caracteres.");
      return;
    }

    try {
      const result = await joinMutation.mutateAsync(trimmed);
      if (result.status === 'pending') {
        toast.success(`Solicitação enviada para a turma "${result.nome}"! Aguarde aprovação.`);
      } else {
        toast.success(`Bem-vindo à turma "${result.nome}"!`);
      }
      if (onSuccess) onSuccess(result);
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao entrar na turma.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">Entrar na Turma</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                {tab === "codigo" ? "Digite o código da turma" : "Aponte para o QR Code"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
            >
              <XIcon className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex gap-2 p-1 bg-muted/40 rounded-2xl">
            <button
              onClick={() => switchTab("codigo")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                tab === "codigo" ? "bg-white dark:bg-zinc-800 shadow-sm text-emerald-700" : "text-muted-foreground"
              )}
            >
              <Link2 className="h-3.5 w-3.5" /> Código
            </button>
            <button
              onClick={() => switchTab("camera")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                tab === "camera" ? "bg-white dark:bg-zinc-800 shadow-sm text-emerald-700" : "text-muted-foreground"
              )}
            >
              <Camera className="h-3.5 w-3.5" /> Câmera QR
            </button>
          </div>

          {tab === "codigo" && (
            <div className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="Ex: TP847293"
                maxLength={8}
                autoFocus
                className="w-full px-4 py-4 rounded-2xl border-2 border-border bg-background text-foreground text-center text-2xl font-black tracking-[0.35em] uppercase placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                onClick={handleJoin}
                disabled={joinMutation.isPending || code.trim().length < 8}
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
              >
                {joinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {joinMutation.isPending ? "Verificando..." : "Entrar na Turma"}
              </button>
            </div>
          )}

          {tab === "camera" && (
            <div className="space-y-2">
              <div
                id={SCANNER_DIV_ID}
                className="w-full rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-black"
                style={{ minHeight: 260 }}
              />
              {!scanning && (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Iniciando câmera...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
