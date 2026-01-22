import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Spotify Playlist AI - AI Destekli Çalma Listesi Oluşturucu',
        short_name: 'Playlist AI',
        description: 'AI ile kişiselleştirilmiş Spotify çalma listeleri oluşturun. Müzik zevkinizi analiz ederek size özel öneriler sunar.',
        theme_color: '#1DB954',
        background_color: '#191414',
        display: 'standalone',
        start_url: '/spotify-playlist-ai/',
        scope: '/spotify-playlist-ai/',
        lang: 'tr',
        orientation: 'portrait-primary',
        categories: ['music', 'entertainment', 'productivity'],
        icons: [
          {
            src: '/spotify-playlist-ai/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/spotify-playlist-ai/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: '/spotify-playlist-ai/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/spotify-playlist-ai/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/spotify-playlist-ai/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/spotify-playlist-ai/', // GitHub Pages için repository adı
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
