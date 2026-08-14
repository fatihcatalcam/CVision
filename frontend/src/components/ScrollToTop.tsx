import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Start each new page at the top.
 *
 * The browser only resets scroll on a real document load. Inside a SPA the
 * offset belongs to the window and nothing was resetting it, so scrolling
 * halfway down the dashboard and clicking "Buy credits" opened /pricing already
 * scrolled halfway down - the visitor looking at the middle of a page they had
 * never seen. It happened on every route.
 *
 * Back and forward are treated the same as any other navigation, which is a
 * deliberate choice rather than an oversight. The tempting version skips POP so
 * the browser can restore the previous offset; measured here, it cannot. The
 * restore happens on popstate, before React has rendered the page it belongs
 * to, so the document is still short and the offset clamps to zero. Skipping
 * POP therefore does not restore anything - it just leaves the window wherever
 * the previous page had it, which is the original bug pointing backwards.
 *
 * The cost is that Back does not return you to your place in a long list. Real
 * restoration means recording a position per history entry and replaying it
 * once the lazy route has actually rendered; worth doing if /history ever gets
 * long enough to feel it, and not worth the timing bugs before then.
 *
 * A URL with a hash is left alone: that is a request to scroll to a specific
 * element, and jumping to the top would fight it. index.css sets
 * scroll-padding-top so those land below the sticky header.
 *
 * useLayoutEffect runs before paint, so the reset is never visible.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) return;

    // 'instant' matters: index.css sets scroll-behavior: smooth for the in-page
    // anchors, and without this a route change would animate the whole way up
    // from wherever the previous page happened to be.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
