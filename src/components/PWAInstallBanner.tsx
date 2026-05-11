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
      // No iOS, mostrar instruções manuais quase imediatamente
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }

    // Para Android/Chrome: escutar o evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Mostrar banner rapidamente
      setShowBanner(true);
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
    <div className="fixed top-[82px] right-4 z-[70] animate-in slide-in-from-right-4 fade-in duration-500 pointer-events-none">
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/10 rounded-2xl px-3 py-2 flex items-center gap-2 max-w-[200px] pointer-events-auto overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <Smartphone className="w-3.5 h-3.5 text-primary animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.05em] text-foreground truncate">
            Instalar App
          </p>
          <button 
            onClick={handleInstall}
            disabled={installing}
            className="text-[8px] font-bold text-primary hover:underline transition-all uppercase tracking-wider text-left block truncate"
          >
            {installing ? "Instalando..." : "Baixar agora"}
          </button>
        </div>

        <button 
          onClick={handleDismiss}
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
