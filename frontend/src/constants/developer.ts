/**
 * Who built CVision, for the credit in the footers and on the About page, and
 * for the author in the guides' structured data.
 *
 * A plain module - no React - because the build-time prerender writes the same
 * credit and schema into the static HTML, and it imports this file directly.
 */

export const DEVELOPER_NAME = 'Çatalçam Yazılım';
export const FOUNDER_NAME = 'Fatih Çatalçam';

/** The studio's site, as an identity in structured data. */
export const DEVELOPER_SITE = 'https://www.catalcamyazilim.online';

// The UTM tags let the studio's analytics tell visits from this credit apart.
export const DEVELOPER_URL =
  `${DEVELOPER_SITE}/?utm_source=cvision&utm_medium=referral&utm_campaign=imza`;
