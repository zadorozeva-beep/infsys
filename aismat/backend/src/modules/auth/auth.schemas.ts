import { z } from 'zod';

const loginRule = z
  .string()
  .min(3, 'Логін має містити мінімум 3 символи')
  .max(64)
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Логін може містити лише латинські літери, цифри, _ . -');

const passwordRule = z
  .string()
  .min(8, 'Пароль має містити мінімум 8 символів')
  .max(128, 'Пароль занадто довгий');

export const registerSchema = z.object({
  login: loginRule,
  password: passwordRule,
  fullName: z.string().min(3, 'ПІБ занадто короткий').max(255),
  email: z.string().email('Невалідний email').max(255),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,32}$/, 'Невалідний номер телефону')
    .optional(),
});

export const loginSchema = z.object({
  login: loginRule,
  password: z.string().min(1, 'Пароль обов’язковий'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
