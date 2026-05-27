import {
  BookOpen,
  Crown,
  Flag,
  FlaskConical,
  GraduationCap,
  Layers,
  Lock,
  Medal,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

import type { BadgesResponse } from '../api/plan.api';

interface Props {
  data: BadgesResponse | undefined;
  loading: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  flag: Flag,
  'graduation-cap': GraduationCap,
  medal: Medal,
  trophy: Trophy,
  layers: Layers,
  'book-open': BookOpen,
  'flask-conical': FlaskConical,
  crown: Crown,
};

export function BadgesGrid({ data, loading }: Props): JSX.Element {
  if (loading || !data) {
    return (
      <div className="card-glow !p-5">
        <h3 className="mb-3 font-display text-base font-bold text-mint-900 dark:text-mint-100">
          Бейджі досягнень
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-mint-100/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-glow !p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="inline-flex items-center gap-2 font-display text-base font-bold text-mint-900 dark:text-mint-100">
          <Trophy size={16} strokeWidth={2.5} />
          Бейджі досягнень
        </h3>
        <span className="rounded-full bg-mint-100 px-2.5 py-1 text-xs font-bold text-mint-700 dark:bg-mint-800/60 dark:text-mint-200">
          {data.meta.earned} / {data.meta.total}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {data.data.map((b) => {
          const Icon = ICON_MAP[b.icon] ?? Trophy;
          const pct = Math.round((b.progressCurrent / b.progressTarget) * 100);
          return (
            <div
              key={b.code}
              title={`${b.description} (${b.progressCurrent}/${b.progressTarget})`}
              className={`flex flex-col items-center gap-1 rounded-2xl p-3 ring-1 transition ${
                b.earned
                  ? 'bg-mint-gradient text-white shadow-mint ring-mint-300'
                  : 'bg-white/60 text-mint-700 ring-mint-200 dark:bg-mint-900/40 dark:text-mint-300 dark:ring-mint-800'
              }`}
            >
              <div className="relative">
                <Icon size={26} strokeWidth={2.2} className={b.earned ? '' : 'opacity-60'} />
                {!b.earned && (
                  <Lock
                    size={10}
                    strokeWidth={3}
                    className="absolute -bottom-0.5 -right-0.5 rounded-full bg-mint-100 p-0.5 text-mint-500 dark:bg-mint-950 dark:text-mint-400"
                  />
                )}
              </div>
              <div
                className={`text-center text-[10px] font-bold uppercase tracking-wider ${
                  b.earned ? 'opacity-100' : 'opacity-70'
                }`}
              >
                {b.title}
              </div>
              {!b.earned && b.progressTarget > 1 && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-mint-100 dark:bg-mint-800/60">
                  <div
                    className="h-full rounded-full bg-mint-gradient transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
