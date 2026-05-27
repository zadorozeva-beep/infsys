import bcrypt from 'bcrypt';

import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../utils/errors.js';

const materialInclude = {
  author: { select: { id: true, fullName: true } },
  discipline: true,
  materialType: true,
  tags: { include: { tag: true } },
} as const;

const publicUserInclude = { role: true } as const;

function serializeMaterial<T extends { fileSize: bigint }>(
  m: T,
): Omit<T, 'fileSize'> & { fileSize: number } {
  return { ...m, fileSize: Number(m.fileSize) };
}

function toPublicUser(user: {
  id: number;
  login: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  role: { name: string };
}) {
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

// ─── Збережені ──────────────────────────────────────────────────────

export async function listSavedMaterials(userId: number) {
  const rows = await prisma.savedMaterial.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
    include: { material: { include: materialInclude } },
  });
  return rows.map((r) => ({
    savedAt: r.savedAt,
    material: serializeMaterial(r.material),
  }));
}

export async function listSavedIds(userId: number): Promise<number[]> {
  const rows = await prisma.savedMaterial.findMany({
    where: { userId },
    select: { materialId: true },
  });
  return rows.map((r) => r.materialId);
}

export async function saveMaterial(userId: number, materialId: number): Promise<void> {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) throw new NotFoundError('Матеріал не знайдено');
  await prisma.savedMaterial.upsert({
    where: { userId_materialId: { userId, materialId } },
    create: { userId, materialId },
    update: {},
  });
}

export async function unsaveMaterial(userId: number, materialId: number): Promise<void> {
  await prisma.savedMaterial.deleteMany({ where: { userId, materialId } });
}

// ─── Свої матеріали ──────────────────────────────────────────────────

export async function listOwnMaterials(authorId: number) {
  const materials = await prisma.material.findMany({
    where: { authorId, deletedAt: null },
    include: materialInclude,
    orderBy: { createdAt: 'desc' },
  });
  return materials.map(serializeMaterial);
}

// ─── Профіль ─────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string | null;
}

export async function updateProfile(userId: number, input: UpdateProfileInput) {
  if (input.email !== undefined) {
    const taken = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) throw new ConflictError('Email уже зайнятий');
  }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
    },
    include: publicUserInclude,
  });
  return toPublicUser(updated);
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Користувача не знайдено');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new UnauthorizedError('Поточний пароль невірний');
  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

// ─── Статистика ──────────────────────────────────────────────────────

export interface UserStats {
  savedCount: number;
  ownCount: number;
  ownTotalDownloads: number;
  topSavedDiscipline: { id: number; name: string; count: number } | null;
  recentSaved: Array<{ savedAt: Date; material: { id: number; title: string } }>;
  topOwnByDownloads: Array<{
    id: number;
    title: string;
    downloadCount: number;
    discipline: { name: string };
  }>;
}

export async function getStats(userId: number): Promise<UserStats> {
  const [savedCount, ownAgg, ownCount, topDiscRows, recentSavedRows, topOwn] =
    await Promise.all([
      prisma.savedMaterial.count({ where: { userId } }),
      prisma.material.aggregate({
        where: { authorId: userId, deletedAt: null },
        _sum: { downloadCount: true },
      }),
      prisma.material.count({ where: { authorId: userId, deletedAt: null } }),
      prisma.$queryRaw<Array<{ id: number; name: string; count: bigint }>>`
        SELECT d.id, d.name, COUNT(*)::bigint AS count
        FROM saved_materials sm
        JOIN materials m ON m.id = sm.material_id
        JOIN disciplines d ON d.id = m.discipline_id
        WHERE sm.user_id = ${userId}
        GROUP BY d.id, d.name
        ORDER BY count DESC
        LIMIT 1
      `,
      prisma.savedMaterial.findMany({
        where: { userId },
        orderBy: { savedAt: 'desc' },
        take: 5,
        select: {
          savedAt: true,
          material: { select: { id: true, title: true } },
        },
      }),
      prisma.material.findMany({
        where: { authorId: userId, deletedAt: null },
        orderBy: { downloadCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          downloadCount: true,
          discipline: { select: { name: true } },
        },
      }),
    ]);

  const topRow = topDiscRows[0];
  const topSavedDiscipline = topRow
    ? { id: topRow.id, name: topRow.name, count: Number(topRow.count) }
    : null;

  return {
    savedCount,
    ownCount,
    ownTotalDownloads: ownAgg._sum.downloadCount ?? 0,
    topSavedDiscipline,
    recentSaved: recentSavedRows,
    topOwnByDownloads: topOwn,
  };
}
