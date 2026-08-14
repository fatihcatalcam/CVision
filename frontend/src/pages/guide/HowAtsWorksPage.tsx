import { useTranslation } from 'react-i18next';
import { ArticlePage } from './ArticlePage';
import { ATS_GUIDE_EXTRA } from '../../content/atsGuide';

/**
 * "How ATS works" - the what-is-this-and-why-did-it-reject-me guide.
 *
 * Its sibling, AtsCvHowToPage, answers the other question: what do I actually
 * type. Two intents, two pages, deliberately not two spellings of one keyword.
 *
 * The first six sections live in the i18n bundles and exist in all five
 * languages; the long-form half comes from content/atsGuide.ts and only exists
 * for the two languages with URLs. See that file for why.
 */
export function HowAtsWorksPage() {
  const { t } = useTranslation();
  const sections = [1, 2, 3, 4, 5, 6] as const;

  return (
    <ArticlePage
      path="/how-ats-works"
      ns="howAts"
      slug="how-ats-works"
      content={ATS_GUIDE_EXTRA}
      intro={t('howAts.definition')}
    >
      {sections.map((i) => (
        <section key={i} className="space-y-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-[#6B6A65] dark:text-[#908d89]">
            {t(`howAts.s${i}Heading`)}
          </h2>
          <p className="text-sm leading-relaxed text-[#444] dark:text-[#c8c6c3]">
            {t(`howAts.s${i}Body`)}
          </p>
        </section>
      ))}
    </ArticlePage>
  );
}
