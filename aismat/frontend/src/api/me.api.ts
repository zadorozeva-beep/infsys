import { api } from './axios';
import type { ApiSuccess, Material, SavedMaterial, User } from '../types';

export async function listSavedMaterials(): Promise<SavedMaterial[]> {
  const { data } = await api.get<ApiSuccess<SavedMaterial[]>>('/me/saved');
  return data.data;
}

export async function listSavedIds(): Promise<number[]> {
  const { data } = await api.get<ApiSuccess<number[]>>('/me/saved/ids');
  return data.data;
}

export async function saveMaterial(materialId: number): Promise<void> {
  await api.post('/me/saved', { materialId });
}

export async function unsaveMaterial(materialId: number): Promise<void> {
  await api.delete(`/me/saved/${materialId}`);
}

export async function listOwnMaterials(): Promise<Material[]> {
  const { data } = await api.get<ApiSuccess<Material[]>>('/me/materials');
  return data.data;
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string | null;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const { data } = await api.patch<ApiSuccess<User>>('/me', input);
  return data.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.patch('/me/password', { currentPassword, newPassword });
}

export interface UserStats {
  savedCount: number;
  ownCount: number;
  ownTotalDownloads: number;
  topSavedDiscipline: { id: number; name: string; count: number } | null;
  recentSaved: Array<{ savedAt: string; material: { id: number; title: string } }>;
  topOwnByDownloads: Array<{
    id: number;
    title: string;
    downloadCount: number;
    discipline: { name: string };
  }>;
}

export async function getStats(): Promise<UserStats> {
  const { data } = await api.get<ApiSuccess<UserStats>>('/me/stats');
  return data.data;
}
