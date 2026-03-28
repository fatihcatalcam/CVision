import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[var(--color-foreground)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-[rgba(24,24,27,0.5)] border border-[var(--color-card-border)] 
            rounded-lg h-11 px-4 text-[var(--color-foreground)] 
            placeholder:text-[var(--color-muted-foreground)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-[rgba(24,24,27,0.8)]
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-sm text-[var(--color-danger)] mt-1 animate-in">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
