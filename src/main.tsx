import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Registrar Service Worker para Push Notifications e controle de cache
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[SW] Registrado com sucesso:', registration.scope);

        // Detecta quando um novo SW foi instalado e está esperando
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // Quando o novo SW termina de instalar e há um SW antigo controlando
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] Nova versão disponível. Recarregando...');
              // Força o reload para carregar a nova versão limpa
              window.location.reload();
            }
          });
        });

        // Verifica atualizações imediatamente ao carregar
        registration.update().catch(() => {});
      })
      .catch(err => {
        console.log('[SW] Falha ao registrar:', err);
      });

    // Quando um novo SW tomar controle, recarrega a página
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[SW] Controller mudou. Recarregando para aplicar nova versão...');
        window.location.reload();
      }
    });
  });
}

// Global capture for beforeinstallprompt since it can fire before React mounts
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
});
