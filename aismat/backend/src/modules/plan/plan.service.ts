import type { PlanStatus } from '@prisma/client';

import { prisma } from '../../db/prisma.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';

const materialInclude = {
  author: { select: { id: true, fullName: true } },
  discipline: { select: { id: true, name: true, code: true } },
  materialType: { select: { id: true, name: true, icon: true } },
} as const;

function serializeItem(row: {
  status: PlanStatus;
  position: number;
  addedAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  material: {
    id: number;
    title: string;
    fileSize: bigint;
    mimeType: string;
    author: { id: number; fullName: string };
    discipline: { id: number; name: string; code: string };
    materialType: { id: number; name: string; icon: string | null };
  };
}) {
  return {
    status: row.status,
    position: row.position,
    addedAt: row.addedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    material: {
      id: row.material.id,
      title: row.material.title,
      fileSize: Number(row.material.fileSize),
      mimeType: row.material.mimeType,
      author: row.material.author,
      discipline: row.material.discipline,
      materialType: row.material.materialType,
    },
  };
}

export type PlanItem = ReturnType<typeof serializeItem>;

export async function listPlan(userId: number): Promise<PlanItem[]> {
  const rows = await prisma.learningPlanItem.findMany({
    where: { userId, material: { deletedAt: null } },
    include: { material: { include: materialInclude } },
    orderBy: [{ status: 'asc' }, { position: 'asc' }],
  });
  return rows.map(serializeItem);
}

export async function addItem(
  userId: number,
  materialId: number,
  status: PlanStatus = 'todo',
): Promise<PlanItem> {
  const material = await prisma.material.findFirst({ where: { id: materialId, deletedAt: null } });
  if (!material) throw new NotFoundError('Матеріал не знайдено');

  const existing = await prisma.learningPlanItem.findUnique({
    where: { userId_materialId: { userId, materialId } },
  });
  if (existing) throw new ConflictError('Матеріал уже у вашому плані');

  // Position = max + 1 у відповідній колонці
  const maxPos = await prisma.learningPlanItem.aggregate({
    where: { userId, status },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const created = await prisma.learningPlanItem.create({
    data: {
      userId,
      materialId,
      status,
      position,
      completedAt: status === 'done' ? new Date() : null,
    },
    include: { material: { include: materialInclude } },
  });
  return serializeItem(created);
}

export interface ReorderInput {
  status: PlanStatus;
  orderedMaterialIds: number[];
}

/**
 * Атомарно оновлює статуси/позиції після drag-and-drop.
 * Очікує масив колонок з впорядкованими materialIds.
 */
export async function reorderPlan(
  userId: number,
  columns: ReorderInput[],
): Promise<void> {
  // Збираємо плоский список оновлень: (materialId, status, position)
  const updates: { materialId: number; status: PlanStatus; position: number }[] = [];
  for (const col of columns) {
    col.orderedMaterialIds.forEach((materialId, position) => {
      updates.push({ materialId, status: col.status, position });
    });
  }
  if (updates.length === 0) return;

  // Перевіримо, що всі items належать користувачу (захист від race condition / маніпуляцій)
  const owned = await prisma.learningPlanItem.findMany({
    where: { userId, materialId: { in: updates.map((u) => u.materialId) } },
    select: { materialId: true, status: true, completedAt: true },
  });
  const ownedMap = new Map(owned.map((o) => [o.materialId, o]));

  // Транзакція: одне оновлення на елемент
  await prisma.$transaction(
    updates
      .filter((u) => ownedMap.has(u.materialId))
      .map((u) => {
        const prev = ownedMap.get(u.materialId)!;
        const completedAt =
          u.status === 'done' && !prev.completedAt
            ? new Date()
            : u.status !== 'done'
              ? null
              : prev.completedAt;
        return prisma.learningPlanItem.update({
          where: { userId_materialId: { userId, materialId: u.materialId } },
          data: { status: u.status, position: u.position, completedAt },
        });
      }),
  );
}

export async function removeItem(userId: number, materialId: number): Promise<void> {
  const existing = await prisma.learningPlanItem.findUnique({
    where: { userId_materialId: { userId, materialId } },
  });
  if (!existing) throw new NotFoundError('Матеріал не у вашому плані');
  await prisma.learningPlanItem.delete({
    where: { userId_materialId: { userId, materialId } },
  });
}

// ─── Прогрес по дисциплінах ──────────────────────────────────────────

export interface DisciplineProgressRow {
  disciplineId: number;
  name: string;
  code: string;
  total: number;
  inPlan: number;
  inProgress: number;
  done: number;
  percent: number;
}

export async function getProgressByDiscipline(userId: number): Promise<DisciplineProgressRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      name: string;
      code: string;
      total: bigint;
      in_plan: bigint;
      in_progress: bigint;
      done: bigint;
    }>
  >`
    SELECT
      d.id, d.name, d.code,
      COUNT(DISTINCT m.id)::bigint AS total,
      COUNT(DISTINCT p.material_id) FILTER (WHERE p.status IS NOT NULL)::bigint AS in_plan,
      COUNT(DISTINCT p.material_id) FILTER (WHERE p.status = 'in_progress')::bigint AS in_progress,
      COUNT(DISTINCT p.material_id) FILTER (WHERE p.status = 'done')::bigint AS done
    FROM disciplines d
    LEFT JOIN materials m ON m.discipline_id = d.id AND m.deleted_at IS NULL
    LEFT JOIN learning_plan_items p
      ON p.material_id = m.id AND p.user_id = ${userId}
    GROUP BY d.id, d.name, d.code
    HAVING COUNT(DISTINCT m.id) > 0
    ORDER BY done DESC, in_progress DESC, d.name ASC
  `;
  return rows.map((r) => {
    const total = Number(r.total);
    const done = Number(r.done);
    return {
      disciplineId: r.id,
      name: r.name,
      code: r.code,
      total,
      inPlan: Number(r.in_plan),
      inProgress: Number(r.in_progress),
      done,
      percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

// ─── Бейджі (геймифікація) ──────────────────────────────────────────

export interface Badge {
  code: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  earned: boolean;
  progressCurrent: number;
  progressTarget: number;
}

interface BadgeDef {
  code: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  measure: (stats: BadgeStats) => number;
}

interface BadgeStats {
  totalDone: number;
  doneByDiscipline: Map<number, { name: string; done: number; total: number }>;
  doneByType: Map<string, number>;
  inProgress: number;
  streakDays: number; // днів поспіль із завершеними матеріалами
}

const BADGE_DEFS: BadgeDef[] = [
  {
    code: 'first_done',
    title: 'Перший крок',
    description: 'Завершіть свій перший матеріал',
    icon: 'flag',
    target: 1,
    measure: (s) => s.totalDone,
  },
  {
    code: 'apprentice',
    title: 'Підмайстер',
    description: 'Завершіть 5 матеріалів',
    icon: 'graduation-cap',
    target: 5,
    measure: (s) => s.totalDone,
  },
  {
    code: 'scholar',
    title: 'Дослідник',
    description: 'Завершіть 10 матеріалів',
    icon: 'medal',
    target: 10,
    measure: (s) => s.totalDone,
  },
  {
    code: 'expert',
    title: 'Знавець',
    description: 'Завершіть 25 матеріалів',
    icon: 'trophy',
    target: 25,
    measure: (s) => s.totalDone,
  },
  {
    code: 'multitasker',
    title: 'Багатозадачний',
    description: 'Тримайте 3 матеріали в роботі одночасно',
    icon: 'layers',
    target: 3,
    measure: (s) => s.inProgress,
  },
  {
    code: 'lecturer_fan',
    title: 'Шанувальник лекцій',
    description: 'Завершіть 5 лекцій',
    icon: 'book-open',
    target: 5,
    measure: (s) => s.doneByType.get('Лекція') ?? 0,
  },
  {
    code: 'lab_hero',
    title: 'Лабораторний герой',
    description: 'Завершіть 3 лабораторні роботи',
    icon: 'flask-conical',
    target: 3,
    measure: (s) => s.doneByType.get('Лабораторна робота') ?? 0,
  },
  {
    code: 'discipline_master',
    title: 'Майстер дисципліни',
    description: 'Завершіть усі матеріали з однієї дисципліни',
    icon: 'crown',
    target: 1,
    measure: (s) => {
      for (const v of s.doneByDiscipline.values()) {
        if (v.total > 0 && v.done >= v.total) return 1;
      }
      return 0;
    },
  },
];

async function gatherBadgeStats(userId: number): Promise<BadgeStats> {
  const items = await prisma.learningPlanItem.findMany({
    where: { userId, material: { deletedAt: null } },
    select: {
      status: true,
      material: {
        select: {
          disciplineId: true,
          discipline: { select: { name: true } },
          materialType: { select: { name: true } },
        },
      },
    },
  });

  const doneByDiscipline = new Map<number, { name: string; done: number; total: number }>();
  const doneByType = new Map<string, number>();
  let totalDone = 0;
  let inProgress = 0;

  for (const it of items) {
    if (it.status === 'done') {
      totalDone++;
      const k = it.material.disciplineId;
      const entry = doneByDiscipline.get(k) ?? {
        name: it.material.discipline.name,
        done: 0,
        total: 0,
      };
      entry.done++;
      doneByDiscipline.set(k, entry);

      const t = it.material.materialType.name;
      doneByType.set(t, (doneByType.get(t) ?? 0) + 1);
    } else if (it.status === 'in_progress') {
      inProgress++;
    }
  }

  // Заповнюємо total для кожної задіяної дисципліни
  if (doneByDiscipline.size > 0) {
    const disciplineIds = [...doneByDiscipline.keys()];
    const totals = await prisma.material.groupBy({
      by: ['disciplineId'],
      where: { disciplineId: { in: disciplineIds }, deletedAt: null },
      _count: { _all: true },
    });
    for (const t of totals) {
      const e = doneByDiscipline.get(t.disciplineId);
      if (e) e.total = t._count._all;
    }
  }

  return { totalDone, doneByDiscipline, doneByType, inProgress, streakDays: 0 };
}

export async function listBadges(userId: number): Promise<Badge[]> {
  const stats = await gatherBadgeStats(userId);
  return BADGE_DEFS.map((def) => {
    const current = def.measure(stats);
    return {
      code: def.code,
      title: def.title,
      description: def.description,
      icon: def.icon,
      earned: current >= def.target,
      progressCurrent: Math.min(current, def.target),
      progressTarget: def.target,
    };
  });
}
