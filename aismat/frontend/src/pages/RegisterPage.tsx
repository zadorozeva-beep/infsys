import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { registerRequest } from '../api/auth.api';
import { extractErrorMessage } from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const schema = z.object({
  login: z
    .string()
    .min(3, 'Мінімум 3 символи')
    .max(64)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Лише латинські літери, цифри, _ . -'),
  password: z.string().min(8, 'Мінімум 8 символів').max(128),
  fullName: z.string().min(3, 'Вкажіть ПІБ').max(255),
  email: z.string().email('Невалідний email'),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,32}$/, 'Невалідний номер')
    .optional()
    .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage(): JSX.Element {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData): Promise<void> => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...values, phone: values.phone || undefined };
      const result = await registerRequest(payload);
      signIn(result.token, result.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mint-radial px-4 py-12">
      <div className="blob -left-20 top-10 h-80 w-80 animate-float-slow bg-mint-300/50" />
      <div className="blob -bottom-20 -right-20 h-96 w-96 animate-float-slower bg-teal-200/50" />

      <div className="relative w-full max-w-lg">
        <div className="card-glow">
          <div className="mb-6 flex flex-col items-center gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-gradient text-white shadow-mint-glow">
              <UserPlus size={28} strokeWidth={2.5} />
            </span>
            <h1 className="text-center font-display text-2xl font-bold text-mint-900">
              Створіть акаунт
            </h1>
            <p className="text-center text-sm text-mint-700/80">
              Реєстрація доступна студентам. Викладачів і адмінів додає адміністратор.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="login">Логін</label>
                <input id="login" className="input" placeholder="ivan.petrenko" {...register('login')} />
                {errors.login && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.login.message}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="fullName">ПІБ</label>
              <input
                id="fullName"
                className="input"
                placeholder="Іваненко Іван Іванович"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.fullName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="email@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="phone">Телефон (опц.)</label>
                <input id="phone" className="input" placeholder="+380..." {...register('phone')} />
                {errors.phone && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary mt-2" disabled={submitting}>
              <UserPlus size={16} strokeWidth={2.5} />
              {submitting ? 'Створення акаунту...' : 'Зареєструватися'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-mint-800/80">
            Уже є акаунт?{' '}
            <Link
              to="/login"
              className="font-bold text-mint-700 underline-offset-4 hover:underline"
            >
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
