import type { ReactNode } from 'react';

interface CollapseProps {
  open: boolean;
  children: ReactNode;
  /** Applied to the inner element, which is what actually gets clipped. */
  className?: string;
}

/**
 * An expanding region that animates to its content's natural height.
 *
 * `{open && <div>...</div>}` cannot animate: there is nothing in the DOM to
 * transition from, so the content teleports in and everything below it jumps.
 * That was the suggestion list on the analysis page, the gap cards on the match
 * result, and the mobile nav panel - the three places in the app where content
 * expands in place.
 *
 * The mechanism is `grid-template-rows: 0fr -> 1fr` (see .collapse-region),
 * which reaches the real height with no JS measurement and no ResizeObserver,
 * and keeps working when the content changes size. Needs Chrome 117+,
 * Safari 17.4+, Firefox 127+; older browsers ignore the transition and open
 * instantly, which is exactly the behaviour being replaced, so nothing breaks.
 *
 * Because the content now stays mounted while closed, it would otherwise still
 * be reachable by Tab and by screen readers from behind a zero-height clip.
 * `inert` takes the whole subtree out of the accessibility tree and out of the
 * focus order, which is the part that is easy to forget.
 */
export function Collapse({ open, children, className = '' }: CollapseProps) {
  return (
    <div className="collapse-region" data-state={open ? 'open' : 'closed'}>
      <div className={className} inert={!open}>
        {children}
      </div>
    </div>
  );
}
