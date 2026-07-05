import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: '육아일기',
        short_name: '육아일기',
        description: '부부와 지인 가족을 위한 비공개 육아일기 + 투자일기',
        lang: 'ko',
        theme_color: '#d97757',
        background_color: '#fbf6ee',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Supabase는 별도 origin이라 runtimeCaching을 추가하지 않는 한 자동으로 캐시되지 않음 —
        // 앱 셸(JS/CSS/폰트)만 프리캐시하고 육아일기 데이터는 항상 네트워크에서 최신으로 받는다.
        globPatterns: ['**/*.{js,css,html,woff,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
