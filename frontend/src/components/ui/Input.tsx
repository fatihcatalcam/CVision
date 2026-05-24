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
          <label htmlFor={inputId} className="text-sm font-medium text-[#111111] dark:text-[#e8e7e4]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full px-3 py-2 text-sm',
            'bg-white dark:bg-[#1c1c1a]',
            'border border-[#EAEAEA] dark:border-white/[0.07]',
            'rounded-[var(--radius-md)]',
            'text-[#111111] dark:text-[#e8e7e4]',
            'placeholder:text-[#A09D9A] dark:placeholder:text-[#6a6764]',
            'transition-all duration-150',
            'focus:outline-none focus:border-[#1B3A6B] dark:focus:border-[#4a7dd1] focus:ring-2 focus:ring-[#EEF2F8] dark:focus:ring-[#4a7dd1]/20',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F7F6F3] dark:disabled:bg-white/[0.03]',
            error ? 'border-[#9F2F2D] dark:border-[#d4524f] focus:ring-[#FDEBEC] dark:focus:ring-[#d4524f]/20' : '',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-[#9F2F2D] dark:text-[#d4524f]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
