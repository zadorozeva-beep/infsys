import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CloudUpload, FileCheck2, Upload as UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { extractErrorMessage } from '../api/axios';
import {
  listDisciplines,
  listMaterialTypes,
  listTags,
  uploadMaterial,
} from '../api/materials.api';

const schema = z.object({
  title: z.string().min(2, 'Мінімум 2 символи').max(255),
  description: z.string().max(2000).optional(),
  disciplineId: z.coerce.number().int().positive('Оберіть дисципліну'),
  materialTypeId: z.coerce.number().int().positive('Оберіть тип'),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function UploadMaterialPage(): JSX.Element {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const disciplinesQ = useQuery({ queryKey: ['disciplines'], queryFn: listDisciplines });
  const typesQ = useQuery({ queryKey: ['material-types'], queryFn: listMaterialTypes });
  const tagsQ = useQuery({ queryKey: ['tags'], queryFn: listTags });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormData): Promise<void> => {
    setError(null);
    if (!file) {
      setError('Оберіть файл матеріалу');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', values.title);
      if (values.description) form.append('description', values.description);
      form.append('disciplineId', String(values.disciplineId));
      form.append('materialTypeId', String(values.materialTypeId));
      if (values.tags) form.append('tags', values.tags);
      form.append('file', file);

      const created = await uploadMaterial(form);
      await qc.invalidateQueries({ queryKey: ['materials'] });
      navigate(`/materials/${created.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>): void => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-gradient text-white shadow-mint-glow">
          <UploadIcon size={22} strokeWidth={2.5} />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-mint-900">
            Завантажити матеріал
          </h1>
          <p className="text-sm text-mint-700/80">
            Додайте лекцію, методичку, презентацію або тест до бібліотеки
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card-glow flex flex-col gap-5" noValidate>
        <div>
          <label className="label" htmlFor="title">Назва</label>
          <input id="title" className="input" placeholder="Наприклад, «Лекція 3. JOIN-и у SQL»" {...register('title')} />
          {errors.title && (
            <p className="mt-1 text-xs font-medium text-rose-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="description">Опис</label>
          <textarea
            id="description"
            className="input min-h-[110px] resize-y"
            placeholder="Короткий опис матеріалу, ключові теми..."
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="disciplineId">Дисципліна</label>
            <select id="disciplineId" className="input" {...register('disciplineId')}>
              <option value="">— оберіть —</option>
              {disciplinesQ.data?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.disciplineId && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.disciplineId.message}</p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="materialTypeId">Тип</label>
            <select id="materialTypeId" className="input" {...register('materialTypeId')}>
              <option value="">— оберіть —</option>
              {typesQ.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.materialTypeId && (
              <p className="mt-1 text-xs font-medium text-rose-600">{errors.materialTypeId.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="tags">Теги (через кому)</label>
          <input id="tags" className="input" placeholder="react, typescript" {...register('tags')} />
          {tagsQ.data && tagsQ.data.length > 0 && (
            <p className="mt-1.5 text-xs text-mint-700/80">
              Існуючі: <span className="font-mono">{tagsQ.data.map((t) => t.slug).join(', ')}</span>
            </p>
          )}
        </div>

        <div>
          <span className="label">Файл</span>
          <label
            htmlFor="file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
              dragOver
                ? 'border-mint-500 bg-mint-50 shadow-mint-glow'
                : file
                  ? 'border-mint-400 bg-mint-50/60'
                  : 'border-mint-200 bg-white/40 hover:border-mint-400 hover:bg-mint-50/40'
            }`}
          >
            <input
              id="file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {file ? (
              <>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-gradient text-white shadow-mint">
                  <FileCheck2 size={22} strokeWidth={2.5} />
                </span>
                <span className="font-semibold text-mint-900">{file.name}</span>
                <span className="text-xs text-mint-700/70">
                  {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
                </span>
                <span className="text-xs font-semibold text-mint-600 underline-offset-4 hover:underline">
                  Замінити файл
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-100 text-mint-600">
                  <CloudUpload size={24} strokeWidth={2.5} />
                </span>
                <span className="font-semibold text-mint-900">
                  Перетягніть файл сюди або клацніть, щоб обрати
                </span>
                <span className="text-xs text-mint-700/70">
                  PDF, DOCX, PPTX, XLSX, MP4, PNG, JPG — до 50 MB
                </span>
              </>
            )}
          </label>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary self-start !px-7" disabled={submitting}>
          <UploadIcon size={16} strokeWidth={2.5} />
          {submitting ? 'Завантаження...' : 'Завантажити матеріал'}
        </button>
      </form>
    </div>
  );
}
