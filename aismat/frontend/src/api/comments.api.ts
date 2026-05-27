import { api } from './axios';
import type { ApiSuccess } from '../types';

export interface Comment {
  id: number;
  materialId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    fullName: string;
    role: string;
  };
}

export async function listComments(materialId: number): Promise<Comment[]> {
  const { data } = await api.get<ApiSuccess<Comment[]>>(`/materials/${materialId}/comments`);
  return data.data;
}

export async function createComment(materialId: number, content: string): Promise<Comment> {
  const { data } = await api.post<ApiSuccess<Comment>>(`/materials/${materialId}/comments`, {
    content,
  });
  return data.data;
}

export async function deleteComment(id: number): Promise<void> {
  await api.delete(`/comments/${id}`);
}
