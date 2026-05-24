import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[#111111]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2 text-sm bg-white border border-[#EAEAEA]',
            'rounded-[var(--radius-md)] text-[#111111] placeholder:text-[#A09D9A]',
            'transition-all duration-150',
            'focus:outline-none focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#EEF2F8]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F7F6F3]',
            error ? 'border-[#9F2F2D] focus:ring-[#FDEBEC]' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-[#9F2F2D]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
