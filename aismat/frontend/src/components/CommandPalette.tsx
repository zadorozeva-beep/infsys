import { useQuery } from '@tanstack/react-query';
import {
  Bookmark,
  CornerDownLeft,
  FileText,
  FolderOpen,
  Home,
  LogOut,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { listMaterials } from '../api/materials.api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../store/theme.store';

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  group: 'Дії' | 'Навігація' | 'Матеріали';
}

export function CommandPalette(): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const debouncedQuery = useDebounce(query, 200);

  // Глобальний хоткей Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Сфокусувати input при відкритті, очистити при закритті
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Жива вибірка матеріалів
  const materialsQ = useQuery({
    queryKey: ['palette-materials', debouncedQuery],
    queryFn: () => listMaterials({ q: debouncedQuery, limit: 5, offset: 0 }),
    enabled: open && debouncedQuery.trim().length >= 2,
    staleTime: 60_000,
  });

  // Сформувати команди
  const actions: CommandItem[] = useMemo(() => {
    const acts: CommandItem[] = [
      {
        id: 'go-home',
        label: 'Перейти до каталогу матеріалів',
        hint: '/',
        icon: <Home size={16} strokeWidth={2.5} />,
        onSelect: () => {
          navigate('/');
          setOpen(false);
        },
        group: 'Навігація',
      },
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему',
        hint: theme === 'dark' ? 'Sun' : 'Moon',
        icon: theme === 'dark' ? <Sun size={16} strokeWidth={2.5} /> : <Moon size={16} strokeWidth={2.5} />,
        onSelect: () => {
          toggleTheme();
          setOpen(false);
        },
        group: 'Дії',
      },
    ];

    if (isAuthenticated) {
      acts.push({
        id: 'go-profile',
        label: 'Мій профіль',
        hint: '/profile',
        icon: <UserIcon size={16} strokeWidth={2.5} />,
        onSelect: () => {
          navigate('/profile');
          setOpen(false);
        },
        group: 'Навігація',
      });
      acts.push({
        id: 'go-saved',
        label: 'Збережені матеріали',
        hint: '/profile',
        icon: <Bookmark size={16} strokeWidth={2.5} />,
        onSelect: () => {
          navigate('/profile');
          setOpen(false);
        },
        group: 'Навігація',
      });
      acts.push({
        id: 'go-settings',
        label: 'Налаштування акаунту',
        hint: '/profile',
        icon: <Settings size={16} strokeWidth={2.5} />,
        onSelect: () => {
          navigate('/profile');
          setOpen(false);
        },
        group: 'Навігація',
      });
    }
    if (user?.role === 'teacher' || user?.role === 'admin') {
      acts.push({
        id: 'go-upload',
        label: 'Завантажити новий матеріал',
        hint: '/upload',
        icon: <Upload size={16} strokeWidth={2.5} />,
        onSelect: () => {
          navigate('/upload');
          setOpen(false);
        },
        group: 'Навігація',
      });
      acts.push({
        id: 'go-own',
        label: 'Мої матеріали',
        hint: '/profile',
        icon: <FolderOpen size={16} strokeWidth={2.5} />,
        onSelect: () => {
          navigate('/profile');
          setOpen(false);
        },
        group: 'Навігація',
      });
    }
    if (user?.role === 'admin') {
      acts.push({
        id: 'go-admin',
        label: 'Панель адміністратора',
        hint: '/admin',
        icon: <Shield size={16} strokeWidth={2.5} />,
        onSelect: () => {
          navigate('/admin');
          setOpen(false);
        },
        group: 'Навігація',
      });
    }
    if (isAuthenticated) {
      acts.push({
        id: 'logout',
        label: 'Вийти з акаунту',
        icon: <LogOut size={16} strokeWidth={2.5} />,
        onSelect: () => {
          signOut();
          navigate('/login');
          setOpen(false);
        },
        group: 'Дії',
      });
    }
    return acts;
  }, [isAuthenticated, navigate, signOut, theme, toggleTheme, user]);

  // Фільтрація команд за query
  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  const materialItems: CommandItem[] = useMemo(() => {
    if (!materialsQ.data) return [];
    return materialsQ.data.data.map((m) => ({
      id: `material-${m.id}`,
      label: m.title,
      hint: `${m.discipline.name} · ${m.materialType.name}`,
      icon: <FileText size={16} strokeWidth={2.5} />,
      onSelect: () => {
        navigate(`/materials/${m.id}`);
        setOpen(false);
      },
      group: 'Матеріали' as const,
    }));
  }, [materialsQ.data, navigate]);

  const allItems = useMemo(
    () => [...materialItems, ...filteredActions],
    [materialItems, filteredActions],
  );

  // Reset активного елемента при зміні списку
  useEffect(() => {
    setActiveIndex(0);
  }, [query, materialItems.length]);

  // Клавіатурна навігація
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(allItems.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = allItems[activeIndex];
        if (item) item.onSelect();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, allItems, activeIndex]);

  if (!open) return null;

  // Групуємо по group для рендера
  const grouped: Record<string, CommandItem[]> = {};
  for (const item of allItems) {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group]!.push(item);
  }

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="absolute inset-0 bg-mint-950/40 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-mint-lg backdrop-blur-2xl dark:border-mint-700/60 dark:bg-mint-950/80"
        role="dialog"
        aria-modal="true"
        aria-label="Командна палітра"
      >
        <div className="flex items-center gap-3 border-b border-mint-100 px-4 py-3 dark:border-mint-800">
          <Search size={18} strokeWidth={2.5} className="text-mint-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук матеріалів і дій..."
            className="flex-1 bg-transparent text-sm font-medium text-mint-900 placeholder:text-mint-400 focus:outline-none dark:text-mint-50 dark:placeholder:text-mint-500"
          />
          <kbd className="hidden rounded-md border border-mint-200 bg-white/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-mint-600 sm:inline-block dark:border-mint-700 dark:bg-mint-900/60 dark:text-mint-300">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-mint-600 dark:text-mint-400">
              {materialsQ.isFetching ? 'Шукаю...' : 'Нічого не знайдено'}
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-mint-500 dark:text-mint-400">
                  {group}
                </div>
                {items.map((item) => {
                  runningIndex += 1;
                  const isActive = runningIndex === activeIndex;
                  const idx = runningIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.onSelect}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                        isActive
                          ? 'bg-mint-gradient text-white shadow-mint'
                          : 'text-mint-900 hover:bg-mint-50 dark:text-mint-100 dark:hover:bg-mint-800/60'
                      }`}
                    >
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          isActive
                            ? 'bg-white/20'
                            : 'bg-mint-100 text-mint-700 dark:bg-mint-800/60 dark:text-mint-300'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-1 font-semibold">{item.label}</div>
                        {item.hint && (
                          <div
                            className={`line-clamp-1 text-xs ${
                              isActive ? 'text-mint-100/90' : 'text-mint-600 dark:text-mint-400'
                            }`}
                          >
                            {item.hint}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <CornerDownLeft size={14} strokeWidth={2.5} className="opacity-80" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-mint-100 px-4 py-2 text-[11px] text-mint-600 dark:border-mint-800 dark:text-mint-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-mint-200 bg-white/70 px-1 py-0.5 font-mono text-[10px] dark:border-mint-700 dark:bg-mint-900/60">↑↓</kbd>
              навігація
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-mint-200 bg-white/70 px-1 py-0.5 font-mono text-[10px] dark:border-mint-700 dark:bg-mint-900/60">↵</kbd>
              вибір
            </span>
          </div>
          <span className="font-mono">⌘K / Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
