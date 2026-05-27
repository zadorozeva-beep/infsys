import { RotateCcw, SlidersHorizontal } from 'lucide-react';

import type { Discipline, MaterialType, Tag } from '../types';

interface Props {
  disciplines: Discipline[];
  types: MaterialType[];
  tags: Tag[];
  disciplineId?: number;
  typeId?: number;
  selectedTagSlugs: string[];
  onDisciplineChange: (id?: number) => void;
  onTypeChange: (id?: number) => void;
  onTagsChange: (slugs: string[]) => void;
  onReset: () => void;
}

export function FilterPanel(props: Props): JSX.Element {
  const {
    disciplines,
    types,
    tags,
    disciplineId,
    typeId,
    selectedTagSlugs,
    onDisciplineChange,
    onTypeChange,
    onTagsChange,
    onReset,
  } = props;

  const toggleTag = (slug: string): void => {
    if (selectedTagSlugs.includes(slug)) {
      onTagsChange(selectedTagSlugs.filter((s) => s !== slug));
    } else {
      onTagsChange([...selectedTagSlugs, slug]);
    }
  };

  const activeCount =
    (disciplineId ? 1 : 0) + (typeId ? 1 : 0) + selectedTagSlugs.length;

  return (
    <aside className="card-glow sticky top-24 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-mint-900 dark:text-mint-100">
          <SlidersHorizontal size={16} strokeWidth={2.5} />
          Фільтри
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-mint-gradient px-1.5 text-[10px] font-bold text-white shadow-mint">
              {activeCount}
            </span>
          )}
        </h2>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-mint-600 transition hover:text-mint-800 dark:text-mint-300 dark:hover:text-mint-100"
        >
          <RotateCcw size={12} strokeWidth={2.5} /> Скинути
        </button>
      </div>

      <div>
        <label className="label" htmlFor="filter-discipline">Дисципліна</label>
        <select
          id="filter-discipline"
          className="input"
          value={disciplineId ?? ''}
          onChange={(e) => onDisciplineChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Усі дисципліни</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="filter-type">Тип матеріалу</label>
        <select
          id="filter-type"
          className="input"
          value={typeId ?? ''}
          onChange={(e) => onTypeChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Усі типи</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="label">Теги</span>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const active = selectedTagSlugs.includes(t.slug);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-mint-gradient text-white shadow-mint hover:-translate-y-0.5'
                    : 'bg-white/70 text-mint-800 ring-1 ring-mint-200 hover:bg-mint-50 hover:ring-mint-300 dark:bg-mint-900/60 dark:text-mint-200 dark:ring-mint-700 dark:hover:bg-mint-800/70 dark:hover:ring-mint-500'
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
