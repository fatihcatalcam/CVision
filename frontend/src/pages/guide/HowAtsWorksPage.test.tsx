import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HowAtsWorksPage } from './HowAtsWorksPage';
import { ATS_GUIDE_EXTRA } from '../../content/atsGuide';

/**
 * The guide has two halves and only one of them lives in i18n.
 *
 * scripts/prerender.ts emits the long-form sections into the static HTML so a
 * crawler sees them. Text that only the prerendered HTML shows is text Google
 * discards the moment it renders the page for real - and worse, a static page
 * that says more than the live one is the shape of cloaking. So the rule for
 * everything in content/atsGuide.ts is that the component renders it too, and
 * this is what holds the two together.
 */

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'tr' } }),
}));

vi.mock('../../hooks/useSeo', () => ({ useSeo: vi.fn() }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/how-ats-works" element={<HowAtsWorksPage />} />
        <Route path="/en/how-ats-works" element={<HowAtsWorksPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('HowAtsWorksPage', () => {
  it('renders every long-form section the prerender emits, in Turkish', () => {
    renderAt('/how-ats-works');

    for (const section of ATS_GUIDE_EXTRA.tr!) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
      for (const item of section.items ?? []) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      }
    }
  });

  it('renders the English sections under /en', () => {
    renderAt('/en/how-ats-works');

    for (const section of ATS_GUIDE_EXTRA.en!) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
    }
    // And not the Turkish ones - the language comes from the URL, not from
    // whatever i18next happened to be set to.
    expect(screen.queryByText(ATS_GUIDE_EXTRA.tr![0].heading)).not.toBeInTheDocument();
  });

  it('names the systems people actually search for', () => {
    // The section exists to catch "workday ats", "taleo cv" and friends. If a
    // rewrite drops the product names it stops doing the job it was added for.
    renderAt('/how-ats-works');

    for (const name of ['Workday', 'Greenhouse', 'Lever', 'Taleo', 'iCIMS']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('keeps a single h1 and puts the extra sections below it', () => {
    renderAt('/how-ats-works');

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(
      screen.getAllByRole('heading', { level: 3 }).length,
      'the long-form items are h3s under their h2',
    ).toBeGreaterThan(10);
  });
});
