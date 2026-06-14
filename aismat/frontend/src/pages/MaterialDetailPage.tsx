import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  FileText,
  FileType,
  GitBranch,
  HardDrive,
  Tag as TagIcon,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { deleteMaterial, getMaterial } from '../api/materials.api';
import { serverUrl } from '../config';
import { AddToPlanButton } from '../components/AddToPlanButton';
import { CommentsSection } from '../components/CommentsSection';
import { FilePreview } from '../components/FilePreview';
import { SaveButton } from '../components/SaveButton';
import { VersionsTab } from '../components/VersionsTab';
import { useAuth } from '../hooks/useAuth';

type DetailTab = 'overview' | 'versions';

export function MaterialDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<DetailTab>('overview');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['material', numId],
    queryFn: () => getMaterial(numId),
    enabled: Number.isFinite(numId) && numId > 0,
  });

  const canDelete = user && data && (user.role === 'admin' || user.id === data.author.id);

  const handleDelete = async (): Promise<void> => {
    if (!data) return;
    if (!confirm(`Видалити матеріал "${data.title}"?`)) return;
    try {
      await deleteMaterial(data.id);
      await qc.invalidateQueries({ queryKey: ['materials'] });
      navigate('/');
    } catch (err) {
      alert(`Помилка видалення: ${(err as Error).message}`);
    }
  };

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-3xl bg-gradient-to-br from-mint-100/60 to-mint-200/40" />;
  }
  if (isError || !data) {
    return (
      <div className="card flex flex-col items-center gap-3 py-12 text-center">
        <h3 className="font-display text-lg font-bold text-mint-900 dark:text-mint-100">Матеріал не знайдено</h3>
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={16} /> Повернутися до списку
        </Link>
      </div>
    );
  }

  const fileUrl = serverUrl(`/api/materials/${data.id}/file`);
  const sizeKb = (data.fileSize / 1024).toFixed(1);

  return (
    <article className="flex flex-col gap-6">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold text-mint-700 ring-1 ring-mint-200 backdrop-blur transition hover:bg-white hover:text-mint-900"
      >
        <ArrowLeft size={14} strokeWidth={2.5} /> До списку
      </Link>

      {/* Hero-блок матеріалу */}
      <header className="relative overflow-hidden rounded-3xl bg-mint-gradient px-6 py-10 text-white shadow-mint-lg md:px-10">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
            {data.materialType.name}
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-balance md:text-4xl">
            {data.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
              <User size={13} strokeWidth={2.5} /> {data.author.fullName}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
              <TrendingUp size={13} strokeWidth={2.5} /> {data.downloadCount} завантажень
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">
              <Calendar size={13} strokeWidth={2.5} />
              {new Date(data.createdAt).toLocaleDateString('uk-UA')}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <a className="btn-secondary !bg-white !text-mint-800" href={fileUrl} target="_blank" rel="noreferrer">
              <Download size={16} strokeWidth={2.5} /> Завантажити файл
            </a>
            <SaveButton materialId={data.id} variant="full" />
            <AddToPlanButton materialId={data.id} variant="full" />
            {canDelete && (
              <button onClick={handleDelete} className="btn-danger">
                <Trash2 size={16} strokeWidth={2.5} /> Видалити
              </button>
            )}
          </div>
        </div>
      </header>

      <FilePreview
        materialId={data.id}
        mimeType={data.mimeType}
        fileName={data.fileUrl.split('/').pop() ?? data.title}
        fileSize={data.fileSize}
      />

      <div className="inline-flex gap-1 self-start rounded-2xl bg-white/60 p-1 shadow-soft backdrop-blur ring-1 ring-mint-200 dark:bg-mint-900/60 dark:ring-mint-700">
        <DetailTabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          <FileText size={15} strokeWidth={2.5} /> Опис
        </DetailTabButton>
        <DetailTabButton active={tab === 'versions'} onClick={() => setTab('versions')}>
          <GitBranch size={15} strokeWidth={2.5} /> Версії
        </DetailTabButton>
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card flex flex-col gap-4">
            {data.description ? (
              <>
                <h2 className="font-display text-lg font-bold text-mint-900 dark:text-mint-100">Опис</h2>
                <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-mint-200">
                  {data.description}
                </p>
              </>
            ) : (
              <p className="text-sm italic text-slate-500 dark:text-mint-300">Опис відсутній</p>
            )}

            {data.tags.length > 0 && (
              <div className="border-t border-mint-100 pt-4 dark:border-mint-800">
                <h3 className="mb-2 inline-flex items-center gap-1.5 font-display text-sm font-bold text-mint-900 dark:text-mint-100">
                  <TagIcon size={14} strokeWidth={2.5} /> Теги
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {data.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-mint-50 px-3 py-1 text-xs font-semibold text-mint-700 ring-1 ring-inset ring-mint-200 dark:bg-mint-800/60 dark:text-mint-200 dark:ring-mint-700"
                    >
                      #{tag.slug}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="card flex flex-col gap-3">
            <h2 className="font-display text-base font-bold text-mint-900 dark:text-mint-100">Деталі</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <InfoRow icon={<BookOpen size={14} strokeWidth={2.5} />} label="Дисципліна">
                <div className="font-semibold text-mint-900 dark:text-mint-100">{data.discipline.name}</div>
                <div className="font-mono text-xs text-mint-600 dark:text-mint-300">{data.discipline.code}</div>
              </InfoRow>
              <InfoRow icon={<FileType size={14} strokeWidth={2.5} />} label="Тип">
                {data.materialType.name}
              </InfoRow>
              <InfoRow icon={<HardDrive size={14} strokeWidth={2.5} />} label="Розмір">
                {sizeKb} KB
                <div className="font-mono text-xs text-mint-600 dark:text-mint-300">{data.mimeType}</div>
              </InfoRow>
              <InfoRow icon={<Calendar size={14} strokeWidth={2.5} />} label="Створено">
                {new Date(data.createdAt).toLocaleString('uk-UA')}
              </InfoRow>
            </dl>
          </aside>
        </div>
      ) : (
        <VersionsTab materialId={data.id} authorId={data.author.id} />
      )}

      <CommentsSection materialId={data.id} />
    </article>
  );
}

function DetailTabButton({
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

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <dt className="mb-0.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-mint-600 dark:text-mint-300">
        {icon} {label}
      </dt>
      <dd className="text-slate-800 dark:text-slate-200">{children}</dd>
    </div>
  );
}
