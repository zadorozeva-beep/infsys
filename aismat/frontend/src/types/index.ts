export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  login: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role | string;
  createdAt: string;
}

export interface Discipline {
  id: number;
  name: string;
  code: string;
  description: string | null;
  credits: string | number;
}

export interface MaterialType {
  id: number;
  name: string;
  icon: string | null;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface MaterialTagJoin {
  tag: Tag;
}

export interface Material {
  id: number;
  title: string;
  description: string | null;
  fileUrl: string;
  authorId: number;
  disciplineId: number;
  materialTypeId: number;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: number; fullName: string };
  discipline: Discipline;
  materialType: MaterialType;
  tags: MaterialTagJoin[];
}

export interface Program {
  id: number;
  name: string;
  code: string;
  qualificationLevel: string;
  durationYears: string | number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: { count?: number; total?: number; limit?: number; offset?: number };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MaterialsListParams {
  q?: string;
  disciplineId?: number;
  typeId?: number;
  tags?: string;
  limit?: number;
  offset?: number;
}

export interface SavedMaterial {
  savedAt: string;
  material: Material;
}
