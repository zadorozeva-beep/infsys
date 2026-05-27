import { Moon, Sun } from 'lucide-react';

import { useTheme } from '../store/theme.store';

export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Світла тема' : 'Темна тема'}
      aria-label="Перемкнути тему"
      className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white/70 text-mint-700 ring-1 ring-mint-200 backdrop-blur transition hover:bg-mint-50 hover:text-mint-900 dark:bg-mint-900/60 dark:text-mint-200 dark:ring-mint-700 dark:hover:bg-mint-800/70 dark:hover:text-white"
    >
      <Sun
        size={17}
        strokeWidth={2.5}
        className={`absolute transition-all duration-500 ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      />
      <Moon
        size={17}
        strokeWidth={2.5}
        className={`absolute transition-all duration-500 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </button>
  );
}
