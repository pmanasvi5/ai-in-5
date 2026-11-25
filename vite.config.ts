import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Base path matches the GitHub Pages repo name ("/ai-in-5/") in production.
// Dev/preview always serve from "/", since there's no subpath locally.
// Override with the VITE_BASE env var if deploying somewhere else.
export default defineConfig(({ command }) => {
  const base = process.env.VITE_BASE ?? (command === 'build' ? '/ai-in-5/' : '/')

  return {
    base,
    plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        id: '/ai-in-5/',
        name: 'AI in 5',
        short_name: 'AI in 5',
        description: 'Your daily 5-minute AI catch-up.',
        start_url: '/ai-in-5/',
        scope: '/ai-in-5/',
        display: 'standalone',
        background_color: '#FBF7F0',
        theme_color: '#1E46E6',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'ai-in-5-data' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  }
})
