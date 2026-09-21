/**
 * Credit prices and grants, mirroring CREDIT_* in backend/app/config.py.
 *
 * Display only. The server decides what is actually charged and what the
 * balance is, so a number that drifts here misinforms but cannot mis-charge.
 * They live in one file because the same price is quoted from several screens -
 * the match price alone appears on the dashboard card, the analysis page and
 * the match page - and three separate copies of "2" is how they stop agreeing.
 */

/** The analysis itself, before its report is opened. */
export const ANALYSIS_COST = 1;
/** Opening the full report on an analysis - only ever charged separately on
 *  analyses made before every upload included the report. */
export const UNLOCK_COST = 2;

/**
 * What one upload costs. Every analysis is now the full report, so this is the
 * only price a user is quoted for an analysis; ANALYSIS_COST and UNLOCK_COST
 * stay because the server still charges them as two lines in the ledger.
 */
export const FULL_ANALYSIS_COST = ANALYSIS_COST + UNLOCK_COST;
/** Matching one CV against one job ad. */
export const MATCH_COST = 2;
/** Generating a cover letter from a match. */
export const COVER_LETTER_COST = 2;

/**
 * One application end to end: the analysis, matching it against the ad, and the
 * cover letter. The pricing page quotes packs in these, and used to divide by a
 * hardcoded 6 that matched no combination of the prices around it.
 */
export const FULL_APPLICATION_COST =
  FULL_ANALYSIS_COST + MATCH_COST + COVER_LETTER_COST;

/** Granted on signup: exactly one analysis. */
export const SIGNUP_CREDITS = 3;
/** Added each week while the balance is under the cap. */
export const WEEKLY_CREDITS = 2;
/** Balance at or above which the weekly grant pauses. */
export const WEEKLY_CREDIT_CAP = 12;
