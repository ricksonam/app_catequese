import { useState, useEffect } from "react";
import { X, Smartphone, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado como PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Verificar se já dispensou o banner recentemente (últimas 48h)
    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      if (hoursSince < 48) return;
    }

    // Detectar iOS
    const iosDevice = /iphone|ipad|ipod/.test(
      window.navigator.userAgent.toLowerCase()
    );
    setIsIOS(iosDevice);

    if (iosDevice) {
      // No iOS, mostrar instruções manuais após 2s
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // Para Android/Chrome: escutar o evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar banner após 2s para não ser intrusivo
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      toast.info("Para instalar no iPhone/iPad:", {
        description: "Toque no botão Compartilhar do Safari (quadrado com seta para cima) e selecione 'Adicionar à Tela de Início'.",
        duration: 10000,
      });
      return;
    }

    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        setIsInstalled(true);
      }
    } catch (err) {
      console.error("Erro ao instalar PWA:", err);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa_banner_dismissed", Date.now().toString());
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="w-full flex justify-center mb-3 px-2 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/10 rounded-[24px] px-3 py-2 flex items-center gap-3 w-full max-w-sm">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <Smartphone className="w-4 h-4 text-primary animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground truncate">
            App iCatequese
          </p>
          <p className="text-[9px] text-muted-foreground leading-tight truncate">
            Instale para acesso rápido
          </p>
        </div>
        
        <button
          onClick={handleInstall}
          disabled={installing}
          className="bg-primary text-white rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-md shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          {installing ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-3 h-3" />
          )}
          {isIOS ? "Como Instalar" : "Instalar"}
        </button>
        
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
