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

    // Quando um novo SW tomar controle, recarrega a página (com proteção anti-loop)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        // Garante que não haverá reload em loop: só recarrega se passaram mais de 5s desde o último reload
        const lastReload = parseInt(sessionStorage.getItem('sw_last_reload') || '0', 10);
        const now = Date.now();
        if (now - lastReload > 5000) {
          refreshing = true;
          sessionStorage.setItem('sw_last_reload', String(now));
          console.log('[SW] Controller mudou. Recarregando para aplicar nova versão...');
          window.location.reload();
        } else {
          console.log('[SW] Controller mudou mas reload recente detectado, ignorando para evitar loop.');
        }
      }
    });
  });
}

// Global capture for beforeinstallprompt since it can fire before React mounts
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
});
