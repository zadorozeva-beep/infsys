import { prisma } from '../../db/prisma.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';

const commentInclude = {
  author: { select: { id: true, fullName: true, role: { select: { name: true } } } },
} as const;

function serializeComment(c: {
  id: number;
  materialId: number;
  authorId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: number; fullName: string; role: { name: string } };
}) {
  return {
    id: c.id,
    materialId: c.materialId,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    author: {
      id: c.author.id,
      fullName: c.author.fullName,
      role: c.author.role.name,
    },
  };
}

export type PublicComment = ReturnType<typeof serializeComment>;

export async function listComments(materialId: number): Promise<PublicComment[]> {
  const rows = await prisma.comment.findMany({
    where: { materialId },
    include: commentInclude,
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(serializeComment);
}

export async function createComment(
  materialId: number,
  authorId: number,
  content: string,
): Promise<PublicComment> {
  const material = await prisma.material.findUnique({ where: { id: materialId } });
  if (!material) throw new NotFoundError('Матеріал не знайдено');

  const created = await prisma.comment.create({
    data: { materialId, authorId, content },
    include: commentInclude,
  });
  return serializeComment(created);
}

export async function deleteComment(
  id: number,
  currentUserId: number,
  currentRole: string,
): Promise<{ materialId: number }> {
  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Коментар не знайдено');
  if (currentRole !== 'admin' && existing.authorId !== currentUserId) {
    throw new ForbiddenError('Видаляти може лише автор або адмін');
  }
  await prisma.comment.delete({ where: { id } });
  return { materialId: existing.materialId };
}
