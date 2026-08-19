import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Collapse } from './Collapse';

/**
 * Three places in the app expand content in place - the suggestion cards on
 * the analysis page, the gap cards on a match result, and the mobile nav. All
 * three were `{open && <div>}`, which cannot animate and makes everything
 * below the region jump.
 *
 * Keeping the content mounted is what buys the animation, and it is also the
 * thing that can quietly break: hidden-but-present content is still tabbable
 * and still read by screen readers unless something says otherwise.
 */

describe('Collapse', () => {
  it('keeps its content mounted while closed so the height can animate', () => {
    render(<Collapse open={false}><p>details</p></Collapse>);

    expect(screen.getByText('details')).toBeInTheDocument();
  });

  it('reports its state to CSS', () => {
    const { container, rerender } = render(<Collapse open={false}><p>details</p></Collapse>);
    const region = container.querySelector('.collapse-region');

    expect(region).toHaveAttribute('data-state', 'closed');

    rerender(<Collapse open><p>details</p></Collapse>);
    expect(region).toHaveAttribute('data-state', 'open');
  });

  it('takes closed content out of the focus order', () => {
    // Without inert, a zero-height region still hands out focus - you Tab and
    // the caret vanishes into a collapsed panel.
    const { container, rerender } = render(
      <Collapse open={false}><button>hidden action</button></Collapse>,
    );
    const inner = container.querySelector('.collapse-region > *');

    expect(inner).toHaveAttribute('inert');

    rerender(<Collapse open><button>hidden action</button></Collapse>);
    expect(inner).not.toHaveAttribute('inert');
  });

  it('puts layout classes on the clipped child, not the grid wrapper', () => {
    // The wrapper owns grid-template-rows; a `md:hidden` landing there instead
    // would fight the animation rather than hide the region.
    const { container } = render(
      <Collapse open className="md:hidden"><p>details</p></Collapse>,
    );

    expect(container.querySelector('.collapse-region')).not.toHaveClass('md:hidden');
    expect(container.querySelector('.collapse-region > *')).toHaveClass('md:hidden');
  });
});
