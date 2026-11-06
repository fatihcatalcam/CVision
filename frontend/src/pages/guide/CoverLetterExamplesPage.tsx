import { ArticlePage } from './ArticlePage';
import { COVER_LETTER_PAGE, COVER_LETTER_EXAMPLES } from '../../content/coverLetterExamples';

/**
 * /on-yazi-ornekleri - six cover letter examples, Turkish only.
 *
 * The copy is Turkish whatever language the visitor has picked; only the
 * shared footer follows the UI language. The page does not pin the UI to
 * Turkish, because that would also overwrite the visitor's saved language for
 * every page after this one. The call to action goes to /match, where the
 * product writes a letter for a specific job ad.
 */
export function CoverLetterExamplesPage() {
  return (
    <ArticlePage
      path="/on-yazi-ornekleri"
      copy={COVER_LETTER_PAGE}
      contentLang="tr"
      ctaPath="/match"
      slug="cover-letter-examples"
      content={{ tr: COVER_LETTER_EXAMPLES }}
      intro={COVER_LETTER_PAGE.definition}
    />
  );
}
