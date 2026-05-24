import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-8 h-8 rounded-lg
        text-[#787774] dark:text-[#908d89]
        hover:text-[#111111] dark:hover:text-[#e8e7e4]
        hover:bg-[#F7F6F3] dark:hover:bg-white/[0.06]
        border border-transparent hover:border-[#EAEAEA] dark:hover:border-white/[0.07]
        transition-all active:scale-[0.95]"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light'
        ? <Moon className="w-3.5 h-3.5" />
        : <Sun className="w-3.5 h-3.5" />}
    </button>
  );
}
