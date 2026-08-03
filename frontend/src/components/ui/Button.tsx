import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  // Dark hover brightens rather than dims. Inverting the colours for dark mode
  // kept the light-mode "move toward grey" step, which on a light-on-dark button
  // reads backwards: hovering dimmed it (luminance .80 -> .62) while the same
  // button in light mode brightens (.006 -> .023). #f2f1ee lifts it to .88.
  primary:   'bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#f2f1ee] hover:shadow-md active:scale-[0.98]',
  // Border is deliberately stronger than --color-card-border (#EAEAEA). A card
  // outline is decoration; a button outline is the only thing telling you this
  // is a control, and #EAEAEA sits at 1.16:1 on the #FBFBFA page - so a
  // secondary button read as plain text next to the solid primary. #8A8985 is
  // 3.38:1 and white/[0.36] is 3.34:1 on the dark background, clearing the 3:1
  // WCAG 1.4.11 floor for non-text UI boundaries in both schemes.
  // dark:hover was bg-white/[0.05], which REPLACES the #1c1c1a surface instead
  // of sitting on it - the 5% white then composited against the page and landed
  // back on #1d1d1c, a 6% lift nobody can see. #272725 is what "#1c1c1a plus 5%
  // white" actually resolves to, so this is the original intent, composited
  // correctly.
  secondary: 'bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4] border border-[#8A8985] dark:border-white/[0.36] hover:bg-[#F7F6F3] dark:hover:bg-[#272725] hover:shadow-sm active:scale-[0.98]',
  ghost:     'bg-transparent text-[#6B6A65] dark:text-[#908d89] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] hover:text-[#111111] dark:hover:text-[#e8e7e4] active:scale-[0.98]',
  danger:    'bg-[#FDEBEC] dark:bg-[#3a1212] text-[#9F2F2D] dark:text-[#d4524f] hover:bg-[#f5d8d9] dark:hover:bg-[#4a1818] active:scale-[0.98]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)]',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B3A6B] dark:focus-visible:ring-[#4a7dd1] focus-visible:ring-offset-[var(--color-background)]',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
