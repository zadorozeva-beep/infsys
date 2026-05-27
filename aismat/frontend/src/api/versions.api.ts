import { api } from './axios';
import type { ApiSuccess } from '../types';

export interface MaterialVersion {
  id: number;
  materialId: number;
  version: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  changeNote: string | null;
  createdAt: string;
  uploader: { id: number; fullName: string };
}

export interface VersionsResponse {
  currentVersion: number;
  versions: MaterialVersion[];
}

export async function listVersions(materialId: number): Promise<VersionsResponse> {
  const { data } = await api.get<ApiSuccess<VersionsResponse>>(
    `/materials/${materialId}/versions`,
  );
  return data.data;
}

export async function uploadNewVersion(
  materialId: number,
  form: FormData,
): Promise<VersionsResponse> {
  const { data } = await api.post<ApiSuccess<VersionsResponse>>(
    `/materials/${materialId}/versions`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}
