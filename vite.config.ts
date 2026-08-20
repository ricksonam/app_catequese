import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      // O Workbox gera e gerencia o sw.js automaticamente no build
      registerType: "autoUpdate",
      injectRegister: false, // Controlamos o registro manualmente no main.tsx

      // Arquivos do public/ que devem ser incluídos no precache
      includeAssets: [
        "icon-192.png",
        "icon-512.png",
        "favicon.ico",
        "Logo_sem_fundo.png",
      ],

      manifest: false, // Usamos o manifest.json existente no public/

      workbox: {
        // Estratégia navigateFallback: serve index.html para qualquer rota offline
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [
          /^\/api\//,
          /supabase\.co/,
          /^\/sw\.js$/,
          /^\/manifest\.json$/,
        ],

        // Runtime caching: imagens do Supabase Storage (cache 7 dias)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.(co|in)\/storage\//,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Limpeza automática de caches antigos
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // State / Query
          "vendor-query": ["@tanstack/react-query"],
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
          // UI Radix (componentes mais usados)
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
          ],
          // Charts (pesado, raramente necessário no carregamento inicial)
          "vendor-charts": ["recharts"],
          // PDF / Export (muito pesado, carregado sob demanda)
          "vendor-pdf": ["jspdf", "html2canvas"],
          // Animações
          "vendor-motion": ["framer-motion"],
          // Data utils
          "vendor-date": ["date-fns"],
        },
      },
    },
  },
}));


