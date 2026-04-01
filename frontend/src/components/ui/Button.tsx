import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-background)] disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-lg shadow-blue-500/20 focus:ring-[var(--color-primary)]',
    secondary: 'bg-[rgba(255,255,255,0.05)] text-white border border-[var(--color-card-border)] hover:bg-[rgba(255,255,255,0.1)] focus:ring-[var(--color-muted)]',
    ghost: 'hover:bg-[rgba(255,255,255,0.05)] text-white focus:ring-[var(--color-muted)]',
    danger: 'bg-[var(--color-danger)] text-white hover:bg-red-600 focus:ring-[var(--color-danger)] shadow-lg shadow-red-500/20',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-14 px-8 text-lg',
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
