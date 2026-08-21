// ============================================================
// iCatequese Service Worker
// IMPORTANTE: Altere o CACHE_VERSION a cada deploy para
// garantir que os usuários recebam a versão mais recente.
// Atualizado em: 2026-08-21T07:00:00-03:00
// ============================================================

const CACHE_VERSION = 'v' + Date.now(); // auto-increments on each SW install
const CACHE_NAME = 'icatequese-cache-' + CACHE_VERSION;

// Arquivos para NÃO cachear (sempre buscar da rede)
const NEVER_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
];

// ── INSTALL: não pré-cacheia nada, apenas ativa imediatamente ──
self.addEventListener('install', function(event) {
  console.log('[SW] Installing version:', CACHE_VERSION);
  // Força o SW novo a assumir o controle imediatamente
  self.skipWaiting();
});

// ── ACTIVATE: apaga todos os caches antigos ──
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            // Remove qualquer cache que não seja o atual
            return name.startsWith('icatequese-cache-') && name !== CACHE_NAME;
          })
          .map(function(name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      // Toma controle de todos os clientes abertos imediatamente
      return self.clients.claim();
    })
  );
});

// ── FETCH: estratégia network-first ──
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;

  // Ignora requisições externas (Supabase, APIs, etc.)
  if (url.origin !== self.location.origin) return;

  // Para arquivos HTML e rotas da SPA: sempre busca da rede
  const pathname = url.pathname;
  const neverCache = NEVER_CACHE.some(p => pathname === p || pathname === '');
  const isHtml = !pathname.includes('.') || pathname.endsWith('.html');

  if (neverCache || isHtml) {
    event.respondWith(
      fetch(event.request).catch(function() {
        // Offline fallback: tenta o cache
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Para assets com hash no nome (ex: index-DGUGHxri.js): cache-first
  // Esses arquivos são imutáveis (o hash muda quando o conteúdo muda)
  const hasHash = /\.[a-f0-9]{8,}\.(js|css|png|jpg|svg|woff2?)$/.test(pathname);

  if (hasHash) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          if (cached) return cached;
          return fetch(event.request).then(function(response) {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Para demais recursos: network-first
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});

// ── PUSH NOTIFICATIONS ──
// Recebe push do servidor e exibe notificação nativa no Android/iOS
self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'iCatequese', body: event.data.text() };
  }

  const title = data.title || 'iCatequese';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    image: data.image || undefined,
    data: {
      url: data.url || '/',
    },
    tag: data.tag || 'icatequese-notif',
    // Vibração para Android: padrão longo-curto-longo
    vibrate: [200, 100, 200, 100, 200],
    // Mantém a notificação até o usuário interagir (não desaparece automaticamente)
    requireInteraction: true,
    // Som padrão do sistema
    silent: false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url)
    ? new URL(event.notification.data.url, self.location.origin).href
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Se já há uma janela aberta, foca nela
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Senão, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
