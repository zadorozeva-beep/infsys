import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, BookCopy, Shield, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';

import { AnalyticsTab } from './AnalyticsTab';

import { extractErrorMessage } from '../api/axios';
import {
  createDiscipline,
  deleteDiscipline,
  deleteUser,
  listDisciplines,
  listUsers,
  updateUserRole,
} from '../api/materials.api';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

type Tab = 'analytics' | 'users' | 'disciplines';

export function AdminPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('analytics');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-gradient text-white shadow-mint-glow">
          <Shield size={22} strokeWidth={2.5} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-mint-900">Адміністрування</h1>
          <p className="text-sm text-mint-700/80">
            Керування користувачами, ролями та довідниками системи
          </p>
        </div>
      </div>

      <div className="inline-flex gap-1 self-start rounded-2xl bg-white/60 p-1 shadow-soft backdrop-blur ring-1 ring-mint-200 dark:bg-mint-900/60 dark:ring-mint-700">
        <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')}>
          <BarChart3 size={15} strokeWidth={2.5} /> Аналітика
        </TabButton>
        <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
          <UserCog size={15} strokeWidth={2.5} /> Користувачі
        </TabButton>
        <TabButton active={tab === 'disciplines'} onClick={() => setTab('disciplines')}>
          <BookCopy size={15} strokeWidth={2.5} /> Дисципліни
        </TabButton>
      </div>

      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'disciplines' && <DisciplinesTab />}
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
        active
          ? 'bg-mint-gradient text-white shadow-mint'
          : 'text-mint-800 hover:bg-mint-50 dark:text-mint-200 dark:hover:bg-mint-800/60'
      }`}
    >
      {children}
    </button>
  );
}

function roleBadgeClass(role: Role): string {
  switch (role) {
    case 'admin':
      return 'bg-rose-100 text-rose-700 ring-rose-200';
    case 'teacher':
      return 'bg-amber-100 text-amber-700 ring-amber-200';
    case 'student':
    default:
      return 'bg-mint-100 text-mint-700 ring-mint-200';
  }
}

function UsersTab(): JSX.Element {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-users'], queryFn: listUsers });

  const setRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => updateUserRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-3xl bg-gradient-to-br from-mint-100/60 to-mint-200/40" />;
  }
  if (isError) {
    return (
      <div className="card text-rose-600">Помилка завантаження користувачів</div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-mint-50/80 text-xs uppercase tracking-wider text-mint-700">
            <tr>
              <th className="px-4 py-3 text-left font-bold">ID</th>
              <th className="px-4 py-3 text-left font-bold">Логін</th>
              <th className="px-4 py-3 text-left font-bold">ПІБ</th>
              <th className="px-4 py-3 text-left font-bold">Email</th>
              <th className="px-4 py-3 text-left font-bold">Роль</th>
              <th className="px-4 py-3 text-right font-bold">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mint-100">
            {data?.map((u) => (
              <tr key={u.id} className="transition hover:bg-mint-50/50">
                <td className="px-4 py-3 font-mono text-xs text-mint-700">#{u.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-mint-gradient text-xs font-bold text-white">
                      {u.fullName.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-mono font-semibold text-mint-900">{u.login}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-800">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${roleBadgeClass(
                      u.role as Role,
                    )}`}
                  >
                    {u.role}
                  </span>
                  <select
                    value={u.role}
                    onChange={(e) =>
                      setRoleMut.mutate({ id: u.id, role: e.target.value as Role })
                    }
                    disabled={u.id === currentUser?.id}
                    className="rounded-xl border border-mint-200 bg-white/80 px-2 py-1 text-xs font-semibold text-mint-800 transition focus:border-mint-400 focus:outline-none focus:ring-2 focus:ring-mint-200"
                  >
                    <option value="admin">admin</option>
                    <option value="teacher">teacher</option>
                    <option value="student">student</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={u.id === currentUser?.id}
                    onClick={() => {
                      if (confirm(`Видалити користувача ${u.login}?`)) deleteMut.mutate(u.id);
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50 disabled:opacity-30"
                    title="Видалити"
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DisciplinesTab(): JSX.Element {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['disciplines'], queryFn: listDisciplines });

  const [form, setForm] = useState({ name: '', code: '', description: '', credits: '' });
  const [error, setError] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: createDiscipline,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disciplines'] });
      setForm({ name: '', code: '', description: '', credits: '' });
      setError(null);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: deleteDiscipline,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplines'] }),
  });

  const handleCreate = (e: React.FormEvent): void => {
    e.preventDefault();
    const credits = Number(form.credits);
    if (!form.name || !form.code || !Number.isFinite(credits) || credits <= 0) {
      setError('Заповніть назву, код та коректну кількість кредитів');
      return;
    }
    createMut.mutate({
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim() || undefined,
      credits,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="h-72 animate-pulse bg-gradient-to-br from-mint-100/60 to-mint-200/40" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-mint-50/80 text-xs uppercase tracking-wider text-mint-700">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Код</th>
                  <th className="px-4 py-3 text-left font-bold">Назва</th>
                  <th className="px-4 py-3 text-left font-bold">Кредити</th>
                  <th className="px-4 py-3 text-right font-bold">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mint-100">
                {data?.map((d) => (
                  <tr key={d.id} className="transition hover:bg-mint-50/50">
                    <td className="px-4 py-3 font-mono font-semibold text-mint-700">{d.code}</td>
                    <td className="px-4 py-3 text-slate-800">{d.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-mint-100 px-2.5 py-0.5 text-xs font-bold text-mint-700 ring-1 ring-inset ring-mint-200">
                        {String(d.credits)} ECTS
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm(`Видалити дисципліну ${d.code}?`)) deleteMut.mutate(d.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={15} strokeWidth={2.5} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={handleCreate} className="card-glow flex flex-col gap-3">
        <h3 className="font-display text-base font-bold text-mint-900">Додати дисципліну</h3>
        <div>
          <label className="label">Назва</label>
          <input
            className="input"
            placeholder="Бази даних"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Код</label>
          <input
            className="input"
            placeholder="DB-201"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Кредити (ECTS)</label>
          <input
            className="input"
            type="number"
            step="0.5"
            placeholder="6"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Опис (необов’язково)</label>
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="Короткий опис..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        <button type="submit" className="btn-primary mt-1" disabled={createMut.isPending}>
          {createMut.isPending ? 'Створення...' : 'Створити дисципліну'}
        </button>
      </form>
    </div>
  );
}
