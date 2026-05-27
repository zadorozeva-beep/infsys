import { prisma } from '../../db/prisma.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';

const userSelect = {
  id: true,
  login: true,
  fullName: true,
  email: true,
  phone: true,
  createdAt: true,
  role: { select: { name: true } },
} as const;

type DbUserShape = {
  id: number;
  login: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  role: { name: string };
};

export interface PublicUser {
  id: number;
  login: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  role: string;
}

// Серіалізуємо роль як string, узгоджено з /api/auth/me та /api/me.
function toPublic(u: DbUserShape): PublicUser {
  return {
    id: u.id,
    login: u.login,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    createdAt: u.createdAt,
    role: u.role.name,
  };
}

export async function listUsers(): Promise<PublicUser[]> {
  const rows = await prisma.user.findMany({ select: userSelect, orderBy: { id: 'asc' } });
  return rows.map(toPublic);
}

export async function updateRole(
  id: number,
  roleName: 'admin' | 'teacher' | 'student',
): Promise<PublicUser> {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new NotFoundError('Роль не знайдено');
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw new NotFoundError('Користувача не знайдено');
  const updated = await prisma.user.update({
    where: { id },
    data: { roleId: role.id },
    select: userSelect,
  });
  return toPublic(updated);
}

export async function deleteUser(id: number, currentUserId: number): Promise<void> {
  if (id === currentUserId) {
    throw new ForbiddenError('Неможливо видалити власний акаунт');
  }
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw new NotFoundError('Користувача не знайдено');
  await prisma.user.delete({ where: { id } });
}
