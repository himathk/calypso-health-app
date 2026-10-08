import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { calypsoApi } from './server/vitePlugin';

export default defineConfig(({ mode }) => {
  // Expose ANTHROPIC_API_KEY from .env.local to the dev/preview API middleware (server-side only).
  const env = loadEnv(mode, process.cwd(), '');
  // (Guarded: assigning undefined to process.env stores the string "undefined".)
  if (!process.env.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  return {
    plugins: [
      react(),
      calypsoApi(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // Only precache Latin font subsets; others still load on demand.
          globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        },
        manifest: {
          name: 'Calypso — Calorie & Habit Coach',
          short_name: 'Calypso',
          description:
            'Snap your food, hit your calorie deficit and stay active through the workday with schedule-aware reminders.',
          theme_color: '#0a0f24',
          background_color: '#0a0f24',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['health', 'fitness', 'food', 'lifestyle'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Snap food', short_name: 'Snap', url: '/?go=snap', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Log water', short_name: 'Water', url: '/?go=water', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Log activity', short_name: 'Move', url: '/?go=activity', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 900,
    },
  };
});
