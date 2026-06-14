import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Bookmark,
  Calendar,
  Download,
  FolderOpen,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  Phone,
  Save,
  Settings,
  Sparkles,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';

import { extractErrorMessage } from '../api/axios';
import {
  changePassword,
  getStats,
  listOwnMaterials,
  listSavedMaterials,
  updateProfile,
  type UserStats,
} from '../api/me.api';
import { CountUp } from '../components/CountUp';
import { MaterialCard } from '../components/MaterialCard';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../store/toast.store';

type Tab = 'overview' | 'saved' | 'own' | 'settings';

export function ProfilePage(): JSX.Element {
  const { user } = useAuth();
  const canUpload = user?.role === 'teacher' || user?.role === 'admin';
  const [tab, setTab] = useState<Tab>('overview');

  const statsQ = useQuery({
    queryKey: ['me-stats'],
    queryFn: getStats,
    enabled: !!user,
  });
  const savedQ = useQuery({
    queryKey: ['saved-materials'],
    queryFn: listSavedMaterials,
    enabled: !!user,
  });
  const ownQ = useQuery({
    queryKey: ['own-materials'],
    queryFn: listOwnMaterials,
    enabled: !!user && canUpload && (tab === 'own' || tab === 'overview'),
  });

  if (!user) return <div />;

  const roleLabel =
    user.role === 'admin'
      ? 'Адміністратор'
      : user.role === 'teacher'
        ? 'Викладач'
        : 'Студент';

  return (
    <div className="flex flex-col gap-8">
      <ProfileHero user={user} roleLabel={roleLabel} stats={statsQ.data} canUpload={canUpload} />

      <div className="inline-flex flex-wrap gap-1 self-start rounded-2xl bg-white/60 p-1 shadow-soft backdrop-blur ring-1 ring-mint-200 dark:bg-mint-900/60 dark:ring-mint-700">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          <LayoutDashboard size={15} strokeWidth={2.5} /> Огляд
        </TabButton>
        <TabButton active={tab === 'saved'} onClick={() => setTab('saved')}>
          <Bookmark size={15} strokeWidth={2.5} /> Збережені
          {savedQ.data && savedQ.data.length > 0 && (
            <span className="ml-1 rounded-full bg-white/30 px-1.5 text-[10px] font-bold">
              {savedQ.data.length}
            </span>
          )}
        </TabButton>
        {canUpload && (
          <TabButton active={tab === 'own'} onClick={() => setTab('own')}>
            <FolderOpen size={15} strokeWidth={2.5} /> Мої матеріали
            {ownQ.data && ownQ.data.length > 0 && (
              <span className="ml-1 rounded-full bg-white/30 px-1.5 text-[10px] font-bold">
                {ownQ.data.length}
              </span>
            )}
          </TabButton>
        )}
        <TabButton active={tab === 'settings'} onClick={() => setTab('settings')}>
          <Settings size={15} strokeWidth={2.5} /> Налаштування
        </TabButton>
      </div>

      {tab === 'overview' && <OverviewSection stats={statsQ.data} loading={statsQ.isLoading} canUpload={canUpload} />}
      {tab === 'saved' && (
        <SavedSection
          loading={savedQ.isLoading}
          error={savedQ.isError}
          items={savedQ.data ?? []}
        />
      )}
      {tab === 'own' && canUpload && (
        <OwnSection
          loading={ownQ.isLoading}
          error={ownQ.isError}
          items={ownQ.data ?? []}
        />
      )}
      {tab === 'settings' && <SettingsSection />}
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────

function ProfileHero({
  user,
  roleLabel,
  stats,
  canUpload,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>;
  roleLabel: string;
  stats: UserStats | undefined;
  canUpload: boolean;
}): JSX.Element {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-mint-gradient px-6 py-10 text-white shadow-mint-lg md:px-10">
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-4xl font-extrabold backdrop-blur-xl ring-4 ring-white/30">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur">
            {roleLabel}
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight md:text-4xl">
            {user.fullName}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
              <UserIcon size={13} strokeWidth={2.5} /> {user.login}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
              <Mail size={13} strokeWidth={2.5} /> {user.email}
            </span>
            {user.phone && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
                <Phone size={13} strokeWidth={2.5} /> {user.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
              <Calendar size={13} strokeWidth={2.5} /> з{' '}
              {new Date(user.createdAt).toLocaleDateString('uk-UA')}
            </span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 text-center md:w-auto md:grid-cols-1">
          <StatPill label="Збережено" value={stats?.savedCount ?? '—'} icon={<Bookmark size={14} strokeWidth={2.5} />} />
          {canUpload && (
            <StatPill label="Свої" value={stats?.ownCount ?? '—'} icon={<FolderOpen size={14} strokeWidth={2.5} />} />
          )}
        </div>
      </div>
    </section>
  );
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}): JSX.Element {
  return (
    <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur ring-1 ring-white/30">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-90">
        {icon} {label}
      </div>
      <div className="mt-0.5 font-display text-2xl font-extrabold">
        {typeof value === 'number' ? <CountUp value={value} /> : value}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-mint-gradient text-white shadow-mint' : 'text-mint-800 hover:bg-mint-50 dark:text-mint-200 dark:hover:bg-mint-800/60'
      }`}
    >
      {children}
    </button>
  );
}

// ── Огляд ────────────────────────────────────────────────────────────

function OverviewSection({
  stats,
  loading,
  canUpload,
}: {
  stats: UserStats | undefined;
  loading: boolean;
  canUpload: boolean;
}): JSX.Element {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-3xl bg-gradient-to-br from-mint-100/60 to-mint-200/40"
          />
        ))}
      </div>
    );
  }
  if (!stats) {
    return <div className="card text-rose-600">Не вдалося завантажити статистику</div>;
  }
  return (
    <div className="flex flex-col gap-6">
      {/* Картки статистики */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Bookmark size={18} strokeWidth={2.5} />}
          label="Збережено матеріалів"
          value={stats.savedCount}
          accent="from-mint-400 to-teal-500"
        />
        {canUpload && (
          <StatCard
            icon={<FolderOpen size={18} strokeWidth={2.5} />}
            label="Своїх матеріалів"
            value={stats.ownCount}
            accent="from-emerald-400 to-mint-500"
          />
        )}
        {canUpload && (
          <StatCard
            icon={<Download size={18} strokeWidth={2.5} />}
            label="Завантажень моїх матеріалів"
            value={stats.ownTotalDownloads}
            accent="from-cyan-400 to-mint-500"
          />
        )}
        <StatCard
          icon={<TrendingUp size={18} strokeWidth={2.5} />}
          label="Топ-дисципліна"
          value={stats.topSavedDiscipline?.name ?? '—'}
          subValue={
            stats.topSavedDiscipline
              ? `${stats.topSavedDiscipline.count} збережено`
              : 'нічого ще не збережено'
          }
          accent="from-teal-400 to-mint-600"
        />
      </div>

      {/* Останні збережені */}
      <div className="card flex flex-col gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-mint-900 dark:text-mint-100">
          <Activity size={16} strokeWidth={2.5} /> Останні збережені
        </h2>
        {stats.recentSaved.length === 0 ? (
          <p className="text-sm italic text-slate-500 dark:text-slate-400">Ви ще нічого не зберігали.</p>
        ) : (
          <ul className="divide-y divide-mint-100">
            {stats.recentSaved.map((row) => (
              <li
                key={row.material.id}
                className="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <Link
                  to={`/materials/${row.material.id}`}
                  className="line-clamp-1 flex-1 font-semibold text-mint-900 dark:text-mint-100 hover:text-mint-700"
                >
                  {row.material.title}
                </Link>
                <span className="text-xs text-mint-600 dark:text-mint-300">
                  {new Date(row.savedAt).toLocaleString('uk-UA', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Топ власні (тільки для teacher/admin) */}
      {canUpload && (
        <div className="card flex flex-col gap-3">
          <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-mint-900 dark:text-mint-100">
            <Sparkles size={16} strokeWidth={2.5} /> Найпопулярніші мої матеріали
          </h2>
          {stats.topOwnByDownloads.length === 0 ? (
            <p className="text-sm italic text-slate-500 dark:text-slate-400">Ви ще не завантажували матеріалів.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {stats.topOwnByDownloads.map((m, i) => {
                const max = stats.topOwnByDownloads[0]?.downloadCount || 1;
                const pct = Math.max(8, Math.round((m.downloadCount / max) * 100));
                return (
                  <li key={m.id} className="rounded-2xl bg-mint-50/60 p-3 ring-1 ring-mint-100">
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <Link
                        to={`/materials/${m.id}`}
                        className="line-clamp-1 flex-1 font-semibold text-mint-900 dark:text-mint-100 hover:text-mint-700"
                      >
                        <span className="mr-1 font-mono text-xs text-mint-500">#{i + 1}</span>
                        {m.title}
                      </Link>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-mint-700 dark:text-mint-300">
                        <Download size={12} strokeWidth={2.5} /> {m.downloadCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mint-100">
                        <div
                          className="h-full rounded-full bg-mint-gradient transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-mint-600 dark:text-mint-300">{m.discipline.name}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subValue?: string;
  accent: string;
}): JSX.Element {
  return (
    <div className="card-glow flex flex-col gap-2 !p-5">
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-mint`}
      >
        {icon}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-mint-600 dark:text-mint-300">{label}</div>
      <div className="line-clamp-1 font-display text-2xl font-extrabold text-mint-900 dark:text-mint-100">
        {typeof value === 'number' ? <CountUp value={value} /> : value}
      </div>
      {subValue && <div className="text-xs text-mint-600 dark:text-mint-300">{subValue}</div>}
    </div>
  );
}

// ── Налаштування ─────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(3, 'Мінімум 3 символи').max(255),
  email: z.string().email('Невалідний email').max(255),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,32}$/, 'Невалідний номер')
    .optional()
    .or(z.literal('')),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введіть поточний пароль'),
    newPassword: z.string().min(8, 'Мінімум 8 символів').max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

function SettingsSection(): JSX.Element {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const updateMut = useMutation({
    mutationFn: (values: ProfileForm) =>
      updateProfile({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone ? values.phone : null,
      }),
    onSuccess: (u) => {
      updateUser(u);
      qc.invalidateQueries({ queryKey: ['me-stats'] });
      toast.success('Профіль оновлено', 'Зміни збережено успішно');
    },
    onError: (err) => toast.error('Не вдалося оновити профіль', extractErrorMessage(err)),
  });

  const passwordMut = useMutation({
    mutationFn: (values: PasswordForm) =>
      changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Пароль змінено', 'Наступного разу входьте з новим паролем');
    },
    onError: (err) => toast.error('Не вдалося змінити пароль', extractErrorMessage(err)),
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        onSubmit={profileForm.handleSubmit((v) => updateMut.mutate(v))}
        className="card-glow flex flex-col gap-4"
        noValidate
      >
        <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-mint-900 dark:text-mint-100">
          <UserIcon size={16} strokeWidth={2.5} /> Особисті дані
        </h2>

        <div>
          <label className="label" htmlFor="set-fullName">ПІБ</label>
          <input
            id="set-fullName"
            className="input"
            {...profileForm.register('fullName')}
          />
          {profileForm.formState.errors.fullName && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {profileForm.formState.errors.fullName.message}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="set-email">Email</label>
          <input
            id="set-email"
            type="email"
            className="input"
            {...profileForm.register('email')}
          />
          {profileForm.formState.errors.email && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {profileForm.formState.errors.email.message}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="set-phone">Телефон</label>
          <input
            id="set-phone"
            className="input"
            placeholder="+380..."
            {...profileForm.register('phone')}
          />
          {profileForm.formState.errors.phone && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {profileForm.formState.errors.phone.message}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary self-start" disabled={updateMut.isPending}>
          <Save size={16} strokeWidth={2.5} />
          {updateMut.isPending ? 'Збереження...' : 'Зберегти зміни'}
        </button>
      </form>

      <form
        onSubmit={passwordForm.handleSubmit((v) => passwordMut.mutate(v))}
        className="card-glow flex flex-col gap-4"
        noValidate
      >
        <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-mint-900 dark:text-mint-100">
          <KeyRound size={16} strokeWidth={2.5} /> Зміна паролю
        </h2>

        <div>
          <label className="label" htmlFor="cur-pass">Поточний пароль</label>
          <input
            id="cur-pass"
            type="password"
            className="input"
            autoComplete="current-password"
            {...passwordForm.register('currentPassword')}
          />
          {passwordForm.formState.errors.currentPassword && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {passwordForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="new-pass">Новий пароль</label>
          <input
            id="new-pass"
            type="password"
            className="input"
            autoComplete="new-password"
            {...passwordForm.register('newPassword')}
          />
          {passwordForm.formState.errors.newPassword && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {passwordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="confirm-pass">Підтвердьте новий пароль</label>
          <input
            id="confirm-pass"
            type="password"
            className="input"
            autoComplete="new-password"
            {...passwordForm.register('confirmPassword')}
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary self-start" disabled={passwordMut.isPending}>
          <KeyRound size={16} strokeWidth={2.5} />
          {passwordMut.isPending ? 'Зміна...' : 'Змінити пароль'}
        </button>
      </form>
    </div>
  );
}

// ── Збережені / Власні ───────────────────────────────────────────────

function SavedSection({
  loading,
  error,
  items,
}: {
  loading: boolean;
  error: boolean;
  items: { savedAt: string; material: import('../types').Material }[];
}): JSX.Element {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-3xl bg-gradient-to-br from-mint-100/60 to-mint-200/40"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-700">
        Помилка завантаження збережених матеріалів.
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
          <Inbox size={32} strokeWidth={2} />
        </span>
        <h3 className="font-display text-lg font-bold text-mint-900 dark:text-mint-100">
          У вас ще немає збережених матеріалів
        </h3>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
          Тицяйте на іконку{' '}
          <Bookmark size={14} strokeWidth={2.5} className="mb-0.5 inline-block" /> у карток
          матеріалів, щоб додати їх сюди.
        </p>
        <Link to="/" className="btn-primary mt-2">
          Перейти до каталогу
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ material }) => (
        <MaterialCard key={material.id} material={material} />
      ))}
    </div>
  );
}

function OwnSection({
  loading,
  error,
  items,
}: {
  loading: boolean;
  error: boolean;
  items: import('../types').Material[];
}): JSX.Element {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-52 animate-pulse rounded-3xl bg-gradient-to-br from-mint-100/60 to-mint-200/40"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm font-medium text-rose-700">
        Помилка завантаження ваших матеріалів.
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
          <FolderOpen size={32} strokeWidth={2} />
        </span>
        <h3 className="font-display text-lg font-bold text-mint-900 dark:text-mint-100">
          Ви ще не завантажували матеріалів
        </h3>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
          Завантажте першу лекцію, методичку або презентацію — вона з'явиться тут.
        </p>
        <Link to="/upload" className="btn-primary mt-2">
          Завантажити матеріал
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((m) => (
        <MaterialCard key={m.id} material={m} />
      ))}
    </div>
  );
}
