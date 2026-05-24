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
  primary:   'bg-[#111111] text-white hover:bg-[#2a2a2a] active:scale-[0.98]',
  secondary: 'bg-white text-[#111111] border border-[#EAEAEA] hover:bg-[#F7F6F3] active:scale-[0.98]',
  ghost:     'bg-transparent text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] active:scale-[0.98]',
  danger:    'bg-[#FDEBEC] text-[#9F2F2D] hover:bg-[#f5d8d9] active:scale-[0.98]',
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
        'disabled:opacity-40 disabled:cursor-not-allowed',
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
