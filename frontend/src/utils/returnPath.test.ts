import { describe, it, expect } from 'vitest';
import { returnPath } from './returnPath';

describe('returnPath', () => {
  it('sends the visitor back to the page they asked for', () => {
    expect(returnPath({ from: '/match' })).toBe('/match');
    expect(returnPath({ from: '/dashboard?upload=1' })).toBe('/dashboard?upload=1');
  });

  it('falls back to the dashboard when there is nothing to go back to', () => {
    expect(returnPath(null)).toBe('/dashboard');
    expect(returnPath(undefined)).toBe('/dashboard');
    expect(returnPath({})).toBe('/dashboard');
    expect(returnPath({ from: 42 })).toBe('/dashboard');
  });

  it('never leaves the site', () => {
    for (const from of ['https://evil.example', '//evil.example', '/\\evil.example', 'match']) {
      expect(returnPath({ from }), from).toBe('/dashboard');
    }
  });
});
