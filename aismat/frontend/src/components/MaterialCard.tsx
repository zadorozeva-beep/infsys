import {
  BookOpen,
  ClipboardCheck,
  Download,
  FileText,
  FlaskConical,
  Presentation,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { AddToPlanButton } from './AddToPlanButton';
import { SaveButton } from './SaveButton';
import type { Material } from '../types';

interface Props {
  material: Material;
}

function typeIcon(iconName?: string | null): JSX.Element {
  switch (iconName) {
    case 'book-open':
      return <BookOpen size={14} strokeWidth={2.5} />;
    case 'flask-conical':
      return <FlaskConical size={14} strokeWidth={2.5} />;
    case 'presentation':
      return <Presentation size={14} strokeWidth={2.5} />;
    case 'clipboard-check':
      return <ClipboardCheck size={14} strokeWidth={2.5} />;
    case 'file-text':
    default:
      return <FileText size={14} strokeWidth={2.5} />;
  }
}

export function MaterialCard({ material }: Props): JSX.Element {
  return (
    <Link to={`/materials/${material.id}`} className="group block">
      <article className="card-hover relative flex h-full flex-col gap-3 overflow-hidden">
        {/* Декоративний градієнтний accent зверху */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-mint-gradient opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start justify-between gap-2">
          <span className="badge-mint">
            {typeIcon(material.materialType.icon)}
            {material.materialType.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-mint-700/70 dark:text-mint-400">
              <Download size={12} strokeWidth={2.5} />
              {material.downloadCount}
            </span>
            <AddToPlanButton materialId={material.id} />
            <SaveButton materialId={material.id} />
          </div>
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-mint-900 transition-colors group-hover:text-mint-700 dark:text-mint-100 dark:group-hover:text-mint-300">
          {material.title}
        </h3>

        {material.description && (
          <p className="line-clamp-3 text-sm text-slate-600 dark:text-mint-300/80">{material.description}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-1.5">
          {material.tags.slice(0, 4).map(({ tag }) => (
            <span
              key={tag.id}
              className="rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-medium text-mint-700 ring-1 ring-inset ring-mint-200 dark:bg-mint-800/60 dark:text-mint-200 dark:ring-mint-700"
            >
              #{tag.slug}
            </span>
          ))}
          {material.tags.length > 4 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-mint-900/60 dark:text-mint-300">
              +{material.tags.length - 4}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-mint-100 pt-3 text-xs text-mint-700/80 dark:border-mint-800/60 dark:text-mint-300/80">
          <span className="inline-flex max-w-[55%] items-center gap-1.5 truncate">
            <BookOpen size={12} strokeWidth={2.5} />
            <span className="truncate">{material.discipline.name}</span>
          </span>
          <span className="inline-flex max-w-[45%] items-center gap-1.5 truncate">
            <User size={12} strokeWidth={2.5} />
            <span className="truncate">{material.author.fullName}</span>
          </span>
        </div>
      </article>
    </Link>
  );
}
