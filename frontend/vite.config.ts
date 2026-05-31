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
})
