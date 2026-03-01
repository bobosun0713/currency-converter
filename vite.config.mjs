// eslint-disable-next-line import/no-unresolved
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// Define the base directory
const baseDir = path => fileURLToPath(new URL(path, import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: '貨幣轉換器',
        short_name: '貨幣轉換器',
        description: '查看即時外匯匯率與歷史趨勢的漸進式網頁應用程式',
        theme_color: '#196ee6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": baseDir("./src"),
      "@tests": baseDir("./tests")
    }
  },
  test: {
    globals: true,
    root: baseDir("./"),
    environment: "jsdom",
    coverage: {
      enabled: true,
      include: ["src/**/*"],
      reportsDirectory: "./.cache/coverage"
    }
  }
});
