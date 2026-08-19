import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Must match the exit duration of .modal-panel / .modal-scrim in index.css. */
const EXIT_MS = 150;

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible name for the dialog. */
  label: string;
  /** Layout for the panel itself - width, padding, scroll behaviour. */
  panelClassName?: string;
  /** Layout for the flex container that positions the panel. */
  containerClassName?: string;
  /** Extra classes for the scrim, e.g. a heavier blur for the PDF viewer. */
  scrimClassName?: string;
  /** Set false for a modal that must be dismissed by an explicit control. */
  dismissOnBackdrop?: boolean;
}

/**
 * The chrome every modal in this app was reimplementing, badly.
 *
 * Each one was `if (!isOpen) return null` around its own overlay. That has one
 * unavoidable consequence: a modal can animate in but never out, because on
 * close the whole subtree is gone before a transition could run. Six modals
 * all appeared with motion and then blinked out of existence.
 *
 * So this keeps the tree mounted for one exit beat, and owns the rest of the
 * things a dialog needs and five of the six were missing: Escape, a body
 * scroll lock, dialog semantics, focus moving in and being handed back, and
 * the rest of the page going inert so Tab cannot wander behind the overlay.
 *
 * It deliberately does not own the panel's layout. The six differ too much -
 * a 95vw PDF viewer and a small confirm box have nothing in common below the
 * overlay - and forcing them into one shape would have been a worse refactor
 * than the bug being fixed.
 */
export function ModalShell({
  isOpen,
  onClose,
  children,
  label,
  panelClassName = '',
  containerClassName = 'fixed inset-0 z-50 flex items-center justify-center p-4',
  scrimClassName = 'bg-black/60 backdrop-blur-sm',
  dismissOnBackdrop = true,
}: ModalShellProps) {
  // `mounted` keeps the exit frame alive; `shown` drives data-state.
  const [mounted, setMounted] = useState(isOpen);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // One frame at the closed state, otherwise there is nothing to
      // transition from and the panel just appears - the same class of bug
      // this component exists to fix.
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const id = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Everything outside the portal stops being reachable, which is what makes
    // this a real dialog rather than a panel drawn on top of a live page.
    const root = document.getElementById('root');
    root?.setAttribute('inert', '');

    // Don't steal focus from a child that asked for it. React's autoFocus has
    // already run by the time this effect fires, so focusing the panel here
    // would pull the caret straight back out of, say, the name field in the
    // Google sign-up modal. The same check guards what we restore to: if focus
    // is already inside, there is no outside element worth remembering, and
    // capturing one would send focus into a modal that no longer exists.
    const active = document.activeElement as HTMLElement | null;
    if (!panelRef.current?.contains(active)) {
      returnFocusTo.current = active;
      panelRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      root?.removeAttribute('inert');
      // Hand focus back to whatever opened this, so keyboard users are not
      // dumped at the top of the document.
      returnFocusTo.current?.focus?.();
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const state = shown ? 'open' : 'closed';

  return createPortal(
    <div className={containerClassName} role="dialog" aria-modal="true" aria-label={label}>
      {/* `fixed`, not `absolute`: two of these modals live in a scrolling
          container, and an absolutely positioned scrim would scroll away with
          the content instead of covering the viewport. */}
      <div
        className={`fixed inset-0 modal-scrim ${scrimClassName}`}
        data-state={state}
        onClick={dismissOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 modal-panel outline-none ${panelClassName}`}
        data-state={state}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
