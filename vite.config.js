import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('epubjs') || id.includes('react-reader')) return 'reader-epub';
            if (id.includes('pdfjs-dist') || id.includes('react-pdf')) return 'reader-pdf';
            return 'vendor-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Slightly increase limit since we are splitting intentionally
  },
})
