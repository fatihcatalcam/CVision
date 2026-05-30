import type { ReactNode } from 'react';
import { useInView } from '../../hooks/useInView';

interface RevealProps {
  children: ReactNode;
  /** Extra delay (ms) before the reveal transition starts, for sequencing. */
  delay?: number;
  className?: string;
  /** Optional wrapper element tag. Defaults to div. */
  as?: 'div' | 'section';
}

/**
 * Wraps content so it fades + slides up smoothly when scrolled into view.
 * Uses transform/opacity only (hardware-accelerated) and respects reduced motion.
 */
export function Reveal({ children, delay = 0, className = '', as = 'div' }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Tag = as;

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
