import { BookOpen, ListTodo, LogIn, LogOut, Shield, Sparkles, Upload } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { NotificationBell } from './NotificationBell';
import { ThemePicker } from './ThemePicker';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';

export function Navbar(): JSX.Element {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    signOut();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    `relative px-4 py-2 text-sm font-semibold rounded-2xl transition-all duration-200 ${
      isActive
        ? 'bg-mint-gradient text-white shadow-mint'
        : 'text-mint-800 hover:bg-white/70 hover:text-mint-900 dark:text-mint-200 dark:hover:bg-mint-800/60 dark:hover:text-white'
    }`;

  const roleLabel = (role?: string): string => {
    switch (role) {
      case 'admin':
        return 'Адміністратор';
      case 'teacher':
        return 'Викладач';
      case 'student':
        return 'Студент';
      default:
        return '';
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/60 backdrop-blur-xl dark:border-mint-800/50 dark:bg-mint-950/50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          to="/"
          className="group flex items-center gap-3 text-lg font-bold text-mint-900 dark:text-mint-100"
        >
          <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-gradient text-white shadow-mint transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <BookOpen size={20} strokeWidth={2.5} />
            <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-mint-600 shadow">
              <Sparkles size={10} />
            </span>
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="bg-gradient-to-r from-mint-700 to-mint-500 bg-clip-text text-transparent dark:from-mint-300 dark:to-mint-100">
              АІС
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-mint-600/80 dark:text-mint-300/80">
              навчальні матеріали
            </span>
          </span>
          <span className="text-xl font-extrabold text-mint-700 dark:text-mint-200 sm:hidden">АІС</span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <NavLink to="/" end className={linkClass}>
            Матеріали
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/plan" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <ListTodo size={15} strokeWidth={2.5} /> Мій план
              </span>
            </NavLink>
          )}
          {isAuthenticated && (user?.role === 'teacher' || user?.role === 'admin') && (
            <NavLink to="/upload" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Upload size={15} strokeWidth={2.5} /> Завантажити
              </span>
            </NavLink>
          )}
          {isAuthenticated && user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <Shield size={15} strokeWidth={2.5} /> Адмін
              </span>
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
            }}
            title="Командна палітра (Ctrl+K)"
            className="hidden items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold text-mint-700 ring-1 ring-mint-200 backdrop-blur transition hover:bg-mint-50 hover:text-mint-900 dark:bg-mint-900/60 dark:text-mint-200 dark:ring-mint-700 dark:hover:bg-mint-800/70 md:inline-flex"
          >
            <span>Пошук</span>
            <kbd className="rounded border border-mint-200 bg-white/80 px-1 py-0.5 font-mono text-[10px] text-mint-600 dark:border-mint-700 dark:bg-mint-950/60 dark:text-mint-300">
              ⌘K
            </kbd>
          </button>
          <NotificationBell />
          <ThemePicker />
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="ml-3 flex items-center gap-3">
              <Link
                to="/profile"
                className="group flex items-center gap-3 rounded-2xl px-2 py-1 transition hover:bg-white/70 dark:hover:bg-mint-800/60"
                title="Мій профіль"
              >
                <div className="hidden flex-col items-end leading-tight md:flex">
                  <span className="text-sm font-semibold text-mint-900 dark:text-mint-100">{user?.fullName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-mint-600 dark:text-mint-400">
                    {roleLabel(user?.role)}
                  </span>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-mint-gradient text-sm font-bold text-white shadow-mint transition-transform duration-300 group-hover:scale-110">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              </Link>
              <button onClick={handleLogout} className="btn-secondary !py-2" title="Вийти">
                <LogOut size={15} /> <span className="hidden sm:inline">Вийти</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary ml-2 !py-2">
              <LogIn size={15} /> Увійти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
