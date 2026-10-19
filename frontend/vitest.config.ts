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
    // Pinned on purpose. The default is one worker per core, which on a
    // 16-thread laptop means ~15 jsdom environments each loading all five
    // locale bundles at once, with the repo inside a synced OneDrive folder.
    // Tests then hit the 5s timeout - a different handful on each run, every
    // one of them passing alone. Measured on that machine, full suite:
    //   default (~15): 2 of the last 4 runs failed
    //   4 workers:     3 of 3 passed, 28-45s
    //   2 workers:     3 of 3 passed, 40-47s
    // A suite that fails at random teaches people to rerun it until it is
    // green, which is how a real failure gets waved through.
    maxWorkers: 4,
  },
})
