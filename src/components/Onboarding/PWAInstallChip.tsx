import { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallChip() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showChip, setShowChip] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (24h)
    const dismissed = localStorage.getItem("pwa_chip_dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      if (hoursSince < 24) return;
    }

    // Detect iOS
    const iosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(iosDevice);
    if (iosDevice) {
      // For iOS, we show the chip to guide manual install
      const timer = setTimeout(() => setShowChip(true), 1500);
      return () => clearTimeout(timer);
    }

    // For Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowChip(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      toast.info("Para instalar o App iCatequese:", {
        description: "Toque no botão Compartilhar do Safari (ícone de quadrado com seta) e selecione 'Adicionar à Tela de Início'.",
        duration: 10000,
      });
      return;
    }

    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowChip(false);
        setIsInstalled(true);
      }
    } catch (err) {
      console.error("Erro ao instalar PWA:", err);
    }
  };

  const handleDismiss = () => {
    setShowChip(false);
    localStorage.setItem("pwa_chip_dismissed", Date.now().toString());
  };

  if (!showChip || isInstalled) return null;

  return (
    <div className="w-full flex justify-center -mt-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-1000 relative z-30">
      <div 
        onClick={handleInstall}
        className="group flex items-center gap-2.5 px-4 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-primary/20 rounded-full shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
          <Download className="w-3 h-3 text-primary group-hover:text-white transition-all" />
        </div>
        
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80 group-hover:text-primary transition-colors">
          Baixar App iCatequese
        </span>
        
        <div className="w-px h-3 bg-primary/20 mx-0.5" />
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group/close"
        >
          <X className="w-3 h-3 text-muted-foreground/30 group-hover/close:text-muted-foreground transition-colors" />
        </button>
      </div>
    </div>
  );
}
