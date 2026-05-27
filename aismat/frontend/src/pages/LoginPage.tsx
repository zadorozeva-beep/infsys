import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, LogIn, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { loginRequest } from '../api/auth.api';
import { extractErrorMessage } from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../store/toast.store';

const schema = z.object({
  login: z.string().min(3, 'Мінімум 3 символи'),
  password: z.string().min(1, 'Введіть пароль'),
});

type FormData = z.infer<typeof schema>;

interface LocationState {
  from?: string;
}

export function LoginPage(): JSX.Element {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
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
      const result = await loginRequest(values);
      signIn(result.token, result.user);
      toast.success(`Вітаємо, ${result.user.fullName}!`, 'Ви успішно увійшли в систему');
      const from = (location.state as LocationState | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      toast.error('Помилка входу', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-mint-radial px-4 py-12">
      {/* Декоративні плями */}
      <div className="blob -left-32 top-10 h-96 w-96 animate-float-slow bg-mint-300/50" />
      <div className="blob -bottom-20 -right-20 h-[28rem] w-[28rem] animate-float-slower bg-teal-200/60" />
      <div className="blob left-1/3 top-1/2 h-72 w-72 animate-float-slow bg-cyan-200/40" />

      <div className="relative grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Ліва частина — брендинг */}
        <div className="hidden flex-col gap-6 text-mint-900 lg:flex">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-mint-700 shadow-soft backdrop-blur">
            <Sparkles size={14} /> Освітня платформа
          </div>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] text-balance">
            <span className="bg-gradient-to-br from-mint-600 via-mint-500 to-teal-400 bg-clip-text text-transparent">
              АІС навчальних
            </span>
            <br />
            матеріалів
          </h1>
          <p className="max-w-md text-base text-mint-800/80">
            Зберігайте, шукайте та діліться лекціями, методичками, презентаціями і тестами. Швидкий пошук українською мовою з ранжуванням і фільтрами.
          </p>
          <div className="flex flex-wrap gap-3">
            {['📚 Лекції', '🧪 Лабораторні', '📊 Презентації', '✅ Тести'].map((f) => (
              <span
                key={f}
                className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-medium text-mint-800 ring-1 ring-white/80 backdrop-blur"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Права частина — форма */}
        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="card-glow">
            <div className="mb-6 flex flex-col items-center gap-3">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-gradient text-white shadow-mint-glow">
                <BookOpen size={28} strokeWidth={2.5} />
              </span>
              <h1 className="text-center font-display text-2xl font-bold text-mint-900">
                Вітаємо знову!
              </h1>
              <p className="text-center text-sm text-mint-700/80">
                Увійдіть, щоб продовжити роботу
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div>
                <label className="label" htmlFor="login">
                  Логін
                </label>
                <input
                  id="login"
                  className="input"
                  autoComplete="username"
                  placeholder="admin"
                  {...register('login')}
                />
                {errors.login && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.login.message}</p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm font-medium text-rose-700 backdrop-blur">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary mt-2" disabled={submitting}>
                <LogIn size={16} strokeWidth={2.5} />
                {submitting ? 'Вхід...' : 'Увійти'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-mint-800/80">
              Немає акаунту?{' '}
              <Link
                to="/register"
                className="font-bold text-mint-700 underline-offset-4 hover:underline"
              >
                Зареєструватися
              </Link>
            </p>
          </div>

          {/* Тестові акаунти */}
          <div className="mt-4 rounded-3xl border border-white/60 bg-white/60 p-4 text-xs text-mint-900 backdrop-blur-xl">
            <p className="mb-2 inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-mint-700">
              <Sparkles size={12} /> Тестові акаунти
            </p>
            <ul className="grid grid-cols-1 gap-1.5 font-mono text-[11px] sm:grid-cols-3">
              <li className="rounded-xl bg-mint-50 px-2 py-1.5 ring-1 ring-mint-200">
                admin / Admin123!
              </li>
              <li className="rounded-xl bg-mint-50 px-2 py-1.5 ring-1 ring-mint-200">
                troschiy / Teacher123!
              </li>
              <li className="rounded-xl bg-mint-50 px-2 py-1.5 ring-1 ring-mint-200">
                student1 / Student123!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
