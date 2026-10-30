// Tells Bing (and the other IndexNow engines) which pages changed.
//
//   node scripts/indexnow.mjs          pages whose sitemap lastmod is recent
//   node scripts/indexnow.mjs --all    every page in the sitemap
//
// Run by .github/workflows/indexnow.yml once Vercel reports a production
// deploy, so the pages it names are already live when Bing comes to read them.
// ChatGPT and Copilot search through Bing's index; without this Bing found
// changes whenever it next happened to crawl.
//
// "Recent" comes from the sitemap's lastmod, which scripts/prerender.ts sets
// by hand only when a page's copy really changes. Re-submitting unchanged
// pages on every deploy would teach the engines the pings mean nothing - the
// same reason lastmod is not the build date.

const SITE = 'https://www.cvisionapp.com';
// Public by design: the engines verify it by fetching /<key>.txt from the site.
const KEY = '435cccd9cfee25e3baadf57a31b265f5';
const RECENT_DAYS = 3;

const all = process.argv.includes('--all');

const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const entries = [...sitemap.matchAll(/<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<lastmod>(.*?)<\/lastmod>/g)].map(
  ([, loc, lastmod]) => ({ loc, lastmod }),
);
if (!entries.length) throw new Error('No <loc>/<lastmod> pairs found in the live sitemap.');

const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
const urlList = entries.filter((e) => all || Date.parse(e.lastmod) >= cutoff).map((e) => e.loc);

if (!urlList.length) {
  console.log(`Nothing changed in the last ${RECENT_DAYS} days; ${entries.length} pages left alone.`);
  process.exit(0);
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList,
  }),
});

console.log(`IndexNow ${res.status} for ${urlList.length} URL(s):\n  ${urlList.join('\n  ')}`);
// 200 accepted, 202 accepted pending key check. Anything else is a real failure.
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
