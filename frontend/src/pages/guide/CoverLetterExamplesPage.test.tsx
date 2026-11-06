import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CoverLetterExamplesPage } from './CoverLetterExamplesPage';
import { COVER_LETTER_PAGE, COVER_LETTER_EXAMPLES } from '../../content/coverLetterExamples';

/**
 * /on-yazi-ornekleri exists in Turkish only. Its copy has to show whatever
 * language the visitor last picked - the shared ArticlePage hides sections
 * for languages a guide has no version in, which here would mean an empty page.
 */

let uiLanguage = 'tr';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: uiLanguage },
  }),
}));

vi.mock('../../hooks/useSeo', () => ({ useSeo: vi.fn() }));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/on-yazi-ornekleri']}>
      <Routes>
        <Route path="/on-yazi-ornekleri" element={<CoverLetterExamplesPage />} />
        <Route path="/match" element={<p>match page</p>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  uiLanguage = 'tr';
});

describe('CoverLetterExamplesPage', () => {
  it('renders every section and every example the prerender emits', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: COVER_LETTER_PAGE.title })).toBeInTheDocument();
    for (const section of COVER_LETTER_EXAMPLES) {
      expect(screen.getByText(section.heading)).toBeInTheDocument();
      for (const item of section.items ?? []) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      }
    }
    // A line from inside a letter, not just its heading.
    expect(screen.getAllByText('Saygılarımla,').length).toBe(6);
  });

  it('still shows the Turkish copy to a visitor using another UI language', () => {
    uiLanguage = 'de';
    renderPage();

    expect(screen.getByText('6 ön yazı örneği')).toBeInTheDocument();
    expect(screen.getByText('Yeni mezun ön yazı örneği')).toBeInTheDocument();
  });

  it('offers no language switcher, since there is nothing to switch to', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /türkçe|english/i })).not.toBeInTheDocument();
  });

  it('sends the call to action to the cover letter feature', () => {
    renderPage();

    expect(screen.getByText(COVER_LETTER_PAGE.ctaTitle)).toBeInTheDocument();
    expect(screen.getByText(COVER_LETTER_PAGE.ctaNote)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(COVER_LETTER_PAGE.ctaButton) }));
    expect(screen.getByText('match page')).toBeInTheDocument();
  });

  it('publishes its own canonical URL in the Article schema', () => {
    renderPage();
    const jsonLd = document.head.querySelector('script[data-page="cover-letter-examples"]');
    expect(jsonLd?.textContent).toContain('https://www.cvisionapp.com/on-yazi-ornekleri');
  });
});
