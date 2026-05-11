import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

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
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 animate-in slide-in-from-bottom-4 duration-500"
      role="banner"
      aria-label="Instalar aplicativo iCatequese"
    >
      <div
        className="max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        style={{
          background: "linear-gradient(135deg, #1a2d8c 0%, #2a4bd1 50%, #3b5cf6 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 flex-shrink-0">
              <img
                src="/icon-192.png"
                alt="iCatequese"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">
                Instalar Aplicativo
              </p>
              <h3 className="text-lg font-black text-white leading-tight">
                iCatequese
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">
                Gestão de catequese na palma da mão
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all flex-shrink-0 mt-1"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Benefícios */}
        <div className="px-5 py-2">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "⚡", label: "Acesso rápido" },
              { icon: "📴", label: "Funciona offline" },
              { icon: "🔔", label: "Notificações" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 rounded-2xl px-2 py-2.5 text-center"
              >
                <div className="text-lg mb-1">{item.icon}</div>
                <p className="text-[9px] font-black text-white/80 uppercase tracking-wide">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Ação */}
        <div className="p-5 pt-3">
          {isIOS ? (
            // Instruções para iOS
            <div className="bg-white/10 rounded-2xl p-4 space-y-2">
              <p className="text-[11px] font-black text-white uppercase tracking-wide flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Como instalar no iPhone/iPad:
              </p>
              <ol className="space-y-1.5">
                {[
                  'Toque no botão "Compartilhar" (⬆️) no Safari',
                  'Role para baixo e toque em "Adicionar à Tela de Início"',
                  'Toque em "Adicionar" para confirmar',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[11px] text-white/80 font-medium">{step}</p>
                  </li>
                ))}
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full mt-2 py-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-black uppercase tracking-widest transition-all"
              >
                Entendido, obrigado!
              </button>
            </div>
          ) : (
            // Botão de instalação para Android/Chrome
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest transition-all"
              >
                Agora não
              </button>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-[2] py-3.5 rounded-2xl bg-white text-primary text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {installing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Instalar Grátis
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
