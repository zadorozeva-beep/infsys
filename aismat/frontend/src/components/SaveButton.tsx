import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, BookmarkCheck } from 'lucide-react';

import { extractErrorMessage } from '../api/axios';
import { listSavedIds, saveMaterial, unsaveMaterial } from '../api/me.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../store/toast.store';
import { fireConfetti } from './ConfettiHost';

const FIRST_SAVE_KEY = 'aismat_first_save_done';

interface Props {
  materialId: number;
  variant?: 'icon' | 'full';
}

export function SaveButton({ materialId, variant = 'icon' }: Props): JSX.Element | null {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();

  const idsQ = useQuery({
    queryKey: ['saved-ids'],
    queryFn: listSavedIds,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const saved = idsQ.data?.includes(materialId) ?? false;

  const saveMut = useMutation({
    mutationFn: () => saveMaterial(materialId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['saved-ids'] });
      const prev = qc.getQueryData<number[]>(['saved-ids']) ?? [];
      qc.setQueryData<number[]>(['saved-ids'], [...prev, materialId]);
      return { prev };
    },
    onSuccess: () => {
      const isFirst = !localStorage.getItem(FIRST_SAVE_KEY);
      if (isFirst) {
        localStorage.setItem(FIRST_SAVE_KEY, '1');
        fireConfetti();
        toast.success('Перший збережений матеріал!', 'Усі ваші закладки — у профілі 🎉');
      } else {
        toast.success('Збережено', 'Матеріал додано до особистого кабінету');
      }
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['saved-ids'], ctx.prev);
      toast.error('Не вдалося зберегти', extractErrorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['saved-ids'] });
      qc.invalidateQueries({ queryKey: ['saved-materials'] });
      qc.invalidateQueries({ queryKey: ['me-stats'] });
    },
  });

  const unsaveMut = useMutation({
    mutationFn: () => unsaveMaterial(materialId),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['saved-ids'] });
      const prev = qc.getQueryData<number[]>(['saved-ids']) ?? [];
      qc.setQueryData<number[]>(
        ['saved-ids'],
        prev.filter((id) => id !== materialId),
      );
      return { prev };
    },
    onSuccess: () => {
      toast.info('Прибрано зі збережених');
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['saved-ids'], ctx.prev);
      toast.error('Не вдалося прибрати', extractErrorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['saved-ids'] });
      qc.invalidateQueries({ queryKey: ['saved-materials'] });
      qc.invalidateQueries({ queryKey: ['me-stats'] });
    },
  });

  if (!isAuthenticated) return null;

  const busy = saveMut.isPending || unsaveMut.isPending;

  const toggle = (e?: React.MouseEvent): void => {
    e?.preventDefault();
    e?.stopPropagation();
    if (busy) return;
    if (saved) unsaveMut.mutate();
    else saveMut.mutate();
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        title={saved ? 'Прибрати зі збережених' : 'Зберегти'}
        aria-label={saved ? 'Прибрати зі збережених' : 'Зберегти матеріал'}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200 ${
          saved
            ? 'bg-mint-gradient text-white shadow-mint'
            : 'bg-white/70 text-mint-700 ring-1 ring-mint-200 backdrop-blur hover:bg-mint-50 hover:text-mint-900'
        } disabled:opacity-50`}
      >
        {saved ? (
          <BookmarkCheck size={16} strokeWidth={2.5} />
        ) : (
          <Bookmark size={16} strokeWidth={2.5} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={saved ? 'btn-secondary' : 'btn-primary'}
    >
      {saved ? (
        <>
          <BookmarkCheck size={16} strokeWidth={2.5} /> У збережених
        </>
      ) : (
        <>
          <Bookmark size={16} strokeWidth={2.5} /> Зберегти
        </>
      )}
    </button>
  );
}
