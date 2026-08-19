import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalShell } from './ModalShell';

/**
 * Six modals each rolled their own overlay, and every one of them was
 * `if (!isOpen) return null`. That single line is why none of them could
 * animate out - on close the subtree is gone before a transition can run - and
 * five of the six had also skipped Escape, the body scroll lock, and dialog
 * semantics along the way.
 */

function Fixture({ open, onClose = () => {} }: { open: boolean; onClose?: () => void }) {
  return (
    <ModalShell isOpen={open} onClose={onClose} label="Test dialog">
      <p>panel body</p>
      <button>inside</button>
    </ModalShell>
  );
}

beforeEach(() => {
  // ModalShell marks the app root inert; the real one is created in index.html.
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
});

afterEach(() => {
  document.getElementById('root')?.remove();
  document.body.style.overflow = '';
});

describe('ModalShell', () => {
  it('stays mounted through the exit so the animation has a tree to run on', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Fixture open />);

    rerender(<Fixture open={false} />);

    // The whole point: closed, but still on screen.
    expect(screen.getByText('panel body')).toBeInTheDocument();
    expect(screen.getByText('panel body').closest('.modal-panel'))
      .toHaveAttribute('data-state', 'closed');

    await act(async () => { vi.advanceTimersByTime(200); });

    expect(screen.queryByText('panel body')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('opens at the closed state for one frame', () => {
    // Without this frame there is nothing to transition from and the panel
    // just appears - exactly the bug being fixed, in the other direction.
    vi.stubGlobal('requestAnimationFrame', () => 0);

    render(<Fixture open />);

    expect(screen.getByText('panel body').closest('.modal-panel'))
      .toHaveAttribute('data-state', 'closed');

    vi.unstubAllGlobals();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Fixture open onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('locks body scroll while open and restores it after', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Fixture open />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Fixture open={false} />);
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(document.body.style.overflow).toBe('');
    vi.useRealTimers();
  });

  it('is announced as a dialog', () => {
    render(<Fixture open />);
    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Test dialog');
  });

  it('makes the rest of the page inert so Tab cannot wander behind it', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Fixture open />);

    expect(document.getElementById('root')).toHaveAttribute('inert');

    rerender(<Fixture open={false} />);
    await act(async () => { vi.advanceTimersByTime(200); });

    expect(document.getElementById('root')).not.toHaveAttribute('inert');
    vi.useRealTimers();
  });

  it('does not steal focus from a child that asked for it', () => {
    // The Google sign-up modal autoFocuses its name field. Focusing the panel
    // unconditionally would yank the caret straight back out.
    render(
      <ModalShell isOpen onClose={() => {}} label="Named">
        <input autoFocus aria-label="full name" />
      </ModalShell>,
    );

    expect(screen.getByLabelText('full name')).toHaveFocus();
  });
});
