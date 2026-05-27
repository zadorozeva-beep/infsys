import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListPlus, ListTodo } from 'lucide-react';

import { extractErrorMessage } from '../api/axios';
import { addToPlan, listPlan } from '../api/plan.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../store/toast.store';

interface Props {
  materialId: number;
  variant?: 'icon' | 'full';
}

export function AddToPlanButton({ materialId, variant = 'icon' }: Props): JSX.Element | null {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const planQ = useQuery({
    queryKey: ['plan'],
    queryFn: listPlan,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const inPlan = planQ.data?.some((p) => p.material.id === materialId) ?? false;

  const addMut = useMutation({
    mutationFn: () => addToPlan(materialId, 'todo'),
    onSuccess: () => {
      toast.success('Додано в план', 'Матеріал у колонці «Хочу вивчити»');
      qc.invalidateQueries({ queryKey: ['plan'] });
      qc.invalidateQueries({ queryKey: ['plan-progress'] });
    },
    onError: (err) => {
      const msg = extractErrorMessage(err);
      if (msg.includes('уже у вашому плані')) {
        toast.info('Уже в плані', msg);
        qc.invalidateQueries({ queryKey: ['plan'] });
      } else {
        toast.error('Помилка', msg);
      }
    },
  });

  if (!isAuthenticated) return null;

  const onClick = (e?: React.MouseEvent): void => {
    e?.preventDefault();
    e?.stopPropagation();
    if (inPlan || addMut.isPending) return;
    addMut.mutate();
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={inPlan || addMut.isPending}
        title={inPlan ? 'У вашому плані' : 'Додати в план навчання'}
        aria-label={inPlan ? 'У вашому плані' : 'Додати в план навчання'}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200 ${
          inPlan
            ? 'bg-mint-100 text-mint-600 dark:bg-mint-800/60 dark:text-mint-300'
            : 'bg-white/70 text-mint-700 ring-1 ring-mint-200 backdrop-blur hover:bg-mint-50 hover:text-mint-900 dark:bg-mint-900/60 dark:text-mint-200 dark:ring-mint-700 dark:hover:bg-mint-800/70'
        } disabled:cursor-default disabled:opacity-70`}
      >
        {inPlan ? (
          <ListTodo size={16} strokeWidth={2.5} />
        ) : (
          <ListPlus size={16} strokeWidth={2.5} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inPlan || addMut.isPending}
      className={inPlan ? 'btn-secondary' : 'btn-primary'}
    >
      {inPlan ? (
        <>
          <ListTodo size={16} strokeWidth={2.5} /> У плані навчання
        </>
      ) : (
        <>
          <ListPlus size={16} strokeWidth={2.5} /> Додати в план
        </>
      )}
    </button>
  );
}
