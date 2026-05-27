import { Check, Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTheme, type Accent } from '../store/theme.store';

interface AccentDef {
  id: Accent;
  label: string;
  // CSS-градієнт як превʼю — НЕ залежить від поточної теми, бо це фіксований swatch.
  preview: string;
}

const ACCENTS: AccentDef[] = [
  { id: 'mint', label: 'М’ятна', preview: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)' },
  { id: 'ocean', label: 'Океан', preview: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' },
  { id: 'sunset', label: 'Захід', preview: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)' },
  { id: 'forest', label: 'Ліс', preview: 'linear-gradient(135deg, #34d399 0%, #047857 100%)' },
  { id: 'rose', label: 'Троянда', preview: 'linear-gradient(135deg, #fb7185 0%, #be123c 100%)' },
  { id: 'lavender', label: 'Лаванда', preview: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)' },
];

export function ThemePicker(): JSX.Element {
  const { accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Колір теми"
        aria-label="Обрати колір теми"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-mint-700 ring-1 ring-mint-200 backdrop-blur transition hover:bg-mint-50 hover:text-mint-900 dark:bg-mint-900/60 dark:text-mint-200 dark:ring-mint-700 dark:hover:bg-mint-800/70 dark:hover:text-white"
      >
        <Palette size={17} strokeWidth={2.5} />
        {/* Маленький індикатор поточного акценту */}
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-mint-950"
          style={{ background: ACCENTS.find((a) => a.id === accent)?.preview ?? 'currentColor' }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[280px] origin-top-right overflow-hidden rounded-3xl border border-white/60 bg-white/95 p-3 shadow-mint-lg backdrop-blur-xl animate-fade-up dark:border-mint-700 dark:bg-mint-950/95">
          <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-mint-600 dark:text-mint-400">
            Колір акценту
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {ACCENTS.map((a) => {
              const isActive = a.id === accent;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setAccent(a.id);
                    setOpen(false);
                  }}
                  className={`group flex flex-col items-center gap-1 rounded-2xl p-2 transition ${
                    isActive
                      ? 'bg-mint-100 ring-2 ring-mint-400 dark:bg-mint-800/60 dark:ring-mint-500'
                      : 'hover:bg-mint-50 dark:hover:bg-mint-900/60'
                  }`}
                  title={a.label}
                  aria-label={`Тема ${a.label}`}
                >
                  <span
                    className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-soft transition-transform group-hover:scale-110"
                    style={{ background: a.preview }}
                  >
                    {isActive && (
                      <Check
                        size={20}
                        strokeWidth={3}
                        className="text-white drop-shadow"
                      />
                    )}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isActive
                        ? 'text-mint-900 dark:text-mint-100'
                        : 'text-mint-700 dark:text-mint-300'
                    }`}
                  >
                    {a.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 px-1 text-[10px] leading-snug text-mint-600 dark:text-mint-400">
            Поєднується зі світлою / темною темою. Зберігається у вашому браузері.
          </p>
        </div>
      )}
    </div>
  );
}
