import { z } from 'zod';

export const createDisciplineSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(1).max(32),
  description: z.string().max(2000).optional(),
  credits: z.coerce.number().positive().max(60),
});

export const updateDisciplineSchema = createDisciplineSchema.partial();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateDisciplineInput = z.infer<typeof createDisciplineSchema>;
export type UpdateDisciplineInput = z.infer<typeof updateDisciplineSchema>;
