import bcrypt from 'bcrypt';

import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';
import { signToken } from '../../utils/jwt.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

const STUDENT_ROLE_NAME = 'student';

export interface PublicUser {
  id: number;
  login: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
}

function toPublic(user: {
  id: number;
  login: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  role: { name: string };
}): PublicUser {
  return {
    id: user.id,
    login: user.login,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role.name,
    createdAt: user.createdAt,
  };
}

export async function registerStudent(input: RegisterInput): Promise<{
  token: string;
  user: PublicUser;
}> {
  const studentRole = await prisma.role.findUnique({ where: { name: STUDENT_ROLE_NAME } });
  if (!studentRole) {
    throw new NotFoundError('Роль "student" не знайдено. Запустіть seed.');
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ login: input.login }, { email: input.email }] },
    select: { login: true, email: true },
  });
  if (existing) {
    if (existing.login === input.login) throw new ConflictError('Логін уже зайнятий');
    throw new ConflictError('Email уже зайнятий');
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const created = await prisma.user.create({
    data: {
      login: input.login,
      passwordHash,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      roleId: studentRole.id,
    },
    include: { role: true },
  });

  const token = signToken({ userId: created.id, role: created.role.name });
  return { token, user: toPublic(created) };
}

export async function login(input: LoginInput): Promise<{ token: string; user: PublicUser }> {
  const user = await prisma.user.findUnique({
    where: { login: input.login },
    include: { role: true },
  });
  if (!user) {
    throw new UnauthorizedError('Невірний логін або пароль');
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Невірний логін або пароль');
  }
  const token = signToken({ userId: user.id, role: user.role.name });
  return { token, user: toPublic(user) };
}

export async function getMe(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user) throw new NotFoundError('Користувача не знайдено');
  return toPublic(user);
}
