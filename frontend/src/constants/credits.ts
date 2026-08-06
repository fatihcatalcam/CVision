/**
 * Credit prices and grants, mirroring CREDIT_* in backend/app/config.py.
 *
 * Display only. The server decides what is actually charged and what the
 * balance is, so a number that drifts here misinforms but cannot mis-charge.
 * They live in one file because the same price is quoted from several screens -
 * the match price alone appears on the dashboard card, the analysis page and
 * the match page - and three separate copies of "2" is how they stop agreeing.
 */

/** A Normal analysis. */
export const ANALYSIS_COST = 1;
/** Opening the full report on an analysis. Pro = ANALYSIS_COST + this. */
export const UNLOCK_COST = 2;
/** Matching one CV against one job ad. */
export const MATCH_COST = 2;
/** Generating a cover letter from a match. */
export const COVER_LETTER_COST = 2;

/** Granted on signup: one analysis plus its unlock, i.e. one Pro analysis. */
export const SIGNUP_CREDITS = 3;
/** Added each week while the balance is under the cap. */
export const WEEKLY_CREDITS = 2;
/** Balance at or above which the weekly grant pauses. */
export const WEEKLY_CREDIT_CAP = 12;
