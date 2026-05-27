import { api } from './axios';
import type {
  ApiSuccess,
  Discipline,
  Material,
  MaterialType,
  MaterialsListParams,
  Program,
  Tag,
  User,
} from '../types';

export interface MaterialsListResponse {
  data: Material[];
  meta: { total: number; count: number; limit: number; offset: number };
}

export async function listMaterials(params: MaterialsListParams): Promise<MaterialsListResponse> {
  const { data } = await api.get<MaterialsListResponse>('/materials', { params });
  return data;
}

export async function getMaterial(id: number): Promise<Material> {
  const { data } = await api.get<ApiSuccess<Material>>(`/materials/${id}`);
  return data.data;
}

export async function uploadMaterial(form: FormData): Promise<Material> {
  const { data } = await api.post<ApiSuccess<Material>>('/materials', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteMaterial(id: number): Promise<void> {
  await api.delete(`/materials/${id}`);
}

export async function listDisciplines(): Promise<Discipline[]> {
  const { data } = await api.get<ApiSuccess<Discipline[]>>('/disciplines');
  return data.data;
}

export async function listMaterialTypes(): Promise<MaterialType[]> {
  const { data } = await api.get<ApiSuccess<MaterialType[]>>('/material-types');
  return data.data;
}

export async function listTags(): Promise<Tag[]> {
  const { data } = await api.get<ApiSuccess<Tag[]>>('/tags');
  return data.data;
}

export async function listPrograms(): Promise<Program[]> {
  const { data } = await api.get<ApiSuccess<Program[]>>('/programs');
  return data.data;
}

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<ApiSuccess<User[]>>('/users');
  return data.data;
}

export async function updateUserRole(
  id: number,
  role: 'admin' | 'teacher' | 'student',
): Promise<User> {
  const { data } = await api.patch<ApiSuccess<User>>(`/users/${id}/role`, { role });
  return data.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function createDiscipline(input: {
  name: string;
  code: string;
  description?: string;
  credits: number;
}): Promise<Discipline> {
  const { data } = await api.post<ApiSuccess<Discipline>>('/disciplines', input);
  return data.data;
}

export async function deleteDiscipline(id: number): Promise<void> {
  await api.delete(`/disciplines/${id}`);
}
