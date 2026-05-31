// Vitest global setup, auto-loaded via vite.config.ts `test.setupFiles`.
// - Registers jest-dom matchers (toBeInTheDocument, toBeDisabled, ...).
// - Unmounts React trees after each test so cases stay isolated.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
