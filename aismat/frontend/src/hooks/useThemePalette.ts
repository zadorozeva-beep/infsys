import { useMemo } from 'react';

import { useTheme } from '../store/theme.store';

export interface ThemePalette {
  c50: string;
  c100: string;
  c200: string;
  c300: string;
  c400: string;
  c500: string;
  c600: string;
  c700: string;
  c800: string;
  c900: string;
  c950: string;
  /** Серія з 8 кольорів для bar/pie chart — від світлого до темного, чергуючи відтінки. */
  series: string[];
}

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

function readVar(name: string): string {
  if (typeof window === 'undefined') return '20 184 166';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || '20 184 166';
}

/**
 * Реактивно повертає поточні значення палітри. Залежить від `accent` і `mode`
 * у ThemeContext — при зміні теми хук перевиклкається, recharts перерендерить
 * графіки з новими кольорами.
 */
export function useThemePalette(): ThemePalette {
  const { accent, mode } = useTheme();

  // Залежність від accent + mode гарантує, що `useMemo` переобчислиться при перемиканні теми.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo<ThemePalette>(() => {
    const rgb = SHADES.reduce<Record<number, string>>((acc, n) => {
      acc[n] = `rgb(${readVar(`--mint-${n}`)})`;
      return acc;
    }, {});

    return {
      c50: rgb[50]!,
      c100: rgb[100]!,
      c200: rgb[200]!,
      c300: rgb[300]!,
      c400: rgb[400]!,
      c500: rgb[500]!,
      c600: rgb[600]!,
      c700: rgb[700]!,
      c800: rgb[800]!,
      c900: rgb[900]!,
      c950: rgb[950]!,
      series: [rgb[500]!, rgb[400]!, rgb[300]!, rgb[600]!, rgb[700]!, rgb[200]!, rgb[800]!, rgb[100]!],
    };
  }, [accent, mode]);
}
