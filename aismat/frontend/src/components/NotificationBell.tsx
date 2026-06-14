import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, BookOpen, CheckCheck, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  listNotifications,
  markAllRead,
  markRead,
  type Notification,
} from '../api/notifications.api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../store/socket.store';
import { useToast } from '../store/toast.store';

interface IncomingNotificationPayload {
  type: Notification['type'];
  title: string;
  body: string | null;
  link: string | null;
  createdAt: string;
}

export function NotificationBell(): JSX.Element | null {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const notifQ = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Realtime — нова нотифікація з'являється: toast + invalidate query
  useEffect(() => {
    if (!socket) return;
    const handler = (payload: IncomingNotificationPayload): void => {
      toast.info(payload.title, payload.body ?? undefined);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [socket, toast, qc]);

  // Закриття popover при кліку поза ним
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  const readMut = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAllMut = useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!isAuthenticated) return null;

  const unread = notifQ.data?.meta.unread ?? 0;
  const items = notifQ.data?.data ?? [];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={`Сповіщення${unread > 0 ? ` (${unread} непрочитаних)` : ''}`}
        aria-label="Сповіщення"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-mint-700 ring-1 ring-mint-200 backdrop-blur transition hover:bg-mint-50 hover:text-mint-900 dark:bg-mint-900/60 dark:text-mint-200 dark:ring-mint-700 dark:hover:bg-mint-800/70 dark:hover:text-white"
      >
        {unread > 0 ? (
          <BellRing size={17} strokeWidth={2.5} className="animate-pulse" />
        ) : (
          <Bell size={17} strokeWidth={2.5} />
        )}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-mint-950">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-mint-lg backdrop-blur-xl animate-fade-up dark:border-mint-700 dark:bg-mint-950/95">
          <div className="flex items-center justify-between gap-2 border-b border-mint-100 px-4 py-3 dark:border-mint-800">
            <h3 className="font-display text-sm font-bold text-mint-900 dark:text-mint-100">
              Сповіщення
            </h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => readAllMut.mutate()}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-mint-700 transition hover:bg-mint-50 dark:text-mint-300 dark:hover:bg-mint-800/60"
              >
                <CheckCheck size={12} strokeWidth={2.5} />
                Все прочитано
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-mint-600 dark:text-mint-300">
                Сповіщень ще немає
              </div>
            ) : (
              items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => {
                    if (!n.readAt) readMut.mutate(n.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}): JSX.Element {
  const isUnread = !notification.readAt;
  const icon =
    notification.type === 'new_material' ? (
      <BookOpen size={16} strokeWidth={2.5} />
    ) : (
      <MessageCircle size={16} strokeWidth={2.5} />
    );

  const content = (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-start gap-3 rounded-2xl p-3 transition ${
        isUnread
          ? 'bg-mint-50/70 hover:bg-mint-50 dark:bg-mint-900/40 dark:hover:bg-mint-900/60'
          : 'hover:bg-slate-50 dark:hover:bg-mint-900/30'
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          isUnread
            ? 'bg-mint-gradient text-white shadow-mint'
            : 'bg-mint-100 text-mint-700 dark:bg-mint-800/60 dark:text-mint-300'
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={`text-sm leading-snug ${
            isUnread
              ? 'font-bold text-mint-900 dark:text-mint-100'
              : 'font-medium text-mint-800 dark:text-mint-200'
          }`}
        >
          {notification.title}
        </div>
        {notification.body && (
          <div className="mt-0.5 line-clamp-2 text-xs text-mint-700 dark:text-mint-300">
            {notification.body}
          </div>
        )}
        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-mint-500">
          {timeAgo(notification.createdAt)}
        </div>
      </div>
      {isUnread && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-mint-500" aria-label="Непрочитано" />
      )}
    </div>
  );

  if (notification.link) {
    return <Link to={notification.link}>{content}</Link>;
  }
  return content;
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const sec = Math.round((now - t) / 1000);
  if (sec < 60) return 'щойно';
  if (sec < 3600) return `${Math.round(sec / 60)} хв тому`;
  if (sec < 86400) return `${Math.round(sec / 3600)} год тому`;
  return new Date(iso).toLocaleDateString('uk-UA');
}
