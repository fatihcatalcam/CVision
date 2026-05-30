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
  primary:   'bg-[#111111] dark:bg-[#e8e7e4] text-white dark:text-[#111111] hover:bg-[#2a2a2a] dark:hover:bg-[#d0cfcc] hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-white dark:bg-[#1c1c1a] text-[#111111] dark:text-[#e8e7e4] border border-[#EAEAEA] dark:border-white/[0.07] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] hover:shadow-sm active:scale-[0.98]',
  ghost:     'bg-transparent text-[#787774] dark:text-[#908d89] hover:bg-[#F7F6F3] dark:hover:bg-white/[0.05] hover:text-[#111111] dark:hover:text-[#e8e7e4] active:scale-[0.98]',
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
