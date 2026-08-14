import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AtsCvHowToPage } from './AtsCvHowToPage';
import { ATS_CV_HOWTO } from '../../content/atsCvHowTo';

/**
 * The how-to guide, which is the first page whose URL differs per language:
 * /ats-uyumlu-cv-nasil-hazirlanir and /en/how-to-write-an-ats-friendly-cv.
 *
 * It is a separate page from /how-ats-works because it answers a different
 * question, not because it spells the same keyword differently. Four
 * near-identical pages around "ATS CV analizi" and friends would be doorway
 * pages, which Google names and penalises.
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
        <Route path="/ats-uyumlu-cv-nasil-hazirlanir" element={<AtsCvHowToPage />} />
        <Route path="/en/how-to-write-an-ats-friendly-cv" element={<AtsCvHowToPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  uiLanguage = 'tr';
});

describe('AtsCvHowToPage', () => {
  it('renders every section the prerender emits', () => {
    renderAt('/ats-uyumlu-cv-nasil-hazirlanir');

    for (const section of ATS_CV_HOWTO.tr!) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
      for (const item of section.items ?? []) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      }
    }
  });

  it('renders at the English slug, in English', () => {
    uiLanguage = 'en';
    renderAt('/en/how-to-write-an-ats-friendly-cv');

    for (const section of ATS_CV_HOWTO.en!) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
    }
    expect(screen.queryByText(ATS_CV_HOWTO.tr![0].heading)).not.toBeInTheDocument();
  });

  it('publishes a canonical that matches the tree it is rendered in', () => {
    // The bug this guards against shipped once on the other guide: a
    // module-level constant pointing at the Turkish URL, which told Google the
    // English page was a duplicate of the Turkish one.
    uiLanguage = 'en';
    renderAt('/en/how-to-write-an-ats-friendly-cv');

    const jsonLd = document.head.querySelector('script[data-page="ats-cv-how-to"]');
    expect(jsonLd?.textContent).toContain('/en/how-to-write-an-ats-friendly-cv');
    expect(jsonLd?.textContent).not.toContain('"@id":"https://www.cvisionapp.com/ats-uyumlu');
  });

  it('shows nothing extra to a language that has no version of it', () => {
    uiLanguage = 'de';
    renderAt('/ats-uyumlu-cv-nasil-hazirlanir');

    expect(screen.queryByText(ATS_CV_HOWTO.tr![0].heading)).not.toBeInTheDocument();
    expect(screen.queryByText(ATS_CV_HOWTO.en![0].heading)).not.toBeInTheDocument();
  });

  it('is a distinct article, not a reworded /how-ats-works', () => {
    // Same intent check as the content file's header: this page is about what
    // to type, its sibling is about what the system does.
    renderAt('/ats-uyumlu-cv-nasil-hazirlanir');

    expect(screen.getByText('atsCvHowTo.title')).toBeInTheDocument();
    expect(screen.queryByText('howAts.title')).not.toBeInTheDocument();
  });
});
