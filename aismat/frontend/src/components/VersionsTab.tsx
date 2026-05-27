import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CloudUpload,
  Download,
  FileCheck2,
  GitBranch,
  History,
  Sparkles,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { extractErrorMessage } from '../api/axios';
import {
  listVersions,
  uploadNewVersion,
  type MaterialVersion,
} from '../api/versions.api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../store/toast.store';

interface Props {
  materialId: number;
  authorId: number;
}

export function VersionsTab({ materialId, authorId }: Props): JSX.Element {
  const { user } = useAuth();
  const canUploadNewVersion =
    !!user && (user.role === 'admin' || user.id === authorId);

  const versionsQ = useQuery({
    queryKey: ['versions', materialId],
    queryFn: () => listVersions(materialId),
  });

  const [modalOpen, setModalOpen] = useState(false);

  if (versionsQ.isLoading) {
    return <div className="h-40 animate-pulse rounded-3xl bg-mint-100/40" />;
  }
  if (versionsQ.isError || !versionsQ.data) {
    return (
      <div className="card text-rose-600">Не вдалося завантажити історію версій</div>
    );
  }

  const { currentVersion, versions } = versionsQ.data;

  // Підраховуємо diff попередньої до наступної версії (для опису)
  const augmented = versions.map((v, idx) => {
    const next = versions[idx - 1]; // у списку desc — наступна стоїть раніше
    const prev = versions[idx + 1]; // попередня — наступна за індексом
    return { v, next, prev };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1 font-bold text-mint-700 dark:bg-mint-800/60 dark:text-mint-200">
            <GitBranch size={13} strokeWidth={2.5} /> Поточна версія: v{currentVersion}
          </span>
          <span className="text-xs text-mint-600 dark:text-mint-400">
            Усього в історії: {versions.length}
          </span>
        </div>
        {canUploadNewVersion && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary !py-2"
          >
            <UploadCloud size={15} strokeWidth={2.5} />
            Завантажити нову версію
          </button>
        )}
      </div>

      <ol className="relative ml-4 space-y-4 border-l-2 border-mint-200 dark:border-mint-800">
        {augmented.map(({ v, prev }, idx) => (
          <VersionRow
            key={v.id}
            v={v}
            previous={prev}
            isLatest={idx === 0}
            materialId={materialId}
          />
        ))}
      </ol>

      {modalOpen && (
        <UploadVersionModal
          materialId={materialId}
          currentVersion={currentVersion}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

function VersionRow({
  v,
  previous,
  isLatest,
  materialId,
}: {
  v: MaterialVersion;
  previous: MaterialVersion | undefined;
  isLatest: boolean;
  materialId: number;
}): JSX.Element {
  const fileUrl = `/api/materials/${materialId}/versions/${v.version}/file`;
  const sizeKb = (v.fileSize / 1024).toFixed(1);

  const diffs = computeDiff(v, previous);

  return (
    <li className="relative ml-6">
      {/* Маркер на лінії */}
      <span
        className={`absolute -left-[34px] top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow ${
          isLatest ? 'bg-mint-gradient shadow-mint' : 'bg-mint-400'
        }`}
        aria-hidden="true"
      >
        v{v.version}
      </span>

      <div
        className={`rounded-2xl p-4 ring-1 transition ${
          isLatest
            ? 'bg-mint-50/80 ring-mint-300 dark:bg-mint-900/60 dark:ring-mint-700'
            : 'bg-white/70 ring-mint-100 hover:ring-mint-200 dark:bg-mint-900/30 dark:ring-mint-800 dark:hover:ring-mint-700'
        }`}
      >
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="inline-flex items-center gap-2 font-display font-bold text-mint-900 dark:text-mint-100">
              {v.title}
              {isLatest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-mint-gradient px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  <Sparkles size={9} /> Актуальна
                </span>
              )}
            </h4>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-mint-700 dark:text-mint-400">
              <span className="inline-flex items-center gap-1">
                <User size={11} strokeWidth={2.5} /> {v.uploader.fullName}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} strokeWidth={2.5} />
                {new Date(v.createdAt).toLocaleString('uk-UA')}
              </span>
              <span className="font-mono">
                {sizeKb} KB · {v.mimeType}
              </span>
            </div>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-semibold text-mint-700 ring-1 ring-mint-200 transition hover:bg-mint-50 dark:bg-mint-900/50 dark:text-mint-200 dark:ring-mint-700 dark:hover:bg-mint-800/70"
          >
            <Download size={12} strokeWidth={2.5} /> Завантажити
          </a>
        </div>

        {v.changeNote && (
          <p className="mb-2 rounded-xl bg-amber-50/70 px-3 py-2 text-xs italic text-amber-800 ring-1 ring-amber-100 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800/40">
            💬 {v.changeNote}
          </p>
        )}

        {diffs.length > 0 && (
          <ul className="flex flex-col gap-1 text-xs">
            {diffs.map((d, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5 font-bold text-mint-600 dark:text-mint-400">→</span>
                <span className="text-mint-800 dark:text-mint-200">{d}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function computeDiff(current: MaterialVersion, prev?: MaterialVersion): string[] {
  const diffs: string[] = [];
  if (!prev) {
    diffs.push('Початкова версія');
    return diffs;
  }
  if (current.title !== prev.title) {
    diffs.push(`Заголовок: "${prev.title}" → "${current.title}"`);
  }
  if ((current.description ?? '') !== (prev.description ?? '')) {
    diffs.push('Оновлено опис');
  }
  const sizeDiff = current.fileSize - prev.fileSize;
  if (sizeDiff !== 0) {
    const kb = (Math.abs(sizeDiff) / 1024).toFixed(1);
    diffs.push(`Файл: ${sizeDiff > 0 ? '+' : '−'}${kb} KB (нове завантаження)`);
  } else if (current.fileUrl !== prev.fileUrl) {
    diffs.push('Файл перезавантажено');
  }
  if (current.mimeType !== prev.mimeType) {
    diffs.push(`Тип: ${prev.mimeType} → ${current.mimeType}`);
  }
  return diffs;
}

// ─── Upload модалка ──────────────────────────────────────────────────

function UploadVersionModal({
  materialId,
  currentVersion,
  onClose,
}: {
  materialId: number;
  currentVersion: number;
  onClose: () => void;
}): JSX.Element {
  const qc = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [changeNote, setChangeNote] = useState('');

  const mut = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Файл обов’язковий');
      const form = new FormData();
      if (title.trim()) form.append('title', title.trim());
      if (description.trim()) form.append('description', description.trim());
      if (changeNote.trim()) form.append('changeNote', changeNote.trim());
      form.append('file', file);
      return uploadNewVersion(materialId, form);
    },
    onSuccess: () => {
      toast.success(`Версія v${currentVersion + 1} створена`, 'Історію оновлено');
      qc.invalidateQueries({ queryKey: ['versions', materialId] });
      qc.invalidateQueries({ queryKey: ['material', materialId] });
      qc.invalidateQueries({ queryKey: ['materials'] });
      onClose();
    },
    onError: (err) => toast.error('Не вдалося завантажити версію', extractErrorMessage(err)),
  });

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-mint-950/40 backdrop-blur-sm" aria-hidden="true" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-mint-lg backdrop-blur-2xl dark:border-mint-700 dark:bg-mint-950/90"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-mint-100 px-5 py-3 dark:border-mint-800">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-mint-900 dark:text-mint-100">
            <History size={18} strokeWidth={2.5} />
            Нова версія (v{currentVersion + 1})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-mint-700 transition hover:bg-mint-50 dark:text-mint-300 dark:hover:bg-mint-800/60"
            aria-label="Закрити"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="flex flex-col gap-4 p-5"
          noValidate
        >
          <div>
            <label className="label" htmlFor="ver-title">
              Новий заголовок (опц.)
            </label>
            <input
              id="ver-title"
              className="input"
              placeholder="Залиште порожнім, якщо не змінюється"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="ver-desc">
              Новий опис (опц.)
            </label>
            <textarea
              id="ver-desc"
              className="input min-h-[70px] resize-y"
              placeholder="Залиште порожнім, якщо не змінюється"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="ver-note">
              Що змінилось у цій версії
            </label>
            <textarea
              id="ver-note"
              className="input min-h-[60px] resize-y"
              placeholder="Наприклад: «Додано приклади з ER-діаграмами», «Виправлено помилки на слайдах 12–15»"
              maxLength={500}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
            <p className="mt-1 text-xs text-mint-600 dark:text-mint-400">
              {changeNote.length} / 500
            </p>
          </div>

          <div>
            <span className="label">Новий файл</span>
            <label
              htmlFor="ver-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
                dragOver
                  ? 'border-mint-500 bg-mint-50 shadow-mint-glow'
                  : file
                    ? 'border-mint-400 bg-mint-50/60 dark:bg-mint-900/40'
                    : 'border-mint-200 bg-white/40 hover:border-mint-400 hover:bg-mint-50/40 dark:border-mint-700 dark:bg-mint-900/30'
              }`}
            >
              <input
                id="ver-file"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint-gradient text-white shadow-mint">
                    <FileCheck2 size={18} strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-semibold text-mint-900 dark:text-mint-100">
                    {file.name}
                  </span>
                  <span className="text-xs text-mint-700/70 dark:text-mint-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-mint-600 dark:bg-mint-800/60 dark:text-mint-200">
                    <CloudUpload size={20} strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-semibold text-mint-900 dark:text-mint-100">
                    Перетягніть файл або клацніть, щоб обрати
                  </span>
                </>
              )}
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-mint-100 pt-3 dark:border-mint-800">
            <button type="button" onClick={onClose} className="btn-secondary !py-2">
              Скасувати
            </button>
            <button
              type="submit"
              className="btn-primary !py-2"
              disabled={!file || mut.isPending}
            >
              <UploadCloud size={14} strokeWidth={2.5} />
              {mut.isPending ? 'Завантаження...' : `Створити v${currentVersion + 1}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
