import { api } from './axios';
import type { ApiSuccess } from '../types';

export interface OverviewKpi {
  totalUsers: number;
  totalMaterials: number;
  totalDownloads: number;
  totalSaves: number;
  totalViews: number;
  downloads7d: number;
  downloads7dPrev: number;
  downloads7dGrowthPct: number;
}

export interface WeeklyPoint {
  week: string;
  views: number;
  downloads: number;
  saves: number;
}

export interface HeatmapCell {
  dow: number;
  hour: number;
  value: number;
}

export interface TopMaterialRow {
  id: number;
  title: string;
  disciplineName: string;
  materialTypeName: string;
  downloads: number;
  views: number;
  saves: number;
}

export interface DisciplineDistribution {
  disciplineId: number;
  name: string;
  materialsCount: number;
  totalDownloads: number;
}

export interface FunnelData {
  views: number;
  downloads: number;
  saves: number;
  downloadRate: number;
  saveRate: number;
  viewToSaveRate: number;
}

export async function getOverview(): Promise<OverviewKpi> {
  const { data } = await api.get<ApiSuccess<OverviewKpi>>('/admin/analytics/overview');
  return data.data;
}

export async function getWeekly(weeks = 12): Promise<WeeklyPoint[]> {
  const { data } = await api.get<ApiSuccess<WeeklyPoint[]>>('/admin/analytics/weekly', {
    params: { weeks },
  });
  return data.data;
}

export async function getHeatmap(days = 30): Promise<HeatmapCell[]> {
  const { data } = await api.get<ApiSuccess<HeatmapCell[]>>('/admin/analytics/heatmap', {
    params: { days },
  });
  return data.data;
}

export async function getTopMaterials(limit = 10): Promise<TopMaterialRow[]> {
  const { data } = await api.get<ApiSuccess<TopMaterialRow[]>>('/admin/analytics/top-materials', {
    params: { limit },
  });
  return data.data;
}

export async function getDisciplineDistribution(): Promise<DisciplineDistribution[]> {
  const { data } = await api.get<ApiSuccess<DisciplineDistribution[]>>(
    '/admin/analytics/disciplines',
  );
  return data.data;
}

export async function getFunnel(days = 30): Promise<FunnelData> {
  const { data } = await api.get<ApiSuccess<FunnelData>>('/admin/analytics/funnel', {
    params: { days },
  });
  return data.data;
}
