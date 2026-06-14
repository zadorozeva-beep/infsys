import { Download, Eye, FileQuestion, Maximize2 } from 'lucide-react';
import { useState } from 'react';

import { serverUrl } from '../config';

interface Props {
  materialId: number;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

type Kind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'unsupported';

function detectKind(mime: string): Kind {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('text/') || mime === 'application/json') return 'text';
  return 'unsupported';
}

function readableMime(mime: string): string {
  if (mime === 'application/pdf') return 'PDF документ';
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return 'Word документ (.docx)';
  if (mime === 'application/msword') return 'Word документ (.doc)';
  if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    return 'PowerPoint презентація (.pptx)';
  if (mime === 'application/vnd.ms-powerpoint') return 'PowerPoint презентація (.ppt)';
  if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return 'Excel таблиця (.xlsx)';
  if (mime === 'application/vnd.ms-excel') return 'Excel таблиця (.xls)';
  return mime;
}

export function FilePreview({ materialId, mimeType, fileName, fileSize }: Props): JSX.Element {
  const url = serverUrl(`/api/materials/${materialId}/file`);
  const kind = detectKind(mimeType);
  const sizeKb = (fileSize / 1024).toFixed(1);
  const [imgError, setImgError] = useState(false);

  const Header = (
    <div className="flex items-center justify-between gap-3 border-b border-mint-100 px-5 py-3">
      <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-mint-900">
        <Eye size={16} strokeWidth={2.5} />
        Попередній перегляд
      </h2>
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-semibold text-mint-700 ring-1 ring-mint-200 backdrop-blur transition hover:bg-mint-50"
          title="Відкрити у новій вкладці"
        >
          <Maximize2 size={13} strokeWidth={2.5} />
          На повний екран
        </a>
      </div>
    </div>
  );

  return (
    <section className="card overflow-hidden p-0">
      {Header}
      <div className="bg-mint-50/40 p-2">
        {kind === 'pdf' && (
          <iframe
            src={`${url}#view=FitH&toolbar=1`}
            title={fileName}
            className="h-[75vh] w-full rounded-2xl bg-white shadow-soft"
          />
        )}

        {kind === 'image' && !imgError && (
          <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-2xl bg-white p-4 shadow-soft">
            <img
              src={url}
              alt={fileName}
              onError={() => setImgError(true)}
              className="max-h-[70vh] max-w-full rounded-xl object-contain"
            />
          </div>
        )}

        {kind === 'video' && (
          <video
            src={url}
            controls
            className="aspect-video w-full rounded-2xl bg-black shadow-soft"
          >
            Ваш браузер не підтримує відео.
          </video>
        )}

        {kind === 'audio' && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-8 shadow-soft">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-mint-gradient text-3xl text-white shadow-mint-glow">
              ♪
            </div>
            <audio src={url} controls className="w-full max-w-md" />
          </div>
        )}

        {kind === 'text' && (
          <iframe
            src={url}
            title={fileName}
            className="h-[60vh] w-full rounded-2xl bg-white p-2 font-mono text-sm shadow-soft"
          />
        )}

        {(kind === 'unsupported' || (kind === 'image' && imgError)) && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-12 text-center shadow-soft">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
              <FileQuestion size={32} strokeWidth={2} />
            </span>
            <h3 className="font-display text-lg font-bold text-mint-900">
              Попередній перегляд недоступний
            </h3>
            <p className="max-w-md text-sm text-slate-600">
              Формат <span className="font-mono font-semibold">{readableMime(mimeType)}</span> не
              підтримується для перегляду в браузері. Завантажте файл, щоб відкрити його у відповідній програмі.
            </p>
            <p className="text-xs text-mint-700/70">
              {fileName} · {sizeKb} KB
            </p>
            <a className="btn-primary mt-2" href={url} target="_blank" rel="noreferrer">
              <Download size={16} strokeWidth={2.5} /> Завантажити файл
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
