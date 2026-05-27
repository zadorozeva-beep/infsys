import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['admin', 'teacher', 'student']),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
