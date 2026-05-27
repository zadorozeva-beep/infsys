import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Shield, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { extractErrorMessage } from '../api/axios';
import {
  createComment,
  deleteComment,
  listComments,
  type Comment,
} from '../api/comments.api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../store/socket.store';
import { useToast } from '../store/toast.store';

interface Props {
  materialId: number;
}

export function CommentsSection({ materialId }: Props): JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const { socket, connected } = useSocket();
  const toast = useToast();
  const qc = useQueryClient();
  const queryKey = ['comments', materialId];
  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<Map<number, { name: string; ts: number }>>(
    new Map(),
  );
  const typingTimerRef = useRef<number | null>(null);

  const commentsQ = useQuery({
    queryKey,
    queryFn: () => listComments(materialId),
  });

  // ── Realtime: підписка на кімнату матеріалу ─────────────────────────
  useEffect(() => {
    if (!socket) return;
    socket.emit('material:join', materialId);

    const onNew = (c: Comment): void => {
      qc.setQueryData<Comment[]>(queryKey, (prev) => {
        if (!prev) return [c];
        // не дублюємо, якщо автор уже додав через optimistic update
        if (prev.some((x) => x.id === c.id)) return prev;
        return [...prev, c];
      });
    };

    const onDelete = (payload: { id: number; materialId: number }): void => {
      if (payload.materialId !== materialId) return;
      qc.setQueryData<Comment[]>(queryKey, (prev) =>
        prev ? prev.filter((c) => c.id !== payload.id) : prev,
      );
    };

    const onTyping = (payload: { userId: number; fullName: string }): void => {
      if (payload.userId === user?.id) return;
      setTypingUsers((m) => {
        const next = new Map(m);
        next.set(payload.userId, { name: payload.fullName, ts: Date.now() });
        return next;
      });
    };

    socket.on('comment:new', onNew);
    socket.on('comment:delete', onDelete);
    socket.on('comment:typing', onTyping);

    return () => {
      socket.emit('material:leave', materialId);
      socket.off('comment:new', onNew);
      socket.off('comment:delete', onDelete);
      socket.off('comment:typing', onTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, materialId, user?.id]);

  // Авто-прибирання застарілих typing-індикаторів (3 сек)
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTypingUsers((m) => {
        const now = Date.now();
        let changed = false;
        const next = new Map(m);
        for (const [k, v] of next) {
          if (now - v.ts > 3000) {
            next.delete(k);
            changed = true;
          }
        }
        return changed ? next : m;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const createMut = useMutation({
    mutationFn: () => createComment(materialId, content.trim()),
    onSuccess: (c) => {
      setContent('');
      qc.setQueryData<Comment[]>(queryKey, (prev) => {
        if (!prev) return [c];
        if (prev.some((x) => x.id === c.id)) return prev;
        return [...prev, c];
      });
    },
    onError: (err) => toast.error('Помилка', extractErrorMessage(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Comment[]>(queryKey, (prev) =>
        prev ? prev.filter((c) => c.id !== id) : prev,
      );
    },
    onError: (err) => toast.error('Не вдалося видалити', extractErrorMessage(err)),
  });

  const handleTyping = (v: string): void => {
    setContent(v);
    if (!socket || !user || !v) return;
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    socket.emit('comment:typing', materialId, user.fullName);
    typingTimerRef.current = window.setTimeout(() => {
      typingTimerRef.current = null;
    }, 1500);
  };

  const items = commentsQ.data ?? [];
  const typingNames = Array.from(typingUsers.values()).map((v) => v.name);

  return (
    <section className="card flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-mint-900 dark:text-mint-100">
          <MessageCircle size={18} strokeWidth={2.5} />
          Коментарі
          <span className="rounded-full bg-mint-100 px-2 py-0.5 text-xs font-bold text-mint-700 dark:bg-mint-800/60 dark:text-mint-200">
            {items.length}
          </span>
        </h2>
        <ConnectionIndicator connected={connected} authenticated={isAuthenticated} />
      </header>

      <ul className="flex flex-col gap-3">
        {commentsQ.isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-mint-100/40" />
          ))
        ) : items.length === 0 ? (
          <li className="rounded-2xl bg-mint-50/60 p-4 text-center text-sm italic text-mint-700 dark:bg-mint-900/30 dark:text-mint-300">
            Ще немає коментарів. {isAuthenticated ? 'Будьте першим!' : 'Увійдіть, щоб залишити.'}
          </li>
        ) : (
          items.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              canDelete={!!user && (user.id === c.author.id || user.role === 'admin')}
              onDelete={() => {
                if (confirm('Видалити коментар?')) deleteMut.mutate(c.id);
              }}
            />
          ))
        )}
      </ul>

      {typingNames.length > 0 && (
        <div className="flex items-center gap-2 text-xs italic text-mint-600 dark:text-mint-400">
          <TypingDots />
          {typingNames.length === 1
            ? `${typingNames[0]} друкує...`
            : `${typingNames.length} осіб друкують...`}
        </div>
      )}

      {isAuthenticated ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return;
            createMut.mutate();
          }}
          className="flex flex-col gap-2"
        >
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="Поділіться думкою про матеріал..."
            value={content}
            onChange={(e) => handleTyping(e.target.value)}
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-mint-600 dark:text-mint-400">
              {content.length} / 2000
            </span>
            <button
              type="submit"
              disabled={!content.trim() || createMut.isPending}
              className="btn-primary !py-2"
            >
              <Send size={14} strokeWidth={2.5} />
              {createMut.isPending ? 'Надсилаю...' : 'Надіслати'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl bg-mint-50/60 p-3 text-center text-sm text-mint-700 dark:bg-mint-900/30 dark:text-mint-300">
          <Link to="/login" className="font-bold underline-offset-4 hover:underline">
            Увійдіть
          </Link>
          , щоб залишити коментар.
        </div>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  onDelete: () => void;
}): JSX.Element {
  const roleColor =
    comment.author.role === 'admin'
      ? 'from-rose-400 to-rose-600'
      : comment.author.role === 'teacher'
        ? 'from-amber-400 to-amber-600'
        : 'from-mint-400 to-mint-600';

  return (
    <li className="group rounded-2xl bg-white/50 p-4 ring-1 ring-mint-100 transition hover:ring-mint-200 dark:bg-mint-900/30 dark:ring-mint-800 dark:hover:ring-mint-700 animate-fade-up">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${roleColor} text-xs font-bold text-white shadow`}
          >
            {comment.author.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-mint-900 dark:text-mint-100">
              {comment.author.fullName}
              {comment.author.role === 'teacher' && (
                <Shield
                  size={10}
                  strokeWidth={3}
                  className="ml-1 inline-block text-amber-600"
                  aria-label="Викладач"
                />
              )}
              {comment.author.role === 'admin' && (
                <Shield
                  size={10}
                  strokeWidth={3}
                  className="ml-1 inline-block text-rose-600"
                  aria-label="Адміністратор"
                />
              )}
            </span>
            <span className="text-[11px] text-mint-600 dark:text-mint-400">
              {new Date(comment.createdAt).toLocaleString('uk-UA')}
            </span>
          </div>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            title="Видалити коментар"
            className="rounded-lg p-1 text-rose-600 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
          >
            <Trash2 size={13} strokeWidth={2.5} />
          </button>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-mint-100">
        {comment.content}
      </p>
    </li>
  );
}

function ConnectionIndicator({
  connected,
  authenticated,
}: {
  connected: boolean;
  authenticated: boolean;
}): JSX.Element | null {
  if (!authenticated) return null;
  if (connected) {
    return (
      <span
        title="Реалтайм підключено"
        className="inline-flex items-center gap-1 rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-mint-700 dark:bg-mint-800/60 dark:text-mint-200"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-500" />
        <Wifi size={10} strokeWidth={2.5} /> Live
      </span>
    );
  }
  return (
    <span
      title="Реалтайм-канал не активний"
      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-mint-900/50 dark:text-mint-500"
    >
      <WifiOff size={10} strokeWidth={2.5} /> Offline
    </span>
  );
}

function TypingDots(): JSX.Element {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 150, 300].map((d) => (
        <span
          key={d}
          className="h-1.5 w-1.5 rounded-full bg-mint-500"
          style={{ animation: `dotpulse 1.2s ${d}ms infinite ease-in-out` }}
        />
      ))}
      <style>{`@keyframes dotpulse { 0%,80%,100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }`}</style>
    </span>
  );
}
