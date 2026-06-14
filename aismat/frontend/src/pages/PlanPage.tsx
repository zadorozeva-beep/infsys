import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  GripVertical,
  ListTodo,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { extractErrorMessage } from '../api/axios';
import {
  getBadges,
  getProgress,
  listPlan,
  removeFromPlan,
  reorderPlan,
  type PlanItem,
  type PlanStatus,
} from '../api/plan.api';
import { BadgesGrid } from '../components/BadgesGrid';
import { ProgressByDiscipline } from '../components/ProgressByDiscipline';
import { useToast } from '../store/toast.store';

const COLUMN_DEFS: Array<{ id: PlanStatus; title: string; icon: React.ReactNode; accent: string }> = [
  {
    id: 'todo',
    title: 'Хочу вивчити',
    icon: <Circle size={16} strokeWidth={2.5} />,
    accent: 'from-cyan-400 to-mint-500',
  },
  {
    id: 'in_progress',
    title: 'В процесі',
    icon: <Loader2 size={16} strokeWidth={2.5} />,
    accent: 'from-amber-400 to-mint-500',
  },
  {
    id: 'done',
    title: 'Завершено',
    icon: <CheckCircle2 size={16} strokeWidth={2.5} />,
    accent: 'from-mint-500 to-teal-600',
  },
];

type ColumnsState = Record<PlanStatus, PlanItem[]>;

const EMPTY_COLUMNS: ColumnsState = { todo: [], in_progress: [], done: [] };

function groupByStatus(items: PlanItem[]): ColumnsState {
  const cols: ColumnsState = { todo: [], in_progress: [], done: [] };
  for (const it of items) cols[it.status].push(it);
  for (const k of Object.keys(cols) as PlanStatus[]) {
    cols[k].sort((a, b) => a.position - b.position);
  }
  return cols;
}

function findColumnByItem(id: number, src: ColumnsState): PlanStatus | null {
  for (const k of Object.keys(src) as PlanStatus[]) {
    if (src[k].some((c) => c.material.id === id)) return k;
  }
  return null;
}

function columnsToPayload(cols: ColumnsState): { status: PlanStatus; orderedMaterialIds: number[] }[] {
  return (Object.keys(cols) as PlanStatus[]).map((status) => ({
    status,
    orderedMaterialIds: cols[status].map((c) => c.material.id),
  }));
}

const COLUMN_IDS: PlanStatus[] = ['todo', 'in_progress', 'done'];
const COLUMN_ID_SET: ReadonlySet<string> = new Set(COLUMN_IDS);

export function PlanPage(): JSX.Element {
  const qc = useQueryClient();
  const toast = useToast();

  const planQ = useQuery({ queryKey: ['plan'], queryFn: listPlan });
  const progressQ = useQuery({ queryKey: ['plan-progress'], queryFn: getProgress });
  const badgesQ = useQuery({ queryKey: ['plan-badges'], queryFn: getBadges });

  const [columns, setColumns] = useState<ColumnsState>(EMPTY_COLUMNS);
  const [activeId, setActiveId] = useState<number | null>(null);
  // Лічильник pending-мутацій: блокує перезапис з planQ, поки користувач drag-ає або чекає save
  const pendingReorderCount = useRef(0);

  // Синхронізуємо state з сервером лише коли немає активних мутацій
  useEffect(() => {
    if (planQ.data && pendingReorderCount.current === 0) {
      setColumns(groupByStatus(planQ.data));
    }
  }, [planQ.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const reorderMut = useMutation({
    mutationFn: (cols: ColumnsState) => reorderPlan(columnsToPayload(cols)),
    onMutate: () => {
      pendingReorderCount.current += 1;
    },
    onSettled: () => {
      pendingReorderCount.current = Math.max(0, pendingReorderCount.current - 1);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan'] });
      qc.invalidateQueries({ queryKey: ['plan-progress'] });
      qc.invalidateQueries({ queryKey: ['plan-badges'] });
      qc.invalidateQueries({ queryKey: ['me-stats'] });
    },
    onError: (err) => {
      toast.error('Не вдалося оновити план', extractErrorMessage(err));
      qc.invalidateQueries({ queryKey: ['plan'] });
    },
  });

  const removeMut = useMutation({
    mutationFn: (materialId: number) => removeFromPlan(materialId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan'] });
      qc.invalidateQueries({ queryKey: ['plan-progress'] });
      qc.invalidateQueries({ queryKey: ['plan-badges'] });
      toast.info('Прибрано з плану');
    },
    onError: (err) => toast.error('Помилка', extractErrorMessage(err)),
  });

  const activeItem = useMemo(
    () => (activeId !== null ? planQ.data?.find((p) => p.material.id === activeId) ?? null : null),
    [activeId, planQ.data],
  );

  const handleDragStart = (e: DragStartEvent): void => {
    setActiveId(Number(e.active.id));
  };

  // Drag over — лише міжколонкове переміщення для миттєвого UI feedback (без mutate)
  const handleDragOver = (e: DragOverEvent): void => {
    const { active, over } = e;
    if (!over) return;
    const activeIdN = Number(active.id);
    const overIdRaw = String(over.id);

    setColumns((prev) => {
      const fromCol = findColumnByItem(activeIdN, prev);
      if (!fromCol) return prev;

      const overCol: PlanStatus | null = COLUMN_ID_SET.has(overIdRaw)
        ? (overIdRaw as PlanStatus)
        : findColumnByItem(Number(overIdRaw), prev);
      if (!overCol || fromCol === overCol) return prev;

      const item = prev[fromCol].find((c) => c.material.id === activeIdN);
      if (!item) return prev;

      const next: ColumnsState = {
        todo: [...prev.todo],
        in_progress: [...prev.in_progress],
        done: [...prev.done],
      };
      next[fromCol] = next[fromCol].filter((c) => c.material.id !== activeIdN);
      next[overCol] = [...next[overCol], { ...item, status: overCol }];
      return next;
    });
  };

  const handleDragEnd = (e: DragEndEvent): void => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) {
      // Drop поза будь-якою колонкою — відкат до сервера
      if (planQ.data) setColumns(groupByStatus(planQ.data));
      return;
    }

    const activeIdN = Number(active.id);
    const overIdRaw = String(over.id);

    // Обчислюємо новий стан в чистій функції — без сайд-ефектів у setState
    const current = columns;
    const fromCol = findColumnByItem(activeIdN, current);
    if (!fromCol) return;

    let nextColumns: ColumnsState = current;

    if (COLUMN_ID_SET.has(overIdRaw)) {
      // Drop безпосередньо на колонку (можливо вже перенесений через handleDragOver) —
      // позиція в кінці є природною. Жодних змін у columns не треба.
      nextColumns = current;
    } else {
      const overIdN = Number(overIdRaw);
      const overCol = findColumnByItem(overIdN, current);
      if (!overCol) return;

      if (fromCol === overCol) {
        const oldIdx = current[fromCol].findIndex((c) => c.material.id === activeIdN);
        const newIdx = current[fromCol].findIndex((c) => c.material.id === overIdN);
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) {
          nextColumns = current;
        } else {
          nextColumns = { ...current };
          nextColumns[fromCol] = arrayMove(current[fromCol], oldIdx, newIdx);
          setColumns(nextColumns);
        }
      }
      // Якщо fromCol !== overCol — це міжколонкове переміщення, яке вже зроблене у handleDragOver.
      // nextColumns = current (це уже post-handleDragOver стан).
    }

    // Один виклик mutate, без вкладеності в setState
    reorderMut.mutate(nextColumns);
  };

  const total = (planQ.data ?? []).length;
  const done = columns.done.length;
  const inProgress = columns.in_progress.length;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl bg-mint-gradient px-6 py-8 text-white shadow-mint-lg md:px-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
              <ListTodo size={12} /> Особистий план
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-4xl">
              Мій план навчання
            </h1>
            <p className="mt-2 max-w-xl text-sm text-mint-50/90">
              Перетягуйте матеріали між колонками, щоб слідкувати за своїм прогресом.
              Завершені — зараховуються до досягнень і впливають на статистику дисциплін.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <HeroStat label="Усього" value={total} />
            <HeroStat label="В роботі" value={inProgress} />
            <HeroStat label="Завершено" value={done} />
          </div>
        </div>
      </section>

      <BadgesGrid data={badgesQ.data} loading={badgesQ.isLoading} />
      <ProgressByDiscipline data={progressQ.data ?? []} loading={progressQ.isLoading} />

      {planQ.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-3xl bg-mint-100/40" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-100 text-mint-600 dark:bg-mint-800/60 dark:text-mint-200">
            <ListTodo size={32} strokeWidth={2} />
          </span>
          <h3 className="font-display text-lg font-bold text-mint-900 dark:text-mint-100">
            Ваш план поки порожній
          </h3>
          <p className="max-w-md text-sm text-slate-600 dark:text-mint-300">
            Зайдіть у каталог матеріалів, оберіть лекцію або лабу і натисніть «Додати в план».
          </p>
          <Link to="/" className="btn-primary mt-2">
            <BookOpen size={16} strokeWidth={2.5} /> Перейти до каталогу
          </Link>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {COLUMN_DEFS.map((col) => (
              <KanbanColumn
                key={col.id}
                colId={col.id}
                title={col.title}
                icon={col.icon}
                accent={col.accent}
                items={columns[col.id]}
                onRemove={(materialId) => removeMut.mutate(materialId)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="rotate-2 scale-105">
                <KanbanCard item={activeItem} dragging onRemove={() => undefined} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur ring-1 ring-white/30">
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">{label}</div>
      <div className="font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}

// ─── Колонка ────────────────────────────────────────────────────────

function KanbanColumn({
  colId,
  title,
  icon,
  accent,
  items,
  onRemove,
}: {
  colId: PlanStatus;
  title: string;
  icon: React.ReactNode;
  accent: string;
  items: PlanItem[];
  onRemove: (materialId: number) => void;
}): JSX.Element {
  // Колонка як ціле — droppable з id = colId. Це робить пусті/непусті колонки
  // надійним drop-target (важливо при drop у порожню колонку чи нижче items).
  const { setNodeRef, isOver } = useDroppable({ id: colId });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] flex-col gap-3 rounded-3xl bg-white/60 p-4 ring-1 backdrop-blur transition dark:bg-mint-950/40 ${
        isOver
          ? 'ring-mint-400 shadow-mint dark:ring-mint-500'
          : 'ring-mint-200 dark:ring-mint-800'
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 font-display text-sm font-bold text-mint-900 dark:text-mint-100">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow`}
          >
            {icon}
          </span>
          {title}
        </h3>
        <span className="rounded-full bg-mint-100 px-2 py-0.5 text-xs font-bold text-mint-700 dark:bg-mint-800/60 dark:text-mint-200">
          {items.length}
        </span>
      </header>

      <SortableContext
        id={colId}
        items={items.map((it) => it.material.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <EmptyHint />
          ) : (
            items.map((it) => (
              <KanbanCard key={it.material.id} item={it} onRemove={() => onRemove(it.material.id)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function EmptyHint(): JSX.Element {
  return (
    <div className="pointer-events-none flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-mint-200 text-xs italic text-mint-500 dark:border-mint-800 dark:text-mint-300">
      Перетягніть сюди
    </div>
  );
}

// ─── Картка ─────────────────────────────────────────────────────────

function KanbanCard({
  item,
  dragging,
  onRemove,
}: {
  item: PlanItem;
  dragging?: boolean;
  onRemove: () => void;
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.material.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group rounded-2xl bg-white/95 p-3 shadow-soft ring-1 ring-mint-100 transition hover:ring-mint-300 dark:bg-mint-900/60 dark:ring-mint-800 dark:hover:ring-mint-600 ${
        dragging ? 'shadow-mint-glow' : ''
      }`}
    >
      <div className="mb-1.5 flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="cursor-grab touch-none rounded p-0.5 text-mint-500 transition hover:bg-mint-50 active:cursor-grabbing dark:hover:bg-mint-800/60"
          aria-label="Перетягнути"
        >
          <GripVertical size={14} strokeWidth={2.5} />
        </button>
        <Link
          to={`/materials/${item.material.id}`}
          className="line-clamp-2 flex-1 font-display text-sm font-bold text-mint-900 hover:text-mint-700 dark:text-mint-100 dark:hover:text-mint-300"
        >
          {item.material.title}
        </Link>
        <button
          type="button"
          onClick={onRemove}
          title="Прибрати з плану"
          className="rounded p-0.5 text-rose-500 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-900/30"
        >
          <Trash2 size={13} strokeWidth={2.5} />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
        <span className="rounded-full bg-mint-100 px-2 py-0.5 text-mint-700 ring-1 ring-inset ring-mint-200 dark:bg-mint-800/60 dark:text-mint-200 dark:ring-mint-700">
          {item.material.materialType.name}
        </span>
        <span className="text-mint-700/80 dark:text-mint-300">
          {item.material.discipline.code}
        </span>
      </div>
    </article>
  );
}
