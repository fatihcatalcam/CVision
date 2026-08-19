import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AnalyzingScreen } from './AnalyzingScreen';

/**
 * `stroke` and `fill` are SVG *presentation attributes*. Tailwind's `dark:`
 * variant compiles to a CSS class, and a class can never override an attribute
 * that was written straight onto the element - so a literal hex there is
 * invisible to the theme, permanently.
 *
 * That is what happened here: the track was #EAEAEA and the progress arc
 * #111111, both hardcoded. On the #111110 dark page the ring rendered
 * inverted - the *empty* track glowed near-white while the *filled* arc was
 * near-black, so progress read as a dark gap eating a bright ring. The step
 * dots below it had the same problem: pending #EAEAEA dots came out brighter
 * than the completed #346538 ones.
 *
 * Every user sees this screen while the product does its actual work.
 */

const steps = [
  { label: 'Reading', threshold: 25 },
  { label: 'Scoring', threshold: 60 },
  { label: 'Finishing', threshold: 90 },
];

const renderScreen = (progress: number) =>
  render(
    <AnalyzingScreen
      progress={progress}
      heading="Analyzing"
      message="Reading your CV"
      steps={steps}
      footer="Hang tight"
    />,
  );

describe('AnalyzingScreen', () => {
  it('draws both ring circles in a colour the theme can reach', () => {
    const { container } = renderScreen(40);
    const circles = container.querySelectorAll('svg circle');

    expect(circles.length).toBe(2);
    circles.forEach((circle) => {
      expect(circle.getAttribute('stroke')).toBe('currentColor');
    });
  });

  it('fills the arc in the foreground colour, not a fixed near-black', () => {
    const { container } = renderScreen(40);
    const arc = container.querySelectorAll('svg circle')[1];

    expect(arc.getAttribute('class')).toContain('var(--color-foreground)');
  });

  it('moves the arc as progress climbs', () => {
    const at10 = renderScreen(10).container.querySelectorAll('circle')[1];
    const offsetAt10 = Number(at10.getAttribute('stroke-dashoffset'));

    const at90 = renderScreen(90).container.querySelectorAll('circle')[1];
    const offsetAt90 = Number(at90.getAttribute('stroke-dashoffset'));

    // More progress = less remaining dash offset.
    expect(offsetAt90).toBeLessThan(offsetAt10);
  });

  it('never hardcodes a hex colour onto an SVG attribute', () => {
    // A rendering assertion only covers the two circles that exist today. This
    // reads the source, so a new <circle stroke="#..."> or <path fill="#...">
    // fails here instead of shipping another theme-blind shape.
    const source = readFileSync(
      path.resolve(__dirname, './AnalyzingScreen.tsx'),
      'utf8',
    );
    const hardcoded = source.match(/\b(stroke|fill)="#[0-9a-fA-F]{3,8}"/g) ?? [];

    expect(hardcoded).toEqual([]);
  });

  it('does not render a pending step brighter than a completed one', () => {
    // The dots are driven by class, so assert on the tokens: completed uses
    // success, pending uses the muted border - both of which flip per theme.
    // Literal hex here is what made the list read backwards on dark.
    const { container } = renderScreen(40);
    const dots = container.querySelectorAll('.rounded-full');
    const classes = Array.from(dots).map((d) => d.getAttribute('class') ?? '');

    const completed = classes.find((c) => c.includes('--color-success'));
    const pending = classes.find((c) => c.includes('--color-card-border'));

    expect(completed).toBeDefined();
    expect(pending).toBeDefined();
    classes.forEach((c) => expect(c).not.toMatch(/bg-\[#[0-9a-fA-F]{3,8}\]/));
  });
});
