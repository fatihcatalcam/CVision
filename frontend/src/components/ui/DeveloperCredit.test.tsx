import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider, Trans } from 'react-i18next';
import i18n from '../../i18n';
import { DeveloperCredit } from './DeveloperCredit';
import { DEVELOPER_URL } from '../../constants/developer';

/**
 * The developer credit in the public footers, and the matching sentence on the
 * About page. Both are links to the studio that built CVision; the name stays
 * the same in every language and only the label around it is translated.
 */

const LANGS = ['tr', 'en', 'de', 'es', 'fr'] as const;

describe('DeveloperCredit', () => {
  it.each(LANGS)('links the studio, translated around the name (%s)', async (lang) => {
    await i18n.changeLanguage(lang);
    render(
      <I18nextProvider i18n={i18n}>
        <DeveloperCredit />
      </I18nextProvider>,
    );

    const link = screen.getByRole('link', { name: 'Çatalçam Yazılım' });
    expect(link).toHaveAttribute('href', DEVELOPER_URL);
    expect(link).toHaveAttribute('target', '_blank');
    // A real, followed credit: noopener for the new tab, never nofollow.
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link.parentElement).toHaveTextContent(`${i18n.t('common.developer')}: Çatalçam Yazılım`);
  });
});

describe('About page credit sentence', () => {
  // The tag in the copy was first called <link>. That is a void HTML element,
  // so the parser closed it on the spot and rendered an empty <a> with the
  // name sitting outside it - the sentence read fine and linked nothing.
  it.each(LANGS)('puts the name inside the link (%s)', async (lang) => {
    await i18n.changeLanguage(lang);
    render(
      <I18nextProvider i18n={i18n}>
        <p>
          <Trans i18nKey="about.builtBy" components={{ author: <a href={DEVELOPER_URL} /> }} />
        </p>
      </I18nextProvider>,
    );

    expect(screen.getByRole('link', { name: 'Fatih Çatalçam' })).toHaveAttribute('href', DEVELOPER_URL);
  });
});
