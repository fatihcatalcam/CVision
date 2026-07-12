import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Test (Vitest) config lives in vitest.config.ts so this file stays native to
// Vite 8's plugin types (importing from vitest/config drags in a conflicting
// nested Vite and breaks `tsc -b`).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Split large, stable third-party deps into their own chunks so an app
        // update doesn't bust the vendor cache, and route-level libraries
        // (recharts is admin-only) stay isolated from the initial bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router';
          if (/[\\/]react(-dom)?[\\/]|[\\/]scheduler[\\/]/.test(id)) return 'react-vendor';
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('@sentry')) return 'sentry';
        },
      },
    },
  },
})
