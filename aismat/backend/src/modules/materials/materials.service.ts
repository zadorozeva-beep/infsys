import fs from 'node:fs/promises';
import path from 'node:path';

import { Prisma } from '@prisma/client';

import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';
import type {
  CreateMaterialBody,
  CreateVersionBody,
  ListMaterialsQuery,
  UpdateMaterialBody,
} from './materials.schemas.js';

const materialInclude = {
  author: { select: { id: true, fullName: true } },
  discipline: true,
  materialType: true,
  tags: { include: { tag: true } },
} as const;

// Серіалізує BigInt fileSize у звичайне число для JSON-відповіді.
function serializeMaterial<T extends { fileSize: bigint }>(
  m: T,
): Omit<T, 'fileSize'> & { fileSize: number } {
  return { ...m, fileSize: Number(m.fileSize) };
}

export async function listMaterials(query: ListMaterialsQuery) {
  const { q, disciplineId, typeId, tags, limit, offset } = query;

  if (q) {
    // FTS-пошук із ранжуванням через ts_rank. Параметризовано через $queryRaw.
    type RankedRow = {
      id: number;
      rank: number;
    };

    const tagsFilter =
      tags && tags.length > 0
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM material_tags mt
            JOIN tags t ON t.id = mt.tag_id
            WHERE mt.material_id = m.id AND t.slug = ANY(${tags})
          )`
        : Prisma.empty;

    const disciplineFilter = disciplineId
      ? Prisma.sql`AND m.discipline_id = ${disciplineId}`
      : Prisma.empty;
    const typeFilter = typeId ? Prisma.sql`AND m.material_type_id = ${typeId}` : Prisma.empty;

    // Like-шаблон для часткового збігу (case-insensitive, без діакритики).
    const qLike = `%${q.toLowerCase()}%`;

    // Об'єднана умова збігу:
    //   1) FTS на title/description (повні лексеми)            → найвищий ранг
    //   2) ILIKE-substring у title (часткові збіги: "інкапсул") → boost 0.6
    //   3) ILIKE-substring у description                         → boost 0.4
    //   4) збіг по назві/slug тегу                               → boost 0.3
    // GREATEST обирає максимальний серед матчів.
    const ranked = await prisma.$queryRaw<RankedRow[]>`
      SELECT m.id,
             GREATEST(
               ts_rank(m.search_vector, plainto_tsquery('simple', unaccent(${q}))) * 2,
               CASE WHEN lower(unaccent(m.title)) LIKE ${qLike} THEN 0.6 ELSE 0 END,
               CASE WHEN lower(unaccent(COALESCE(m.description, ''))) LIKE ${qLike} THEN 0.4 ELSE 0 END,
               CASE WHEN EXISTS (
                 SELECT 1 FROM material_tags mt2
                 JOIN tags t2 ON t2.id = mt2.tag_id
                 WHERE mt2.material_id = m.id
                   AND (lower(unaccent(t2.name)) LIKE ${qLike} OR lower(t2.slug) LIKE ${qLike})
               ) THEN 0.3 ELSE 0 END
             ) AS rank
      FROM materials m
      WHERE m.deleted_at IS NULL
        AND (
          m.search_vector @@ plainto_tsquery('simple', unaccent(${q}))
          OR lower(unaccent(m.title)) LIKE ${qLike}
          OR lower(unaccent(COALESCE(m.description, ''))) LIKE ${qLike}
          OR EXISTS (
            SELECT 1 FROM material_tags mt
            JOIN tags t ON t.id = mt.tag_id
            WHERE mt.material_id = m.id
              AND (lower(unaccent(t.name)) LIKE ${qLike} OR lower(t.slug) LIKE ${qLike})
          )
        )
        ${disciplineFilter}
        ${typeFilter}
        ${tagsFilter}
      ORDER BY rank DESC, m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalRow = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM materials m
      WHERE m.deleted_at IS NULL
        AND (
          m.search_vector @@ plainto_tsquery('simple', unaccent(${q}))
          OR lower(unaccent(m.title)) LIKE ${qLike}
          OR lower(unaccent(COALESCE(m.description, ''))) LIKE ${qLike}
          OR EXISTS (
            SELECT 1 FROM material_tags mt
            JOIN tags t ON t.id = mt.tag_id
            WHERE mt.material_id = m.id
              AND (lower(unaccent(t.name)) LIKE ${qLike} OR lower(t.slug) LIKE ${qLike})
          )
        )
        ${disciplineFilter}
        ${typeFilter}
        ${tagsFilter}
    `;

    const total = totalRow[0] ? Number(totalRow[0].count) : 0;
    if (ranked.length === 0) {
      return { data: [], meta: { total, count: 0, limit, offset } };
    }

    const ids = ranked.map((r) => r.id);
    const materials = await prisma.material.findMany({
      where: { id: { in: ids } },
      include: materialInclude,
    });
    // Зберігаємо порядок ts_rank.
    const sorted = ids
      .map((id) => materials.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));

    return {
      data: sorted.map(serializeMaterial),
      meta: { total, count: sorted.length, limit, offset },
    };
  }

  // Без q — звичайна вибірка з фільтрами.
  const where: Prisma.MaterialWhereInput = {
    deletedAt: null,
    ...(disciplineId && { disciplineId }),
    ...(typeId && { materialTypeId: typeId }),
    ...(tags && tags.length > 0 && { tags: { some: { tag: { slug: { in: tags } } } } }),
  };

  const [materials, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: materialInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.material.count({ where }),
  ]);

  return {
    data: materials.map(serializeMaterial),
    meta: { total, count: materials.length, limit, offset },
  };
}

export async function getMaterial(id: number) {
  const material = await prisma.material.findFirst({
    where: { id, deletedAt: null },
    include: materialInclude,
  });
  if (!material) throw new NotFoundError('Матеріал не знайдено');
  return serializeMaterial(material);
}

async function ensureTagsBySlug(slugs: string[]): Promise<number[]> {
  if (slugs.length === 0) return [];
  const existing = await prisma.tag.findMany({ where: { slug: { in: slugs } } });
  const existingSlugs = new Set(existing.map((t) => t.slug));
  const missing = slugs.filter((s) => !existingSlugs.has(s));
  if (missing.length > 0) {
    await prisma.tag.createMany({
      data: missing.map((slug) => ({ name: slug, slug })),
      skipDuplicates: true,
    });
  }
  const all = await prisma.tag.findMany({ where: { slug: { in: slugs } } });
  return all.map((t) => t.id);
}

export interface UploadedFileInfo {
  filename: string;
  mimetype: string;
  size: number;
}

export async function createMaterial(
  authorId: number,
  body: CreateMaterialBody,
  file: UploadedFileInfo,
) {
  if (!file.filename || !file.mimetype) {
    throw new ValidationError('Файл матеріалу обов’язковий');
  }

  const tagIds = await ensureTagsBySlug(body.tags);

  const material = await prisma.material.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      authorId,
      disciplineId: body.disciplineId,
      materialTypeId: body.materialTypeId,
      fileUrl: `/uploads/${file.filename}`,
      fileSize: BigInt(file.size),
      mimeType: file.mimetype,
      tags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
    include: materialInclude,
  });

  return serializeMaterial(material);
}

export async function updateMaterial(
  id: number,
  currentUserId: number,
  currentRole: string,
  body: UpdateMaterialBody,
) {
  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Матеріал не знайдено');
  if (currentRole !== 'admin' && existing.authorId !== currentUserId) {
    throw new ForbiddenError('Редагувати може лише автор або адмін');
  }

  const data: Prisma.MaterialUpdateInput = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.disciplineId !== undefined) data.discipline = { connect: { id: body.disciplineId } };
  if (body.materialTypeId !== undefined)
    data.materialType = { connect: { id: body.materialTypeId } };

  if (body.tags !== undefined) {
    const tagIds = await ensureTagsBySlug(body.tags);
    await prisma.materialTag.deleteMany({ where: { materialId: id } });
    if (tagIds.length > 0) {
      await prisma.materialTag.createMany({
        data: tagIds.map((tagId) => ({ materialId: id, tagId })),
      });
    }
  }

  const updated = await prisma.material.update({
    where: { id },
    data,
    include: materialInclude,
  });
  return serializeMaterial(updated);
}

export async function deleteMaterial(
  id: number,
  currentUserId: number,
  currentRole: string,
): Promise<void> {
  const existing = await prisma.material.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError('Матеріал не знайдено');
  if (currentRole !== 'admin' && existing.authorId !== currentUserId) {
    throw new ForbiddenError('Видаляти може лише автор або адмін');
  }

  // Soft delete: позначаємо deleted_at, файли НЕ видаляємо (можуть бути в історії версій).
  await prisma.material.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export interface FileForStream {
  absolutePath: string;
  mimeType: string;
  fileName: string;
}

export async function getMaterialFileForStream(id: number): Promise<FileForStream> {
  const material = await prisma.material.findFirst({ where: { id, deletedAt: null } });
  if (!material) throw new NotFoundError('Матеріал не знайдено');
  return resolveFileForStream(material.fileUrl, material.mimeType, () => {
    prisma.material
      .update({ where: { id }, data: { downloadCount: { increment: 1 } } })
      .catch((err) => logger.warn(`downloadCount increment failed: ${(err as Error).message}`));
  });
}

function resolveFileForStream(
  fileUrl: string,
  mimeType: string,
  onResolved?: () => void,
): Promise<FileForStream> {
  return (async () => {
    if (!fileUrl.startsWith('/uploads/')) {
      throw new NotFoundError('Файл недоступний');
    }
    const filename = path.basename(fileUrl);
    const uploadRoot = path.resolve(env.UPLOAD_DIR);
    const filePath = path.resolve(uploadRoot, filename);

    if (!filePath.startsWith(uploadRoot + path.sep) && filePath !== uploadRoot) {
      throw new NotFoundError('Файл недоступний');
    }
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundError('Файл не існує на диску');
    }
    if (onResolved) onResolved();
    return { absolutePath: filePath, mimeType, fileName: filename };
  })();
}

// ─── Версіонування ──────────────────────────────────────────────────

const versionInclude = {
  uploader: { select: { id: true, fullName: true } },
} as const;

function serializeVersion(v: {
  id: number;
  materialId: number;
  version: number;
  title: string;
  description: string | null;
  fileUrl: string;
  fileSize: bigint;
  mimeType: string;
  uploadedBy: number;
  changeNote: string | null;
  createdAt: Date;
  uploader: { id: number; fullName: string };
}) {
  return {
    id: v.id,
    materialId: v.materialId,
    version: v.version,
    title: v.title,
    description: v.description,
    fileUrl: v.fileUrl,
    fileSize: Number(v.fileSize),
    mimeType: v.mimeType,
    changeNote: v.changeNote,
    createdAt: v.createdAt.toISOString(),
    uploader: v.uploader,
  };
}

export async function listMaterialVersions(materialId: number) {
  const material = await prisma.material.findFirst({
    where: { id: materialId, deletedAt: null },
    select: { id: true, currentVersion: true },
  });
  if (!material) throw new NotFoundError('Матеріал не знайдено');

  const versions = await prisma.materialVersion.findMany({
    where: { materialId },
    include: versionInclude,
    orderBy: { version: 'desc' },
  });
  return {
    currentVersion: material.currentVersion,
    versions: versions.map(serializeVersion),
  };
}

/**
 * Створює нову версію матеріалу.
 * - Поточний стан materials уже збережено у material_versions під попереднім номером
 *   (попередній snapshot було зроблено при попередньому upload або через backfill v1).
 * - Оновлюємо materials актуальними даними та інкрементуємо current_version.
 * - Старі файли не видаляємо — на них посилаються рядки material_versions.
 */
export async function createMaterialVersion(
  materialId: number,
  currentUserId: number,
  currentRole: string,
  body: CreateVersionBody,
  file: UploadedFileInfo,
) {
  const material = await prisma.material.findFirst({
    where: { id: materialId, deletedAt: null },
  });
  if (!material) throw new NotFoundError('Матеріал не знайдено');
  if (currentRole !== 'admin' && material.authorId !== currentUserId) {
    throw new ForbiddenError('Завантажувати нові версії може лише автор або адмін');
  }

  const newVersionNumber = material.currentVersion + 1;
  const newTitle = body.title?.trim() || material.title;
  const newDescription =
    body.description !== undefined ? body.description : material.description;
  const newFileUrl = `/uploads/${file.filename}`;

  // Транзакція: записуємо snapshot нової версії і оновлюємо matters.
  await prisma.$transaction([
    prisma.materialVersion.create({
      data: {
        materialId,
        version: newVersionNumber,
        title: newTitle,
        description: newDescription,
        fileUrl: newFileUrl,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        uploadedBy: currentUserId,
        changeNote: body.changeNote ?? null,
      },
    }),
    prisma.material.update({
      where: { id: materialId },
      data: {
        title: newTitle,
        description: newDescription,
        fileUrl: newFileUrl,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        currentVersion: newVersionNumber,
      },
    }),
  ]);

  return listMaterialVersions(materialId);
}

export async function getVersionFileForStream(
  materialId: number,
  version: number,
): Promise<FileForStream> {
  const v = await prisma.materialVersion.findUnique({
    where: { materialId_version: { materialId, version } },
  });
  if (!v) throw new NotFoundError('Версію не знайдено');
  return resolveFileForStream(v.fileUrl, v.mimeType);
}
