import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Use conditional base path: empty for development, '/realms-of-war/' for production
  base: process.env.NODE_ENV === 'production' ? '/realms-of-war/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Increase chunking size limit to avoid warnings for Unity files
    chunkSizeWarningLimit: 2000,
    // Make sure to include build directory in assets
    assetsInlineLimit: 0, // Disable inlining assets
    rollupOptions: {
      // Don't process Unity files with rollup, as they're copied separately
      external: [
        '/build/mapeditor/Build.loader.js',
        '/build/mapeditor/Build.framework.js',
        '/build/mapeditor/Build.wasm',
        '/build/mapeditor/Build.data'
      ]
    }
  },
  // Configure server to avoid CORS issues with Unity files
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  }
})
