import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

createRoot(document.getElementById("root")!).render(<App />);

// Registrar Service Worker via vite-plugin-pwa (Workbox)
// O registerSW atualiza automaticamente quando há nova versão deployada
registerSW({
  onNeedRefresh() {
    // Nova versão disponível: recarrega para garantir que o usuário
    // use sempre a versão mais recente após cada deploy
    const lastReload = parseInt(sessionStorage.getItem("sw_last_reload") || "0", 10);
    const now = Date.now();
    if (now - lastReload > 5000) {
      sessionStorage.setItem("sw_last_reload", String(now));
      console.log("[SW] Nova versão disponível. Recarregando...");
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log("[SW] App pronto para uso offline!");
  },
  onRegistered(registration) {
    console.log("[SW] Service Worker registrado:", registration?.scope);
  },
  onRegisterError(error) {
    console.warn("[SW] Falha ao registrar Service Worker:", error);
  },
});

// Global capture for beforeinstallprompt since it can fire before React mounts
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
});

