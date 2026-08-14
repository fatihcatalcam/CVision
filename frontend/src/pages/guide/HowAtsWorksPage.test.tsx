import { describe, it, expect, vi, beforeEach } from 'vitest';
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
 * everything in content/atsGuide.ts is that the component renders it too.
 *
 * The other rule these tests hold is which language decides. The first version
 * keyed the sections on the URL TREE, which is only ever 'tr' or 'en' - so a
 * visitor reading the site in French at /how-ats-works got French headings
 * above a thousand words of Turkish. The sections were added on the promise
 * that the three languages without URLs keep exactly the page they already
 * had, and only the UI language can keep it.
 */

let uiLanguage = 'tr';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: uiLanguage },
  }),
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

beforeEach(() => {
  uiLanguage = 'tr';
});

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

  it('renders the English sections when the UI is English', () => {
    uiLanguage = 'en';
    renderAt('/en/how-ats-works');

    for (const section of ATS_GUIDE_EXTRA.en!) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
    }
    expect(screen.queryByText(ATS_GUIDE_EXTRA.tr![0].heading)).not.toBeInTheDocument();
  });

  it('shows no long-form sections at all to a language that has none', () => {
    // The promise: French, Spanish and German keep the six-section page they
    // already had. Not a Turkish one, and not an English one either - half a
    // page in a language you did not choose is worse than the shorter page.
    uiLanguage = 'fr';
    renderAt('/how-ats-works');

    expect(screen.queryByText(ATS_GUIDE_EXTRA.tr![0].heading)).not.toBeInTheDocument();
    expect(screen.queryByText(ATS_GUIDE_EXTRA.en![0].heading)).not.toBeInTheDocument();
    // The original six sections are untouched.
    expect(screen.getByText('howAts.s1Heading')).toBeInTheDocument();
  });

  it('handles a regional tag like en-GB', () => {
    uiLanguage = 'en-GB';
    renderAt('/en/how-ats-works');

    expect(screen.getByText(ATS_GUIDE_EXTRA.en![0].heading)).toBeInTheDocument();
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
