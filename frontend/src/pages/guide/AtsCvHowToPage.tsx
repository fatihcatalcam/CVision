import { useTranslation } from 'react-i18next';
import { ArticlePage } from './ArticlePage';
import { ATS_CV_HOWTO } from '../../content/atsCvHowTo';

/**
 * "How to write an ATS-friendly CV" - the how-do-I-do-it guide.
 *
 * A separate page from /how-ats-works because it answers a different question,
 * not because it spells the same keyword differently. Four near-identical pages
 * around "ATS CV analizi", "özgeçmiş ATS kontrolü" and friends would be doorway
 * pages; Google names that pattern and penalises it.
 *
 * Its URL differs per language on purpose - /ats-uyumlu-cv-nasil-hazirlanir and
 * /en/how-to-write-an-ats-friendly-cv - because the slug is the strongest
 * on-page signal a URL carries, and a Turkish phrase in an English URL wastes
 * it. See i18n/routes.ts.
 */
export function AtsCvHowToPage() {
  const { t } = useTranslation();

  return (
    <ArticlePage
      path="/ats-uyumlu-cv-nasil-hazirlanir"
      ns="atsCvHowTo"
      slug="ats-cv-how-to"
      content={ATS_CV_HOWTO}
      intro={t('atsCvHowTo.definition')}
    />
  );
}
