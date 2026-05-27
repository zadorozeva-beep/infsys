import { BookOpen, TrendingUp } from 'lucide-react';

import type { DisciplineProgress } from '../api/plan.api';

interface Props {
  data: DisciplineProgress[];
  loading: boolean;
}

export function ProgressByDiscipline({ data, loading }: Props): JSX.Element {
  return (
    <div className="card-glow !p-5">
      <h3 className="mb-4 inline-flex items-center gap-2 font-display text-base font-bold text-mint-900 dark:text-mint-100">
        <TrendingUp size={16} strokeWidth={2.5} />
        Прогрес по дисциплінах
      </h3>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-mint-100/40" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm italic text-mint-600 dark:text-mint-400">
          Немає дисциплін з матеріалами.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((d) => (
            <li key={d.disciplineId}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-mint-800 dark:text-mint-200">
                  <BookOpen size={12} strokeWidth={2.5} /> {d.name}
                  <span className="font-mono text-mint-500">({d.code})</span>
                </span>
                <span className="font-mono text-mint-700 dark:text-mint-300">
                  <span className="font-bold">
                    {d.done} / {d.total}
                  </span>
                  <span className="ml-2 text-mint-500">{d.percent}%</span>
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-mint-100 dark:bg-mint-900/60">
                {/* Прогрес "В роботі" — світліша смужка */}
                {d.inProgress > 0 && d.total > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 bg-amber-300/60"
                    style={{ width: `${((d.done + d.inProgress) / d.total) * 100}%` }}
                  />
                )}
                {/* Прогрес "Завершено" — основна смужка */}
                <div
                  className="absolute inset-y-0 left-0 bg-mint-gradient transition-all duration-700"
                  style={{ width: `${d.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
