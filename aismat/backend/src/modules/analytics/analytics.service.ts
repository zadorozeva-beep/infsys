import { prisma } from '../../db/prisma.js';

/**
 * Адмін-аналітика над журналом подій material_events.
 * Усі агрегації виконуються чистим SQL — потужніше, ніж ORM, і дозволяє
 * демонструвати GROUP BY / window-функції / date_trunc / generate_series.
 */

export interface OverviewKpi {
  totalUsers: number;
  totalMaterials: number;
  totalDownloads: number;
  totalSaves: number;
  totalViews: number;
  downloads7d: number;
  downloads7dPrev: number;
  downloads7dGrowthPct: number; // різниця у % порівняно з попередніми 7 днями
}

export async function getOverview(): Promise<OverviewKpi> {
  const [users, materials, downloads, saves, views, last7, prev7] = await Promise.all([
    prisma.user.count(),
    prisma.material.count(),
    prisma.materialEvent.count({ where: { eventType: 'download' } }),
    prisma.materialEvent.count({ where: { eventType: 'save' } }),
    prisma.materialEvent.count({ where: { eventType: 'view' } }),
    prisma.materialEvent.count({
      where: {
        eventType: 'download',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      },
    }),
    prisma.materialEvent.count({
      where: {
        eventType: 'download',
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 3600 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        },
      },
    }),
  ]);

  const growthPct = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);

  return {
    totalUsers: users,
    totalMaterials: materials,
    totalDownloads: downloads,
    totalSaves: saves,
    totalViews: views,
    downloads7d: last7,
    downloads7dPrev: prev7,
    downloads7dGrowthPct: growthPct,
  };
}

// ─── Динаміка завантажень по тижнях ──────────────────────────────────

export interface WeeklyPoint {
  week: string; // ISO date початку тижня (понеділок)
  downloads: number;
  views: number;
  saves: number;
}

export async function getWeeklyDynamics(weeks: number): Promise<WeeklyPoint[]> {
  // generate_series для всіх тижнів (щоб не було розривів)
  const rows = await prisma.$queryRaw<
    Array<{ week: Date; views: bigint; downloads: bigint; saves: bigint }>
  >`
    WITH series AS (
      SELECT date_trunc('week', d)::timestamptz AS week
      FROM generate_series(
        date_trunc('week', NOW() - (${weeks - 1} * INTERVAL '1 week')),
        date_trunc('week', NOW()),
        INTERVAL '1 week'
      ) AS d
    )
    SELECT
      s.week,
      COALESCE(SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END), 0)::bigint AS views,
      COALESCE(SUM(CASE WHEN e.event_type = 'download' THEN 1 ELSE 0 END), 0)::bigint AS downloads,
      COALESCE(SUM(CASE WHEN e.event_type = 'save' THEN 1 ELSE 0 END), 0)::bigint AS saves
    FROM series s
    LEFT JOIN material_events e
      ON date_trunc('week', e.created_at) = s.week
    GROUP BY s.week
    ORDER BY s.week ASC
  `;
  return rows.map((r) => ({
    week: r.week.toISOString().slice(0, 10),
    views: Number(r.views),
    downloads: Number(r.downloads),
    saves: Number(r.saves),
  }));
}

// ─── Теплова карта активності (день × година) ────────────────────────

export interface HeatmapCell {
  dow: number; // 0=пн, 6=нд (за ISO)
  hour: number; // 0–23
  value: number;
}

export async function getHeatmap(days: number): Promise<HeatmapCell[]> {
  const rows = await prisma.$queryRaw<
    Array<{ dow: number; hour: number; value: bigint }>
  >`
    SELECT
      (EXTRACT(ISODOW FROM created_at)::int - 1) AS dow,
      EXTRACT(HOUR FROM created_at)::int AS hour,
      COUNT(*)::bigint AS value
    FROM material_events
    WHERE created_at >= NOW() - (${days} * INTERVAL '1 day')
    GROUP BY dow, hour
    ORDER BY dow, hour
  `;
  return rows.map((r) => ({
    dow: Number(r.dow),
    hour: Number(r.hour),
    value: Number(r.value),
  }));
}

// ─── Топ-N матеріалів за завантаженнями ──────────────────────────────

export interface TopMaterialRow {
  id: number;
  title: string;
  disciplineName: string;
  materialTypeName: string;
  downloads: number;
  views: number;
  saves: number;
}

export async function getTopMaterials(limit: number): Promise<TopMaterialRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      title: string;
      discipline_name: string;
      type_name: string;
      views: bigint;
      downloads: bigint;
      saves: bigint;
    }>
  >`
    SELECT
      m.id,
      m.title,
      d.name AS discipline_name,
      mt.name AS type_name,
      COALESCE(SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END), 0)::bigint AS views,
      COALESCE(SUM(CASE WHEN e.event_type = 'download' THEN 1 ELSE 0 END), 0)::bigint AS downloads,
      COALESCE(SUM(CASE WHEN e.event_type = 'save' THEN 1 ELSE 0 END), 0)::bigint AS saves
    FROM materials m
    JOIN disciplines d ON d.id = m.discipline_id
    JOIN material_types mt ON mt.id = m.material_type_id
    LEFT JOIN material_events e ON e.material_id = m.id
    GROUP BY m.id, m.title, d.name, mt.name
    ORDER BY downloads DESC, views DESC, m.id ASC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    disciplineName: r.discipline_name,
    materialTypeName: r.type_name,
    downloads: Number(r.downloads),
    views: Number(r.views),
    saves: Number(r.saves),
  }));
}

// ─── Розподіл матеріалів по дисциплінах ──────────────────────────────

export interface DisciplineDistribution {
  disciplineId: number;
  name: string;
  materialsCount: number;
  totalDownloads: number;
}

export async function getDisciplineDistribution(): Promise<DisciplineDistribution[]> {
  const rows = await prisma.$queryRaw<
    Array<{ id: number; name: string; materials: bigint; downloads: bigint }>
  >`
    SELECT
      d.id,
      d.name,
      COUNT(DISTINCT m.id)::bigint AS materials,
      COALESCE(SUM(CASE WHEN e.event_type = 'download' THEN 1 ELSE 0 END), 0)::bigint AS downloads
    FROM disciplines d
    LEFT JOIN materials m ON m.discipline_id = d.id
    LEFT JOIN material_events e ON e.material_id = m.id
    GROUP BY d.id, d.name
    ORDER BY materials DESC, downloads DESC
  `;
  return rows.map((r) => ({
    disciplineId: r.id,
    name: r.name,
    materialsCount: Number(r.materials),
    totalDownloads: Number(r.downloads),
  }));
}

// ─── Конверсійна воронка view → download → save ──────────────────────

export interface FunnelData {
  views: number;
  downloads: number;
  saves: number;
  downloadRate: number; // % від views
  saveRate: number; // % від downloads
  viewToSaveRate: number; // % від views
}

export async function getFunnel(days: number): Promise<FunnelData> {
  const rows = await prisma.$queryRaw<
    Array<{ views: bigint; downloads: bigint; saves: bigint }>
  >`
    SELECT
      COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0)::bigint AS views,
      COALESCE(SUM(CASE WHEN event_type = 'download' THEN 1 ELSE 0 END), 0)::bigint AS downloads,
      COALESCE(SUM(CASE WHEN event_type = 'save' THEN 1 ELSE 0 END), 0)::bigint AS saves
    FROM material_events
    WHERE created_at >= NOW() - (${days} * INTERVAL '1 day')
  `;
  const r = rows[0] ?? { views: 0n, downloads: 0n, saves: 0n };
  const views = Number(r.views);
  const downloads = Number(r.downloads);
  const saves = Number(r.saves);
  return {
    views,
    downloads,
    saves,
    downloadRate: views > 0 ? Math.round((downloads / views) * 100) : 0,
    saveRate: downloads > 0 ? Math.round((saves / downloads) * 100) : 0,
    viewToSaveRate: views > 0 ? Math.round((saves / views) * 100) : 0,
  };
}
