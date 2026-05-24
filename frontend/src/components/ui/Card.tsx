import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ noPadding, className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'bg-white border border-[#EAEAEA] rounded-[var(--radius-xl)]',
        'transition-shadow duration-200',
        'hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        !noPadding && 'p-6',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';
