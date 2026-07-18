import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the big, rarely-changing libraries into their own chunks so a
        // normal app-code deploy doesn't invalidate them in the browser cache,
        // and so the charting library isn't part of the shared entry.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return 'react-vendor'
          if (id.includes('@supabase')) return 'supabase'
          if (
            id.includes('recharts') ||
            id.includes('d3-') ||
            id.includes('victory') ||
            id.includes('decimal.js')
          )
            return 'recharts'
        },
      },
    },
  },
})
