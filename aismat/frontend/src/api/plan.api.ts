import { api } from './axios';
import type { ApiSuccess } from '../types';

export type PlanStatus = 'todo' | 'in_progress' | 'done';

export interface PlanItem {
  status: PlanStatus;
  position: number;
  addedAt: string;
  updatedAt: string;
  completedAt: string | null;
  material: {
    id: number;
    title: string;
    fileSize: number;
    mimeType: string;
    author: { id: number; fullName: string };
    discipline: { id: number; name: string; code: string };
    materialType: { id: number; name: string; icon: string | null };
  };
}

export interface DisciplineProgress {
  disciplineId: number;
  name: string;
  code: string;
  total: number;
  inPlan: number;
  inProgress: number;
  done: number;
  percent: number;
}

export interface Badge {
  code: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  progressCurrent: number;
  progressTarget: number;
}

export interface BadgesResponse {
  data: Badge[];
  meta: { earned: number; total: number };
}

export async function listPlan(): Promise<PlanItem[]> {
  const { data } = await api.get<ApiSuccess<PlanItem[]>>('/me/plan');
  return data.data;
}

export async function addToPlan(materialId: number, status: PlanStatus = 'todo'): Promise<PlanItem> {
  const { data } = await api.post<ApiSuccess<PlanItem>>('/me/plan', { materialId, status });
  return data.data;
}

export async function reorderPlan(
  columns: { status: PlanStatus; orderedMaterialIds: number[] }[],
): Promise<void> {
  await api.patch('/me/plan/reorder', { columns });
}

export async function removeFromPlan(materialId: number): Promise<void> {
  await api.delete(`/me/plan/${materialId}`);
}

export async function getProgress(): Promise<DisciplineProgress[]> {
  const { data } = await api.get<ApiSuccess<DisciplineProgress[]>>('/me/plan/progress');
  return data.data;
}

export async function getBadges(): Promise<BadgesResponse> {
  const { data } = await api.get<BadgesResponse>('/me/plan/badges');
  return data;
}
