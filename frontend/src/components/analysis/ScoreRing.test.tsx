import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ScoreRing } from './ScoreRing';

/**
 * The ring is the payoff of the whole product: the moment a user finally sees
 * their ATS score. It carries `transition-all duration-1000`, but AnalysisPage
 * mounts it behind `data!` - only once the scores have loaded - so it used to
 * render with its final strokeDashoffset already set. A CSS transition needs a
 * *change* to fire, so the animation never ran a frame and the score simply
 * appeared, fully drawn.
 *
 * These tests pin the two frames that prove it sweeps.
 */

const circumference = (size: number) => ((size - 8) / 2) * 2 * Math.PI;

/** The drawn arc is the second circle; the first is the background track. */
const progressCircle = (container: HTMLElement) =>
  container.querySelectorAll('circle')[1];

const offsetOf = (container: HTMLElement) =>
  Number(progressCircle(container).getAttribute('stroke-dashoffset'));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ScoreRing', () => {
  it('paints empty on the first frame so the transition has somewhere to go', () => {
    // requestAnimationFrame is stubbed out entirely, freezing the component on
    // the frame it mounts with. Without this the callback can land before the
    // assertion and hide the very state we care about.
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});

    const { container } = render(<ScoreRing score={82} label="ATS" />);

    expect(offsetOf(container)).toBeCloseTo(circumference(120), 1);
  });

  it('hands the real offset over on the next frame', async () => {
    const { container } = render(<ScoreRing score={82} label="ATS" />);

    // Let the scheduled frame run.
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });

    const c = circumference(120);
    expect(offsetOf(container)).toBeCloseTo(c - (82 / 100) * c, 1);
  });

  it('keeps the 1000ms sweep on the drawn arc', () => {
    // The duration is the animation. If someone drops the class the two tests
    // above still pass while nothing visibly moves.
    const { container } = render(<ScoreRing score={82} label="ATS" />);

    expect(progressCircle(container).getAttribute('class')).toContain('duration-1000');
  });

  it('skips the sweep entirely when reduced motion is requested', async () => {
    // Not "animate instantly" - render final on the first paint, so there is no
    // flash of an empty ring for someone who asked for less movement.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});

    const { container } = render(<ScoreRing score={82} label="ATS" />);

    const c = circumference(120);
    expect(offsetOf(container)).toBeCloseTo(c - (82 / 100) * c, 1);
  });

  it('leaves a zero score empty', async () => {
    const { container } = render(<ScoreRing score={0} label="ATS" />);

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });

    expect(offsetOf(container)).toBeCloseTo(circumference(120), 1);
  });
});
