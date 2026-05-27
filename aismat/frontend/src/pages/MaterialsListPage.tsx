import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Inbox, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  listDisciplines,
  listMaterialTypes,
  listMaterials,
  listTags,
} from '../api/materials.api';
import { FilterPanel } from '../components/FilterPanel';
import { MaterialCard } from '../components/MaterialCard';
import { SearchBar } from '../components/SearchBar';
import { useDebounce } from '../hooks/useDebounce';

const PAGE_SIZE = 12;

export function MaterialsListPage(): JSX.Element {
  const [search, setSearch] = useState('');
  const [disciplineId, setDisciplineId] = useState<number | undefined>(undefined);
  const [typeId, setTypeId] = useState<number | undefined>(undefined);
  const [tagSlugs, setTagSlugs] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  const disciplinesQ = useQuery({ queryKey: ['disciplines'], queryFn: listDisciplines });
  const typesQ = useQuery({ queryKey: ['material-types'], queryFn: listMaterialTypes });
  const tagsQ = useQuery({ queryKey: ['tags'], queryFn: listTags });

  const params = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      disciplineId,
      typeId,
      tags: tagSlugs.length > 0 ? tagSlugs.join(',') : undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    [debouncedSearch, disciplineId, typeId, tagSlugs, offset],
  );

  const materialsQ = useQuery({
    queryKey: ['materials', params],
    queryFn: () => listMaterials(params),
  });

  const resetFilters = (): void => {
    setDisciplineId(undefined);
    setTypeId(undefined);
    setTagSlugs([]);
    setOffset(0);
  };

  const total = materialsQ.data?.meta.total ?? 0;
  const items = materialsQ.data?.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero-блок */}
      <section className="relative overflow-hidden rounded-3xl bg-mint-gradient px-6 py-10 text-white shadow-mint-lg md:px-10 md:py-14">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
            <Sparkles size={12} /> Бібліотека знань
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-4xl">
            Знайдіть будь-який навчальний матеріал
            <br />
            <span className="text-mint-100">за секунди</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-mint-50/90 md:text-base">
            Повнотекстовий пошук українською мовою з ранжуванням. Фільтруйте за дисципліною, типом і тегами — або вводьте запит у будь-якій формі.
          </p>

          <div className="mt-6">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setOffset(0);
              }}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
              <TrendingUp size={12} strokeWidth={2.5} />
              {total} {pluralize(total)} у каталозі
            </span>
            {disciplinesQ.data && (
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
                {disciplinesQ.data.length} дисциплін
              </span>
            )}
            {tagsQ.data && (
              <span className="rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
                {tagsQ.data.length} тегів
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <FilterPanel
          disciplines={disciplinesQ.data ?? []}
          types={typesQ.data ?? []}
          tags={tagsQ.data ?? []}
          disciplineId={disciplineId}
          typeId={typeId}
          selectedTagSlugs={tagSlugs}
          onDisciplineChange={(id) => {
            setDisciplineId(id);
            setOffset(0);
          }}
          onTypeChange={(id) => {
            setTypeId(id);
            setOffset(0);
          }}
          onTagsChange={(slugs) => {
            setTagSlugs(slugs);
            setOffset(0);
          }}
          onReset={resetFilters}
        />

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-mint-900 dark:text-mint-100">
              {materialsQ.isLoading
                ? 'Завантаження...'
                : `Знайдено: ${total} ${pluralize(total)}`}
            </span>
            {materialsQ.isFetching && !materialsQ.isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-mint-600 dark:text-mint-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-mint-500" />
                Оновлення...
              </span>
            )}
          </div>

          {materialsQ.isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-700 backdrop-blur">
              Помилка завантаження матеріалів. Перевірте, чи запущено бекенд на :3000.
            </div>
          )}

          {materialsQ.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-3xl bg-gradient-to-br from-mint-100/60 to-mint-200/40"
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-12 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
                <Inbox size={32} strokeWidth={2} />
              </span>
              <h3 className="font-display text-lg font-bold text-mint-900">Нічого не знайдено</h3>
              <p className="max-w-md text-sm text-slate-600">
                Спробуйте змінити пошуковий запит, обрати інші фільтри або скинути всі параметри.
              </p>
              <button onClick={resetFilters} className="btn-secondary mt-2">
                Скинути фільтри
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((m) => (
                <MaterialCard key={m.id} material={m} />
              ))}
            </div>
          )}

          {total > PAGE_SIZE && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <button
                className="btn-secondary !py-2"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                <ChevronLeft size={16} strokeWidth={2.5} /> Попередня
              </button>
              <span className="rounded-2xl bg-white/70 px-4 py-2 text-sm font-semibold text-mint-900 ring-1 ring-mint-200 backdrop-blur dark:bg-mint-900/60 dark:text-mint-100 dark:ring-mint-700">
                {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} з {total}
              </span>
              <button
                className="btn-secondary !py-2"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Наступна <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'матеріал';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'матеріали';
  return 'матеріалів';
}
