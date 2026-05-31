import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Dedicated Vitest config. Kept separate from vite.config.ts (and out of every
// tsconfig `include`) so it is never type-checked by the production `tsc -b`,
// where vitest/config's bundled Vite types clash with the app's Vite 8 plugins.
// Vitest loads this file directly at runtime and prefers it over vite.config.ts.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',      // browser-like DOM for component tests
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
