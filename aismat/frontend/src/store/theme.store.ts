import { createContext, useContext, useEffect, useState } from 'react';

export type Mode = 'light' | 'dark';
export type Accent = 'mint' | 'ocean' | 'sunset' | 'forest' | 'rose' | 'lavender';

const MODE_KEY = 'aismat_theme';
const ACCENT_KEY = 'aismat_accent';

interface ThemeContextValue {
  theme: Mode; // back-compat для існуючих компонентів
  mode: Mode;
  accent: Accent;
  setTheme: (m: Mode) => void;
  setMode: (m: Mode) => void;
  setAccent: (a: Accent) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

const ACCENTS: ReadonlySet<Accent> = new Set([
  'mint',
  'ocean',
  'sunset',
  'forest',
  'rose',
  'lavender',
]);

export function readStoredMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function readStoredAccent(): Accent {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    if (stored && ACCENTS.has(stored as Accent)) return stored as Accent;
  } catch {
    /* ignore */
  }
  return 'mint';
}

function applyThemeToHtml(mode: Mode, accent: Accent): void {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.setAttribute('data-theme', accent);
}

export function useThemeState(): ThemeContextValue {
  const [mode, setModeState] = useState<Mode>(() => readStoredMode());
  const [accent, setAccentState] = useState<Accent>(() => readStoredAccent());

  useEffect(() => {
    applyThemeToHtml(mode, accent);
    try {
      localStorage.setItem(MODE_KEY, mode);
      localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* quota — нехай */
    }
  }, [mode, accent]);

  return {
    theme: mode,
    mode,
    accent,
    setTheme: setModeState,
    setMode: setModeState,
    setAccent: setAccentState,
    toggleTheme: () => setModeState((t) => (t === 'dark' ? 'light' : 'dark')),
  };
}
