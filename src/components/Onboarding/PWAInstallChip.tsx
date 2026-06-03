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

    // Detect iOS
    const iosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(iosDevice);
    
    // Show chip after a short delay regardless of event (fallback logic)
    const timer = setTimeout(() => setShowChip(true), 1000);

    // Initial check for global deferred prompt
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowChip(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      toast.info("Para instalar o App iCatequese:", {
        description: "Toque no botão Compartilhar do Safari (ícone de quadrado com seta) e selecione 'Adicionar à Tela de Início'.",
        duration: 10000,
      });
      return;
    }

    if (!deferredPrompt) {
      toast.info("Instalação do Aplicativo", {
        description: "Para baixar, clique nos três pontinhos do seu navegador (no canto superior ou inferior) e selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'.",
        duration: 8000,
      });
      return;
    }

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
    // We don't save to localStorage here to keep it "fixed" as requested, 
    // it will reappear on next reload if not installed.
  };

  if (!showChip || isInstalled) return null;

  return (
    <div className="w-full flex justify-center sticky top-[68px] z-40 px-4 -mt-2 mb-6 animate-in fade-in slide-in-from-top-4 duration-700 pointer-events-none">
      <div 
        onClick={handleInstall}
        className="group flex items-center gap-2.5 px-5 py-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-primary/30 rounded-full shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer pointer-events-auto border-b-2 border-r-2"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
          <Download className="w-3.5 h-3.5 text-primary group-hover:text-white transition-all" />
        </div>
        
        <div className="flex flex-col items-start leading-none">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-foreground group-hover:text-primary transition-colors">
            Baixar App iCatequese
          </span>
          <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            Instalar na tela inicial
          </span>
        </div>
        
        <div className="w-px h-4 bg-primary/20 mx-1" />
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors group/close"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/close:text-muted-foreground transition-colors" />
        </button>
      </div>
    </div>
  );
}
