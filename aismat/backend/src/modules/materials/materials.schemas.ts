import { z } from 'zod';

const MAX_LIMIT = 100;

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listMaterialsQuerySchema = z.object({
  q: z.string().trim().min(1).max(255).optional(),
  disciplineId: z.coerce.number().int().positive().optional(),
  typeId: z.coerce.number().int().positive().optional(),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        : undefined,
    ),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createMaterialBodySchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  disciplineId: z.coerce.number().int().positive(),
  materialTypeId: z.coerce.number().int().positive(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (!v) return [];
      const arr = Array.isArray(v) ? v : v.split(',');
      return arr.map((s) => s.trim().toLowerCase()).filter(Boolean);
    }),
});

export const updateMaterialBodySchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(2000).optional(),
  disciplineId: z.coerce.number().int().positive().optional(),
  materialTypeId: z.coerce.number().int().positive().optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      const arr = Array.isArray(v) ? v : v.split(',');
      return arr.map((s) => s.trim().toLowerCase()).filter(Boolean);
    }),
});

export const createVersionBodySchema = z.object({
  title: z.string().min(2).max(255).optional(),
  description: z.string().max(2000).optional(),
  changeNote: z.string().trim().max(500).optional(),
});

export const versionParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  version: z.coerce.number().int().positive(),
});

export type ListMaterialsQuery = z.infer<typeof listMaterialsQuerySchema>;
export type CreateMaterialBody = z.infer<typeof createMaterialBodySchema>;
export type UpdateMaterialBody = z.infer<typeof updateMaterialBodySchema>;
export type CreateVersionBody = z.infer<typeof createVersionBodySchema>;
